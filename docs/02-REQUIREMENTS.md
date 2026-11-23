# Approved functional and non-functional baseline

There are exactly 12 **primary** use cases and 3 concrete user roles. In shared resource access, Student/Faculty/Admin can all search/view/download approved documents.

| FR / UC | Primary responsibility | Actor and required result |
|---|---|---|
| FR-01 / UC-01 | Register Student | Visitor with unique `@mitaoe.ac.in` email; role fixed to STUDENT; no verification mail |
| FR-02 / UC-02 | Login | Any role; verify hash, JWT identity + role, generic invalid credential error |
| FR-03 / UC-03 | Manage Users | Admin list accounts/create Faculty/Admin/change role/delete only with integrity checks |
| FR-04 / UC-04 | Manage Departments & Subjects | Admin create/list Departments/Subjects, edit/delete Subjects, enforce unique and dependency rules |
| FR-05 / UC-05 | Review Upload | Admin approve/reject once; rejection requires reason; reviewer and time recorded |
| FR-06 / UC-06 | Manage Documents | Admin edit metadata or permanently delete linked data; never replace PDF |
| FR-07 / UC-07 | Upload PDF | Faculty submit metadata/PDF <= 50 MiB; validate, SHA-256 reject duplicate, pending records |
| FR-08 / UC-08 | View Own Upload Status | Faculty sees only own submissions and rejection reasons |
| FR-09 / UC-09 | Browse Documents | Authenticated users see approved documents by subject/type |
| FR-10 / UC-10 | Search Documents | Authenticated users filter approved title, subject, type; explicit no-result state |
| FR-11 / UC-11 | View PDF | Authenticated user can inline-stream only approved PDFs, access checked on backend |
| FR-12 / UC-12 | Download PDF | Authenticated user can attachment-stream only approved PDFs; no public GridFS URLs |

## Unchangeable invariants

- Role `ADMIN | FACULTY | STUDENT`; Document status `PENDING | APPROVED | REJECTED`; type `EBOOK | REFERENCE_BOOK | RESEARCH_PAPER | LAB_MANUAL | LECTURE_NOTES | QUESTION_PAPER | OTHER`.
- Exactly 6 application collections: `users`, `departments`, `subjects`, `documents`, `fileAssets`, `uploadRequests`; GridFS additionally uses `fs.files`, `fs.chunks`.
- 10 *UML core types* (not 10 collections): User, Admin, Faculty, Student, Department, Subject, Document, FileAsset, UploadRequest, DocumentType enumeration. Admin/Faculty/Student are roles of one users collection.
- Department → Subject → Document. Subject unique within department; user email unique; department name unique; FileAsset sha256 unique.
- Every document exactly 1 Subject, 1 Faculty uploader, 1 FileAsset, 1 UploadRequest. Status stored only on Document; review fields stored on UploadRequest.
- Only FACULTY uploads (to any existing Subject); only ADMIN reviews. No non-approved item appears in general discovery or streaming routes.
- Bad PDF, encrypted PDF, corrupt PDF, non-PDF, duplicate, >50 MiB must be rejected with no persistent upload results.

## Out of scope

AI, recommendation/chatbot, password reset, email verification, notifications, native/offline app, editions, PDF replacement/revisions, archive/restore, audit log/history, physical lending, malware scanning, user-submitted modification/deletion requests, faculty-to-subject assignments, payment integration. No new roles, request statuses or domain entities without explicit approval.

## SRS non-functional requirements

Security: backend RBAC, hashed passwords, HTTPS deployed, restricted file streams. Reliability: cleanup/compensating operations for GridFS and metadata. Maintainability: 7 logical backend modules. Usability: labeled forms, validation, empty states and role-appropriate navigation. Portability: modern web browsers. Availability: graceful storage failure. **No numeric throughput or response latency guarantee is approved**; collect measured demo environment results instead of fabricating targets.
