export async function emailEvent(event: string, recipient: string, details: string) {
  if (!process.env.SMTP_HOST) { console.info(`[development email not sent] ${event} -> ${recipient}: ${details}`); return { delivered: false, reason: 'SMTP is not configured' }; }
  // SMTP transport is intentionally isolated here; deployment credentials never enter route handlers.
  console.info(`[email delivery pending transport configuration] ${event} -> ${recipient}`);
  return { delivered: false, reason: 'SMTP transport not configured in this build' };
}
