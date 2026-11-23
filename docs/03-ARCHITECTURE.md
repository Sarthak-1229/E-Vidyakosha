# Implementation architecture (MERN modular monolith)

```
Browser / React + TypeScript / role-aware UI
       | HTTPS JSON + multipart + Authorization: Bearer <JWT>
Express REST controllers + Zod validation + auth/RBAC + errors
       |
  auth | user | academic | document | approval | search | file
       |
Mongoose models / MongoDB app collections | GridFS adapter -> fs.files + fs.chunks
```

## Module ownership and separation

- `auth`: Student registration, login, JWT issue, role-safe auth identity.
- `user`: Admin account list/create/role update/delete with referential constraints.
- `academic`: department/subject list/create/rename/delete with unique names, foreign refs and no-dependent-delete.
- `document`: upload orchestration, metadata update, permanent delete, status/reference lookup.
- `approval`: admin queue, single final decision, faculty own-status retrieval.
- `search`: indexed approved-only catalog, title/subject/type filtering with pagination.
- `file`: PDF validity, SHA-256 hash, GridFS upload/download, cleanup; never direct public access.

Use `src/modules/{auth,user,academic,document,approval,search,file}/{route,controller,service,repository,schema}.ts` as appropriate. `src/models` contains the 6 persistent models and indexes. `src/middleware` owns bearer JWT, role checks and rate/size constraints; `src/lib` shared HTTP/errors/config. Controllers never query MongoDB directly. Services use repositories; dependency direction should remain acyclic.

## Security

- JWT contains id, role, expiry (recommended short expiry, e.g. 2h); verify signature, expiry and active user in protected routes, not just JWT role if a user role can change.
- Initial Admin provisioned **only** via guarded one-off CLI script / managed secret, never HTTP self-registration. No default admin username/password in repo.
- All registrations force role STUDENT and `@mitaoe.ac.in`, after normalizing email. Never echo passwordHash, JWT secrets, MongoDB URI or stack traces.
- For student public authentication endpoints rate-limit brute-force; apply restrictive upload limits. Bearer token is kept **in memory** by frontend to avoid persistent browser token storage in the initial release; refresh requires relogin unless approved otherwise.
- Validate ObjectId, enums, metadata, path params and query params on backend. Return consistent status codes/error structure in `spec/openapi.yaml`.
- Force PDF Content-Type, `X-Content-Type-Options: nosniff`, sanitized filename/Content-Disposition. Never give GridFS routes/IDs directly to browser. Enforce approval and JWT **on each view and download**.

## Upload sequence and failure safety

1. Authorized Faculty / existing Subject. Receive multipart PDF using size limits and safe temp-file handling (do not trust MIME or extension).
2. Check file starts as PDF and is readable by a PDF parser, non-encrypted, noncorrupt, <= 50 MiB; compute full SHA-256 from content.
3. Query retained `fileAssets.sha256Hash`; early reject duplicates. **Also rely on unique DB index**; only pre-checking creates a race.
4. Stream validated file to GridFS; track generated GridFS id. Commit FileAsset + Document(status=PENDING) + UploadRequest together in a **Mongo metadata transaction** (replica set required).
5. If metadata transaction fails, compensation deletes uploaded GridFS bytes; if crash occurs between operations, the admin/maintenance reconciliation command identifies and removes unreferenced GridFS assets. Duplicate-key race must be treated as duplicate error and cleanup both file and metadata.
6. Always delete temp files. Unit + integration tests must inject failures at every stage; repeated upload after a failed attempt must work.

**GridFS does not support multi-document transactions.** Transactions may cover metadata writes, **not** GridFS operations. The SRS asks for consistency, so use compensation and reconciliation, not a fictitious single global transaction. Concurrency and partial cleanup must be verified under actual MongoDB replica set.

## Review sequence

- Admin loads one pending UploadRequest and its Document. Require rejectionReason on REJECTED.
- Use Mongo metadata transaction with conditional `Document.status=PENDING` update; atomically set status + reviewer/reviewedAt/rejectionReason. Must reject second review even if simultaneous.
- UploadRequest does not have a `status` column. Status always derived from Document. APPROVED enters search immediately; REJECTED never does.

## Deletion sequence

- Admin metadata edit never changes PDF bytes or resets status.
- Permanent deletion removes Document and UploadRequest in a metadata transaction; only then safely removes unreferenced FileAsset/GridFS binary, with retryable reconciliation if GridFS deletion fails. Ensure unreferenced file is not reachable from public routes during cleanup.
- Avoid deleting referenced Users, Subjects or Departments. No soft-delete/archive/history new user-facing feature.

## Deployment

React static site / Express server / MongoDB replica set. No vendor mandated. HTTPS for client-server; secure DB transport in hosted environment. Use health checks, safe structured operational error logs (not activity-history feature), environment-variable validation and secrets outside Git. Dedicated test database required for integration tests.
