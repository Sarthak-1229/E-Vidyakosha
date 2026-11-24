# E-Vidyakosha

E-Vidyakosha is the MERN academic document repository defined by MSS v2.0. Students discover approved PDFs, Faculty submit them, and administrators manage users, subjects, documents, and reviews. The [API contract](spec/openapi.yaml) and [integration verification](docs/13-INTEGRATION-VERIFICATION.md) map the implementation to FR-01–FR-12.

## Local development

Use Node.js 24 LTS, npm, and a MongoDB replica set. The [database guide](infra/README.md) covers the loopback Docker replica set and managed databases.

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
