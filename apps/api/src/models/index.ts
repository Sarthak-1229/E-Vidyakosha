import { DOCUMENT_STATUSES, DOCUMENT_TYPES, MAX_PDF_BYTES, USER_ROLES } from '@evidy/shared';
import { Schema, type Connection } from 'mongoose';

const ref = (model: string) => ({ type: Schema.Types.ObjectId, required: true, ref: model }) as const;
const options = { strict: 'throw', versionKey: false } as const;
// A reference write conflicts with a concurrent deletion of the referenced record.
const referenceVersion = { type: Number, default: 0, select: false } as const;
export const nameCollation = { locale: 'en', strength: 2 } as const;

const users = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: USER_ROLES },
  createdAt: { type: Date, required: true, default: Date.now },
  bootstrap: { type: Boolean, select: false },
  referenceVersion,
}, options);
users.index({ role: 1, _id: 1 });
users.index({ bootstrap: 1 }, { unique: true, partialFilterExpression: { bootstrap: true } });
users.index({ createdAt: -1, _id: -1 });

const departments = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  referenceVersion,
}, options);
departments.index({ name: 1 }, { unique: true, collation: nameCollation });

const subjects = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  departmentId: ref('Department'),
  referenceVersion,
}, options);
subjects.index({ departmentId: 1, name: 1 }, { unique: true, collation: nameCollation });

const fileAssets = new Schema({
  gridFsFileId: { type: Schema.Types.ObjectId, required: true, unique: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 1, max: MAX_PDF_BYTES, validate: Number.isSafeInteger },
  sha256Hash: { type: String, required: true, unique: true, match: /^[a-f0-9]{64}$/ },
  cleanupDocumentId: { type: Schema.Types.ObjectId, unique: true, sparse: true },
}, options);

const documents = new Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, default: null },
  type: { type: String, required: true, enum: DOCUMENT_TYPES },
  subjectId: ref('Subject'),
  uploadedBy: ref('User'),
  fileAssetId: { ...ref('FileAsset'), unique: true },
  status: { type: String, required: true, enum: DOCUMENT_STATUSES, default: 'PENDING' },
  uploadedAt: { type: Date, required: true, default: Date.now },
}, options);
documents.index({ status: 1, uploadedAt: -1, _id: -1 });
documents.index({ subjectId: 1, status: 1, uploadedAt: -1, _id: -1 });
documents.index({ type: 1, status: 1, uploadedAt: -1, _id: -1 });
documents.index({ uploadedBy: 1 });
documents.index({ status: 1, title: 'text' }, { default_language: 'none' });

const uploadRequests = new Schema({
  documentId: { ...ref('Document'), unique: true },
  submittedBy: ref('User'),
  reviewedBy: { ...ref('User'), required: false, default: null },
  submittedAt: { type: Date, required: true },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
}, options);
uploadRequests.index({ submittedBy: 1, submittedAt: -1, _id: -1 });
uploadRequests.index({ reviewedBy: 1 });

export function connectModels(connection: Connection) {
  return {
    users: connection.model('User', users, 'users'),
    departments: connection.model('Department', departments, 'departments'),
    subjects: connection.model('Subject', subjects, 'subjects'),
    documents: connection.model('Document', documents, 'documents'),
    fileAssets: connection.model('FileAsset', fileAssets, 'fileAssets'),
    uploadRequests: connection.model('UploadRequest', uploadRequests, 'uploadRequests'),
  };
}
