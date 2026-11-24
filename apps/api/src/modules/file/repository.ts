import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { GridFSBucket, type GridFSFile, type ObjectId } from 'mongodb';
import type { Database } from '../../lib/database.js';

export const gridFiles = (db: Database) => db.mongo.collection<GridFSFile>('fs.files');
export const gridChunks = (db: Database) => db.mongo.collection<{ files_id: ObjectId }>('fs.chunks');

export function createFileStore(db: Database) {
  const bucket = new GridFSBucket(db.mongo, { writeConcern: { w: 'majority' } });
  return {
    async write(id: ObjectId, path: string, name: string) {
      const target = bucket.openUploadStreamWithId(id, name);
      await pipeline(createReadStream(path, { highWaterMark: target.chunkSizeBytes }), target);
    },
    async remove(id: ObjectId) {
      // Delete partial uploads as well as complete files; repeated deletion is harmless.
      await gridFiles(db).deleteOne({ _id: id });
      await gridChunks(db).deleteMany({ files_id: id });
    },
    info: (id: ObjectId) => gridFiles(db).findOne({ _id: id }),
    read: (id: ObjectId) => bucket.openDownloadStream(id),
  };
}

export type FileStore = ReturnType<typeof createFileStore>;
