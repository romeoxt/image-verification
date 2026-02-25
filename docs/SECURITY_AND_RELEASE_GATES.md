# Security and Release Gates

## Mandatory Gates Before Merge

- API typecheck must pass.
- C2PA tests must pass.
- API integration tests must pass (DB-backed).
- Migration smoke job must pass (idempotency).

## Mandatory Gates Before Production Deploy

- No insecure production flags:
  - `DISABLE_API_AUTH`
  - `ALLOW_INSECURE_ATTESTATION_DEV`
  - `ALLOW_CLIENT_SECURITY_OVERRIDE`
  - `ALLOW_SOFTWARE_KEYS`
  - `ALLOW_VERIFY_URL_FETCH`
- `CORS_ORIGIN` must not be `*`.
- `PUBLIC_URL` and `DATABASE_URL` must be configured.

## External Security Work Required for GA

- Complete third-party penetration test.
- Triage findings and close critical/high items.
- Publish remediation evidence and retest report.

## Abuse Control Expectations

- API-level IP rate limiting (implemented in API server).
- API-key quotas and per-day/per-minute limits (implemented in auth DB layer).
- Edge WAF and bot protection must be configured in production ingress.

