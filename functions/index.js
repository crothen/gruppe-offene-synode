// Cloud Functions for the GOS website: e-mail notifications for membership requests.
//   gos-requests/{uid} created            -> mail to all admins (role "admin")
//   gos-requests/{uid} status changes     -> mail to the requester (approved / denied)
// SMTP settings come from functions/.env (see .env.example). Without them, mails are only logged.
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

const SITE_URL = process.env.SITE_URL || 'https://gruppe-offene-synode.web.app';
const SITE_NAME = 'Gruppe Offene Synode';

function transporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT || 587);
  return nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
}

async function sendMail(to, subject, text) {
  const t = transporter();
  if (!t) { logger.warn('SMTP not configured – mail NOT sent', { to, subject }); return; }
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text });
  logger.info('mail sent', { to, subject });
}

exports.onMemberRequestCreated = onDocumentCreated('gos-requests/{uid}', async (event) => {
  const d = event.data?.data();
  if (!d) return;
  const admins = await getFirestore().collection('gos-admins').where('role', '==', 'admin').get();
  const to = admins.docs.map((x) => x.data().email).filter(Boolean);
  if (!to.length) { logger.warn('no admin e-mail addresses found'); return; }
  await sendMail(
    to,
    `${SITE_NAME}: Neue Mitgliedschaftsanfrage von ${d.name || d.email}`,
    `Guten Tag\n\nAuf der Website ist eine neue Anfrage für einen Mitgliederzugang eingegangen:\n\n` +
    `  Name:    ${d.name || '–'}\n  E-Mail:  ${d.email}\n\n` +
    `Sie können die Anfrage im Admin-Portal unter «Benutzer» annehmen oder ablehnen:\n${SITE_URL}/admin.html\n\n` +
    `Diese Nachricht wurde automatisch von der Website ${SITE_NAME} verschickt.`
  );
});

exports.onMemberRequestDecided = onDocumentUpdated('gos-requests/{uid}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status || !after.email) return;

  const name = after.name ? ` ${after.name}` : '';
  if (after.status === 'approved') {
    await sendMail(
      after.email,
      `${SITE_NAME}: Ihr Mitgliederzugang ist freigeschaltet`,
      `Guten Tag${name}\n\nIhre Anfrage wurde angenommen. Sie können sich ab sofort auf der Website anmelden und den Bereich «Dokumente» nutzen:\n${SITE_URL}\n\n` +
      `Melden Sie sich mit Ihrer E-Mail-Adresse und dem gewählten Passwort an. Sollten Sie das Passwort vergessen haben, verwenden Sie «Passwort vergessen?» im Login-Dialog.\n\n` +
      `Freundliche Grüsse\n${SITE_NAME}`
    );
  } else if (after.status === 'denied') {
    await sendMail(
      after.email,
      `${SITE_NAME}: Ihre Anfrage für einen Mitgliederzugang`,
      `Guten Tag${name}\n\nVielen Dank für Ihr Interesse. Ihre Anfrage für einen Mitgliederzugang konnte leider nicht freigeschaltet werden.\n\n` +
      `Bei Fragen wenden Sie sich bitte über das Kontaktformular an uns:\n${SITE_URL}/#kontakt\n\n` +
      `Freundliche Grüsse\n${SITE_NAME}`
    );
  }
});
