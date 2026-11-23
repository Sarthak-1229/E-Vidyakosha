# Cross-document alignment review (all 8 practical files)

The baseline files have been preserved without mutation. Summary of how the implementation design aligns:

| Source | Key page(s) | Implemented as engineering plan |
|---|---|---|
| 01 SRS | pp. 6–8 and 9–11 | FR-01…FR-12, data dictionary, verification matrix |
| 02 Process Identification | pp. 1–3 | P1–P8 map to auth/user/academic/upload/review/document/search/file |
| 03 Use Cases | pp. 2–7 | Student/Faculty/Admin plus abstract Library User behavior; authorization, PDF validation, SHA-256 and cleanup |
| 04 Structural Design | pp. 3–4, 6–9 | 10 core UML types, 6 app collections, 7 modules, MERN 3-tier deployment |
| 05 Architecture Design | pp. 3–7 | Security Middleware, REST API Layer and services; DocumentService internal validator/hasher/cleanup |
| 06 Workflow/State | pp. 3–12 | Subject check -> PDF -> hash -> GridFS -> pending; review once; 3 persistent status values |
| 07 Interactions | pp. 4–10 | Login, upload, review, PDF stream messages; API paths in diagrams are illustrative |
| 08 Complex Interactions | pp. 3–10 | multi-session document life cycle; logical ordering not numeric time guarantees |

## Non-obvious consistency checks

1. Process Identification §7 says `UploadRequest` status is derived from `Document.status`; the server must not add a second status column.
2. Structural Design class diagram defines `DocumentType` seven literals; `UserRole` and `DocumentStatus` are typed values, **not new core persistent entities**.
3. Activity/sequence diagrams depict two review updates; implementation must make their metadata write atomic even though illustration uses fork/par notation.
4. GridFS cannot participate in MongoDB multi-document transactions; explicit compensation and recovery are therefore mandatory implementation mechanisms.
5. Practical 6 example paths and HTTP codes are labeled illustrative. The new v1 paths are an implementation choice recorded in OpenAPI, not a modification of the SRS.
6. Practical 7 uses logical time t0…tN; no measured SLAs should be claimed.
7. Two mismatches that need transparent handling are recorded in `08-OPEN-DECISIONS.md`: admin pending-PDF preview vs approved-only stream rule, and department multiplicity when initially empty.
