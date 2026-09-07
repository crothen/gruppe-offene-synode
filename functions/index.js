// Cloud Functions for the GOS website (admin helpers that need the Admin SDK).
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });


async function requireAdmin(req) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Bitte anmelden.');
  const me = await getFirestore().collection('gos-admins').doc(req.auth.uid).get();
  if (!me.exists || me.data().role !== 'admin') throw new HttpsError('permission-denied', 'Nur Administratoren dürfen das.');
}

// Admin-only: set a new password for a member's login account.
exports.setMemberPassword = onCall({ cors: true }, async (req) => {
  await requireAdmin(req);
  const email = String(req.data?.email || '').trim().toLowerCase();
  const password = String(req.data?.password || '');
  if (!email) throw new HttpsError('invalid-argument', 'E-Mail-Adresse fehlt.');
  if (password.length < 6) throw new HttpsError('invalid-argument', 'Das Passwort muss mindestens 6 Zeichen haben.');
  const member = await getFirestore().collection('gos-members').doc(email).get();
  if (!member.exists) throw new HttpsError('failed-precondition', 'Diese Adresse ist nicht als Mitglied eingetragen.');
  let user;
  try { user = await getAuth().getUserByEmail(email); }
  catch { throw new HttpsError('not-found', 'Zu dieser E-Mail-Adresse gibt es noch kein Login-Konto.'); }
  await getAuth().updateUser(user.uid, { password });
  logger.info('password set', { email, by: req.auth.token.email });
  return { ok: true };
});

// Admin-only: turn a member (identified by e-mail) into an admin or editor.
// Needs the Admin SDK because the browser cannot map an e-mail to an Auth UID.
exports.promoteToAdmin = onCall({ cors: true }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Bitte anmelden.');
  const db = getFirestore();
  const me = await db.collection('gos-admins').doc(req.auth.uid).get();
  if (!me.exists || me.data().role !== 'admin') throw new HttpsError('permission-denied', 'Nur Administratoren können Rollen vergeben.');

  const email = String(req.data?.email || '').trim().toLowerCase();
  const role = req.data?.role === 'editor' ? 'editor' : 'admin';
  if (!email) throw new HttpsError('invalid-argument', 'E-Mail-Adresse fehlt.');

  let user;
  try { user = await getAuth().getUserByEmail(email); }
  catch { throw new HttpsError('not-found', 'Zu dieser E-Mail-Adresse gibt es noch kein Login-Konto. Die Person muss sich zuerst einmal auf der Website anmelden.'); }

  const member = await db.collection('gos-members').doc(email).get();
  const displayName = (member.exists && member.data().displayName) || user.displayName || '';
  await db.collection('gos-admins').doc(user.uid).set({
    email, displayName, role,
    createdAt: FieldValue.serverTimestamp(),
    promotedBy: req.auth.token.email || req.auth.uid,
  }, { merge: true });
  logger.info('promoted', { email, role, by: req.auth.token.email });
  return { uid: user.uid, role, displayName };
});

// Stamp "admin" / "member" flags onto the caller's login token. Storage rules
// check these flags, which avoids the Firestore lookup that needs an extra IAM role.
// Called by the site and the admin portal right after sign-in.
exports.refreshMyClaims = onCall({ cors: true }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Bitte anmelden.');
  const db = getFirestore();
  const uid = req.auth.uid;
  const email = String(req.auth.token.email || '').toLowerCase();
  const adminDoc = await db.collection('gos-admins').doc(uid).get();
  const memberDoc = email ? await db.collection('gos-members').doc(email).get() : null;
  const claims = { admin: adminDoc.exists, member: adminDoc.exists || !!(memberDoc && memberDoc.exists) };
  const user = await getAuth().getUser(uid);
  const cur = user.customClaims || {};
  const changed = cur.admin !== claims.admin || cur.member !== claims.member;
  if (changed) await getAuth().setCustomUserClaims(uid, { ...cur, ...claims });
  return { ...claims, changed };
});
