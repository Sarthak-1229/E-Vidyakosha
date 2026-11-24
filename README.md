# E-Vidyakosha

E-Vidyakosha is the MERN academic document repository defined by MSS v2.0. Students discover approved PDFs, Faculty submit them, and administrators manage users, subjects, documents, and reviews. The [API contract](spec/openapi.yaml) and [integration verification](docs/13-INTEGRATION-VERIFICATION.md) map the implementation to FR-01–FR-12.

## Local development

Use Node.js 24, npm and a MongoDB replica set. Run the commands from the repository root. For a classroom presentation, follow the separate [academic demo guide](docs/demo/README.md). It includes the two sample courses, three original PDFs, role sign-in instructions and a walkthrough of all twelve requirements.

1. Run `npm ci` from the repository root.
2. Start or connect to your MongoDB replica set. For the bundled local setup, use `docker compose -f infra/docker-compose.yml up -d` and initialize `rs0` as shown in the database guide.
3. Configure `apps/api/.env` if your checkout has no existing configuration. The development API defaults to port 4000 and Vite uses port 5173.

```powershell
if (-not (Test-Path apps/api/.env)) {
  $evidyJwt = node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
  (Get-Content -Raw apps/api/.env.example).Replace("JWT_SECRET=", "JWT_SECRET=$evidyJwt") |
    Set-Content -Encoding ascii apps/api/.env
}
```

Use the example URI for the bundled replica set, or set `MONGODB_URI` for your database. `WEB_ORIGIN` specifies the browser origin allowed for cross-origin requests. The Vite proxy defaults to `http://127.0.0.1:4000`; use `API_PROXY_TARGET` in the web development environment if you run the API on another port.

On macOS and Linux, this command creates a new local API configuration with a random signing secret. The exclusive write protects existing settings. Run it only for a new checkout.

```bash
node --input-type=module -e "import fs from 'node:fs'; import {randomBytes} from 'node:crypto'; fs.writeFileSync('apps/api/.env', fs.readFileSync('apps/api/.env.example','utf8').replace('JWT_SECRET=', 'JWT_SECRET='+randomBytes(48).toString('base64url')), {flag:'wx',mode:0o600})"
```

| Setting | Where it is read | Value for local development |
|---|---|---|
| `MONGODB_URI` | API and administrator CLI | The application database on a writable replica set |
| `JWT_SECRET` | API at startup | Random signing secret of at least 32 characters |
| `PORT` / `WEB_ORIGIN` | API at startup | `4000` / `http://localhost:5173`; for the combined server use its exact browser origin |
| `TRUST_PROXY_HOPS` | API at startup | `0` for a direct connection |
| `VITE_API_BASE_URL` | Web build and Vite | `/api/v1` for the same-origin app and the development proxy |
| `API_PROXY_TARGET` | Vite development server | `http://127.0.0.1:4000` |

An older setup ZIP generated `apps/web/.env` with `VITE_API_BASE_URL=http://localhost:4000/api/v1`. Change that entry to `VITE_API_BASE_URL=/api/v1` before building for the demo, CI or deployment. Rebuild after changing a `VITE_*` setting. The browser can read all values bundled under that prefix.

### Provision the first Admin

Run this one time against the intended database. Supply your own Admin name, email and unique password of 16–128 characters. The CLI refuses a second bootstrap.

```powershell
$env:BOOTSTRAP_ADMIN_NAME = Read-Host 'Admin name'
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'Admin email'
$evidyPassword = Read-Host 'Admin password' -AsSecureString
$env:BOOTSTRAP_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $evidyPassword).Password
try {
  npm run admin:bootstrap -w @evidy/api
} finally {
  Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD, Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_NAME
}
```

On macOS and Linux, export the same three variables for the command. Use a silent password prompt or a secret manager. Future privileged accounts are provisioned through the Admin UI.

### Launch

```bash
npm run dev
```

Open [the development application](http://localhost:5173). The API is available directly at `http://localhost:4000/api/v1`. Development and built applications default to the real API. Explicitly set `VITE_USE_MOCKS=true` for a mock-only Vite development session. Configure a disposable `VITE_MOCK_PASSWORD` locally if you need the mock's fixture accounts. The production build excludes the mock adapter.

## Production build and deployment

The [production deployment guide](infra/DEPLOYMENT.md) covers the HTTPS proxy, database identity, secret rotation, backup restore and pre-release checks.

```bash
npm ci
npm run build
npm start
```

The combined Express server serves the React build plus `/api/v1` on port 4000. Keep `VITE_API_BASE_URL=/api/v1` for this same-origin deployment. For a container deployment, supply `MONGODB_URI`, `JWT_SECRET`, and the HTTPS `WEB_ORIGIN` through your deployment environment or secret manager. Use an authenticated, persistent MongoDB replica set with TLS.

```bash
docker compose -f infra/compose.production.yml up -d --build
```

The container binds through loopback on the host. Configure the public TLS reverse proxy in front of port 4000 with a request body limit larger than 50 MiB to allow multipart overhead. Preserve the API's streaming responses. Set `TRUST_PROXY_HOPS` to the actual number of trusted proxies only when they form the sole request path and overwrite forwarding headers. Use `/api/v1/health` as the liveness endpoint. See the [operations guide](infra/README.md) for container Admin provisioning and GridFS maintenance.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration -w @evidy/api
npm run build
npx playwright install chromium
npm run test:e2e -w @evidy/api
npm audit
python scripts/verify_repository.py --ci
```

Integration and browser tests start isolated real replica sets. The browser tests exercise the built React UI against the live Express routes. CI runs these checks and smoke-tests the production image against MongoDB.

The private SAD PDFs and extracts supplied with the setup kit belong only in local checkouts. Keep .env files and credentials outside Git. [Source index](docs/01-SOURCE-OF-TRUTH.md)

## Troubleshooting

| Symptom | Check and recovery |
|---|---|
| Startup fails or a write reports a transaction error | Verify the API database URI, that the replica set is initialized, and that `db.hello().isWritablePrimary` is true. Check the host advertised by the replica set is reachable from the API process. |
| Bootstrap says an administrator already exists | Sign in with the existing Admin for that database. Confirm which database the CLI selected. The classroom helper targets its own database. |
| Sign-in shows a connection error, or a browser test times out at `/auth/login` | In browser Network, check the request goes to the same origin as the page. Correct the starter ZIP setting above, rebuild, then reopen the application. |
| An API or Vite port is occupied | Use the running instance or stop your own process with Ctrl+C. For development, changing the API port also requires updating the Vite proxy target. |
| A Faculty upload fails | Use a readable, unencrypted PDF of at most 50 MiB and select an existing Subject. A 409 means identical bytes are already retained, including pending or rejected uploads. |
| A signed-in user cannot see a PDF | Check the Admin decision and Faculty status. Only approved material appears in the library. A page reload or expired session requires sign-in again. |
| Playwright or MongoDB tests fail before starting | Run `npx playwright install chromium`. On a new test machine allow the first MongoDB binary download, or point `MONGOMS_SYSTEM_BINARY` at a compatible local `mongod`. |
