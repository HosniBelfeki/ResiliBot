# Database Connection Pool Exhaustion Runbook

## Symptoms
- Application errors: "Cannot acquire connection"
- Increased response times
- Database connection count at maximum

## Common Causes
1. **Connection Leak**: Connections not properly closed
2. **Long-Running Queries**: Queries holding connections too long
3. **Traffic Spike**: More concurrent requests than pool size
4. **Database Performance**: Slow queries causing connection buildup

## Diagnosis Steps
1. Check application logs for connection errors
2. Query database for active connections: `SELECT * FROM pg_stat_activity`
3. Review slow query log
4. Check connection pool metrics

## Remediation Actions

### Immediate Actions
- **Increase Pool Size**: Temporarily increase max connections
- **Kill Long Queries**: Terminate blocking queries
- **Scale Read Replicas**: Add read replicas for read traffic
- **Restart Application**: Force connection pool reset

### Long-Term Fixes
- Fix connection leaks in code
- Optimize slow queries
- Implement connection timeout
- Add connection pool monitoring

## Prevention
- Proper connection management in code
- Query performance optimization
- Regular database maintenance
- Capacity planning

## Monitoring
- Connection pool utilization
- Query execution time
- Database CPU and memory
- Application error rates
