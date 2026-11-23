# Codex backend-specific rules

Own API implementation here. Read `spec/openapi.yaml` before writing a route and `docs/03-ARCHITECTURE.md` before data operations. Controllers parse/validate inputs and delegate; services encapsulate business rules; repositories own database access. Do not put role logic solely in React. Any discovered schema conflict must be recorded in `docs/08-OPEN-DECISIONS.md`, not papered over.

Initial project only supplies `/api/v1/health` and an Express skeleton. Implement all FRs with integration tests against a replica-set test database. For GridFS use compensating deletion and recovery; tests must verify no orphan data after induced failure.
