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

Run `npm run dev -w @evidy/api` for development or `npm run build && npm start -w @evidy/api` for the built server. Supply a valid replica-set URI to use an existing database.

## GridFS reconciliation

Document deletion removes the document and its upload request together. If deleting the binary fails, retry the same DELETE request. The remaining asset tracks cleanup and preserves SHA-256 uniqueness until its bytes are removed.

Stop every API instance that writes to the database and let active requests finish before running reconciliation. An in-progress upload can have GridFS data before its metadata transaction commits. Inspect the recovery inventory first, then apply it.

```bash
npm run files:reconcile -w @evidy/api
npm run files:reconcile -w @evidy/api -- --apply
```

The command preserves binaries referenced by documents, and removes unreferenced assets, orphan files and orphan chunk groups. Each deletion can be retried. Restart the API after applying cleanup.
