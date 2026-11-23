import type { ObjectId } from 'mongodb';
import type { Database } from '../../lib/database.js';
import { removeFileAsset } from '../document/repository.js';
import { createFileStore, gridChunks, gridFiles } from './repository.js';

const assetLookup = {
  $lookup: { from: 'fileAssets', localField: '_id', foreignField: 'gridFsFileId', as: 'asset' },
};
const missingAsset = { $match: { 'asset.0': { $exists: false } } };

// Call with all API writers stopped. A live upload has no FileAsset until its transaction commits.
export async function reconcileFiles(db: Database, apply: boolean) {
  const store = createFileStore(db);
  const counts = { unreferencedAssets: 0, orphanFiles: 0, orphanChunkGroups: 0 };

  const assets = db.models.fileAssets.aggregate<{ _id: ObjectId; gridFsFileId: ObjectId }>([
    { $lookup: { from: 'documents', localField: '_id', foreignField: 'fileAssetId', as: 'document' } },
    { $match: { 'document.0': { $exists: false } } },
  ]).cursor();
  for await (const asset of assets) {
    counts.unreferencedAssets += 1;
    if (apply) {
      await store.remove(asset.gridFsFileId);
      await removeFileAsset(db, asset._id);
    }
  }

  const files = gridFiles(db).aggregate<{ _id: ObjectId }>([assetLookup, missingAsset]);
  for await (const file of files) {
    counts.orphanFiles += 1;
    if (apply) await store.remove(file._id);
  }

  const chunks = gridChunks(db).aggregate<{ _id: ObjectId }>([
    { $group: { _id: '$files_id' } },
    assetLookup,
    missingAsset,
    { $lookup: { from: 'fs.files', localField: '_id', foreignField: '_id', as: 'file' } },
    { $match: { 'file.0': { $exists: false } } },
  ]);
  for await (const chunk of chunks) {
    counts.orphanChunkGroups += 1;
    if (apply) await store.remove(chunk._id);
  }
  return counts;
}
