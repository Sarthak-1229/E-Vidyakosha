# Production deployment

The release image runs the built React application and Express API on port 4000 as the unprivileged `node` user. The intended public surface is a single HTTPS origin. The production Compose file binds the application to host loopback and expects an existing MongoDB replica set.

## Configure the database and secrets

1. Create a dedicated application database on an authenticated, persistent replica set. Give its application identity rights to read and write this database, create collections and indexes, and use transactions and GridFS. Restrict connectivity to application hosts and verify all advertised replica hostnames resolve from inside the application container. Require TLS with certificate and hostname validation. [MongoDB security checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
2. Inject `MONGODB_URI`, `JWT_SECRET` and `WEB_ORIGIN` through the runtime secret store. Use a URI with the database name, the correct authentication database and replica-set options for your provider. Generate a unique signing secret with at least 32 random bytes. Use the exact HTTPS origin without a path or trailing slash. Keep secret values out of Compose files, shell history, client builds and logs.
3. Build the client with `VITE_API_BASE_URL=/api/v1`. The application image contains both builds. Keep the Node listener private and preserve the existing non-root user. Use a persistent database backup that covers all six collections and both GridFS collections at the same recovery point. Restore into an isolated replica set and compare a known PDF digest before approving the backup. [MongoDB backup methods](https://www.mongodb.com/docs/manual/core/backups/)

## Terminate HTTPS at the proxy

Configure a valid certificate for the public DNS name, automatic renewal and an HTTP-to-HTTPS redirect. Route both the SPA and `/api/v1` through the same origin. At a single trusted Nginx edge, the following belongs inside the TLS server block. The 55 MiB request limit leaves room for multipart headers around a 50 MiB PDF. The API still enforces the exact file limit.

```nginx
location / {
    client_max_body_size 55m;
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_buffering off;
    proxy_cache off;
}
```

Set `TRUST_PROXY_HOPS=1` only when that proxy is the only path to Express and it overwrites client-supplied forwarding headers. For a different topology, verify the actual trusted hop count. Disable caching of authenticated API and PDF responses at every proxy or CDN. Keep port 4000 and MongoDB unreachable from the public network. [Nginx proxy directives](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) · [Nginx request size limit](https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size)

## Launch and provision

Once deployment is authorized, run the following with the runtime environment available on the host. Pin the deployed source revision or image digest for rollback.

```bash
docker compose -f infra/compose.production.yml up -d --build
docker compose -f infra/compose.production.yml ps
```

For the first application Admin, inject `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` and a new 16–128 character `BOOTSTRAP_ADMIN_PASSWORD` into this one-off process, then clear them. The CLI refuses a second bootstrap. Later Faculty and Admin accounts are created by a signed-in Admin.

```bash
docker compose -f infra/compose.production.yml run --rm \
  -e BOOTSTRAP_ADMIN_NAME -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD \
  app node dist/commands/bootstrap-admin.js
```

## Verify on the target before opening access

| Check | Expected evidence |
|---|---|
| DNS and HTTPS | HTTP redirects to the intended HTTPS origin. A browser trusts the full certificate chain and the renewal job succeeds. |
| Application health | `GET /api/v1/health` returns 200. Also sign in and list a Subject to exercise database access. |
| Authorization and cache | An anonymous request for the approved document's PDF returns 401, including immediately after an authenticated read. A Student cannot list users. Pending material yields 404 with valid Student credentials. |
| Proxy and PDF integrity | Through the public origin, submit a valid 50 MiB PDF, approve it, then open and download it. Check the content disposition, filename, byte length and SHA-256. Oversize files must fail. |
| Secrets and networking | Inspect exposed ports, forwarding behavior, runtime permissions, redacted logs and the absence of credentials in browser assets. Confirm that direct database access is restricted. |
| Backup and rollback | Restore a backup on a separate replica set. Sign in and open a retained PDF. Rehearse switching to the previous compatible image and rerun the health and authenticated read checks. |

Rotate the JWT signing secret across all app instances together, then sign in again. Rotate database credentials by introducing a new restricted identity, updating the runtime secret, verifying access, then revoking the old identity. Stop all writers before GridFS recovery. The [operations guide](README.md) has the dry-run and apply commands.

Record the verified deployment hostname, image digest, replica-set health, restore result and reviewer privately during deployment. The local academic demo and the CI container test do not exercise the institution's DNS, certificate renewal or backup service.
