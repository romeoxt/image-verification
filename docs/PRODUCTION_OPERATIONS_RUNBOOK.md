# Production Operations Runbook

## Monitoring Baseline

- **Availability SLO**: 99.9% monthly for `POST /v1/verify`
- **Latency SLO**: p95 < 2.5s and p99 < 5s for <= 10MB assets
- **Error budget alert**: trigger when 5xx > 1% over 10 minutes
- **Readiness**: monitor `GET /health/ready` and alert on any 503
- **Liveness**: monitor `GET /health/live` and alert on sustained failures

## Alerting Policy

- Page immediately for:
  - sustained 5xx > 5% for 5 minutes
  - database unavailable > 2 minutes
  - auth disabled in production
- Create ticket within 1 business day for:
  - SLO warning burn rate
  - elevated rate limit violations
  - certificate parsing anomalies

## Incident Response

1. Declare incident channel and owner.
2. Triage blast radius (regions, tenants, endpoints).
3. Stabilize (rollback, disable risky flag, throttle traffic).
4. Recover service and verify SLO recovery.
5. Publish postmortem within 48 hours.

## Key Rotation and Revocation Drills

- **API keys**: quarterly rotation drill and emergency revoke simulation.
- **Attestation roots/trust config**: quarterly verification drill.
- **Device revocation flow**: monthly sampled exercise (test tenant).
- Store drill records with date, owner, outcome, and follow-ups.

