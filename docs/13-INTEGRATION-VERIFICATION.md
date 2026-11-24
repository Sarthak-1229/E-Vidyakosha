# Full-stack verification

The built React client uses the published API at `/api/v1`. Its co-located production server and Vite development proxy share the same path. The only OpenAPI annotation added during integration was the existing optional `page` and `pageSize` query parameters on Admin user listing.

| Workflow | Live evidence |
|---|---|
| Student registration and sign-in | Browser submits institutional address, verifies the explicit sign-in step, and uses a JWT obtained from Express |
| Accounts and academic catalog | Admin creates privileged accounts, changes a role and removes an unused account. Admin creates and deletes an empty Department and creates, renames and deletes Subjects |
| Faculty upload and own status | Browser uploads a PDF to GridFS, sees status, receives duplicate and invalid-PDF validation, and sees a real storage error with clean rollback |
| Review | Admin approves and rejects through the queue. The UI requires a reason. API tests race opposite decisions and verify atomic reviewer and status updates |
| Approved discovery and PDF access | Student searches, filters, renders PDF pages and downloads byte-identical content under the API-provided filename. Pending and rejected PDF routes return 404 |
| Document administration | Admin updates an approved PDF's metadata and deletes its linked data. Its public-facing repository ID can no longer retrieve a PDF |
| Security and mobile | Role violations, stale or expired JWTs, browser memory-only storage, keyboard focus, mobile navigation and horizontal overflow are checked |
| Contract | The integration test records successful calls and compares them to all 25 OpenAPI operation IDs. The unit suite validates the OpenAPI 3.1 document |

The [browser suite](../apps/api/tests/e2e/integrated.spec.ts) serves the build over HTTP from Express, uses Chromium, and starts a real MongoDB replica set. It checks the browser for uncaught exceptions and unexpected console errors. Mobile coverage uses a 390 × 844 emulated viewport with reduced motion. The [backend suite](../apps/api/tests/api.integration.ts) verifies negative paths, permissions, exact 50 MiB, concurrency and GridFS compensation separately from UI tests.

## Adopted decisions

- D-01 uses metadata-only review of pending submissions. Every binary endpoint still requires an approved document and authentication.
- D-02 permits empty Departments and blocks deletion when dependent Subjects exist.
- D-03 uses an in-memory bearer session and requires sign-in after reload or server revocation.
- D-04 uses a metadata transaction, GridFS compensation and offline reconciliation.
- D-05 keeps the 25 published API operations. The Admin document screen uses the approved catalog described in the contract.
- D-06 enforces 50 MiB, using the shared byte constant and the server-side multipart limit.
- D-07 directs new Students to sign in after registration.

[Source decisions](08-OPEN-DECISIONS.md) · [Backend traceability](12-BACKEND-TRACEABILITY.md)
