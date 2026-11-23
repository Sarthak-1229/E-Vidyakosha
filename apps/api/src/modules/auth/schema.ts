import { INSTITUTION_EMAIL_DOMAIN, USER_ROLES } from '@evidy/shared';
import { z } from 'zod';
import { name } from '../../lib/http.js';

const email = z.string().trim().toLowerCase().max(254).email();
export const registration = z.object({
  name,
  email,
  password: z.string().min(8).max(128),
}).strict();

export const studentRegistration = registration.extend({
  email: email.refine(value => value.endsWith(`@${INSTITUTION_EMAIL_DOMAIN}`)),
});
export const privilegedRegistration = registration.extend({ role: z.enum(['FACULTY', 'ADMIN']) });
export const loginInput = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const tokenClaims = z.object({
  sub: z.string().regex(/^[a-f0-9]{24}$/i),
  role: z.enum(USER_ROLES),
});
