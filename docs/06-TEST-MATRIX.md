# Verification matrix — release must prove each requirement

| FR | Positive test | Negative/security/concurrency test |
|---|---|---|
| 01 | valid Student registration with institution email | other domain, duplicate mixed-case email, role injection, missing fields |
| 02 | all 3 roles login and correct dashboard | wrong email/password same generic error; expired/forged JWT rejected |
| 03 | Admin creates Faculty/Admin, changes role, deletes unused user | Student cannot, self-escalation blocked, referenced user deletion blocked |
| 04 | create Departments/Subjects; edit subject; browse | duplicate department/subject; delete with dependencies; invalid ObjectId |
| 05 | Admin approves/rejects pending; fields recorded in same logical decision | missing rejection reason; second decision; simultaneous approval/rejection; forbidden role |
| 06 | Admin edits metadata; deletes doc with linked data | PDF replacement denied; user forbidden; injected cleanup failure; references remain valid |
| 07 | Faculty uploads valid readable unique PDF up to 50 MiB | non-PDF spoof; corrupt; encrypted; >50 MiB; duplicate sequential/concurrent; failed GridFS write; metadata commit failure |
| 08 | Faculty sees only own PENDING/APPROVED/REJECTED + reason | Faculty B cannot read Faculty A; Student cannot read; no stored status on request |
| 09 | all authenticated roles browse approved by Subject/type | pending/rejected omitted; anonymous cannot browse |
| 10 | title, Subject, type filters with pagination | malicious query/invalid ObjectId; zero matches explicit empty state; private results excluded |
| 11 | approved PDF inline stream, content type & inline disposition | anonymous/expired; pending/rejected/missing; raw GridFS id inaccessible |
| 12 | approved PDF download attachment filename safely encoded | other status/invalid token; header injection; avoid exposing internal file path |

## Full user journeys

A. Student registration -> login -> search -> view -> download. B. Faculty login -> upload -> PENDING own status -> Admin review -> Faculty sees result -> Student discovery if approved. C. Admin category and user controls including dependency protection. D. Duplicate-race upload and forced crash/cleanup/reconciliation. E. Unauthorized cross-role access on **every** protected route.

## CI and quality

Required: ESLint, `tsc` strict, unit tests, MongoDB replica-set integration tests, frontend component tests, E2E browser tests, successful production builds and successful API integration. Separate tests that require Docker/DB from unit tests and run them with explicit configuration in CI. Run `npm audit --omit=dev` before release; triage actual findings rather than claiming zero vulnerabilities automatically. Verify no secret files committed.

**No numeric response targets were approved** (SRS §3.5). Log latency and PDF behavior in the real demonstration environment, not fictional benchmarks.

## Definition of done

- All FR-01…FR-12 positive and negative tests pass with evidence.
- No console errors, uncaught rejections, TypeScript errors or known blockers.
- All permissions enforced by backend; GridFS orphan reconciliation verified under failure injection.
- Responsive and accessible UI as specified, actual integration flows rather than mocks.
- CI green on merged main; pending defects documented. It is impossible to mathematically promise zero future bugs; tests and risk controls make completion demonstrable.
