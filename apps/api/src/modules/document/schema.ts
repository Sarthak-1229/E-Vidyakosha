import { DOCUMENT_TYPES } from '@evidy/shared';
import { z } from 'zod';
import { objectId } from '../../lib/http.js';

const title = z.string().trim().min(1).max(500);
const author = z.string().trim().max(250).transform(value => value || null);
const metadata = z.object({
  title, author: author.nullable().optional(), type: z.enum(DOCUMENT_TYPES), subjectId: objectId,
}).strict();

export const uploadMetadata = metadata.extend({ author: author.optional() });
export const editMetadata = metadata.partial().refine(value => Object.keys(value).length > 0);
export type UploadMetadata = z.infer<typeof uploadMetadata>;
export type EditMetadata = z.infer<typeof editMetadata>;
