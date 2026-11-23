# Backend traceability

The approved MSS v2.0 SRS §3.2 and §6 map FR-01–FR-12 to UC-01–UC-12. SRS §3.6 and §3.6.1 define the six collections and their constraints. The [source index](01-SOURCE-OF-TRUTH.md) identifies the eight private inputs and the rules for resolving differences.

| Requirement | API operation IDs | Evidence in the MongoDB integration suite |
|---|---|---|
| FR-01 / UC-01 | `registerStudent` | Institutional email normalization, fixed Student role, duplicate email, missing fields and injected role |
| FR-02 / UC-02 | `login`, `getCurrentUser` | Login for all roles, generic credential failures, invalid and expired JWTs, deleted and changed accounts |
| FR-03 / UC-03 | `listUsers`, `createPrivilegedUser`, `updateUserRole`, `deleteUser` | Paginated user list, Faculty and Admin creation, role changes, last Admin and referenced account guards |
| FR-04 / UC-04 | `listDepartments`, `createDepartment`, `deleteEmptyDepartment`, `listSubjects`, `createSubject`, `updateSubject`, `deleteEmptySubject` | Case-insensitive uniqueness, ObjectId validation, CRUD and protected dependencies |
| FR-05 / UC-05 | `listPendingApprovals`, `decideUpload` | Pending queue, required rejection reason, reviewer and time, conditional status update and concurrent decision |
| FR-06 / UC-06 | `updateDocumentMetadata`, `deleteDocument` | Metadata changes preserve PDF hash and status, linked metadata deletion, concealed bytes and retryable cleanup |
| FR-07 / UC-07 | `submitPdf` | Valid and exact 50 MiB files, oversize, spoofed, damaged and encrypted PDFs, sequential and concurrent SHA-256 deduplication, GridFS and commit failures |
| FR-08 / UC-08 | `listOwnSubmissions` | Private ownership, all three statuses, rejection reason and single stored status on Document |
| FR-09 / UC-09 | `searchApprovedDocuments`, `getApprovedDocument` | Approved-only browse and direct metadata for authenticated roles |
| FR-10 / UC-10 | `searchApprovedDocuments` | Indexed title words, subject and type filters, pagination, empty results and malformed queries |
| FR-11 / UC-11 | `inlineApprovedPdf` | Signed authorization, approved state, inline disposition, byte equality and denied internal IDs |
| FR-12 / UC-12 | `downloadApprovedPdf` | Attachment disposition, safe filename, byte equality and denied pending, rejected and missing PDFs |

The [API integration suite](../apps/api/tests/api.integration.ts) checks anonymous access for every protected operation and exercises both disallowed roles for each role-specific operation. The [browser test](../apps/api/tests/e2e/browser.spec.ts) exercises CORS, bearer authentication, multipart upload, review, catalog search, and the PDF blob and download flows in Chromium. It uses a dedicated test page with the live API and replica set. React interface journeys belong to frontend integration.

[OpenAPI validation](../apps/api/tests/contract.test.ts) checks the OpenAPI 3.1 document and shared enums. Run `python scripts/verify_repository.py` in a checkout with private sources to inventory them and check repository traceability. CI runs the same tracked-file and traceability gates with `--ci`.

The [documented source differences](08-OPEN-DECISIONS.md) guide the implementation. D-01 uses the SRS metadata-only review flow. D-02 allows a new department to start empty, as required by the SRS creation workflow.
