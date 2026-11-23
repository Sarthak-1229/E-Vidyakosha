# API contract and change policy

`spec/openapi.yaml` is the authoritative v1 REST agreement for the two agents. Paths/HTTP codes are **implementation decisions**, not verbatim mandated by MSS v2.0 (SRS §4.2). They must not expand scope.

Base `http://localhost:4000/api/v1` in dev; use HTTPS in deployment. JSON requests and responses except multipart and application/pdf responses. A valid JWT uses `Authorization: Bearer <token>`. All documents returned via catalog routes have `APPROVED` status; private Faculty submissions and admin pending queue are separate authenticated endpoints.

## Endpoint matrix

| Route | Role(s) | FR | Purpose |
|---|---|---|---|
| POST `/auth/register` | Anonymous Student | 01 | Name/email/password; always STUDENT |
| POST `/auth/login` | Anonymous | 02 | Generic failure / JWT login |
| GET `/auth/me` | Any authenticated | 02 helper | Current user identity |
| GET/POST `/users` | ADMIN | 03 | List/create Faculty or Admin |
| PATCH/DELETE `/users/{id}` | ADMIN | 03 | Change role / delete with integrity checks |
| GET `/departments` and GET `/subjects` | Authenticated | 04 helper | Subject selector/navigation |
| POST/DELETE `/departments` | ADMIN | 04 | Create / delete empty department |
| POST/PATCH/DELETE `/subjects` | ADMIN | 04 | Maintain subjects with constraints |
| GET `/documents` | Authenticated | 09–10 | Approved listing + `q`, `subjectId`, `type`, pagination |
| GET `/documents/{id}` | Authenticated | 09–10 helper | Approved-only metadata |
| POST `/documents` | FACULTY | 07 | Multipart `file,title,author?,type,subjectId`; returns submission ID |
| PATCH/DELETE `/documents/{id}` | ADMIN | 06 | Metadata update / permanent deletion |
| GET `/uploads/mine` | FACULTY | 08 | Only own submissions + status + reason |
| GET `/approvals/pending` | ADMIN | 05 | Pending review metadata |
| POST `/approvals/{id}/decision` | ADMIN | 05 | `decision: APPROVED|REJECTED`, `reason?` |
| GET `/documents/{id}/pdf` | Authenticated | 11 | Approved inline PDF |
| GET `/documents/{id}/download` | Authenticated | 12 | Approved attachment PDF |

### Common schemas and errors

- Success lists: `{items:[...],page:1,pageSize:20,total:0}`. MongoDB IDs serialized as strings and dates ISO-8601. Never return raw passwordHash or GridFS id.
- Standard errors: `{ "error": {"code": "VALIDATION_ERROR", "message": "Human-readable message", "details": {} } }` (details omitted when unavailable).
- Suggested statuses: `400 VALIDATION_ERROR`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 CONFLICT` for duplicates/already-reviewed/dependencies, `413 PAYLOAD_TOO_LARGE`, `500 INTERNAL_ERROR`, `503 STORAGE_UNAVAILABLE`.
- Faculty own statuses and admin pending queue are private metadata, not a route for students. Only approved PDF stream routes exist; **admin preview of pending bytes is unresolved** (see `08-OPEN-DECISIONS.md`).
- `author` is optional input / serialized null when absent, enum categories use exact uppercase values.

## Versioning and changes

Do not modify route paths, role mappings, response shapes or enums unilaterally. Agent that proposes a change creates an ADR and asks for approval; shared types + OpenAPI + backend/frontend tests must change in same reviewed integration PR. A test asserting accepted contract is required for each endpoint. No convenience endpoints that leak private state.
