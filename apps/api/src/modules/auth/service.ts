import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@evidy/shared';
import type { z } from 'zod';
import type { Database } from '../../lib/database.js';
import { conflict, isDuplicate, unauthenticated } from '../../lib/http.js';
import { publicUser } from '../user/repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { findActiveUser, findCredentials, hasAdmin, insertAccount } from './repository.js';
import { tokenClaims, type loginInput, type registration } from './schema.js';

const issuer = 'e-vidyakosha-api';
const audience = 'e-vidyakosha-web';
export const credentialsError = () => unauthenticated('Invalid email or password.');

export async function registerStudent(db: Database, { password, ...profile }: z.infer<typeof registration>) {
  const account = await insertAccount(db, {
    ...profile, role: 'STUDENT', passwordHash: await hashPassword(password),
  });
  return publicUser(account);
}

export async function bootstrapFirstAdmin(db: Database, { password, ...profile }: z.infer<typeof registration>) {
  if (await hasAdmin(db)) throw conflict('An administrator already exists.');
  try {
    return publicUser(await insertAccount(db, {
      ...profile, role: 'ADMIN', bootstrap: true, passwordHash: await hashPassword(password),
    }));
  } catch (error) {
    if (isDuplicate(error)) throw conflict('An administrator already exists or the email is already in use.');
    throw error;
  }
}

async function sign(secret: Uint8Array, id: string, role: UserRole) {
  return new SignJWT({ role }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(id).setIssuer(issuer).setAudience(audience).setIssuedAt().setExpirationTime('2h')
    .sign(secret);
}

export async function login(db: Database, secret: Uint8Array, input: z.infer<typeof loginInput>) {
  const account = await findCredentials(db, input.email);
  if (!await verifyPassword(input.password, account?.passwordHash) || !account) throw credentialsError();
  const user = publicUser(account);
  return { token: await sign(secret, user.id, user.role), user };
}

export async function authenticate(db: Database, secret: Uint8Array, token: string) {
  let claims: z.infer<typeof tokenClaims>;
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer, audience, algorithms: ['HS256'], typ: 'JWT', requiredClaims: ['sub', 'exp', 'iat'],
      maxTokenAge: '2h',
    });
    claims = tokenClaims.parse(payload);
  } catch {
    throw unauthenticated();
  }
  const user = await findActiveUser(db, claims.sub);
  if (!user || user.role !== claims.role) throw unauthenticated();
  return publicUser(user);
}
