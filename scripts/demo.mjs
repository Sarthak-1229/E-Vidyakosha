import { createHash, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createApp } from '../apps/api/dist/app.js';
import { openDatabase } from '../apps/api/dist/lib/database.js';
import { bootstrapFirstAdmin } from '../apps/api/dist/modules/auth/service.js';

// This operator command has one fixed, local destination, independent of the API .env.
const uri = 'mongodb://127.0.0.1:27017/evidyakosha_demo_v1?replicaSet=rs0&directConnection=true';
const host = '127.0.0.1';
const port = 4000;
const webOrigin = `http://${host}:${port}`;
const webDist = fileURLToPath(new URL('../apps/web/dist/', import.meta.url));
const handouts = new URL('../docs/demo/handouts/', import.meta.url);
const profiles = [
  { role: 'ADMIN', name: 'Demo Administrator', email: 'demo.admin@example.test' },
  { role: 'FACULTY', name: 'Demo Faculty', email: 'demo.faculty@example.test' },
  { role: 'STUDENT', name: 'Demo Student', email: 'demo.student@mitaoe.ac.in' },
];
const catalog = [
  { department: 'Computer Engineering', subject: 'Algorithms', file: 'binary-search.pdf',
    title: 'Binary search on a sorted array', type: 'LECTURE_NOTES', approve: true },
  { department: 'Electronics Engineering', subject: 'Signals and Systems', file: 'sampling.pdf',
    title: 'Sampling a sine wave', type: 'LAB_MANUAL', approve: false },
];

function demoAccounts() {
  const accounts = profiles.map(profile => {
    const key = 'DEMO_' + profile.role + '_PASSWORD';
    const password = process.env[key];
    if (!password || password.length < 16 || password.length > 128) {
      throw new Error('Supply ' + key + ' (16–128 characters) through the local environment.');
    }
    delete process.env[key];
    return { ...profile, password };
  });
  if (new Set(accounts.map(account => account.password)).size !== accounts.length) {
    throw new Error('Use a different password for each demonstration account.');
  }
  return accounts;
}

function apiAt(origin) {
  return async (path, { token, json, form } = {}) => {
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    if (json) headers['Content-Type'] = 'application/json';
    const response = await fetch(origin + '/api/v1' + path, {
      method: json || form ? 'POST' : 'GET', headers,
      body: form ?? (json ? JSON.stringify(json) : undefined), redirect: 'error',
    });
    if (!response.ok) throw new Error(path + ' returned HTTP ' + response.status);
    return response.json();
  };
}

async function seed(db, api, accounts) {
  const [admin] = accounts;
  const owner = await db.models.users.exists({ email: admin.email, role: 'ADMIN', bootstrap: true });
  if (!owner) {
    const collections = await db.mongo.listCollections({}, { nameOnly: true }).toArray();
    for (const { name } of collections) {
      if (await db.mongo.collection(name).findOne({}, { projection: { _id: 1 } })) {
        throw new Error('The dedicated demo database contains other data. Setup stopped before provisioning.');
      }
    }
    await bootstrapFirstAdmin(db, { name: admin.name, email: admin.email, password: admin.password });
  }
  const sessions = {};
  for (const { role, name, email, password } of accounts) {
    if (!await db.models.users.exists({ email })) {
      if (role === 'FACULTY') await api('/users', { token: sessions.ADMIN.token, json: { role, name, email, password } });
      if (role === 'STUDENT') await api('/auth/register', { json: { name, email, password } });
    }
    const session = await api('/auth/login', { json: { email, password } });
    if (session.user.role !== role) throw new Error('Demo account has a different role: ' + role);
    sessions[role] = session;
  }

  const token = sessions.ADMIN.token;
  for (const sample of catalog) {
    let department = (await api('/departments', { token })).find(row => row.name === sample.department);
    department ??= await api('/departments', { token, json: { name: sample.department } });
    let subject = (await api('/subjects?departmentId=' + department.id, { token })).find(row => row.name === sample.subject);
    subject ??= await api('/subjects', { token, json: { name: sample.subject, departmentId: department.id } });

    const bytes = await readFile(new URL(sample.file, handouts));
    const sha256Hash = createHash('sha256').update(bytes).digest('hex');
    const asset = await db.models.fileAssets.findOne({ sha256Hash });
    let id;
    let status;
    if (asset) {
      const document = await db.models.documents.findOne({ fileAssetId: asset._id, uploadedBy: sessions.FACULTY.user.id });
      const submission = document && await db.models.uploadRequests.findOne({ documentId: document._id });
      if (!submission) throw new Error('Retained sample has a different owner or incomplete metadata: ' + sample.file);
      id = submission.id;
      status = document.status;
    } else {
      const form = new FormData();
      form.set('file', new Blob([bytes], { type: 'application/pdf' }), sample.file);
      form.set('title', sample.title);
      form.set('type', sample.type);
      form.set('subjectId', subject.id);
      form.set('author', 'E-Vidyakosha Teaching Lab');
      const submitted = await api('/documents', { token: sessions.FACULTY.token, form });
      id = submitted.submissionId;
      status = submitted.status;
    }
    if (sample.approve && status === 'PENDING') {
      ({ status } = await api('/approvals/' + id + '/decision', { token, json: { decision: 'APPROVED' } }));
    }
    console.log(sample.file + ' | ' + status);
  }
}

async function main() {
  const mode = process.argv[2];
  if (!['setup', 'start'].includes(mode)) throw new Error('Use npm run demo:setup or npm run demo:start.');
  const accounts = mode === 'setup' ? demoAccounts() : [];
  await access(new URL('../apps/web/dist/index.html', import.meta.url));
  const db = await openDatabase(uri);
  let server;
  try {
    const app = createApp({ db, webDist, webOrigin, jwtSecret: randomBytes(48).toString('base64url') });
    server = app.listen(mode === 'setup' ? 0 : port, host);
    await once(server, 'listening');
    if (mode === 'setup') {
      await seed(db, apiAt('http://' + host + ':' + server.address().port), accounts);
      console.log('Demo data ready in evidyakosha_demo_v1.');
    } else {
      console.log('Demo listening at ' + webOrigin + ' | database evidyakosha_demo_v1');
      await new Promise(resolve => {
        process.once('SIGINT', resolve);
        process.once('SIGTERM', resolve);
      });
    }
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await db.connection.close();
  }
}

main().catch(error => {
  console.error('Demo failed:', error.message);
  process.exitCode = 1;
});
