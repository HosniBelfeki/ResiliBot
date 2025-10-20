/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ExpandMore,
  ContentCopy,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface SystemCheckDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CheckResult {
  name: string;
  status: "success" | "error" | "warning" | "checking";
  message: string;
  details?: string;
  fix?: string;
}

export const SystemCheckDialog: React.FC<SystemCheckDialogProps> = ({
  open,
  onClose,
}) => {
  const [checking, setChecking] = useState(false);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_GATEWAY_URL || ""
  );

  const getStatusIcon = (status: CheckResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle color="success" />;
      case "error":
        return <Error color="error" />;
      case "warning":
        return <Warning color="warning" />;
      case "checking":
        return <CircularProgress size={24} />;
    }
  };

  const getStatusColor = (status: CheckResult["status"]) => {
    switch (status) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  const runSystemChecks = async () => {
    setChecking(true);
    const results: CheckResult[] = [];

    // Check 1: API Endpoint Configuration
    results.push({
      name: "API Endpoint",
      status: "checking",
      message: "Checking API endpoint...",
    });
    setChecks([...results]);

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL || apiUrl;
      if (!apiEndpoint || apiEndpoint.includes("your-api-gateway-id")) {
        results[0] = {
          name: "API Endpoint",
          status: "error",
          message: "API endpoint not configured",
          details: "Please set NEXT_PUBLIC_API_GATEWAY_URL in .env.local",
          fix: "Add your API Gateway URL to frontend/.env.local file",
        };
      } else {
        // Try to connect to API
        const response = await fetch(`${apiEndpoint}/incidents`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          results[0] = {
            name: "API Endpoint",
            status: "success",
            message: "API endpoint is reachable",
            details: apiEndpoint,
          };
        } else {
          results[0] = {
            name: "API Endpoint",
            status: "warning",
            message: "API endpoint configured but not responding correctly",
            details: `Status: ${response.status}`,
            fix: "Check if your backend is deployed and API Gateway is configured",
          };
        }
      }
    } catch (err) {
      results[0] = {
        name: "API Endpoint",
        status: "error",
        message: "Cannot connect to API",
        details: err instanceof Error ? err.message : "Unknown error",
        fix: "Deploy your backend using: cd infrastructure && cdk deploy",
      };
    }
    setChecks([...results]);

    // Check 2: Environment Variables
    results.push({
      name: "Environment Variables",
      status: "checking",
      message: "Checking environment configuration...",
    });
    setChecks([...results]);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const requiredEnvVars = ["NEXT_PUBLIC_API_GATEWAY_URL"];

    const missingVars = requiredEnvVars.filter(
      (varName) =>
        !process.env[varName] || process.env[varName]?.includes("your-")
    );

    if (missingVars.length === 0) {
      results[1] = {
        name: "Environment Variables",
        status: "success",
        message: "All required environment variables are set",
      };
    } else {
      results[1] = {
        name: "Environment Variables",
        status: "warning",
        message: `${missingVars.length} environment variable(s) need configuration`,
        details: missingVars.join(", "),
        fix: "Copy .env.local.example to .env.local and fill in your values",
      };
    }
    setChecks([...results]);

    // Check 3: Browser Compatibility
    results.push({
      name: "Browser Compatibility",
      status: "checking",
      message: "Checking browser compatibility...",
    });
    setChecks([...results]);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const isModernBrowser =
      typeof window !== "undefined" &&
      "fetch" in window &&
      "Promise" in window &&
      "localStorage" in window;

    if (isModernBrowser) {
      results[2] = {
        name: "Browser Compatibility",
        status: "success",
        message: "Browser is compatible",
      };
    } else {
      results[2] = {
        name: "Browser Compatibility",
        status: "error",
        message: "Browser may not be fully compatible",
        fix: "Please use a modern browser (Chrome, Firefox, Safari, Edge)",
      };
    }
    setChecks([...results]);

    // Check 4: Local Storage
    results.push({
      name: "Local Storage",
      status: "checking",
      message: "Checking local storage...",
    });
    setChecks([...results]);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      results[3] = {
        name: "Local Storage",
        status: "success",
        message: "Local storage is available",
      };
    } catch {
      results[3] = {
        name: "Local Storage",
        status: "warning",
        message: "Local storage is not available",
        details: "Some features may not work properly",
        fix: "Enable cookies and local storage in your browser settings",
      };
    }
    setChecks([...results]);

    setChecking(false);
  };

  useEffect(() => {
    if (open && checks.length === 0) {
      runSystemChecks();
    }
  }, [open]);

  const allPassed = checks.every((check) => check.status === "success");
  const hasErrors = checks.some((check) => check.status === "error");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.2 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6">System Requirements Check</Typography>
          {allPassed && !checking && (
            <Chip label="All Checks Passed" color="success" size="small" />
          )}
          {hasErrors && !checking && (
            <Chip label="Issues Found" color="error" size="small" />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Before deploying ResiliBot, ensure all system requirements are met.
            This check verifies your configuration and connectivity.
          </Typography>
        </Alert>

        {/* API URL Configuration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            API Gateway URL
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://your-api-id.execute-api.region.amazonaws.com/prod"
            helperText="Enter your API Gateway URL from AWS CDK deployment"
            InputProps={{
              endAdornment: apiUrl && (
                <Button
                  size="small"
                  onClick={() => copyToClipboard(apiUrl)}
                  startIcon={<ContentCopy />}
                >
                  Copy
                </Button>
              ),
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* System Checks */}
        <List>
          {checks.map((check, index) => (
            <motion.div
              key={check.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  mb: 1,
                  bgcolor:
                    check.status === "error"
                      ? "error.light"
                      : check.status === "warning"
                        ? "warning.light"
                        : check.status === "success"
                          ? "success.light"
                          : "transparent",
                  opacity: check.status === "success" ? 0.9 : 1,
                }}
              >
                <ListItemIcon>{getStatusIcon(check.status)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {check.name}
                      </Typography>
                      <Chip
                        label={check.status}
                        size="small"
                        color={getStatusColor(check.status)}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                        {check.message}
                      </Box>
                      {check.details && (
                        <Box
                          component="span"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                          }}
                        >
                          {check.details}
                        </Box>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{
                    component: "div",
                  }}
                />
              </ListItem>

              {/* Show fix instructions for errors/warnings */}
              {check.fix &&
                (check.status === "error" || check.status === "warning") && (
                  <Accordion sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2" color="primary">
                        How to fix
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          bgcolor: "grey.100",
                          p: 2,
                          borderRadius: 1,
                        }}
                      >
                        {check.fix}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
            </motion.div>
          ))}
        </List>

        {checks.length === 0 && !checking && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Click &quot;Run Checks&quot; to verify your system configuration
            </Typography>
          </Box>
        )}

        {/* Deployment Instructions */}
        {allPassed && !checking && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              ✅ System Ready for Deployment!
            </Typography>
            <Typography variant="body2">
              Your system meets all requirements. You can now deploy ResiliBot
              to production.
            </Typography>
          </Alert>
        )}

        {hasErrors && !checking && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              ⚠️ Action Required
            </Typography>
            <Typography variant="body2">
              Please fix the errors above before deploying. Check the &quot;How
              to fix&quot; sections for guidance.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={checking}>
          Close
        </Button>
        <Button
          onClick={runSystemChecks}
          disabled={checking}
          variant="contained"
          startIcon={checking ? <CircularProgress size={16} /> : <Refresh />}
        >
          {checking ? "Checking..." : "Run Checks"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
