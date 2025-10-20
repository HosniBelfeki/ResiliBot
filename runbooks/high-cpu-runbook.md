# High CPU Utilization Runbook

## Symptoms
- CPU utilization > 80% for sustained period
- Application response time degradation
- Increased error rates

## Common Causes
1. **Memory Leak**: Application consuming excessive memory, causing GC thrashing
2. **Infinite Loop**: Code bug causing CPU spin
3. **Traffic Spike**: Legitimate increase in load
4. **Resource Contention**: Multiple processes competing for CPU

## Diagnosis Steps
1. Check CloudWatch CPU metrics for pattern
2. Review application logs for errors
3. Check process list via SSM: `top -b -n 1`
4. Analyze thread dumps if Java application

## Remediation Actions

### Safe Actions (Auto-Execute)
- **Restart Service**: `systemctl restart application`
- **Scale Up**: Increase Auto Scaling Group desired capacity
- **Clear Cache**: Flush application cache if applicable

### Risky Actions (Require Approval)
- **Terminate Instance**: Replace unhealthy instance
- **Rollback Deployment**: Revert to previous version
- **Modify Configuration**: Change resource limits

## Prevention
- Implement proper monitoring and alerting
- Regular load testing
- Code review for performance issues
- Implement circuit breakers

## Related Incidents
- INC-2024-001: Memory leak in payment service
- INC-2024-015: Traffic spike during Black Friday
