import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { expect, test, type Page } from '@playwright/test';
import type { DocumentDto, ListResponse, PublicUser, SubmissionDto } from '@evidy/shared';
import { createApp } from '../../src/app.js';
import { bootstrapFirstAdmin } from '../../src/modules/auth/service.js';
import { createTestDatabase, jwtSecret, testAccount } from '../helpers/database.js';
import { testPdf } from '../helpers/pdf.js';

async function start(server: Server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  return 'http://127.0.0.1:' + address.port;
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test('Chromium crosses the CORS boundary for register, upload, review, search, PDF blob and download', async ({ page }) => {
  const fixture = await createTestDatabase();
  const site = createServer((_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><title>API integration harness</title><main></main>');
  });
  const origin = await start(site);
  const server = createServer(createApp({ db: fixture.db, jwtSecret, webOrigin: origin }));
  const base = await start(server) + '/api/v1';
  const unexpected: string[] = [];
  page.on('pageerror', error => unexpected.push(error.message));

  type Input = { path: string; method?: string; token?: string; body?: Record<string, string> };
  async function json<T>(input: Input, status = 200) {
    const result = await page.evaluate(async ({ url, method, body, token }) => {
      const headers = new Headers();
      if (token) headers.set('Authorization', 'Bearer ' + token);
      if (body) headers.set('Content-Type', 'application/json');
      const response = await fetch(url, {
        method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, data: await response.json() as unknown };
    }, { url: base + input.path, method: input.method ?? 'GET', token: input.token, body: input.body });
    expect(result.status).toBe(status);
    return result.data as T;
  }

  const login = async (email: string, password: string) => (await json<{ token: string }>({
    path: '/auth/login', method: 'POST', body: { email, password },
  })).token;

  try {
    await bootstrapFirstAdmin(fixture.db, testAccount);
    await page.goto(origin);
    const admin = await login(testAccount.email, testAccount.password);
    const password = 'browser-test-password';
    const staffEmail = 'staff@example.test';
    await json({ path: '/users', method: 'POST', token: admin, body: {
      email: staffEmail, name: 'Faculty', password, role: 'FACULTY',
    } }, 201);
    const faculty = await login(staffEmail, password);
    const studentEmail = 'browser@mitaoe.ac.in';
    const studentAccount = await json<{ user: PublicUser }>({
      path: '/auth/register', method: 'POST', body: { name: 'Browser Student', email: studentEmail, password },
    }, 201);
    expect(studentAccount.user.role).toBe('STUDENT');
    const student = await login(studentEmail, password);

    const department = await json<{ id: string }>({
      path: '/departments', method: 'POST', token: admin, body: { name: 'Computer Engineering' },
    }, 201);
    const subject = await json<{ id: string }>({
      path: '/subjects', method: 'POST', token: admin, body: { name: 'Algorithms', departmentId: department.id },
    }, 201);
    const expected = await testPdf('Authenticated browser PDF');
    const uploaded = await page.evaluate(async ({ url, token, bytes, subjectId }) => {
      const body = new FormData();
      body.append('title', 'Browser Algorithms Notes');
      body.append('type', 'LECTURE_NOTES');
      body.append('subjectId', subjectId);
      body.append('file', new File([new Uint8Array(bytes)], 'Algorithms Notes.pdf', { type: 'application/pdf' }));
      const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body });
      return { status: response.status, result: await response.json() as { submissionId: string; status: string } };
    }, { url: base + '/documents', token: faculty, bytes: Array.from(expected), subjectId: subject.id });
    expect(uploaded.status).toBe(201);
    expect(uploaded.result.status).toBe('PENDING');

    const mine = await json<SubmissionDto[]>({ path: '/uploads/mine', token: faculty });
    const pending = mine[0];
    expect(pending?.id).toBe(uploaded.result.submissionId);
    const id = pending?.document.id ?? '';
    await json({ path: `/documents/${id}/pdf`, token: admin }, 404);
    await json({ path: '/uploads/mine', token: student }, 403);
    await json({
      path: '/approvals/' + uploaded.result.submissionId + '/decision',
      token: admin, method: 'POST', body: { decision: 'APPROVED' },
    });
    const listing = await json<ListResponse<DocumentDto>>({ path: '/documents?q=Algorithms', token: student });
    expect(listing.items.map(item => item.id)).toEqual([id]);

    const inline = await page.evaluate(async ({ url, token }) => {
      const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const frame = document.createElement('iframe');
      frame.title = 'PDF preview';
      frame.src = objectUrl;
      document.querySelector('main')?.append(frame);
      window.addEventListener('pagehide', () => URL.revokeObjectURL(objectUrl), { once: true });
      return {
        type: blob.type,
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
        disposition: response.headers.get('content-disposition'),
      };
    }, { url: base + `/documents/${id}/pdf`, token: student });
    expect(inline.type).toBe('application/pdf');
    expect(inline.disposition).toMatch(/^inline;/);
    expect(Buffer.from(inline.bytes)).toEqual(expected);
    await expect(page.locator('iframe[title="PDF preview"]')).toHaveAttribute('src', /^blob:/);

    const [download, disposition] = await Promise.all([
      page.waitForEvent('download', { predicate: item => item.suggestedFilename() === 'Algorithms Notes.pdf' }),
      triggerDownload(page, base + `/documents/${id}/download`, student),
    ]);
    expect(disposition).toMatch(/^attachment;/);
    expect(await readFile(await download.path())).toEqual(expected);
    expect(unexpected).toEqual([]);
  } finally {
    await Promise.all([close(server), close(site)]);
    await fixture.close();
  }
});

function triggerDownload(page: Page, url: string, token: string) {
  return page.evaluate(async ({ url, token }) => {
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'Algorithms Notes.pdf';
    document.querySelector('main')?.append(link);
    link.click();
    window.addEventListener('pagehide', () => URL.revokeObjectURL(objectUrl), { once: true });
    return response.headers.get('content-disposition');
  }, { url, token });
}
