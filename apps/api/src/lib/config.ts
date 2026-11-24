import { z } from 'zod';

const mongoUri = z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/);
const webOrigin = z.string().url().refine(value => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
});
const tokenSecret = z.string().min(32);

export function loadDatabaseUri(env: NodeJS.ProcessEnv = process.env) {
  const uri = mongoUri.safeParse(env.MONGODB_URI);
  if (!uri.success) throw new Error('MONGODB_URI must be a MongoDB connection string.');
  return uri.data;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const config = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_ORIGIN: webOrigin.default('http://localhost:5173'),
    JWT_SECRET: tokenSecret,
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  }).safeParse(env);
  if (!config.success) {
    const fields = config.error.issues.map(issue => issue.path.join('.')).join(', ');
    throw new Error(`Invalid configuration for ${fields}.`);
  }

  return {
    mongoUri: loadDatabaseUri(env),
    port: config.data.PORT,
    webOrigin: config.data.WEB_ORIGIN,
    jwtSecret: config.data.JWT_SECRET,
    trustProxyHops: config.data.TRUST_PROXY_HOPS,
  };
}
