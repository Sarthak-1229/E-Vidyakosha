# Academic demonstration

Show how an instructor's PDF becomes available to a Student. Use three browser profiles or separate private sessions so each role stays signed in. The demo uses the real built React client, Express API and GridFS on the local `rs0` replica set.

## Prepare the machine

1. Install Node.js 24 and run `npm ci` at the repository root. Start the loopback replica set on port 27017 and wait for a writable primary. Docker and native MongoDB instructions are in the [database guide](../../infra/README.md).
2. Set the web build to the relative API path. In PowerShell run `$env:VITE_API_BASE_URL='/api/v1'` followed by `npm run build`. In Bash run `VITE_API_BASE_URL=/api/v1 npm run build`. This also works in checkouts made by the older setup ZIP.
3. Seed the dedicated database using the command below for your system. This creates three synthetic accounts, two Departments, two Subjects and two submitted PDFs. The third handout is reserved for the live upload.
4. Run `npm run demo:start` and open [the local demonstration](http://127.0.0.1:4000). Keep the process running. Ctrl+C stops the app. The database persists across restarts and each app start generates a new session signing secret.

### Windows

```powershell
.\scripts\demo-accounts.ps1
```

The helper generates separate random passwords and saves the role credentials using Windows DPAPI in `%LOCALAPPDATA%\E-Vidyakosha\academic-demo-v1.clixml`. Run it as the same Windows user on the same machine for later rehearsals. To sign in, use the address below and copy just that role's password into the sign-in form. Keep clipboard history and cloud sync off for the presentation, and clear the clipboard after pasting.

```powershell
.\scripts\demo-accounts.ps1 -CopyPassword Faculty
Set-Clipboard -Value ''
```

Use `Admin` or `Student` in place of `Faculty` for the other sessions. Run the copy and clear commands separately, with the paste in between.

### macOS / Linux

In Bash, supply different 16–128 character passwords from your password manager using silent prompts. Keep those passwords for future runs.

```bash
(
  for role in ADMIN FACULTY STUDENT; do
    read -rsp "$role demo password: " value || exit 1
    printf '\n'
    export "DEMO_${role}_PASSWORD=$value"
  done
  unset value
  npm run demo:setup
)
```

### Accounts and handouts

| Role | Local sign-in address | Landing screen |
|---|---|---|
| Student | `demo.student@mitaoe.ac.in` | Academic Library |
| Faculty | `demo.faculty@example.test` | My Submissions |
| Admin | `demo.admin@example.test` | Review & Approvals Queue |

| Department / Subject | Handout | Initial state |
|---|---|---|
| Computer Engineering / Algorithms | [Binary search on a sorted array](handouts/binary-search.pdf) | Approved lecture notes, visible in the library |
| Electronics Engineering / Signals and Systems | [Sampling a sine wave](handouts/sampling.pdf) | Pending lab manual, visible to its uploader and the Admin queue |
| Computer Engineering / Algorithms | [Breadth-first traversal](handouts/breadth-first-traversal.pdf) | Local worksheet for the presenter to upload |

All handouts were written for this demonstration. Setup always uses `evidyakosha_demo_v1` on `127.0.0.1:27017`, regardless of the normal application's `MONGODB_URI`. Each rerun authenticates the same accounts, reuses retained sample bytes by SHA-256 and preserves final review decisions. An interrupted seed can be retried. A populated database without the expected bootstrap Admin or a mismatched password stops setup. Keep the classroom credentials and database separate from institutional data.

## Present the upload journey

1. **Student.** Sign in, open the library and search for `traversal`. Observe the empty result. Searching for `binary` finds the approved lecture notes.
2. **Faculty.** Open **Upload PDF**. Choose `handouts/breadth-first-traversal.pdf`, enter **Breadth-first traversal**, select Lecture Notes, Computer Engineering and Algorithms, then submit. Open **My Submissions** and locate its pending status. The Student still sees no traversal result.
3. **Admin.** Open **Review Queue** and select **Review Submission** for the worksheet. Inspect the metadata and confirm approval. Re-enter the Faculty submissions screen to see **Approved**.
4. **Student.** Search for `traversal` again. Filter by Algorithms and Lecture Notes, open the result, and show the worked queue on the rendered page. Click **Download PDF**. The file is named `breadth-first-traversal.pdf`. Compare it with the handout using `Get-FileHash` or `shasum -a 256`.
5. **Admin.** On **Documents**, edit the worksheet's title and show the updated Student search. At the end of the rehearsal, permanently delete **only the worksheet you just uploaded** to free its content hash for the next run. Keep the two seeded records. For a rejection demonstration, the pending sampling handout accepts a reason and shows it to Faculty. That decision is final on this database.

## Trace the twelve requirements

| Requirement | What the presenter does | What the examiner can observe |
|---|---|---|
| FR-01 · Register Student | In a signed-out session, register a fresh synthetic institutional address. | Other domains are rejected. A successful registration proceeds to sign-in and the account is a Student. |
| FR-02 · Sign in | Sign in separately as Student, Faculty and Admin. Try one incorrect password. | Role-specific navigation appears after success. Invalid credentials produce a generic error. |
| FR-03 · Manage users | Admin opens **Users**, creates a temporary Faculty account, changes its role, then deletes the unused account. | The list reflects each change. Referenced accounts and the last Admin have deletion protection. |
| FR-04 · Manage the hierarchy | Admin opens **Hierarchy**, adds a temporary Department and Subject, renames the Subject, then removes the Subject before its Department. | The hierarchy reflects each change. A Department with Subjects cannot be deleted. |
| FR-05 · Review an upload | Admin approves the worksheet or rejects the sampling handout with a reason. | The pending item leaves the queue. A second final decision is refused. |
| FR-06 · Manage documents | Admin edits the approved worksheet metadata, then deletes that rehearsal upload. | The PDF bytes survive a metadata edit. A deleted document disappears from search and file access. |
| FR-07 · Upload a PDF | Faculty submits the worksheet. Submit the same bytes again under another filename. | The first upload enters review. The duplicate is refused. The API checks readability, encryption and the 50 MiB limit. |
| FR-08 · See own statuses | Re-enter **My Submissions** as Faculty after review. | The uploader sees their pending/final statuses and any rejection reason. Another Faculty account has its own list. |
| FR-09 · Browse | Student opens **Library** before and after approval. | The binary-search handout is visible immediately. The worksheet appears only after approval. |
| FR-10 · Search | Combine a title word with Algorithms and Lecture Notes, then try a word with no matches. | Matching approved documents appear. An empty search result has an explicit message. |
| FR-11 · View PDF | Open the approved worksheet and zoom the rendered page. | Page controls work and the student can read the PDF. Anonymous access is denied and pending bytes are concealed. |
| FR-12 · Download PDF | Click **Download PDF** and compare the local digest with the original. | The downloaded filename and bytes match. Direct anonymous requests cannot download the document. |

The [test matrix](../06-TEST-MATRIX.md) and [backend traceability](../12-BACKEND-TRACEABILITY.md) identify the automated negative, authorization and concurrency checks behind these demonstrations.

## Presentation screenshots

| Role and device | Captured screen |
|---|---|
| Admin · desktop | [Reviewing the worksheet before approval](screenshots/desktop-admin-review.png) |
| Faculty · desktop | [Own submissions after the decision](screenshots/desktop-faculty-status.png) |
| Student · desktop | [Search with all three filters](screenshots/desktop-student-search.png) · [Rendered worksheet](screenshots/desktop-pdf.png) |
| Student · mobile | [Full library page](screenshots/mobile-library.png) · [PDF and download controls](screenshots/mobile-pdf.png) |

The screenshots use synthetic data from the running application. The desktop viewport was 1440 × 900. Mobile used touch-enabled Chromium at 390 × 844. The mobile library capture includes the full scrollable page. See the [release verification record](VERIFICATION.md) for test counts and remaining physical-device and deployment checks.
