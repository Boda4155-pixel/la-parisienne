# Memory Index

- [Security Audit Verification Report](security-audit-verification-report.md) — Focused verification of findings C1–C6 and H1–H4 from Phase 5 security audit of La Parisienne application
- [RPC Investigation Report](rpc-investigation-report.md) — Read-only investigation of 4 Supabase RPC functions: accept_order, cancel_my_order, create_secure_order, reject_order
- [Phase 1 Investigation Report](phase-1-investigation.md) — Phase 1: service-role key exposure, RPC call sites, privileged operations catalog, live DB inspection requirements, rollback plan
- [Edge Function Security Review](edge-function-security-review.md) — Read-only security verification of admin-api and delete-user Edge Functions: 15 findings (EF-1 through EF-15), 6 critical, 3 high, 2 medium; includes remediation steps and live DB inspection checklist
- [Edge Function Remediation](edge-function-remediation.md) — Remediation of both Edge Functions: JWT auth, admin role checks, input validation, UUID checks, CORS hardening; 29 tests passing, changes not yet deployed
