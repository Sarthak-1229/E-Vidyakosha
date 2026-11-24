import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { MAX_PDF_BYTES, type SubmissionDto } from '@evidy/shared';
import { parse as parseContentDisposition } from 'content-disposition';
import { SignJWT } from 'jose';
import { ObjectId } from 'mongodb';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { reconcileFiles } from '../src/modules/file/reconcile.js';
import { createFileStore, gridChunks, gridFiles } from '../src/modules/file/repository.js';
import { createTestDatabase, jwtSecret, testAccount } from './helpers/database.js';
import { testPdf } from './helpers/pdf.js';

const prefix = '/api/v1';
const webOrigin = 'http://localhost:5173';
const password = 'enough-for-a-test';
const unknownId = new ObjectId().toHexString();
const newAccount = (name: string, email: string, role: 'FACULTY' | 'ADMIN') => ({ name, email, password, role });
const studentInput = { name: ' Student One ', email: 'Student@MITAOE.AC.IN', password };

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let api: ReturnType<typeof request>;
let admin: string;
let adminId: string;
let faculty: string;
let facultyId: string;
let facultyB: string;
let student: string;
let subjectId: string;
let secondSubjectId: string;
let departmentId: string;
let approvedId: string;
let rejectedId: string;
let pendingId: string;
let approvedBytes: Buffer;

const execute = promisify(execFile);

function runBootstrap(name: string, email: string) {
  const command = fileURLToPath(new URL('../src/commands/bootstrap-admin.ts', import.meta.url));
  return execute(process.execPath, ['--import', 'tsx', command], {
    timeout: 30_000,
    env: {
      ...process.env, MONGODB_URI: fixture.uri,
      BOOTSTRAP_ADMIN_NAME: name, BOOTSTRAP_ADMIN_EMAIL: email,
      BOOTSTRAP_ADMIN_PASSWORD: testAccount.password,
    },
  });
}

async function login(email: string, raw = password) {
  const response = await api.post(prefix + '/auth/login').send({ email, password: raw }).expect(200);
  assert.deepEqual(Object.keys(response.body).sort(), ['token', 'user']);
  assert.deepEqual(Object.keys(response.body.user).sort(), ['createdAt', 'email', 'id', 'name', 'role']);
  return response.body as { token: string; user: { id: string; role: string; email: string } };
}

function upload(client: ReturnType<typeof request>, token: string, bytes: Buffer, title: string, options = {
  subject: subjectId, filename: 'Resumé.pdf', type: 'LECTURE_NOTES',
}) {
  return client.post(prefix + '/documents').set('Authorization', token)
    .field('title', title).field('type', options.type).field('subjectId', options.subject)
    .attach('file', bytes, { filename: options.filename, contentType: 'application/pdf' });
}

const decide = (id: string, decision: object, token = admin) =>
  api.post(prefix + `/approvals/${id}/decision`).set('Authorization', token).send(decision);

async function counts() {
  const { db } = fixture;
  const [assets, documents, requests, files, chunks] = await Promise.all([
    db.models.fileAssets.countDocuments(), db.models.documents.countDocuments(),
    db.models.uploadRequests.countDocuments(), gridFiles(db).countDocuments(), gridChunks(db).countDocuments(),
  ]);
  return { assets, documents, requests, files, chunks };
}

before(async () => {
  fixture = await createTestDatabase();
  const { db } = fixture;
  api = request(createApp({ db, jwtSecret, webOrigin }));
}, { timeout: 180_000 });

after(async () => {
  await fixture?.close();
});

test('health and the guarded first-admin CLI work against the six-collection replica set', async () => {
  await api.get(prefix + '/health').expect(200, { status: 'ok', service: 'e-vidyakosha-api' });
  await api.get('/unknown').expect(404);
  const { db } = fixture;
  const provision = await Promise.allSettled([
    runBootstrap(testAccount.name, testAccount.email), runBootstrap('Other Bootstrap Admin', 'other@example.test'),
  ]);
  assert.equal(provision.filter(result => result.status === 'fulfilled').length, 1, JSON.stringify(provision));
  const winner = await db.models.users.findOne({ role: 'ADMIN' }).orFail().lean();
  const session = await login(winner.email, testAccount.password);
  admin = 'Bearer ' + session.token;
  adminId = session.user.id;
  await assert.rejects(runBootstrap('Third Bootstrap Admin', 'third@example.test'), /already exists/);

  const names = (await db.mongo.listCollections().toArray()).map(({ name }) => name).sort();
  assert.deepEqual(names, ['departments', 'documents', 'fileAssets', 'subjects', 'uploadRequests', 'users']);
  for (const [model, key] of [
    [db.models.users, 'email'], [db.models.departments, 'name'], [db.models.subjects, 'departmentId'],
    [db.models.documents, 'fileAssetId'], [db.models.fileAssets, 'sha256Hash'],
    [db.models.uploadRequests, 'documentId'],
  ] as const) {
    const indexes = await model.collection.indexes();
    assert.ok(indexes.some(index => index.unique && key in index.key), key);
  }
});

test('FR-01 registers only institutional Students and rejects duplicates, missing fields and role injection', async () => {
  const response = await api.post(prefix + '/auth/register').send(studentInput).expect(201);
  assert.deepEqual(Object.keys(response.body), ['user']);
  assert.equal(response.body.user.role, 'STUDENT');
  assert.equal(response.body.user.name, 'Student One');
  assert.equal(response.body.user.email, 'student@mitaoe.ac.in');
  assert.equal('passwordHash' in response.body.user, false);
  await api.post(prefix + '/auth/register').send({ ...studentInput, email: 'student@mitaoe.ac.in' }).expect(409);
  await api.post(prefix + '/auth/register').send({ ...studentInput, email: 'student@mitaoe.ac.in.example' }).expect(400);
  await api.post(prefix + '/auth/register').send({ ...studentInput, email: 'different@mitaoe.ac.in', role: 'ADMIN' }).expect(400);
  await api.post(prefix + '/auth/register').send({ email: 'different@mitaoe.ac.in' }).expect(400);
  await api.post(prefix + '/auth/register').type('json').send('{"name":').expect(400);
  student = 'Bearer ' + (await login(studentInput.email)).token;
});

test('FR-02 verifies all three roles and rejects expired, forged, malformed and wrong credentials', async () => {
  const setup = [
    newAccount('Faculty One', 'faculty@example.test', 'FACULTY'),
    newAccount('Faculty Two', 'faculty-two@example.test', 'FACULTY'),
  ];
  for (const account of setup) {
    await api.post(prefix + '/users').set('Authorization', admin).send(account).expect(201);
  }
  const a = await login('faculty@example.test');
  faculty = 'Bearer ' + a.token;
  facultyId = a.user.id;
  facultyB = 'Bearer ' + (await login('faculty-two@example.test')).token;

  for (const [token, role] of [[student, 'STUDENT'], [faculty, 'FACULTY'], [admin, 'ADMIN']] as const) {
    const response = await api.get(prefix + '/auth/me').set('Authorization', token).expect(200);
    assert.equal(response.body.user.role, role);
    assert.equal(response.headers['cache-control'], 'no-store');
  }

  const wrongPassword = await api.post(prefix + '/auth/login').send({ ...studentInput, password: 'wrong' }).expect(401);
  // Login's strict body excludes the name field, so exercise both credential hash paths separately.
  const wrong = await api.post(prefix + '/auth/login').send({ email: studentInput.email, password: 'wrong' }).expect(401);
  const unknown = await api.post(prefix + '/auth/login').send({ email: 'missing@example.test', password }).expect(401);
  assert.deepEqual(wrong.body, unknown.body);
  assert.deepEqual(wrong.body, wrongPassword.body);
  const key = new TextEncoder().encode(jwtSecret);
  const expired = await new SignJWT({ role: 'ADMIN' }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('e-vidyakosha-api').setAudience('e-vidyakosha-web').setSubject(adminId)
    .setIssuedAt().setExpirationTime(1).sign(key);
  const forged = await new SignJWT({ role: 'ADMIN' }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('e-vidyakosha-api').setAudience('e-vidyakosha-web').setSubject(adminId).setIssuedAt()
    .setExpirationTime('1h').sign(new TextEncoder().encode('o'.repeat(40)));
  for (const token of [expired, forged, 'invalid']) {
    await api.get(prefix + '/auth/me').set('Authorization', 'Bearer ' + token).expect(401);
    await api.get(prefix + `/documents/${unknownId}/pdf`).set('Authorization', 'Bearer ' + token).expect(401);
    await api.get(prefix + `/documents/${unknownId}/download`).set('Authorization', 'Bearer ' + token).expect(401);
  }
});

test('FR-03 Admin manages users, invalidates stale JWTs and protects the last administrator', async () => {
  await api.delete(prefix + `/users/${adminId}`).set('Authorization', admin).expect(409);
  await api.patch(prefix + `/users/${adminId}`).set('Authorization', admin).send({ role: 'FACULTY' }).expect(409);
  const newAdmin = newAccount('Second Admin', 'second@example.test', 'ADMIN');
  const created = await api.post(prefix + '/users').set('Authorization', admin).send(newAdmin).expect(201);
  const id = created.body.user.id;
  const path = prefix + '/users/' + id;
  const stale = 'Bearer ' + (await login(newAdmin.email)).token;
  await api.post(prefix + '/users').set('Authorization', admin).send(newAdmin).expect(409);
  await api.post(prefix + '/users').set('Authorization', admin).send({ ...newAdmin, role: 'STUDENT' }).expect(400);

  const listing = await api.get(prefix + '/users?page=1&pageSize=2').set('Authorization', admin).expect(200);
  assert.equal(listing.body.items.length, 2);
  assert.equal(listing.body.total, 5);
  assert.equal(JSON.stringify(listing.body).includes('passwordHash'), false);
  await api.patch(path).set('Authorization', student).send({ role: 'ADMIN' }).expect(403);
  await api.patch(path).set('Authorization', admin).send({ role: 'FACULTY' }).expect(200);
  await api.get(prefix + '/auth/me').set('Authorization', stale).expect(401);
  const revoked = 'Bearer ' + (await login(newAdmin.email)).token;
  await api.delete(path).set('Authorization', admin).expect(204);
  await api.get(prefix + '/auth/me').set('Authorization', revoked).expect(401);
});

test('FR-04 Admin manages Departments and Subjects with uniqueness and reference protection', async () => {
  const departments = prefix + '/departments';
  const subjects = prefix + '/subjects';
  const engineering = await api.post(departments).set('Authorization', admin).send({ name: ' Computer Engineering ' }).expect(201);
  departmentId = engineering.body.id;
  await api.post(departments).set('Authorization', admin).send({ name: 'computer engineering' }).expect(409);
  const empty = await api.post(departments).set('Authorization', admin).send({ name: 'Empty' }).expect(201);
  await api.delete(departments + '/' + empty.body.id).set('Authorization', admin).expect(204);
  await api.get(departments).set('Authorization', student).expect(200, [engineering.body]);

  const algorithms = await api.post(subjects).set('Authorization', admin).send({ name: 'Algorithms', departmentId }).expect(201);
  subjectId = algorithms.body.id;
  await api.post(subjects).set('Authorization', admin).send({ name: 'ALGORITHMS', departmentId }).expect(409);
  await api.post(subjects).set('Authorization', admin).send({ name: 'Algorithms', departmentId: unknownId }).expect(404);
  await api.post(subjects).set('Authorization', admin).send({ name: 'Algorithms', departmentId: 'bad-id' }).expect(400);
  const second = await api.post(subjects).set('Authorization', admin).send({ name: 'Operating Systems', departmentId }).expect(201);
  secondSubjectId = second.body.id;
  await api.patch(subjects + '/' + secondSubjectId).set('Authorization', admin).send({ name: 'Algorithms' }).expect(409);
  await api.patch(subjects + '/' + secondSubjectId).set('Authorization', admin).send({ name: 'Systems' }).expect(200, {
    id: secondSubjectId, name: 'Systems', departmentId,
  });
  await api.get(subjects + '?departmentId=' + departmentId).set('Authorization', faculty).expect(200).expect(res => {
    assert.equal(res.body.length, 2);
  });
  await api.delete(departments + '/' + departmentId).set('Authorization', admin).expect(409);
  await api.delete(subjects + '/bad-id').set('Authorization', admin).expect(400);

  const spare = await api.post(subjects).set('Authorization', admin).send({ name: 'Spare', departmentId }).expect(201);
  await api.delete(subjects + '/' + spare.body.id).set('Authorization', admin).expect(204);
});

test('Every protected operation rejects anonymous access and every role-specific operation rejects other roles', async () => {
  const protectedRoutes = [
    ['get', '/auth/me'], ['get', '/users', 'ADMIN'], ['post', '/users', 'ADMIN'],
    ['patch', '/users/' + unknownId, 'ADMIN'], ['delete', '/users/' + unknownId, 'ADMIN'],
    ['get', '/departments'], ['post', '/departments', 'ADMIN'], ['delete', '/departments/' + unknownId, 'ADMIN'],
    ['get', '/subjects'], ['post', '/subjects', 'ADMIN'], ['patch', '/subjects/' + unknownId, 'ADMIN'],
    ['delete', '/subjects/' + unknownId, 'ADMIN'],
    ['get', '/documents'], ['post', '/documents', 'FACULTY'], ['get', '/documents/' + unknownId],
    ['patch', '/documents/' + unknownId, 'ADMIN'], ['delete', '/documents/' + unknownId, 'ADMIN'],
    ['get', `/documents/${unknownId}/pdf`], ['get', `/documents/${unknownId}/download`],
    ['get', '/uploads/mine', 'FACULTY'], ['get', '/approvals/pending', 'ADMIN'],
    ['post', `/approvals/${unknownId}/decision`, 'ADMIN'],
  ] as const;
  for (const [method, path, role] of protectedRoutes) {
    await api[method](prefix + path).expect(401);
    if (role) {
      await api[method](prefix + path).set('Authorization', student).expect(403);
      await api[method](prefix + path).set('Authorization', role === 'ADMIN' ? faculty : admin).expect(403);
    }
  }
});

test('FR-01/FR-02 limit bursts of public authentication requests', async () => {
  const { db } = fixture;
  const limited = request(createApp({ db, jwtSecret, webOrigin }));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await limited.post(prefix + '/auth/login').send({}).expect(401);
  }
  await limited.post(prefix + '/auth/register').send(studentInput).expect(429);
});

test('FR-07 rejects spoofed, corrupt, encrypted, oversize or invalid submissions without persisting data', async () => {
  const prior = await counts();
  const valid = await testPdf('Validation example');
  const brokenXref = Buffer.from(valid.toString('latin1').replace(/startxref\s+\d+/, 'startxref\n12'), 'latin1');
  for (const bytes of [
    Buffer.from('this is not a PDF'), Buffer.from('%PDF-1.7\nnot a valid document'), valid.subarray(0, valid.length - 18),
    brokenXref, await readFile(new URL('./fixtures/encrypted-empty-user-password.pdf', import.meta.url)),
    await readFile(new URL('./fixtures/encrypted-password-required.pdf', import.meta.url)),
  ]) {
    await upload(api, faculty, bytes, 'Invalid').expect(400);
  }
  await upload(api, faculty, Buffer.alloc(MAX_PDF_BYTES + 1), 'Oversize').expect(413);
  await upload(api, faculty, valid, 'Invalid type', { subject: subjectId, type: 'ZIP', filename: 'notes.pdf' }).expect(400);
  await upload(api, faculty, valid, 'Unlinked', { subject: unknownId, type: 'EBOOK', filename: 'notes.pdf' }).expect(404);
  await api.post(prefix + '/documents').set('Authorization', faculty).field('title', 'Missing file').expect(400);
  await api.post(prefix + '/documents').set('Authorization', faculty).type('multipart/form-data').send('missing boundary').expect(400);
  await api.post(prefix + '/documents').set('Authorization', faculty)
    .field('title', 'Test').field('type', 'OTHER').field('subjectId', subjectId).field('status', 'APPROVED')
    .attach('file', valid, 'notes.pdf').expect(400);
  assert.deepEqual(await counts(), prior);
});

test('FR-07 stores the exact 50 MiB boundary in GridFS and deduplicates by SHA-256', { timeout: 90_000 }, async () => {
  const { db } = fixture;
  const bytes = await testPdf('Exact boundary document', MAX_PDF_BYTES);
  const response = await upload(api, faculty, bytes, 'Boundary').expect(201);
  const requestRow = await db.models.uploadRequests.findById(response.body.submissionId).orFail().lean();
  const doc = await db.models.documents.findById(requestRow.documentId).orFail().lean();
  const asset = await db.models.fileAssets.findById(doc.fileAssetId).orFail().lean();
  assert.equal(asset.fileSize, MAX_PDF_BYTES);
  assert.equal(asset.sha256Hash, createHash('sha256').update(bytes).digest('hex'));
  assert.ok(await gridChunks(db).countDocuments({ files_id: asset.gridFsFileId }) > 100);
  await upload(api, facultyB, bytes, 'Renamed duplicate').expect(409);
  await api.delete(prefix + '/documents/' + doc._id.toHexString()).set('Authorization', admin).expect(204);
  assert.deepEqual(await counts(), { assets: 0, documents: 0, requests: 0, files: 0, chunks: 0 });
});

test('FR-05/FR-07/FR-08 enforce one atomic decision and keep Faculty submissions private', async () => {
  const { db } = fixture;
  approvedBytes = await testPdf('Algorithms Lecture Worksheets');
  const approved = await upload(api, faculty, approvedBytes, 'Algorithms Lecture Worksheets').expect(201);
  const rejected = await upload(api, faculty, await testPdf('Algorithms Rejected'), 'Algorithms Rejected').expect(201);
  const pending = await upload(api, facultyB, await testPdf('Algorithms Pending'), 'Algorithms Pending').expect(201);
  assert.deepEqual(approved.body, { submissionId: approved.body.submissionId, status: 'PENDING' });
  const queue = await api.get(prefix + '/approvals/pending').set('Authorization', admin).expect(200);
  const submissions = queue.body as SubmissionDto[];
  assert.equal(submissions.length, 3);
  const docOf = (id: string) => {
    const row = submissions.find(item => item.id === id);
    assert.ok(row);
    assert.deepEqual(Object.keys(row.document).sort(), ['author', 'id', 'subjectId', 'title', 'type', 'uploadedAt']);
    return row.document.id;
  };
  approvedId = docOf(approved.body.submissionId);
  rejectedId = docOf(rejected.body.submissionId);
  pendingId = docOf(pending.body.submissionId);
  await decide(rejected.body.submissionId, { decision: 'REJECTED', reason: ' ' }).expect(400);

  await decide(approved.body.submissionId, { decision: 'APPROVED' }).expect(200);
  await decide(rejected.body.submissionId, { decision: 'REJECTED', reason: ' Needs corrections ' }).expect(200);
  await decide(rejected.body.submissionId, { decision: 'APPROVED' }).expect(409);
  const rows = await db.models.uploadRequests.find().lean();
  const review = rows.find(row => row._id.toHexString() === rejected.body.submissionId);
  assert.ok(review);
  assert.equal('status' in review, false);
  assert.equal(review.reviewedBy?.toHexString(), adminId);
  assert.ok(review.reviewedAt instanceof Date);
  assert.equal(review.rejectionReason, 'Needs corrections');

  const own = await api.get(prefix + '/uploads/mine').set('Authorization', faculty).expect(200);
  assert.deepEqual((own.body as SubmissionDto[]).map(({ status }) => status).sort(), ['APPROVED', 'REJECTED']);
  assert.equal((own.body as SubmissionDto[]).find(row => row.status === 'REJECTED')?.rejectionReason, 'Needs corrections');
  const other = await api.get(prefix + '/uploads/mine').set('Authorization', facultyB).expect(200);
  assert.deepEqual((other.body as SubmissionDto[]).map(({ id, status }) => [id, status]), [[pending.body.submissionId, 'PENDING']]);
  const remaining = await api.get(prefix + '/approvals/pending').set('Authorization', admin).expect(200);
  assert.deepEqual((remaining.body as SubmissionDto[]).map(({ id }) => id), [pending.body.submissionId]);

  await api.patch(prefix + '/users/' + facultyId).set('Authorization', admin).send({ role: 'STUDENT' }).expect(409);
  await api.delete(prefix + '/users/' + facultyId).set('Authorization', admin).expect(409);
  await api.delete(prefix + '/subjects/' + subjectId).set('Authorization', admin).expect(409);
});

test('FR-05 rolls back a failed review commit and arbitrates concurrent opposite decisions', async () => {
  const { db } = fixture;
  const reviewer = newAccount('Review Admin', 'reviewer@example.test', 'ADMIN');
  const account = await api.post(prefix + '/users').set('Authorization', admin).send(reviewer).expect(201);
  const token = 'Bearer ' + (await login(reviewer.email)).token;
  const submitted = await upload(api, faculty, await testPdf('Concurrent review'), 'Concurrent review').expect(201);
  const id = submitted.body.submissionId as string;
  const row = await db.models.uploadRequests.findById(id).orFail().lean();
  await db.mongo.admin().command({
    configureFailPoint: 'failCommand', mode: { times: 1 },
    data: { failCommands: ['commitTransaction'], errorCode: 2 },
  });
  await decide(id, { decision: 'APPROVED' }).expect(500);
  const unchanged = await db.models.uploadRequests.findById(id).orFail().lean();
  assert.equal(unchanged.reviewedBy, null);
  assert.equal(unchanged.reviewedAt, null);
  assert.equal((await db.models.documents.findById(row.documentId).orFail().lean()).status, 'PENDING');
  const outcomes = await Promise.all([
    decide(id, { decision: 'APPROVED' }),
    decide(id, { decision: 'REJECTED', reason: 'Needs revision' }, token),
  ]);
  assert.deepEqual(outcomes.map(result => result.status).sort(), [200, 409]);
  const winner = outcomes.find(result => result.status === 200);
  assert.ok(winner);
  const document = await db.models.documents.findById(row.documentId).orFail().lean();
  const reviewed = await db.models.uploadRequests.findById(id).orFail().lean();
  assert.equal(document.status, winner.body.status);
  assert.equal(reviewed.reviewedBy?.toHexString(), document.status === 'APPROVED' ? adminId : account.body.user.id);
  assert.equal(reviewed.rejectionReason, document.status === 'APPROVED' ? null : 'Needs revision');
  assert.ok(reviewed.reviewedAt instanceof Date);
  await api.delete(prefix + '/documents/' + row.documentId.toHexString()).set('Authorization', admin).expect(204);
  await api.delete(prefix + '/users/' + account.body.user.id).set('Authorization', admin).expect(204);
});

test('FR-09/FR-10 index approved search by title, subject and type with stable pagination', async () => {
  for (const token of [student, faculty, admin]) {
    const listing = await api.get(prefix + '/documents?subjectId=' + subjectId + '&type=LECTURE_NOTES')
      .set('Authorization', token).expect(200);
    assert.deepEqual(listing.body.items.map(({ id }: { id: string }) => id), [approvedId]);
  }

  const endpoint = prefix + '/documents';
  const path = endpoint + '?q=algorithms&subjectId=' + subjectId + '&type=LECTURE_NOTES&pageSize=1';
  const search = await api.get(path).set('Authorization', student).expect(200);
  assert.equal(search.body.items[0].id, approvedId);
  assert.equal(search.body.total, 1);
  await api.get(path + '&page=2').set('Authorization', student).expect(200, { page: 2, pageSize: 1, total: 1, items: [] });
  await api.get(endpoint + '?q=Rejected').set('Authorization', student).expect(200, { page: 1, pageSize: 20, total: 0, items: [] });
  await api.get(endpoint + '?subjectId=bad').set('Authorization', student).expect(400);
  await api.get(endpoint + '?q%5B%24ne%5D=x').set('Authorization', student).expect(400);
  await api.get(endpoint + '?pageSize=101').set('Authorization', student).expect(400);
  await api.get(endpoint + '/' + approvedId).set('Authorization', student).expect(200, search.body.items[0]);
  await api.get(endpoint + '/' + pendingId).set('Authorization', admin).expect(404);
});

test('FR-11/FR-12 serve identical approved bytes with safe dispositions and no public storage route', async () => {
  const { db } = fixture;
  for (const [action, disposition] of [['pdf', 'inline'], ['download', 'attachment']] as const) {
    const endpoint = (id: string) => prefix + `/documents/${id}/${action}`;
    for (const token of [student, faculty, admin]) {
      const served = await api.get(endpoint(approvedId)).set({ Authorization: token, Origin: webOrigin })
        .buffer(true).parse((res, callback) => {
          const parts: Buffer[] = [];
          res.on('data', (part: Buffer) => parts.push(part));
          res.on('end', () => callback(null, Buffer.concat(parts)));
        }).expect('Content-Type', 'application/pdf').expect('X-Content-Type-Options', 'nosniff').expect(200);
      assert.deepEqual(served.body, approvedBytes);
      const header = served.headers['content-disposition'];
      const exposedHeaders = served.headers['access-control-expose-headers'];
      assert.ok(header && exposedHeaders);
      assert.match(header, new RegExp('^' + disposition + ';'));
      assert.equal(parseContentDisposition(header).parameters.filename, 'Resumé.pdf');
      assert.match(exposedHeaders, /Content-Disposition/i);
      assert.doesNotMatch(header, /[\r\n\\]|evidyakosha-upload/);
    }
    await api.head(endpoint(approvedId)).set('Authorization', student).expect(200);
    for (const id of [pendingId, rejectedId, unknownId]) {
      await api.get(endpoint(id)).set('Authorization', admin).expect(404);
    }
    const doc = await db.models.documents.findById(approvedId).orFail().lean();
    const file = await db.models.fileAssets.findById(doc.fileAssetId).orFail().lean();
    await api.get(endpoint(file.gridFsFileId.toHexString())).set('Authorization', student).expect(404);
    await api.get(prefix + '/files/' + file.gridFsFileId.toHexString()).set('Authorization', student).expect(404);
  }
});

test('FR-07 compensates partial GridFS writes, failed metadata commits and the unique-index race', { timeout: 60_000 }, async () => {
  const { db } = fixture;
  const initial = await counts();
  const store = createFileStore(db);
  const failureApi = request(createApp({
    db, jwtSecret, webOrigin,
    fileStore: {
      ...store,
      async write(id) {
        await db.mongo.collection('fs.chunks').insertOne({ files_id: id, n: 0, data: Buffer.from('partial') });
        throw new Error('Injected failure after a chunk write');
      },
    },
  }));
  const bytes = await testPdf('Failure and recovery PDF');
  await upload(failureApi, faculty, bytes, 'Storage fault').expect(503);
  assert.deepEqual(await counts(), initial);

  await db.mongo.admin().command({
    configureFailPoint: 'failCommand', mode: { times: 1 },
    data: { failCommands: ['commitTransaction'], errorCode: 2 },
  });
  await upload(api, faculty, bytes, 'Metadata commit fault').expect(500);
  assert.deepEqual(await counts(), initial);

  let wrote = 0;
  let release: () => void = () => {};
  const bothWrote = new Promise<void>(resolve => { release = resolve; });
  const concurrentApi = request(createApp({
    db, jwtSecret, webOrigin,
    fileStore: {
      ...store,
      async write(id, path, name) {
        try {
          await store.write(id, path, name);
        } finally {
          wrote += 1;
          if (wrote === 2) release();
        }
        await bothWrote;
      },
    },
  }));
  const duplicateRace = await Promise.all([
    upload(concurrentApi, faculty, bytes, 'Race A'), upload(concurrentApi, facultyB, bytes, 'Race B'),
  ]);
  assert.deepEqual(duplicateRace.map(result => result.status).sort(), [201, 409]);
  assert.deepEqual(await counts(), {
    assets: initial.assets + 1, documents: initial.documents + 1, requests: initial.requests + 1,
    files: initial.files + 1, chunks: initial.chunks + 1,
  });
});

test('FR-04/FR-07 prevent a concurrent subject deletion from leaving a dangling upload', { timeout: 30_000 }, async () => {
  const { db } = fixture;
  const initial = await counts();
  const category = await api.post(prefix + '/subjects').set('Authorization', admin)
    .send({ name: 'Temporary Subject', departmentId }).expect(201);
  const store = createFileStore(db);
  let release: () => void = () => {};
  let signalStored: () => void = () => {};
  const block = new Promise<void>(resolve => { release = resolve; });
  const stored = new Promise<void>(resolve => { signalStored = resolve; });
  const paused = request(createApp({
    db, jwtSecret, webOrigin, fileStore: {
      ...store,
      async write(id, path, name) {
        try {
          await store.write(id, path, name);
        } finally {
          signalStored();
        }
        await block;
      },
    },
  }));
  const submission = upload(paused, faculty, await testPdf('Subject deletion race'), 'Subject deletion race', {
    subject: category.body.id, type: 'OTHER', filename: 'race.pdf',
  }).then(response => response);
  await Promise.race([stored, submission]);
  try {
    await api.delete(prefix + '/subjects/' + category.body.id).set('Authorization', admin).expect(204);
  } finally {
    release();
  }
  assert.equal((await submission).status, 404);
  assert.deepEqual(await counts(), initial);
});

test('FR-06 edits only metadata, conceals deleted PDFs and retries interrupted cleanup', async () => {
  const { db } = fixture;
  const path = prefix + '/documents/' + approvedId;
  await api.patch(path).set('Authorization', admin).send({ status: 'PENDING' }).expect(400);
  await api.patch(path).set('Authorization', admin).send({ file: 'replacement' }).expect(400);
  await api.patch(path).set('Authorization', admin).send({ subjectId: unknownId }).expect(404);
  const changed = await api.patch(path).set('Authorization', admin)
    .send({ title: 'Algorithms Revised Metadata', subjectId: secondSubjectId, author: 'Edited author' }).expect(200);
  assert.equal(changed.body.author, 'Edited author');
  await api.patch(path).set('Authorization', admin).send({ author: null }).expect(200);
  const doc = await db.models.documents.findById(approvedId).orFail().lean();
  const asset = await db.models.fileAssets.findById(doc.fileAssetId).orFail().lean();
  assert.equal(doc.status, 'APPROVED');
  assert.equal(doc.subjectId.toHexString(), secondSubjectId);
  assert.equal(asset.sha256Hash, createHash('sha256').update(approvedBytes).digest('hex'));

  const store = createFileStore(db);
  const failureApi = request(createApp({
    db, jwtSecret, webOrigin,
    fileStore: { ...store, async remove(id) {
      await gridFiles(db).deleteOne({ _id: id });
      throw new Error('Injected interruption between files and chunks deletion');
    } },
  }));
  await failureApi.delete(path).set('Authorization', admin).expect(503);
  assert.equal(await db.models.uploadRequests.exists({ documentId: approvedId }), null);
  await api.get(path + '/pdf').set('Authorization', student).expect(404);
  await api.get(path + '/download').set('Authorization', student).expect(404);
  assert.ok(await gridChunks(db).countDocuments({ files_id: asset.gridFsFileId }) > 0);
  await api.delete(path).set('Authorization', admin).expect(204);
  assert.equal(await db.models.fileAssets.exists({ _id: asset._id }), null);
  assert.equal(await gridChunks(db).countDocuments({ files_id: asset.gridFsFileId }), 0);
  await api.delete(path).set('Authorization', admin).expect(404);
  await upload(api, faculty, approvedBytes, 'Upload after deletion').expect(201);
});

test('FR-06/FR-07 recovery dry-run and apply remove orphan files, partial chunks and detached assets', async () => {
  const { db } = fixture;
  const initial = await counts();
  const orphan = new ObjectId();
  const chunksOnly = new ObjectId();
  const detached = new ObjectId();
  const file = (id: ObjectId) => ({
    _id: id, length: 4, chunkSize: 255 * 1024, uploadDate: new Date(), filename: 'orphan.pdf',
  });
  await gridFiles(db).insertMany([file(orphan), file(detached)]);
  await db.mongo.collection('fs.chunks').insertMany([orphan, chunksOnly, detached]
    .map(id => ({ files_id: id, n: 0, data: Buffer.from('test') })));
  await db.models.fileAssets.create({
    gridFsFileId: detached, originalName: 'orphan.pdf', fileSize: 4, sha256Hash: '0'.repeat(64),
  });
  const expected = { unreferencedAssets: 1, orphanFiles: 1, orphanChunkGroups: 1 };
  assert.deepEqual(await reconcileFiles(db, false), expected);
  assert.deepEqual(await counts(), { ...initial, assets: initial.assets + 1, files: initial.files + 2, chunks: initial.chunks + 3 });
  assert.deepEqual(await reconcileFiles(db, true), expected);
  assert.deepEqual(await counts(), initial);
  assert.deepEqual(await reconcileFiles(db, true), { unreferencedAssets: 0, orphanFiles: 0, orphanChunkGroups: 0 });
});
