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
