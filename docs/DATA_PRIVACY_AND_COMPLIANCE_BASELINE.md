# Data Privacy and Compliance Baseline

## Retention Policy (Recommended Defaults)

- Verification records: 365 days
- Raw uploaded assets/manifests: 90 days (or customer-configurable)
- API access logs: 90 days hot, 365 days cold
- Security audit logs: 365 days minimum

## Data Handling Requirements

- Encrypt data in transit (TLS) and at rest.
- Restrict asset/evidence access to scoped API keys.
- Keep audit trails for access to evidence packages.
- Support customer-driven deletion requests for tenant data.

## Enterprise Expectations

- Maintain DPA template for enterprise customers.
- Document subprocessors and data residency options.
- Define breach notification SLA and contact process.
- Define legal hold process for evidence packages.

## Audit Logging Expectations

- Log: actor (API key/user), endpoint, resource id, status, timestamp.
- Ensure logs are immutable and retained per policy.
- Track privileged configuration changes (security flags, auth policy, key revocations).

