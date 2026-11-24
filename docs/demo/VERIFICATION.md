# v1.0.0 release verification

Verified on 24 November 2026 from the integrated `main` revision `8500ecdb37aacae9cedcbaffe17b84b1ecce7e6a`. The release adds classroom data, operator scripts, presentation evidence and documentation. MSS v2.0 still has three roles, twelve requirements, six application collections plus GridFS, and 25 API operations.

## Local checks executed

| Check | Result |
|---|---|
| `npm ci --no-fund` | 482 packages added, 486 audited. Node 24.13.0 and npm 11.6.2 on Windows. npm emitted deprecation notices for ESLint 9 and whatwg-encoding. |
| `npm run lint`, `npm run typecheck` | Both exited 0. |
| `npm test` | 4 API unit/contract, 23 React component and 1 shared contract test passed. |
| `npm run test:integration -w @evidy/api` | 17 passed on real isolated replica sets. Includes authentication boundaries, exact and oversize PDFs, duplicate races, final review decisions, GridFS failures and cleanup. |
| `npm run build` | All workspaces built. Vite transformed 1,643 modules and copied 192 PDF resources. |
| `npx playwright install chromium`, `npm run test:e2e -w @evidy/api` | 4 passed in 47.0 s. Live cross-origin flow, all 25 API operations, mobile navigation/keyboard/accessibility and production artifacts. |
| `npm audit`, `npm audit --omit=dev` | Both reported zero known vulnerabilities at the time of verification. |
| `python scripts/verify_repository.py`, `python scripts/verify_repository.py --ci` | 12 requirements, 25 operations and private-file tracking checks. Full local gate also checked eight private PDFs, eight corresponding extracts and 17 OpenAPI route templates. |

The automated total was **49 passed, 0 failed** after correction. The original local browser run had two failures at sign-in. The starter checkout's ignored Vite environment contained an absolute localhost API URL. Changing that entry to `/api/v1` and rebuilding fixed both desktop and mobile sign-in without changing the client or relaxing the tests.

## Acceptance on the running demo

The combined built client/API listened on `127.0.0.1:4000`; MongoDB 8.2.6 reported `rs0` with a writable primary on `127.0.0.1:27017`. A separate Chromium run signed in using the seeded accounts against this persistent database.

- Faculty submitted the traversal worksheet. The Student saw no matching title and an authenticated request for the pending PDF returned 404.
- Admin confirmed approval in the queue. Faculty saw the new approved count. The Student then found the worksheet using title, Subject and type filters.
- Desktop and emulated mobile Chromium rendered the page. The downloaded file was 2,846 bytes with SHA-256 `ae883239040e790c2c37a7c49f918f6044f7580b62b46434260f6db415236508`, identical to the original. No unexpected browser console errors or uncaught page errors occurred.
- Admin deleted the temporary worksheet through the UI. The authenticated download returned 404. The separate approved and pending starter records were retained for the presenter.
- Repeating setup preserved the IDs and counts of all three accounts, two Departments, two Subjects, two documents, two requests, two file assets, two GridFS files and their two chunks. The seed also worked with an unrelated invalid `MONGODB_URI` in the parent environment. A wrong Admin password produced HTTP 401 and left these records unchanged.

In one warm local Chromium 159.0.8154.6 rehearsal, submit-click to pending response took 645 ms, decision-click to queue update 68 ms, search input to filtered results 37 ms, and opening the result to rendered PDF 365 ms. These are single-machine observations with a small PDF. MSS specifies no latency target.

## Target-specific checks

Windows did not have Docker installed. The repository's Linux CI builds the production image and runs its container smoke against MongoDB. Consult the exact release-candidate PR checks before publishing. No hosted application was deployed during the rehearsal.

For academic sign-off, check the actual projector, physical handset, and target browsers, particularly Safari or Firefox if required. For a hosted release, verify DNS and TLS renewal, reverse-proxy upload and cache behavior, production database access, secret rotation and a backup restore with a PDF digest comparison. The [deployment checklist](../../infra/DEPLOYMENT.md) gives observable results for each check.
