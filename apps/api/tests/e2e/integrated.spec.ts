import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import SwaggerParser from '@apidevtools/swagger-parser';
import { devices, expect, test, type BrowserContext, type Page } from '@playwright/test';
import type { SubmissionDto } from '@evidy/shared';
import { ObjectId } from 'mongodb';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../../src/app.js';
import { bootstrapFirstAdmin } from '../../src/modules/auth/service.js';
import { createFileStore, gridChunks, gridFiles } from '../../src/modules/file/repository.js';
import { createTestDatabase, jwtSecret } from '../helpers/database.js';
import { testPdf } from '../helpers/pdf.js';

const webDist = fileURLToPath(new URL('../../../web/dist/', import.meta.url));
const specPath = fileURLToPath(new URL('../../../../spec/openapi.yaml', import.meta.url));
const admin = { name: 'Integration Admin', email: 'integration-admin@example.test', password: randomUUID() };
let dbFixture: Awaited<ReturnType<typeof createTestDatabase>>;
let server: Server;
let origin: string;
let failNextGridWrite = false;

test.beforeAll(async () => {
  await readFile(webDist + 'index.html');
  dbFixture = await createTestDatabase();
  const { db } = dbFixture;
  await bootstrapFirstAdmin(db, admin);
  const fileStore = createFileStore(db);
  server = createServer(createApp({
    db, jwtSecret, webDist, webOrigin: 'http://localhost:5173',
    fileStore: {
      ...fileStore,
      async write(id, path, name) {
        await fileStore.write(id, path, name);
        if (failNextGridWrite) {
          failNextGridWrite = false;
          throw new Error('Injected storage failure after real GridFS write');
        }
      },
    },
  }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  origin = 'http://127.0.0.1:' + address.port;
});

test.afterAll(async () => {
  try {
    if (server?.listening) await new Promise<void>(resolve => server.close(() => resolve()));
  } finally {
    await dbFixture?.close();
  }
});

function uiErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    // Chromium also reports deliberate 4xx/5xx test requests, which the UI handles.
    if (message.location().url.startsWith(origin + '/api/v1/') &&
        /^Failed to load resource: the server responded with a status of (400|401|403|404|409|503)/.test(message.text())) return;
    errors.push(message.text());
  });
  return errors;
}

async function signIn(page: Page, profile: { email: string; password: string }) {
  await page.getByLabel(/^Email/).fill(profile.email);
  await page.getByLabel(/^Password/).fill(profile.password);
  const [response] = await Promise.all([
    page.waitForResponse(value => value.url() === origin + '/api/v1/auth/login'),
    page.getByRole('button', { name: 'Sign In', exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  return (await response.json()).token as string;
}

function endpoint(path: string) { return origin + '/api/v1' + path; }
const auth = (token: string) => ({ Authorization: 'Bearer ' + token });

async function nav(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true }).click();
}

async function assertAccessible(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
}

async function addUser(page: Page, profile: { name: string; email: string; password: string }, role: 'ADMIN' | 'FACULTY') {
  await page.getByRole('button', { name: 'Create Privileged User' }).click();
  const modal = page.getByRole('dialog', { name: 'Create Privileged Account' });
  await modal.getByLabel('Full Name').fill(profile.name);
  await modal.getByLabel('Email Address').fill(profile.email);
  await modal.getByLabel(/^Password/).fill(profile.password);
  await modal.getByLabel(/Account Role|Access Role|Role/).selectOption(role);
  await modal.getByRole('button', { name: 'Create User' }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: profile.email })).toBeVisible();
}

async function confirm(page: Page, button: string, action: string) {
  await page.getByRole('button', { name: button, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: action, exact: true }).click();
}

async function lodgePdf(page: Page, title: string, bytes: Buffer, filename: string, classification = 'LECTURE_NOTES') {
  await nav(page, 'Upload PDF');
  await page.locator('#pdf-file-input').setInputFiles({ name: filename, mimeType: 'application/pdf', buffer: bytes });
  await page.getByLabel(/Document Title/).fill(title);
  await page.getByLabel(/Document Classification/).selectOption(classification);
  await expect(page.locator('#doc-subject')).not.toHaveValue('');
  const [outcome] = await Promise.all([
    page.waitForResponse(value => value.url() === endpoint('/documents') && value.request().method() === 'POST'),
    page.getByRole('button', { name: 'Submit for Review' }).click(),
  ]);
  return outcome;
}

function watchOperations(context: BrowserContext, seen: Set<string>, operations: Map<string, RegExp>) {
  context.on('response', response => {
    if (!response.ok() || !response.url().startsWith(endpoint('/'))) return;
    const signature = response.request().method() + ' ' + new URL(response.url()).pathname.replace('/api/v1', '');
    for (const [name, path] of operations) {
      if (path.test(signature)) seen.add(name);
    }
  });
}

test('desktop journeys exercise all 25 live OpenAPI operations and enforce storage and role boundaries', async ({ browser }, info) => {
  const spec = await SwaggerParser.validate(specPath);
  const operations = new Map<string, RegExp>();
  for (const [path, declaration] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(declaration ?? {})) {
      if (!operation || typeof operation !== 'object' || !('operationId' in operation) ||
          typeof operation.operationId !== 'string') continue;
      operations.set(operation.operationId, new RegExp('^' + method.toUpperCase() + ' ' + path.replaceAll(/\{[^}]+\}/g, '[^/]+') + '$'));
    }
  }
  expect(operations.size).toBe(25);

  const contexts = await Promise.all(Array.from({ length: 3 }, () =>
    browser.newContext({ viewport: { width: 1440, height: 900 } }),
  ));
  const [adminPage, facultyPage, studentPage] = await Promise.all(contexts.map(context => context.newPage()));
  if (!adminPage || !facultyPage || !studentPage) throw new Error('Expected three browser sessions');
  const diagnostics = [adminPage, facultyPage, studentPage].map(uiErrors);
  const seen = new Set<string>();
  for (const context of contexts) watchOperations(context, seen, operations);
  const staff = { name: 'Integration Faculty', email: 'integration-faculty@example.test', password: randomUUID() };
  const temporary = { name: 'Temporary Reviewer', email: 'temporary-reviewer@example.test', password: randomUUID() };
  const student = { name: 'Integration Student', email: `qa-${randomUUID()}@mitaoe.ac.in`, password: randomUUID() };

  try {
    expect((await adminPage.request.get(endpoint('/health'))).ok()).toBe(true);
    seen.add('getHealth');
    const unknownApi = await adminPage.request.get(origin + '/api/unsupported');
    expect(unknownApi.status()).toBe(404);
    expect(unknownApi.headers()['content-type']).toContain('application/json');

    await adminPage.goto(origin + '/sign-in');
    await expect(adminPage.getByText(/quick demo accounts|mock data/i)).toHaveCount(0);
    const adminToken = await signIn(adminPage, admin);
    await expect(adminPage.getByRole('heading', { name: 'Review & Approvals Queue' })).toBeVisible();
    const current = await adminPage.request.get(endpoint('/auth/me'), { headers: auth(adminToken) });
    expect((await current.json()).user.role).toBe('ADMIN');
    seen.add('getCurrentUser');

    await nav(adminPage, 'Users');
    await addUser(adminPage, staff, 'FACULTY');
    await addUser(adminPage, temporary, 'FACULTY');
    await adminPage.getByRole('button', { name: 'Change role for Temporary Reviewer' }).click();
    await adminPage.getByLabel(/Assigned Role/).selectOption('ADMIN');
    await adminPage.getByRole('button', { name: 'Update Role' }).click();
    await expect(adminPage.getByRole('row').filter({ hasText: temporary.email })).toContainText('ADMIN');
    await confirm(adminPage, 'Delete Temporary Reviewer', 'Delete User');
    await expect(adminPage.getByRole('row').filter({ hasText: temporary.email })).toHaveCount(0);

    await nav(adminPage, 'Hierarchy');
    await adminPage.getByRole('button', { name: 'Add', exact: true }).click();
    await adminPage.getByLabel(/Department Name/).fill('Engineering QA');
    await adminPage.getByRole('button', { name: 'Create Department' }).click();
    await expect(adminPage.getByText('Engineering QA', { exact: true })).toBeVisible();
    for (const subject of ['Algorithms QA', 'Temporary Course']) {
      await adminPage.getByRole('button', { name: 'Add Course', exact: true }).click();
      await adminPage.getByLabel(/Course \/ Subject Name/).fill(subject);
      await adminPage.getByRole('button', { name: 'Create Course', exact: true }).click();
      await expect(adminPage.getByText(subject, { exact: true })).toBeVisible();
    }
    await adminPage.getByRole('button', { name: 'Rename Temporary Course' }).click();
    await adminPage.getByLabel('Subject Name').fill('Renamed Course');
    await adminPage.getByRole('button', { name: 'Save Changes' }).click();
    await expect(adminPage.getByText('Renamed Course', { exact: true })).toBeVisible();
    await confirm(adminPage, 'Delete Renamed Course', 'Delete Course');
    await expect(adminPage.getByText('Renamed Course', { exact: true })).toHaveCount(0);
    await adminPage.getByRole('button', { name: 'Add', exact: true }).click();
    await adminPage.getByLabel(/Department Name/).fill('Spare Department');
    await adminPage.getByRole('button', { name: 'Create Department' }).click();
    await expect(adminPage.getByRole('button', { name: 'Delete Spare Department' })).toBeVisible();
    await confirm(adminPage, 'Delete Spare Department', 'Delete Department');
    await expect(adminPage.getByRole('button', { name: 'Delete Spare Department' })).toHaveCount(0);

    await facultyPage.goto(origin + '/sign-in');
    const facultyToken = await signIn(facultyPage, staff);
    await expect(facultyPage.getByRole('heading', { name: 'My Submissions' })).toBeVisible();
    const source = await PDFDocument.create();
    source.addPage().drawText('Authenticated Algorithms page one', { x: 48, y: 740, size: 20 });
    source.addPage().drawText('Authenticated Algorithms page two', { x: 48, y: 740, size: 20 });
    const pdf = Buffer.from(await source.save());
    const uploaded = await lodgePdf(facultyPage, 'Algorithms Lecture QA', pdf, 'Algorithms Lecture.pdf');
    expect(uploaded.status()).toBe(201);
    const approvedSubmission = (await uploaded.json()).submissionId as string;
    await expect(facultyPage.getByText('Algorithms Lecture QA')).toBeVisible();
    const pending = await lodgePdf(facultyPage, 'Signals Reading QA', await testPdf('Rejected Signals'), 'Signals.pdf', 'LAB_MANUAL');
    expect(pending.status()).toBe(201);
    const rejectedSubmission = (await pending.json()).submissionId as string;
    const duplicate = await lodgePdf(facultyPage, 'Duplicate Algorithms', pdf, 'Different Name.pdf');
    expect(duplicate.status()).toBe(409);
    await expect(facultyPage.getByRole('alert')).toContainText('PDF is already retained');
    await facultyPage.getByRole('button', { name: 'Remove selected file' }).click();
    const invalid = await lodgePdf(facultyPage, 'Corrupt fixture', Buffer.from('%PDF-1.7\nbroken'), 'Corrupt.pdf');
    expect(invalid.status()).toBe(400);
    await expect(facultyPage.getByRole('alert')).toContainText('readable, unencrypted PDF');
    await facultyPage.getByRole('button', { name: 'Remove selected file' }).click();

    const { db } = dbFixture;
    const inventory = async () => Promise.all([
      gridFiles(db).countDocuments(), gridChunks(db).countDocuments(),
      db.models.fileAssets.countDocuments(), db.models.documents.countDocuments(), db.models.uploadRequests.countDocuments(),
    ]);
    const before = await inventory();
    failNextGridWrite = true;
    try {
      const failed = await lodgePdf(facultyPage, 'Injected storage fault', await testPdf('File cleanup'), 'Cleanup.pdf');
      expect(failed.status()).toBe(503);
      await expect(facultyPage.getByRole('alert')).toContainText('Storage is temporarily unavailable');
      expect(await inventory()).toEqual(before);
    } finally {
      failNextGridWrite = false;
    }

    await studentPage.goto(origin + '/register');
    await studentPage.getByLabel(/Full Name/).fill(student.name);
    await studentPage.getByLabel(/Institutional Email/).fill(student.email);
    await studentPage.getByLabel(/^Password/).fill(student.password);
    await studentPage.getByLabel(/Confirm Password/).fill(student.password);
    await studentPage.getByRole('button', { name: 'Create Student Account' }).click();
    await expect(studentPage.getByText('Account Created!')).toBeVisible();
    await studentPage.getByRole('button', { name: /Proceed to Sign In/ }).click();
    const studentToken = await signIn(studentPage, student);
    await expect(studentPage.getByText('No Documents Found')).toBeVisible();

    const own = await facultyPage.request.get(endpoint('/uploads/mine'), { headers: auth(facultyToken) });
    const submissions = await own.json() as SubmissionDto[];
    const rejectedDoc = submissions.find(row => row.id === rejectedSubmission)?.document.id;
    const approvedDoc = submissions.find(row => row.id === approvedSubmission)?.document.id;
    expect(rejectedDoc && approvedDoc).toBeTruthy();
    for (const id of [approvedDoc, rejectedDoc]) {
      expect((await studentPage.request.get(endpoint(`/documents/${id}/pdf`), { headers: auth(studentToken) })).status()).toBe(404);
      expect((await adminPage.request.get(endpoint(`/documents/${id}/download`), { headers: auth(adminToken) })).status()).toBe(404);
    }
    expect((await studentPage.request.get(endpoint('/uploads/mine'), { headers: auth(studentToken) })).status()).toBe(403);
    expect((await facultyPage.request.get(endpoint('/users'), { headers: auth(facultyToken) })).status()).toBe(403);

    await nav(adminPage, 'Review Queue');
    await adminPage.getByTestId('review-btn-' + rejectedSubmission).click();
    let dialog = adminPage.getByRole('dialog', { name: 'Review Academic Submission' });
    await dialog.getByRole('button', { name: 'Reject Resource' }).click();
    await dialog.getByRole('button', { name: 'Confirm Rejection' }).click();
    await expect(dialog.getByRole('alert')).toContainText('rejection reason is required');
    await dialog.getByLabel(/Reason for Rejection/).fill('Incorrect subject classification.');
    await dialog.getByRole('button', { name: 'Confirm Rejection' }).click();
    await expect(dialog).toBeHidden();

    await adminPage.getByTestId('review-btn-' + approvedSubmission).click();
    dialog = adminPage.getByRole('dialog', { name: 'Review Academic Submission' });
    await dialog.getByRole('button', { name: 'Confirm Approval' }).click();
    await expect(dialog).toBeHidden();
    expect((await adminPage.request.post(endpoint(`/approvals/${approvedSubmission}/decision`), {
      headers: auth(adminToken), data: { decision: 'REJECTED', reason: 'Repeat decision' },
    })).status()).toBe(409);
    expect((await studentPage.request.get(endpoint(`/documents/${rejectedDoc}/download`), { headers: auth(studentToken) })).status()).toBe(404);

    await nav(facultyPage, 'My Submissions');
    await expect(facultyPage.getByText('Incorrect subject classification.')).toBeVisible();
    await expect(facultyPage.getByText('Approved', { exact: true }).last()).toBeVisible();

    await studentPage.getByRole('searchbox').fill('Algorithms');
    await studentPage.getByLabel('Department', { exact: true }).selectOption({ label: 'Engineering QA' });
    await studentPage.getByLabel('Subject / Course').selectOption({ label: 'Algorithms QA' });
    await studentPage.getByLabel('Document Type').selectOption('LECTURE_NOTES');
    await expect(studentPage.getByRole('link', { name: 'Algorithms Lecture QA' })).toBeVisible();
    await expect(studentPage.getByText('Welcome back, Integration Student!')).toBeHidden({ timeout: 6000 });
    await assertAccessible(studentPage);
    await studentPage.getByRole('link', { name: 'Algorithms Lecture QA' }).click();
    await expect(studentPage.getByTestId('rendered-pdf-page')).toBeVisible();
    await expect(studentPage.getByText('Authenticated Algorithms page one')).toBeAttached();
    await studentPage.getByRole('button', { name: 'Next page' }).click();
    await expect(studentPage.getByText('Authenticated Algorithms page two')).toBeAttached();
    await studentPage.getByRole('button', { name: 'Zoom in' }).click();
    await expect(studentPage.getByText('125%', { exact: true })).toBeVisible();
    const [download] = await Promise.all([
      studentPage.waitForEvent('download'),
      studentPage.getByRole('button', { name: 'Download PDF', exact: true }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('Algorithms Lecture.pdf');
    expect(await readFile(await download.path())).toEqual(pdf);

    await studentPage.screenshot({ path: info.outputPath('desktop-pdf.png') });
    await expect(studentPage.locator('main')).toBeVisible();
    expect(await studentPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await nav(adminPage, 'Documents');
    await adminPage.getByRole('button', { name: 'Edit Algorithms Lecture QA' }).click();
    await adminPage.getByRole('dialog').getByLabel('Title', { exact: false }).fill('Algorithms Updated QA');
    await adminPage.getByRole('button', { name: 'Save Metadata' }).click();
    await expect(adminPage.getByText('Algorithms Updated QA')).toBeVisible();
    await confirm(adminPage, 'Delete Algorithms Updated QA', 'Permanently Delete');
    await expect(adminPage.getByText('Algorithms Updated QA')).toHaveCount(0);
    expect((await studentPage.request.get(endpoint(`/documents/${approvedDoc}/pdf`), { headers: auth(studentToken) })).status()).toBe(404);

    await expect.poll(() => [...operations.keys()].filter(name => !seen.has(name))).toEqual([]);
    expect(diagnostics.flat()).toEqual([]);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});

test('mobile navigation, keyboard, accessible pages and server-revoked sessions work in the production bundle', async ({ browser }, info) => {
  const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  const page = await context.newPage();
  const diagnostics = uiErrors(page);
  const student = { name: 'Mobile Student', email: `mobile-${randomUUID()}@mitaoe.ac.in`, password: randomUUID() };
  const registered = await context.request.post(endpoint('/auth/register'), { data: student });
  expect(registered.status()).toBe(201);
  const userId = (await registered.json()).user.id as string;
  try {
    await page.goto(origin);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await page.getByRole('button', { name: 'Open mobile menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Mobile navigation' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open mobile menu' })).toBeFocused();
    await page.getByRole('button', { name: 'Open mobile menu' }).click();
    await menu.getByRole('link', { name: 'Sign in' }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await assertAccessible(page);

    const signedInAdmin = await context.request.post(endpoint('/auth/login'), { data: { email: admin.email, password: admin.password } });
    expect(signedInAdmin.ok()).toBe(true);
    const token = (await signedInAdmin.json()).token as string;
    const department = await context.request.post(endpoint('/departments'), {
      headers: auth(token), data: { name: 'Mobile QA Department' },
    });
    expect(department.status()).toBe(201);
    const subject = await context.request.post(endpoint('/subjects'), {
      headers: auth(token), data: { name: 'Mobile QA Subject', departmentId: (await department.json()).id },
    });
    expect(subject.status()).toBe(201);
    const member = { email: 'mobile-faculty@example.test', password: randomUUID() };
    const provisioned = await context.request.post(endpoint('/users'), {
      headers: auth(token), data: { ...member, name: 'Mobile Faculty', role: 'FACULTY' },
    });
    expect(provisioned.status()).toBe(201);
    const faculty = await context.request.post(endpoint('/auth/login'), { data: member });
    expect(faculty.status()).toBe(200);
    const submitted = await context.request.post(endpoint('/documents'), {
      headers: auth((await faculty.json()).token),
      multipart: {
        file: { name: 'Mobile Reading.pdf', mimeType: 'application/pdf', buffer: await testPdf('Readable mobile PDF page') },
        title: 'Mobile Reading', type: 'EBOOK', subjectId: (await subject.json()).id,
      },
    });
    expect(submitted.status()).toBe(201);
    expect((await context.request.post(endpoint(`/approvals/${(await submitted.json()).submissionId}/decision`), {
      headers: auth(token), data: { decision: 'APPROVED' },
    })).status()).toBe(200);

    await signIn(page, student);
    await expect(page.getByRole('heading', { name: 'Academic Library' })).toBeVisible();
    await expect(page.getByText('Welcome back, Mobile Student!')).toBeHidden({ timeout: 6000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await assertAccessible(page);
    await page.screenshot({ path: info.outputPath('mobile-library.png') });
    await page.getByRole('link', { name: 'Mobile Reading', exact: true }).tap();
    await expect(page.getByTestId('rendered-pdf-page')).toBeVisible();
    await expect(page.getByText('Readable mobile PDF page')).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('mobile-pdf.png') });
    await page.getByRole('link', { name: 'Back to Library' }).tap();
    await expect(page.getByRole('link', { name: 'Mobile Reading', exact: true })).toBeVisible();
    const revoked = await context.request.patch(endpoint('/users/' + userId), {
      data: { role: 'FACULTY' }, headers: auth(token),
    });
    expect(revoked.status()).toBe(200);
    await page.getByRole('searchbox').fill('Expired session check');
    await expect(page.getByRole('alert')).toContainText('Your session expired.');
    await expect(page).toHaveURL(/\/sign-in$/);
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    expect(diagnostics).toEqual([]);
  } finally {
    await context.close();
  }
});

test('production artifacts contain the PDF worker and exclude development mock code', async () => {
  // Read the assembled static artifacts rather than the source modules.
  const files = await readdir(webDist + 'assets');
  expect(files.some(file => file.startsWith('pdf.worker'))).toBe(true);
  const scripts = await Promise.all(files.filter(name => name.endsWith('.js')).map(name => readFile(webDist + 'assets/' + name, 'utf8')));
  expect(scripts.some(script => script.includes('mock-token-') || script.includes('student.fixture@mitaoe.ac.in'))).toBe(false);
  expect((await readFile(webDist + 'pdfjs/standard_fonts/FoxitSerif.pfb')).length).toBeGreaterThan(0);
  const missing = await fetch(endpoint('/documents/' + new ObjectId().toHexString()));
  expect(missing.status).toBe(401);
});
