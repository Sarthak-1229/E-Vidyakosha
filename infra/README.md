# Local MongoDB replica set

MongoDB metadata transactions require a replica set, while GridFS is not permitted inside multi-document transactions. `docker compose` is an optional **local-only** database setup.

```bash
cd infra
docker compose up -d
docker compose exec mongodb mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
# After initialization:
docker compose exec mongodb mongosh --quiet --eval 'rs.status().ok'
```

Expected app `MONGODB_URI`: `mongodb://127.0.0.1:27017/evidyakosha?replicaSet=rs0&directConnection=true`.

This demo container has **no MongoDB authentication** and binds to localhost only. Do not expose it externally or use as a production configuration; configure managed database credentials, backups, TLS, restricted network access and persistent storage before deployment.

## API startup and initial administrator

Set `MONGODB_URI`, `JWT_SECRET` and `WEB_ORIGIN` in the API environment. The API verifies the database topology and creates required indexes on startup. Development defaults to port 4000.

Provide `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` and a unique 16–128 character `BOOTSTRAP_ADMIN_PASSWORD` through a one-off environment or your secret manager. Run `npm run admin:bootstrap -w @evidy/api` from the repository root. The command checks for an existing Admin and handles simultaneous bootstrap attempts with a unique MongoDB index. Clear the bootstrap environment after use. Later privileged accounts are created through the authenticated Admin API.

Run `npm run dev` from the repository root for both development processes. Run `npm run build` and then `npm start` to serve the built React app and Express API together. Supply a valid replica-set URI to use an existing database.

For the production image, provision the initial Admin through the deployment environment and run:

```bash
docker compose -f infra/compose.production.yml run --rm \
  -e BOOTSTRAP_ADMIN_NAME -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD \
  app node dist/commands/bootstrap-admin.js
```

Clear the one-off bootstrap environment after the command. The image uses the app's runtime MongoDB connection and exits after provisioning.

## GridFS reconciliation

Document deletion removes the document and its upload request together. If deleting the binary fails, retry the same DELETE request. The remaining asset tracks cleanup and preserves SHA-256 uniqueness until its bytes are removed.

Stop every API instance that writes to the database and let active requests finish before running reconciliation. An in-progress upload can have GridFS data before its metadata transaction commits. Inspect the recovery inventory first, then apply it.

```bash
npm run files:reconcile -w @evidy/api
npm run files:reconcile -w @evidy/api -- --apply
```

The command preserves binaries referenced by documents, and removes unreferenced assets, orphan files and orphan chunk groups. Each deletion can be retried. Restart the API after applying cleanup.

In the production image use `node dist/commands/reconcile-files.js` as a one-off Compose command, with optional `--apply` after reviewing the inventory and stopping writers.
