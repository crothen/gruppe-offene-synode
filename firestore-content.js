/* ============================================
   Gruppe Offene Synode — Dynamic Firestore Content
   ============================================
   Loads events and documents from Firestore and
   renders them into the public site.
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy }
  from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, sendPasswordResetEmail, signOut }
  from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- State ---
let eventsData = [];
let documentsData = [];

// --- Helpers ---
function localizedField(doc, field) {
  return doc[field + '_de'] || '';
}

// --- SVG Icons (reused from original HTML) ---
const DOC_ICON_SVG = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
  <polyline points="10 9 9 9 8 9"/>
</svg>`;

const DOWNLOAD_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="7 10 12 15 17 10"/>
  <line x1="12" y1="15" x2="12" y2="3"/>
</svg>`;

// --- Render Events ---
function renderEvents() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;

  if (eventsData.length === 0) {
    timeline.innerHTML = '<p class="content-empty">Keine Termine verfügbar.</p>';
    return;
  }

  const badgeLabels = { gos: 'GOS', synode: 'Synode' };
  const dotClasses = { gos: 'dot-gos', synode: 'dot-synode' };

  timeline.innerHTML = eventsData.map(function (ev) {
    const category = ev.category || 'gos';
    const dotClass = dotClasses[category] || 'dot-gos';
    const badgeClass = ev.badgeClass || 'badge-gos';
    const badgeLabel = badgeLabels[category] || category.toUpperCase();

    return `
      <div class="timeline-item" data-category="${category}">
        <div class="timeline-marker">
          <div class="timeline-dot ${dotClass}"></div>
        </div>
        <div class="timeline-card">
          <div class="timeline-date">
            <span class="date-day">${ev.dateDisplay || ''}</span>
            <span class="date-month">${localizedField(ev, 'month')}</span>
          </div>
          <div class="timeline-body">
            <span class="session-badge ${badgeClass}">${badgeLabel}</span>
            <h3>${localizedField(ev, 'title')}</h3>
            <p>${localizedField(ev, 'description')}</p>
          </div>
        </div>
      </div>`;
  }).join('');

  // Re-initialize scroll animations for new elements
  if (window.GOS && window.GOS.observeElements) {
    window.GOS.observeElements(timeline.querySelectorAll('.timeline-item'));
  }
}

// --- Render Documents ---
function renderDocuments() {
  const docsGrid = document.querySelector('.docs-grid');
  if (!docsGrid) return;

  if (documentsData.length === 0) {
    docsGrid.innerHTML = '<p class="content-empty">Keine Dokumente verfügbar.</p>';
    return;
  }

  docsGrid.innerHTML = documentsData.map(function (doc) {
    const href = doc.fileUrl || '#';
    const target = doc.fileUrl ? ' target="_blank" rel="noopener noreferrer"' : '';

    return `
      <a href="${href}"${target} class="doc-card">
        <div class="doc-icon" aria-hidden="true">${DOC_ICON_SVG}</div>
        <div class="doc-info">
          <h3>${localizedField(doc, 'title')}</h3>
          <p>${localizedField(doc, 'description')}</p>
          <span class="doc-meta">${localizedField(doc, 'meta')}</span>
        </div>
        <div class="doc-download" aria-hidden="true">${DOWNLOAD_ICON_SVG}</div>
      </a>`;
  }).join('');

  // Re-initialize scroll animations for new elements
  if (window.GOS && window.GOS.observeElements) {
    window.GOS.observeElements(docsGrid.querySelectorAll('.doc-card'));
  }
}

// --- Loading States ---
function showLoading(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="content-loading">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>`;
}

function showError(container) {
  if (!container) return;
  const msg = 'Inhalte sind derzeit nicht verfügbar.';
  container.innerHTML = `<p class="content-error">${msg}</p>`;
}

// --- Fetch Data ---
async function loadEvents() {
  const timeline = document.querySelector('.timeline');
  showLoading(timeline);

  try {
    const q = query(
      collection(db, 'gos-events'),
      where('visible', '==', true),
      orderBy('order')
    );
    const snapshot = await getDocs(q);
    eventsData = snapshot.docs.map(function (d) { return d.data(); });
    renderEvents();
  } catch (err) {
    console.error('Failed to load events:', err);
    showError(timeline);
  }
}

async function loadDocuments() {
  const docsGrid = document.querySelector('.docs-grid');
  showLoading(docsGrid);

  try {
    const q = query(
      collection(db, 'gos-documents'),
      where('visible', '==', true),
      orderBy('order')
    );
    const snapshot = await getDocs(q);
    documentsData = snapshot.docs.map(function (d) { return d.data(); });
    renderDocuments();
  } catch (err) {
    console.error('Failed to load documents:', err);
    showError(docsGrid);
  }
}

// --- Initialize ---
// --- Editable texts (gos-content/sections) and people (gos-people) -------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const paragraphsOf = (s) => String(s || '').split(/\n/).map((t) => t.trim()).filter(Boolean);   // one paragraph per line, blank lines ignored
const initialsOf = (name) => String(name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function setQuote(sectionSel, text) {
  const q = document.querySelector(sectionSel + ' .creed');
  if (!q) return;
  q.hidden = !text;
  if (text) q.textContent = text;
}

function setProse(sectionSel, text) {
  const el = document.querySelector(sectionSel + ' .prose');
  if (el && text) el.innerHTML = paragraphsOf(text).map((p) => `<p>${esc(p)}</p>`).join('');
}

function renderSections(d) {
  setProse('#wer-wir-sind', d.who_text);
  setQuote('#wer-wir-sind', d.who_quote);
  setProse('#was-wir-wollen', d.goals_text);
  setQuote('#was-wir-wollen', d.goals_quote);
  setProse('#wie-wir-arbeiten', d.how_text);
  setQuote('#wie-wir-arbeiten', d.how_quote);

  const intro = document.querySelector('#menschen .section-subtitle');
  if (intro && d.people_intro) intro.textContent = d.people_intro;
}

async function loadSections() {
  try {
    const snap = await getDoc(doc(db, 'gos-content', 'sections'));
    if (snap.exists()) renderSections(snap.data());
  } catch (err) {
    console.error('Failed to load section texts:', err); // static HTML stays
  }
}

function renderPeople(people) {
  const grid = document.querySelector('#menschen .people-grid');
  if (!grid) return;
  if (people.length === 0) {
    grid.innerHTML = '<p class="content-empty">Keine Einträge.</p>';
    return;
  }
  grid.innerHTML = people.map((p) => `
    <article class="person-card visible">
      <div class="person-avatar" aria-hidden="true">${esc(initialsOf(p.name))}</div>
      <h3>${esc(p.name)}</h3>
      ${p.role ? `<p class="person-role">${esc(p.role)}</p>` : ''}
      ${p.text ? `<p>${esc(p.text)}</p>` : ''}
      ${p.email ? `<a class="person-mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}
    </article>`).join('');
}

async function loadPeople() {
  try {
    const q = query(collection(db, 'gos-people'), where('visible', '==', true), orderBy('order'));
    const snapshot = await getDocs(q);
    renderPeople(snapshot.docs.map((d) => d.data()));
  } catch (err) {
    console.error('Failed to load people:', err); // static HTML stays
  }
}

// --- Mitglieder-Login ---------------------------------------------------
// Documents are only for members: a signed-in user whose e-mail is listed in
// "gos-members" (or who is an admin). Firestore rules enforce the same thing.
const $ = (id) => document.getElementById(id);
const AUTH_ERRORS = {
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/wrong-password': 'E-Mail oder Passwort ist falsch.',
  'auth/user-not-found': 'Zu dieser E-Mail-Adresse gibt es kein Konto.',
  'auth/invalid-email': 'Bitte eine gültige E-Mail-Adresse eingeben.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später noch einmal probieren.',
  'auth/popup-closed-by-user': 'Anmeldung abgebrochen.',
  'auth/missing-password': 'Bitte das Passwort eingeben.',
};
let documentsLoaded = false;

function showAuthError(err) {
  const el = $('authError');
  el.textContent = err ? (AUTH_ERRORS[err.code] || 'Anmeldung fehlgeschlagen: ' + (err.message || err)) : '';
  el.hidden = !err;
}

function openAuthModal() { $('authModal').hidden = false; showAuthError(null); ($('authSignedOut').hidden ? null : $('authEmail')).focus?.(); }
function closeAuthModal() { $('authModal').hidden = true; }

async function isMemberUser(user) {
  const email = (user.email || '').toLowerCase();
  const checks = [getDoc(doc(db, 'gos-admins', user.uid)).catch(() => null)];
  if (email) checks.push(getDoc(doc(db, 'gos-members', email)).catch(() => null));
  const results = await Promise.all(checks);
  return results.some((s) => s && s.exists());
}

function applyMemberState(user, isMember) {
  $('navDocs').hidden = !isMember;
  $('dokumente').hidden = !isMember;
  $('navAuth').textContent = user ? 'Abmelden' : 'Anmelden';
  $('navAuth').title = user ? 'Angemeldet als ' + (user.email || '') : '';
  $('authSignedOut').hidden = !!user;
  $('authNotMember').hidden = !(user && !isMember);
  if (user && !isMember) { $('authNotMemberEmail').textContent = user.email || ''; }
  if (isMember && !documentsLoaded) { documentsLoaded = true; loadDocuments(); }
  if (!isMember) documentsLoaded = false;
}

function initAuthUi() {
  if (!$('authModal')) return;
  $('navAuth').addEventListener('click', async (e) => {
    e.preventDefault();
    if (auth.currentUser) { await signOut(auth); closeAuthModal(); }
    else openAuthModal();
  });
  $('authClose').addEventListener('click', closeAuthModal);
  $('authModal').addEventListener('click', (e) => { if (e.target === $('authModal')) closeAuthModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuthModal(); });
  $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthError(null);
    try { await signInWithEmailAndPassword(auth, $('authEmail').value.trim(), $('authPassword').value); }
    catch (err) { showAuthError(err); }
  });
  $('authReset').addEventListener('click', async () => {
    const email = $('authEmail').value.trim();
    if (!email) { showAuthError({ code: 'auth/invalid-email' }); $('authEmail').focus(); return; }
    try { await sendPasswordResetEmail(auth, email); showAuthError({ message: 'E-Mail zum Zurücksetzen wurde an ' + email + ' geschickt.' }); $('authError').style.color = 'var(--color-forest)'; }
    catch (err) { $('authError').style.color = ''; showAuthError(err); }
  });
  $('authGoogle').addEventListener('click', async () => {
    showAuthError(null);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { showAuthError(err); }
  });
  $('authSignOut2').addEventListener('click', () => signOut(auth));

  onAuthStateChanged(auth, async (user) => {
    if (!user) { applyMemberState(null, false); return; }
    const member = await isMemberUser(user);
    applyMemberState(user, member);
    if (member) { closeAuthModal(); }
    else { openAuthModal(); }
  });
}

// --- Initialize ---
(async function init() {
  initAuthUi();
  await Promise.all([loadEvents(), loadSections(), loadPeople()]);   // documents load once a member is signed in
})();
