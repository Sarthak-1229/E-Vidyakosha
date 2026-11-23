import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const options = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const scheme = 'scrypt-v1';
const keyLength = 64;
// Derive a key even when the email is absent, to avoid an account-existence timing shortcut.
const dummyHash = `${scheme}:${'0'.repeat(32)}:${'0'.repeat(keyLength * 2)}`;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${scheme}:${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, hash?: string) {
  const [version, salt, expected] = (hash ?? dummyHash).split(':');
  if (version !== scheme || !salt || !expected || !/^[a-f0-9]{32}$/.test(salt) ||
      !/^[a-f0-9]{128}$/.test(expected)) return false;
  const key = await derive(password, Buffer.from(salt, 'hex'));
  return timingSafeEqual(key, Buffer.from(expected, 'hex')) && hash !== undefined;
}
