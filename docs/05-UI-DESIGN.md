# Approved visual direction — Soft glassmorphism / atmospheric gradient

## Tone

Calm, contemporary editorial academic space, not a busy admin dashboard. Smooth, diffused atmospheric gradient washes blending deep slate / midnight navy into cool blue-gray and airy off-white. Semi-transparent translucent/frosted surfaces and **generous** radius; avoid solid slab backgrounds, heavy borders or heavy shadows.

## Tokens (implementation proposal, adjustable within approved direction)

| Token | Suggested value | Use |
|---|---|---|
| midnight | `#111D2E` | top navigation and high contrast |
| slate | `#243A55` | deep gradients, secondary text |
| mist | `#EAF0F6` | bright surfaces |
| snow | `#FAFBFC` | whitespace |
| glass | `rgba(255,255,255,.56)` | cards/forms |
| glass border | `rgba(255,255,255,.52)` | 1px edge on bright surfaces |
| radius-card | `24px` | primary panels |
| radius-input | `14px` | fields |
| radius-pill | `9999px` | primary black CTA |
| blur-card | `20–26px` | translucent backdrop |
| headings | Manrope / system fallback | bold, tight editorial |
| body | DM Sans / system fallback | readable and spacious |

Accessibility wins over aesthetic effects: text must meet WCAG AA contrast, including over translucent cards; if needed add solid backdrop/overlay, and do not rely on blur for meaning. Visible focus rings and keyboard reachable controls. Respect `prefers-reduced-motion`.

## Information architecture / screens

Shared: Landing, login, Student registration, 404, auth expired/error. Authenticated shared: Repository with title search, Subject and type filter, results/empty states, detail/inline PDF viewer + download. Student: simple library-first dashboard. Faculty: dashboard, upload form with validation/progress, own submissions (PENDING/APPROVED/REJECTED, rejection reasons). Admin: dashboard, manage users, departments, subjects, documents; queue with review decision and reason field.

Never expose role choice on self-registration. Never show upload action to Student. Never display pending/rejected documents in public repository. Every page must have loading, empty, validation, permission and server-error states.

## Interaction rules

- Responsive mobile-first 360px, tablet, desktop. Nav collapses sensibly; no horizontal overflow.
- Buttons: solid black pill for primary action; transparent or subtle glass for secondary actions.
- Headings large with strong visual hierarchy; supporting copy muted and generous spacing.
- Inputs labeled, required/error text clear, error summary where useful, server error not lost on rerender.
- PDF: authorize via API bearer header; prefer `fetch` blob + `URL.createObjectURL` with cleanup for inline viewer, **not** a public `/files/<gridfsid>` URL or raw `iframe` to unauthenticated endpoint.
- Upload: size/type prevalidation for feedback, but the server always performs definitive checks.
- Disable buttons while submitting; prevent duplicate sends; handle abort, timeouts, 401 expiration and offline gracefully.
- Use measured (not fabricated) counters, badges and resource lists. Until API exists, mark local sample data explicitly as DESIGN PREVIEW and remove before release.

## UI acceptance evidence

Screenshots at desktop 1440×900 and mobile 390×844; keyboard-only navigation, focus visibility, color contrast test, 200% zoom test, reduced-motion check. Browser tests for forbidden navigation, no-result search, API errors, forms and PDF flows. No fake functional success messages.
