import { useQuery } from "@tanstack/react-query";
import type {
  Incident,
  IncidentStatus,
  IncidentPriority,
  IncidentSeverity,
} from "@/types";
import { incidentService } from "@/services/apiService";

// Real API service calls - only return real data from API
const fetchIncidents = async (): Promise<Incident[]> => {
  try {
    const realIncidents = await incidentService.getIncidents();

    // Transform the real API data to match our interface
    return realIncidents.map((incident: Record<string, unknown>) => {
      // Parse tags - handle both array and string formats
      let tags: string[] = [];
      if (Array.isArray(incident.tags)) {
        tags = incident.tags.map(String);
      } else if (typeof incident.tags === "string") {
        // Handle comma-separated string tags
        tags = incident.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      // Extract real tags from metadata if no tags field exists
      if (tags.length === 0 && incident.metadata && typeof incident.metadata === 'object') {
        const metadata = incident.metadata as Record<string, unknown>;
        
        // Extract service from metadata
        if (metadata.service) {
          tags.push(String(metadata.service));
        }
        
        // Extract region from metadata
        if (metadata.region) {
          tags.push(String(metadata.region));
        }
        
        // Extract affected services from metadata
        if (Array.isArray(metadata.affectedServices)) {
          metadata.affectedServices.slice(0, 3).forEach(service => {
            tags.push(String(service));
          });
        }
        
        // Extract other useful metadata fields
        if (metadata.testType) {
          tags.push(String(metadata.testType));
        }
      }
      
      // If still no tags, use source as a tag (only if it's meaningful)
      if (tags.length === 0) {
        const source = String(incident.source || '').trim();
        if (source && source !== 'manual' && source !== 'unknown' && source.length > 0) {
          tags.push(source);
        }
      }

      return {
        id: String(incident.incidentId || incident.id || ""),
        incidentId: String(incident.incidentId || incident.id || ""),
        title: String(incident.title || "Untitled Incident"),
        description: String(incident.description || ""),
        status: (incident.status as IncidentStatus) || "OPEN",
        priority: (incident.priority as IncidentPriority) || "MEDIUM",
        severity: (incident.severity as IncidentSeverity) || "INFO",
        createdAt: String(
          incident.createdAt || incident.timestamp || new Date().toISOString()
        ),
        updatedAt: String(
          incident.updatedAt || incident.timestamp || new Date().toISOString()
        ),
        resolvedAt: incident.resolvedAt
          ? String(incident.resolvedAt)
          : undefined,
        duration: incident.duration ? Number(incident.duration) : undefined,
        tags,
        source: String(incident.source || "Unknown"),
        metrics: incident.metrics || {},
        aiAnalysis: incident.aiAnalysis,
        actions: incident.actions || [],
        assignee: incident.assignee,
        postmortem: incident.postmortem,
      };
    });
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
    throw new Error("Unable to fetch incidents from API");
  }
};

export const useIncidents = () => {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2,
    retryDelay: 1000,
  });
};

export const useIncident = (id: string) => {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: async (): Promise<Incident | null> => {
      const incidents = await fetchIncidents();
      return incidents.find((incident) => incident.id === id) || null;
    },
    enabled: !!id,
  });
};
