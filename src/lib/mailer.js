// src/lib/mailer.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from common locations
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../../.env'),
];
let loadedFrom = null;
for (const p of candidates) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); loadedFrom = p; break; }
}
if (!loadedFrom) dotenv.config();

function reqEnv(name) {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`Missing env: ${name}${loadedFrom ? ` (loaded from: ${loadedFrom})` : ''}`);
  return v;
}

// Prefer SMTP_*; fallback to EMAIL_* for backward compatibility
const HOST   = (process.env.SMTP_HOST || '').trim() || 'smtp.gmail.com';
const PORT   = Number((process.env.SMTP_PORT || '').trim() || 465);
const SECURE = String(process.env.SMTP_SECURE ?? (PORT === 465)).toLowerCase() === 'true';
const USER   = (process.env.SMTP_USER || process.env.EMAIL_USERNAME || '').trim();
let PASS     = (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '').trim();
// Remove spaces in Google app password if present
PASS = PASS.replace(/\s+/g, '');

if (!USER) throw new Error('Missing env: SMTP_USER or EMAIL_USERNAME');
if (!PASS) throw new Error('Missing env: SMTP_PASS or EMAIL_PASSWORD');

const FROM = (process.env.MAIL_FROM || USER).trim();
const REPLY_TO = (process.env.MAIL_REPLY_TO || '').trim();
const SMTP_DEBUG = String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true';

// Transporter with pool + optional debug
export const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: SECURE,             // true for 465; false for 587/STARTTLS
  auth: { user: USER, pass: PASS },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  logger: SMTP_DEBUG,
  debug: SMTP_DEBUG,
  // tls: { servername: HOST }, // uncomment if your env needs SNI
});

// Quick SMTP self-test (optional: call this once at server start)
export async function verifySmtp() {
  try {
    const ok = await transporter.verify();
    if (SMTP_DEBUG) console.log('[SMTP] verify ok:', ok);
    return true;
  } catch (e) {
    console.error('[SMTP] verify failed:', e?.response || e?.message || e);
    return false;
  }
}

// ---------- Existing OTP email ----------
export async function sendOtpEmail(to, otp) {
  if (!to) throw new Error('sendOtpEmail: "to" is required');
  if (!otp) throw new Error('sendOtpEmail: "otp" is required');

  const html = `
    <p>Your MyTestBuddies verification code is:</p>
    <h2 style="letter-spacing:6px;margin:12px 0;font-family:Inter,Arial,sans-serif">${otp}</h2>
    <p>This code will expire in 10 minutes.</p>
  `;

  const mail = {
    from: FROM, // keep aligned with authenticated mailbox for Gmail
    to,
    subject: 'Your OTP Code',
    html,
    text: `Your MyTestBuddies verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
    replyTo: REPLY_TO || undefined,
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log('OTP mail sent:', info.messageId);
    return info;
  } catch (e) {
    console.error('OTP mail error:', e?.response || e?.message || e);
    throw e;
  }
}

// ---------- New: Policies/Terms email ----------
/**
 * Sends Terms & Conditions + Privacy Policy + Legal Disclaimer in one email.
 * @param {string} to
 * @param {object} options
 * @param {string} [options.website='https://mytestbuddies.shop']
 * @param {string} [options.brand='MyTestBuddies']
 * @param {string} [options.effectiveDate] - e.g., 'October 13, 2025' (defaults to today)
 * @param {string} [options.jurisdiction='[Your City/State]']
 * @param {string} [options.address='[Your City, State, India]']
 */
export async function sendPoliciesEmail(to, options = {}) {
  if (!to) throw new Error('sendPoliciesEmail: "to" is required');

  const {
    website = 'https://mytestbuddies.shop',
    brand = 'MyTestBuddies',
    effectiveDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    jurisdiction = '[Your City/State]',
    address = '[Your City, State, India]',
  } = options;

  const preheader = `${brand} — Terms & Conditions, Privacy Policy, and Legal Disclaimer (Effective ${effectiveDate})`;

  const html = buildPoliciesHtml({ website, brand, effectiveDate, jurisdiction, address, preheader });
  const text = buildPoliciesText({ website, brand, effectiveDate, jurisdiction, address });

  const mail = {
    from: FROM,
    to,
    subject: `${brand} — Terms, Privacy & Disclaimer (Effective ${effectiveDate})`,
    html,
    text,
    replyTo: REPLY_TO || undefined,
  };

  try {
    const info = await transporter.sendMail(mail);
    console.log('Policies mail sent:', info.messageId);
    return info;
  } catch (e) {
    console.error('Policies mail error:', e?.response || e?.message || e);
    throw e;
  }
}

// ---------- HTML builder (email friendly) ----------
function buildPoliciesHtml({ website, brand, effectiveDate, jurisdiction, address, preheader }) {
  // All inline CSS, table layout for wide client support, max 700px, safe fonts, large touch targets
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${brand} — Terms, Privacy & Disclaimer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    /* Some clients ignore <style>, so we duplicate critical styles inline. */
    @media (max-width:600px){ .container{ width:100%!important } .px{ padding-left:16px!important; padding-right:16px!important } }
    a { color:#2563eb; text-decoration:none; }
    .btn a { display:inline-block; padding:12px 20px; border-radius:8px; background:#2563eb; color:#ffffff !important; }
    .muted { color:#667085; }
    .h1 { font-size:24px; line-height:1.3; margin:0; }
    .h2 { font-size:18px; line-height:1.4; margin:24px 0 8px; }
    .small { font-size:12px; }
    .card { border:1px solid #e5e7eb; border-radius:12px; padding:20px; }
    .toc a { display:block; margin:6px 0; }
    .section { margin-top:28px; }
    .divider { height:1px; background:#e5e7eb; margin:24px 0; }
  </style>
</head>
<body style="margin:0;background:#f6f7fb">
  <!-- Preheader (hidden in most clients) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb">
    <tr><td align="center">
      <table role="presentation" class="container" width="700" cellpadding="0" cellspacing="0" style="width:700px;max-width:100%;margin:0 auto">
        <tr><td class="px" style="padding:24px">
          <!-- Header -->
          <table role="presentation" width="100%" class="card" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px">
            <tr>
              <td>
                <div style="font-size:14px;color:#2563eb;font-weight:600;letter-spacing:.4px">${brand}</div>
                <h1 class="h1" style="font-family:Inter,Arial,sans-serif;color:#111827;margin:8px 0 6px">Legal Documents</h1>
                <div class="muted" style="font-family:Inter,Arial,sans-serif;font-size:13px">Effective Date: <strong>${effectiveDate}</strong></div>
                <div style="height:16px"></div>
                <div class="btn">
                  <a href="${website}" target="_blank" rel="noopener">Visit Website</a>
                </div>
              </td>
            </tr>

            <tr><td><div class="divider"></div></td></tr>

            <!-- TOC -->
            <tr><td>
              <div class="toc" style="font-family:Inter,Arial,sans-serif">
                <div class="h2" style="font-weight:700">Table of Contents</div>
                <a href="#tandc">1. Terms & Conditions (Mega Quiz)</a>
                <a href="#privacy">2. Privacy Policy</a>
                <a href="#disclaimer">3. Legal Disclaimer</a>
              </div>
            </td></tr>

            <tr><td><div class="divider"></div></td></tr>

            <!-- Terms & Conditions -->
            <tr><td id="tandc" class="section">
              <div class="h2" style="font-weight:700">1. Terms & Conditions (Mega Quiz)</div>
              <p class="muted small" style="margin:0 0 12px">Website: <a href="${website}" target="_blank" rel="noopener">${website}</a><br/>Organizer: ${brand} (“We”, “Us”, “Our”)</p>

              <div class="card" style="background:#fafafb">
                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">1) Eligibility</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Only Indian residents aged 18 years or above are eligible.</li>
                  <li>Participants below 18 years must have parental/guardian consent.</li>
                  <li>Employees, contractors, or family members of ${brand} cannot participate.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">2) Participation</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Register at <a href="${website}/megaquiz" target="_blank" rel="noopener">${website}/megaquiz</a> before the closing date.</li>
                  <li>Only one entry per person is allowed unless otherwise stated.</li>
                  <li>Participants must ensure all submitted information is accurate and verifiable.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">3) Quiz Rules</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Quiz questions must be completed within the given time limit.</li>
                  <li>Using bots, fake accounts, or unfair means will lead to disqualification.</li>
                  <li>${brand}’s decision on scoring and results shall be final and binding.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">4) Prizes</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Winners will be selected on the basis of highest scores or fastest time (as announced).</li>
                  <li>Prizes cannot be exchanged or transferred.</li>
                  <li>Winners will be notified via email/SMS within 7 working days of result announcement.</li>
                  <li>If a winner does not respond within 7 days, the prize will be forfeited.</li>
                  <li>All applicable taxes, TDS (as per Section 194B, Income Tax Act, 1961) or charges shall be borne by the winner.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">5) Disqualification</h3>
                <p style="margin:0 0 8px">We may disqualify a participant who:</p>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Submits false information or multiple entries.</li>
                  <li>Uses any unfair or automated method.</li>
                  <li>Violates these Terms in any manner.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">6) Data Usage</h3>
                <p style="margin:0 0 8px">By participating, you allow ${brand} to collect and use your name, score, and basic contact details for:</p>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Contest administration, winner communication, and analytics.</li>
                  <li>Future marketing or promotional activities (only with your consent).</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">7) Liability</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>${brand} shall not be responsible for technical issues, internet failure, or data loss.</li>
                  <li>The contest may be postponed, modified, or cancelled without prior notice.</li>
                  <li>The organizer’s decision shall be final in all matters related to the contest.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">8) Intellectual Property</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>All questions, logos, and content are the property of ${brand}.</li>
                  <li>Any reproduction or distribution without written consent is prohibited.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">9) Governing Law</h3>
                <p style="margin:0 0 16px">These Terms are governed by Indian laws. All disputes shall fall under the jurisdiction of ${jurisdiction} Courts, India.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:16px 0 8px">10) Contact</h3>
                <p style="margin:0">📧 <a href="mailto:mytestbuddies">support@mytestbuddies.com</a><br/>📍 ${address}</p>
              </div>
            </td></tr>

            <!-- Privacy Policy -->
            <tr><td id="privacy" class="section">
              <div class="h2" style="font-weight:700">2. Privacy Policy</div>
              <p class="muted small" style="margin:0 0 12px">Effective Date: <strong>${effectiveDate}</strong> • Website: <a href="${website}" target="_blank" rel="noopener">${website}</a></p>

              <div class="card" style="background:#fafafb">
                <p style="margin:0 0 12px">${brand} respects your privacy and is committed to protecting your personal data in accordance with the Information Technology Act, 2000 and SPDI (Sensitive Personal Data) Rules, 2011.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">1) Information We Collect</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li><strong>Personal Information:</strong> Name, email, phone number, date of birth, etc.</li>
                  <li><strong>Usage Data:</strong> Browser type, IP address, device info, quiz performance.</li>
                  <li><strong>Cookies:</strong> To improve user experience and website analytics.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">2) How We Use Your Information</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Conduct quizzes and contests.</li>
                  <li>Notify winners and deliver prizes.</li>
                  <li>Improve website performance and personalize experience.</li>
                  <li>Send updates or promotional materials (you can opt out anytime).</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">3) Sharing of Information</h3>
                <p style="margin:0 0 8px">We do not sell or rent your data. Information may be shared only with:</p>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Trusted service providers (email, hosting, payment gateways).</li>
                  <li>Legal authorities, if required by law.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">4) Data Security</h3>
                <p style="margin:0 0 16px">We implement reasonable security practices, including encryption and secure servers, to protect your information from unauthorized access or disclosure.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">5) Retention</h3>
                <p style="margin:0 0 16px">We retain personal data only as long as necessary for the purpose collected or as required by law.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">6) Your Rights</h3>
                <p style="margin:0 0 8px">Under Indian data protection rules, you have the right to:</p>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>Access, correct, or delete your personal data.</li>
                  <li>Withdraw consent for processing.</li>
                  <li>Request information on how your data is used.</li>
                </ul>
                <p style="margin:0 0 16px">To exercise these rights, email us at <a href="mailto:mytestbuddies">support@mytestbuddies.com</a>.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">7) External Links</h3>
                <p style="margin:0 0 16px">Our site may contain links to third-party websites. We are not responsible for their privacy practices.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">8) Changes to this Policy</h3>
                <p style="margin:0">We may update this Privacy Policy occasionally. Please check this page regularly for updates.</p>
              </div>
            </td></tr>

            <!-- Legal Disclaimer -->
            <tr><td id="disclaimer" class="section">
              <div class="h2" style="font-weight:700">3. Legal Disclaimer</div>
              <p class="muted small" style="margin:0 0 12px">Effective Date: <strong>${effectiveDate}</strong></p>

              <div class="card" style="background:#fafafb">
                <p style="margin:0 0 16px">The information provided on ${brand} is for educational and entertainment purposes only.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">1) General Disclaimer</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>${brand} does not guarantee the accuracy or completeness of any quiz question or result.</li>
                  <li>Participation in any quiz or contest is voluntary and at the participant’s own risk.</li>
                  <li>The organizer shall not be liable for any loss, damage, or injury resulting from participation.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">2) Technical Disclaimer</h3>
                <p style="margin:0 0 16px">We make reasonable efforts to keep the website running smoothly. However, ${brand} takes no responsibility for technical issues, downtime, or interruptions beyond our control.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">3) Prize Disclaimer</h3>
                <ul style="margin:0 0 16px;padding-left:18px">
                  <li>The organizer reserves the right to change, cancel, or substitute prizes at any time.</li>
                  <li>Taxes or levies on prizes shall be the responsibility of the winner.</li>
                </ul>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">4) No Warranties</h3>
                <p style="margin:0 0 16px">All services are provided “as is” without any warranties, either express or implied, including fitness for a particular purpose.</p>

                <h3 style="font-family:Inter,Arial,sans-serif;font-size:16px;margin:0 0 8px">5) Jurisdiction</h3>
                <p style="margin:0">All legal matters or disputes shall be governed by the laws of India, with exclusive jurisdiction of ${jurisdiction} courts.</p>
              </div>
            </td></tr>

            <tr><td><div class="divider"></div></td></tr>

            <!-- Footer -->
            <tr><td>
              <p class="small muted" style="margin:0 0 8px">© ${new Date().getFullYear()} ${brand} | Terms &amp; Conditions | Privacy Policy | Disclaimer</p>
              <p class="small muted" style="margin:0 0 4px">Contact: <a href="mailto:mytestbuddies">support@mytestbuddies.com</a></p>
              <p class="small muted" style="margin:0">${address}</p>
            </td></tr>
          </table>

          <div style="height:28px"></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;
}

// ---------- Plain-text fallback ----------
function buildPoliciesText({ website, brand, effectiveDate, jurisdiction, address }) {
  return `
${brand} — Terms, Privacy & Disclaimer
Effective Date: ${effectiveDate}
Website: ${website}

TABLE OF CONTENTS
1) Terms & Conditions (Mega Quiz)
2) Privacy Policy
3) Legal Disclaimer

==============================
1) TERMS & CONDITIONS (MEGA QUIZ)
Organizer: ${brand}
Website: ${website}

Eligibility:
- Only Indian residents aged 18+ are eligible for General and Student class according to the guidelines.
- Participants below 18 must have parental/guardian consent.
- Employees, contractors, or family members of ${brand} cannot participate.

Participation:
- Register at ${website}/megaquiz before the closing date.
- One entry per person unless otherwise stated.
- All submitted information must be accurate and verifiable.

Quiz Rules:
- Complete questions within the given time limit.
- Using bots, fake accounts, or unfair means leads to disqualification.
- ${brand}'s decision on scoring/results is final and binding.

Prizes:
- Winners selected by highest scores or fastest time (as announced).
- Prizes cannot be exchanged or transferred.
- Winners notified via email/SMS within 7 working days of results.
- No response within 7 days => prize forfeited.
- All taxes/TDS (Sec 194B, Income Tax Act, 1961) borne by winner.

Disqualification:
- False information or multiple entries.
- Unfair/automated methods.
- Violation of these Terms.

Data Usage:
- We may use name, score, and contact details for administration, communication, analytics, and (with consent) future marketing.

Liability:
- Not responsible for technical issues, internet failure, or data loss.
- Contest may be postponed/modified/cancelled without notice.
- Organizer’s decision is final.

Intellectual Property:
- All questions, logos, and content are property of ${brand}.
- Reproduction/distribution without written consent is prohibited.

Governing Law:
- Governed by Indian laws; disputes under ${jurisdiction} Courts, India.

Contact:
- Email: mytestbuddies
- Address: ${address}

==============================
2) PRIVACY POLICY
Effective Date: ${effectiveDate}
We comply with the IT Act, 2000 and SPDI Rules, 2011.

Information We Collect:
- Personal: name, email, phone, DOB, etc.
- Usage: browser, IP, device info, quiz performance.
- Cookies for UX and analytics.

How We Use Info:
- Conduct quizzes/contests; notify winners; deliver prizes.
- Improve site performance; personalize experience.
- Send updates/promotions (opt out anytime).

Sharing:
- No selling or renting data.
- Share only with trusted service providers or legal authorities if required.

Data Security:
- Reasonable security practices, encryption, secure servers.

Retention:
- Keep data only as long as needed or required by law.

Your Rights:
- Access/correct/delete data; withdraw consent; request info on usage.
- Email support@mytestbuddies.com.

External Links:
- Not responsible for third-party privacy practices.

Changes:
- We may update this policy from time to time.

==============================
3) LEGAL DISCLAIMER
General:
- Information is for educational and entertainment purposes only.
- Participation is voluntary and at your own risk.
- We’re not liable for loss/damage/injury arising from participation.

Technical:
- We try to keep the site running but aren’t responsible for downtime/interruptions.

Prize:
- We may change/cancel/substitute prizes anytime.
- Taxes/levies on prizes are the winner’s responsibility.

No Warranties:
- Services provided “as is”, without warranties (express or implied).

Jurisdiction:
- Governed by laws of India; exclusive jurisdiction of ${jurisdiction} courts.

© ${new Date().getFullYear()} ${brand}
  `.trim();
}
