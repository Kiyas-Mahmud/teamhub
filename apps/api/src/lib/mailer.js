import nodemailer from 'nodemailer';

const hasMailerConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

const transporter = hasMailerConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// Module-scope mailer health state. Surfaced via /api/health and updated
// by the boot-time verify() call as well as runtime send failures.
const mailerStatus = {
  configured: Boolean(hasMailerConfig),
  ready: false,
  lastError: null,
  verifiedAt: null,
};

if (transporter) {
  transporter.verify((err) => {
    if (err) {
      mailerStatus.ready = false;
      mailerStatus.lastError = err.message || String(err);
      console.error('[mailer] SMTP verification FAILED:', {
        message: err.message,
        code: err.code,
        response: err.response,
      });
      console.error(
        '[mailer] Hint: Gmail requires a 16-char app password (with 2FA enabled). ' +
          'If you just edited .env, restart the API to pick up the new values.'
      );
    } else {
      mailerStatus.ready = true;
      mailerStatus.lastError = null;
      mailerStatus.verifiedAt = new Date().toISOString();
      console.log(
        `[mailer] SMTP ready (${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${process.env.SMTP_USER})`
      );
    }
  });
} else {
  console.warn(
    '[mailer] SMTP not configured — invite/mention emails will be skipped. ' +
      'Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in apps/api/.env to enable.'
  );
}

export function getMailerStatus() {
  return { ...mailerStatus };
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell({ title, intro, ctaLabel, ctaUrl, footer }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid rgba(15,23,42,0.06);">
                <span style="display:inline-block;height:24px;width:24px;border-radius:6px;background:#0d9488;color:#fff;text-align:center;line-height:24px;font-weight:700;font-size:12px;vertical-align:middle;">T</span>
                <span style="margin-left:8px;font-weight:600;font-size:14px;color:#0a0a0a;vertical-align:middle;">Team Hub</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 8px;font-size:20px;line-height:28px;font-weight:600;color:#0a0a0a;">${title}</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#404552;">${intro}</p>
                ${
                  ctaUrl
                    ? `<a href="${ctaUrl}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(ctaLabel || 'Open')}</a>
                       <p style="margin:18px 0 0;font-size:12px;color:#6b7280;word-break:break-all;">If the button doesn't work, paste this link: ${ctaUrl}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid rgba(15,23,42,0.06);background:#fafafa;font-size:12px;color:#6b7280;">
                ${footer || 'Team Hub — collaborative workspace'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.warn('[mailer] SMTP not configured — skipping email to', to);
    return { skipped: true };
  }
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

/**
 * Fire-and-forget email send. Never throws; logs failures with full context
 * and updates mailerStatus.lastError so /api/health reflects the latest state.
 */
function sendInBackground(promiseFactory, { label, to }) {
  Promise.resolve()
    .then(promiseFactory)
    .catch((error) => {
      console.error(`[mailer] ${label} → ${to} failed:`, {
        message: error?.message,
        code: error?.code,
        response: error?.response,
      });
      mailerStatus.ready = false;
      mailerStatus.lastError = error?.message || String(error);
    });
}

export const mailer = {
  sendWorkspaceInvite({ to, workspaceName, inviterName, inviteLink }) {
    const safeWorkspace = escapeHtml(workspaceName || 'a workspace');
    const safeInviter = escapeHtml(inviterName || 'A teammate');
    const html = shell({
      title: `You've been invited to ${safeWorkspace}`,
      intro: `${safeInviter} invited you to collaborate on <strong>${safeWorkspace}</strong> in Team Hub. Accept to start tracking goals, action items, and announcements together.`,
      ctaLabel: 'Accept invitation',
      ctaUrl: inviteLink,
      footer: "This invite expires in 7 days. Ignore this email if you weren't expecting it.",
    });
    sendInBackground(
      () => sendMail({ to, subject: `Invitation to ${workspaceName}`, html }),
      { label: 'workspace invite', to }
    );
  },

  sendMentionEmail({ to, authorName, workspaceName, snippet, link }) {
    const safeAuthor = escapeHtml(authorName || 'A teammate');
    const safeWorkspace = escapeHtml(workspaceName || 'your workspace');
    const safeSnippet = escapeHtml((snippet || '').slice(0, 240));
    const html = shell({
      title: `${safeAuthor} mentioned you`,
      intro: `${safeAuthor} mentioned you in <strong>${safeWorkspace}</strong>.${
        safeSnippet ? `<br/><br/><em style="color:#404552;">"${safeSnippet}"</em>` : ''
      }`,
      ctaLabel: 'Open in Team Hub',
      ctaUrl: link,
    });
    sendInBackground(
      () => sendMail({ to, subject: `${authorName} mentioned you in ${workspaceName}`, html }),
      { label: 'mention email', to }
    );
  },
};
