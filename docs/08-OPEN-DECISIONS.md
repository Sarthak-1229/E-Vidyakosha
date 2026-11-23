# Explicit source ambiguities and engineering decisions

No changes to the approved requirements without user approval. These points are reported here rather than silently resolved.

## D-01 — Admin reviewing an unapproved PDF [NEEDS APPROVAL]

SRS FR-11/FR-12 and security rules say only APPROVED PDFs may be streamed via general access endpoints. Practical 5 review flow says Admin inspects "metadata and PDF" before deciding; Practical 2 UC-05 describes inspecting a pending submission without explicitly requiring a separate PDF stream. **Current contract permits metadata-only queue** and does not invent a pending PDF viewer. If an admin-only preview is essential, obtain explicit approval for an authorization-scoped review-preview route that never appears in general repository, and update tests/contract.

## D-02 — Department multiplicity [SOURCE MODEL INCONSISTENCY]

Practical 3 class-relationship table presents Department 1 → 1..* Subject. But SRS FR-04 explicitly lets Admin create a Department before its Subjects. **Proposed practical implementation permits temporary empty Departments (0..* Subjects)** and still blocks deletion when dependent Subjects exist. If strict model fidelity to 1..* at all times is required, that conflicts with department creation workflow; ask user before changing the core UML model.

## D-03 — JWT transport/storage [IMPLEMENTATION DECISION, NOT NEW FR]

SRS §4.2 leaves this open. Proposed Bearer token in request Authorization header, short expiry, **memory-only** storage; browser reload requires re-login. No refresh-token/user-facing reset subsystem added. This balances prototype scope and XSS persistence risk. Ask user if persistent sessions are required.

## D-04 — Upload metadata atomicity and GridFS [IMPLEMENTATION DECISION]

MSS demands no orphan file/partial records. MongoDB documentation says GridFS does not support multi-document transactions. Use metadata transaction + GridFS compensation, crash-recovery reconciliation and failure-injection tests. Do not place GridFS operations inside DB transactions.

## D-05 — Exact API route names / codes [IMPLEMENTATION DECISION]

SRS §4.2 leaves paths and response schemas unspecified. `spec/openapi.yaml` is a consistent concrete v1 contract. Agent changes require an ADR and integration review, not unilateral implementation.

## D-06 — Size meaning [IMPLEMENTATION DECISION]

SRS says "50 MB" without binary/decimal precision. Starter uses 50 MiB = 52,428,800 bytes, documented and tested. Switch to 50,000,000 bytes only if academic evaluator requires decimal interpretation.

## D-07 — Browser login from student registration [SOURCE CLARIFICATION]

Practical 5/6 says registration does not auto-log-in. Implement register-success -> sign-in flow, no JWT on registration response.
