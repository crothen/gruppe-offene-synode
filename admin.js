/* ============================================
   GOS Admin Portal — Logic
   ============================================
   Firebase CRUD for events, documents, and users.
   Auth via Google Sign-In or email/password.

   BOOTSTRAP — First Admin User:
   1. Sign in once to create your Firebase Auth account
   2. Go to Firebase Console → Firestore Database
   3. Create collection "gos-admins"
   4. Add document with ID = your UID (from Auth → Users)
   5. Fields: email (string), displayName (string),
      role (string: "admin"), createdAt (timestamp: now)
   6. Refresh this admin page — you should now have access.
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js';
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword,
  GoogleAuthProvider, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js';
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-storage.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';

// --- Firebase Init ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1');
const googleProvider = new GoogleAuthProvider();

// --- State ---
let currentUser = null;
let currentAdmin = null;
let currentTab = 'events';
let eventsCache = [];
let docsCache = [];
let usersCache = [];

// --- DOM References ---
const $ = (id) => document.getElementById(id);
const loadingScreen = $('loadingScreen');
const loginScreen = $('loginScreen');
const accessDenied = $('accessDenied');
const dashboard = $('dashboard');
const modal = $('modal');
const modalTitle = $('modalTitle');
const modalBody = $('modalBody');
const toast = $('toast');

// ============================================
// AUTH
// ============================================
function showScreen(screen) {
  [loadingScreen, loginScreen, accessDenied, dashboard].forEach(s => {
    s.style.display = 'none';
  });
  screen.style.display = '';
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    // Check admin status
    try {
      const adminDoc = await getDoc(doc(db, 'gos-admins', user.uid));
      if (adminDoc.exists()) {
        currentAdmin = adminDoc.data();
        $('userDisplay').textContent = user.email;
        showScreen(dashboard);
        loadCurrentTab();
        refreshRequestBadge();
      } else {
        currentAdmin = null;
        showScreen(accessDenied);
      }
    } catch (err) {
      console.error('Admin check failed:', err);
      showScreen(accessDenied);
    }
  } else {
    currentUser = null;
    currentAdmin = null;
    showScreen(loginScreen);
  }
});

// Google Sign-In
$('btnGoogleSignIn').addEventListener('click', async () => {
  try {
    $('loginError').textContent = '';
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error('Google sign-in error:', err);
    $('loginError').textContent = 'Anmeldung fehlgeschlagen: ' + err.message;
  }
});

// Email/Password Sign-In
$('emailLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  $('loginError').textContent = '';

  if (!email || !password) {
    $('loginError').textContent = 'Bitte E-Mail und Passwort eingeben.';
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('Email sign-in error:', err);
    const messages = {
      'auth/invalid-credential': 'Ungültige E-Mail oder Passwort.',
      'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
      'auth/wrong-password': 'Ungültiges Passwort.',
      'auth/too-many-requests': 'Zu viele Versuche. Bitte warten Sie.',
      'auth/invalid-email': 'Ungültige E-Mail-Adresse.'
    };
    $('loginError').textContent = messages[err.code] || 'Anmeldung fehlgeschlagen.';
  }
});

// Logout
$('btnLogout').addEventListener('click', () => signOut(auth));
$('btnLogoutDenied').addEventListener('click', () => signOut(auth));

// ============================================
// TABS
// ============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    // Users tab only for admins
    if (tab === 'users' && (!currentAdmin || currentAdmin.role !== 'admin')) {
      showToast('Nur Administratoren können Benutzer verwalten.', 'error');
      return;
    }

    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    $('panel-' + tab).style.display = '';

    loadCurrentTab();
  });
});

function loadCurrentTab() {
  switch (currentTab) {
    case 'events': loadEvents(); break;
    case 'documents': loadDocuments(); break;
    case 'users': loadUsers(); break;
    case 'texts': loadTexts(); break;
    case 'people': loadPeople(); break;
  }
}

// ============================================
// MODAL
// ============================================
function openModal(title, bodyHtml) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modal.style.display = '';
}

function closeModal() {
  modal.style.display = 'none';
  modalBody.innerHTML = '';
}

$('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// ============================================
// TOAST
// ============================================
let toastTimeout = null;

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast toast-visible';
  if (type === 'error') toast.classList.add('toast-error');
  else if (type === 'success') toast.classList.add('toast-success');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast-visible');
  }, 3000);
}

// ============================================
// CONFIRM DIALOG
// ============================================
function confirmDialog(title, message, opts = {}) {
  const confirmText = opts.confirmText || 'Löschen';
  const confirmClass = opts.primary ? 'btn-primary' : 'btn-danger';
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <h4>${escHtml(title)}</h4>
        <p>${escHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn-secondary" data-action="cancel">Abbrechen</button>
          <button class="${confirmClass}" data-action="confirm">${confirmText}</button>
        </div>
      </div>`;

    overlay.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'confirm') { overlay.remove(); resolve(true); }
      else if (action === 'cancel' || e.target === overlay) { overlay.remove(); resolve(false); }
    });

    document.body.appendChild(overlay);
  });
}

// ============================================
// EVENTS CRUD
// ============================================
async function loadEvents() {
  const list = $('eventsList');
  list.innerHTML = '<div class="items-loading"><div class="spinner"></div></div>';

  try {
    const q = query(collection(db, 'gos-events'), orderBy('order'));
    const snapshot = await getDocs(q);
    eventsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderEventsList();
  } catch (err) {
    console.error('Load events error:', err);
    list.innerHTML = '<div class="items-empty">Fehler beim Laden der Termine.</div>';
  }
}

function renderEventsList() {
  const list = $('eventsList');

  if (eventsCache.length === 0) {
    list.innerHTML = '<div class="items-empty">Keine Termine vorhanden.</div>';
    return;
  }

  const badgeLabels = { gos: 'GOS', synode: 'Synode' };

  list.innerHTML = eventsCache.map(ev => `
    <div class="item-card" data-id="${ev.id}">
      <div class="item-order">${ev.order || ''}</div>
      <div class="item-info">
        <h4>${escHtml(ev.title_de || '')}</h4>
        <div class="item-info-meta">
          <span class="item-badge ${ev.badgeClass || 'badge-gos'}">${badgeLabels[ev.category] || ev.category || ''}</span>
          <span>${escHtml(ev.dateDisplay || '')} ${escHtml(ev.month_de || '')}</span>
        </div>
      </div>
      <div class="item-actions">
        <label class="visibility-toggle" title="${ev.visible ? 'Sichtbar' : 'Versteckt'}">
          <input type="checkbox" ${ev.visible ? 'checked' : ''} data-action="toggle-visibility" data-id="${ev.id}">
          <span class="toggle-slider"></span>
        </label>
        <button class="btn-icon" data-action="edit-event" data-id="${ev.id}" title="Bearbeiten">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon btn-icon-danger" data-action="delete-event" data-id="${ev.id}" title="Löschen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Event delegation
  list.onclick = async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'toggle-visibility') {
      const visible = btn.checked;
      try {
        await updateDoc(doc(db, 'gos-events', id), { visible });
        const ev = eventsCache.find(e => e.id === id);
        if (ev) ev.visible = visible;
        showToast(visible ? 'Termin sichtbar' : 'Termin versteckt');
      } catch (err) {
        showToast('Fehler: ' + err.message, 'error');
        btn.checked = !visible;
      }
    } else if (action === 'edit-event') {
      const ev = eventsCache.find(e => e.id === id);
      if (ev) showEventForm(ev);
    } else if (action === 'delete-event') {
      const ev = eventsCache.find(e => e.id === id);
      const confirmed = await confirmDialog('Termin löschen', `"${ev?.title_de || ''}" wirklich löschen?`);
      if (confirmed) {
        try {
          await deleteDoc(doc(db, 'gos-events', id));
          showToast('Termin gelöscht');
          loadEvents();
        } catch (err) {
          showToast('Fehler: ' + err.message, 'error');
        }
      }
    }
  };
}

$('btnAddEvent').addEventListener('click', () => showEventForm(null));

function showEventForm(event) {
  const isEdit = !!event;
  const title = isEdit ? 'Termin bearbeiten' : 'Neuer Termin';

  openModal(title, `
    <form id="eventForm">
      <div class="form-row-half">
        <div class="form-row">
          <label for="ef-dateDisplay">Datumsanzeige</label>
          <input type="text" id="ef-dateDisplay" placeholder="z.B. 14. oder 2.–3." value="${escAttr(event?.dateDisplay || '')}" required>
        </div>
        <div class="form-row">
          <label for="ef-dateSort">Sortierdatum</label>
          <input type="date" id="ef-dateSort" value="${escAttr(event?.dateSort || '')}" required>
        </div>
      </div>
      <div class="form-row-half">
        <div class="form-row">
          <label for="ef-category">Kategorie</label>
          <select id="ef-category" required>
            <option value="gos" ${event?.category === 'gos' ? 'selected' : ''}>GOS</option>
            <option value="synode" ${event?.category === 'synode' ? 'selected' : ''}>Synode</option>
          </select>
        </div>
        <div class="form-row">
          <label for="ef-badgeClass">Badge-Stil</label>
          <select id="ef-badgeClass" required>
            <option value="badge-gos" ${event?.badgeClass === 'badge-gos' ? 'selected' : ''}>GOS (grün)</option>
            <option value="badge-spring" ${event?.badgeClass === 'badge-spring' ? 'selected' : ''}>Frühling (olive)</option>
            <option value="badge-dialogue" ${event?.badgeClass === 'badge-dialogue' ? 'selected' : ''}>Gespräch (gold)</option>
            <option value="badge-autumn" ${event?.badgeClass === 'badge-autumn' ? 'selected' : ''}>Herbst (braun)</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <label for="ef-title_de">Titel</label>
        <input type="text" id="ef-title_de" value="${escAttr(event?.title_de || '')}" required>
      </div>
      <div class="form-row">
        <label for="ef-description_de">Beschreibung</label>
        <textarea id="ef-description_de" rows="3">${escHtml(event?.description_de || '')}</textarea>
      </div>
      <div class="form-row-half">
        <div class="form-row">
          <label for="ef-month_de">Monat</label>
          <input type="text" id="ef-month_de" placeholder="z.B. März 2026" value="${escAttr(event?.month_de || '')}">
        </div>
      </div>
      <div class="form-row-half">
        <div class="form-row">
          <label for="ef-order">Reihenfolge</label>
          <input type="number" id="ef-order" min="0" value="${event?.order ?? (eventsCache.length + 1)}">
        </div>
        <div class="form-row">
          <div class="form-toggle" style="margin-top:1.6rem">
            <label class="visibility-toggle">
              <input type="checkbox" id="ef-visible" ${event?.visible !== false ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <label for="ef-visible">Sichtbar</label>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="document.getElementById('modal').style.display='none'">Abbrechen</button>
        <button type="submit" class="btn-primary">${isEdit ? 'Speichern' : 'Erstellen'}</button>
      </div>
    </form>
  `);

  $('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      dateDisplay: $('ef-dateDisplay').value.trim(),
      dateSort: $('ef-dateSort').value,
      category: $('ef-category').value,
      badgeClass: $('ef-badgeClass').value,
      title_de: $('ef-title_de').value.trim(),
      description_de: $('ef-description_de').value.trim(),
      month_de: $('ef-month_de').value.trim(),
      order: parseInt($('ef-order').value) || 0,
      visible: $('ef-visible').checked
    };

    try {
      if (isEdit) {
        await updateDoc(doc(db, 'gos-events', event.id), data);
        showToast('Termin aktualisiert');
      } else {
        await addDoc(collection(db, 'gos-events'), data);
        showToast('Termin erstellt');
      }
      closeModal();
      loadEvents();
    } catch (err) {
      showToast('Fehler: ' + err.message, 'error');
    }
  });
}

// ============================================
// DOCUMENTS CRUD
// ============================================
async function loadDocuments() {
  const list = $('docsList');
  list.innerHTML = '<div class="items-loading"><div class="spinner"></div></div>';

  try {
    const q = query(collection(db, 'gos-documents'), orderBy('order'));
    const snapshot = await getDocs(q);
    docsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDocumentsList();
  } catch (err) {
    console.error('Load documents error:', err);
    list.innerHTML = '<div class="items-empty">Fehler beim Laden der Dokumente.</div>';
  }
}

function renderDocumentsList() {
  const list = $('docsList');

  if (docsCache.length === 0) {
    list.innerHTML = '<div class="items-empty">Keine Dokumente vorhanden.</div>';
    return;
  }

  list.innerHTML = docsCache.map(d => `
    <div class="item-card" data-id="${d.id}">
      <div class="item-order">${d.order || ''}</div>
      <div class="item-info">
        <h4>${escHtml(d.title_de || '')}</h4>
        <div class="item-info-meta">
          <span class="file-status ${d.fileUrl ? 'has-file' : 'no-file'}">
            ${d.fileUrl ? '📎 ' + escHtml(d.fileName || 'Datei vorhanden') : 'Keine Datei'}
          </span>
        </div>
      </div>
      <div class="item-actions">
        <label class="visibility-toggle" title="${d.visible ? 'Sichtbar' : 'Versteckt'}">
          <input type="checkbox" ${d.visible ? 'checked' : ''} data-action="toggle-doc-visibility" data-id="${d.id}">
          <span class="toggle-slider"></span>
        </label>
        <button class="btn-icon" data-action="edit-doc" data-id="${d.id}" title="Bearbeiten">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon btn-icon-danger" data-action="delete-doc" data-id="${d.id}" title="Löschen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Event delegation
  list.onclick = async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'toggle-doc-visibility') {
      const visible = btn.checked;
      try {
        await updateDoc(doc(db, 'gos-documents', id), { visible });
        const d = docsCache.find(x => x.id === id);
        if (d) d.visible = visible;
        showToast(visible ? 'Dokument sichtbar' : 'Dokument versteckt');
      } catch (err) {
        showToast('Fehler: ' + err.message, 'error');
        btn.checked = !visible;
      }
    } else if (action === 'edit-doc') {
      const d = docsCache.find(x => x.id === id);
      if (d) showDocumentForm(d);
    } else if (action === 'delete-doc') {
      const d = docsCache.find(x => x.id === id);
      const confirmed = await confirmDialog('Dokument löschen', `"${d?.title_de || ''}" wirklich löschen?`);
      if (confirmed) {
        try {
          // Also delete file from storage if exists
          if (d?.fileName) {
            try {
              await deleteObject(ref(storage, 'gos-documents/' + d.fileName));
            } catch (storageErr) {
              console.warn('File deletion failed (may not exist):', storageErr);
            }
          }
          await deleteDoc(doc(db, 'gos-documents', id));
          showToast('Dokument gelöscht');
          loadDocuments();
        } catch (err) {
          showToast('Fehler: ' + err.message, 'error');
        }
      }
    }
  };
}

$('btnAddDoc').addEventListener('click', () => showDocumentForm(null));

function showDocumentForm(document_) {
  const isEdit = !!document_;
  const title = isEdit ? 'Dokument bearbeiten' : 'Neues Dokument';

  openModal(title, `
    <form id="docForm">
      <div class="form-row">
        <label for="df-title_de">Titel</label>
        <input type="text" id="df-title_de" value="${escAttr(document_?.title_de || '')}" required>
      </div>
      <div class="form-row">
        <label for="df-description_de">Beschreibung</label>
        <textarea id="df-description_de" rows="2">${escHtml(document_?.description_de || '')}</textarea>
      </div>
      <div class="form-row-half">
        <div class="form-row">
          <label for="df-meta_de">Meta-Text</label>
          <input type="text" id="df-meta_de" placeholder="z.B. Herunterladen" value="${escAttr(document_?.meta_de || 'Herunterladen')}">
        </div>
      </div>
      <div class="form-row">
        <label>Datei</label>
        <div class="file-upload-area" id="fileUploadArea">
          <div class="upload-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p>Datei auswählen oder hierher ziehen</p>
          <input type="file" id="df-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf">
        </div>
        ${document_?.fileName ? `<div class="file-current">📎 Aktuelle Datei: <strong>${escHtml(document_.fileName)}</strong></div>` : ''}
        <div id="uploadProgress" class="upload-progress" style="display:none">
          <div id="uploadProgressBar" class="upload-progress-bar"></div>
        </div>
      </div>
      <div class="form-row-half">
        <div class="form-row">
          <label for="df-order">Reihenfolge</label>
          <input type="number" id="df-order" min="0" value="${document_?.order ?? (docsCache.length + 1)}">
        </div>
        <div class="form-row">
          <div class="form-toggle" style="margin-top:1.6rem">
            <label class="visibility-toggle">
              <input type="checkbox" id="df-visible" ${document_?.visible !== false ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <label for="df-visible">Sichtbar</label>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="document.getElementById('modal').style.display='none'">Abbrechen</button>
        <button type="submit" class="btn-primary" id="docSubmitBtn">${isEdit ? 'Speichern' : 'Erstellen'}</button>
      </div>
    </form>
  `);

  $('docForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = $('docSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Speichern...';

    const fileInput = $('df-file');
    const file = fileInput.files[0];

    let fileUrl = document_?.fileUrl || '';
    let fileName = document_?.fileName || '';

    // Upload file if selected
    if (file) {
      try {
        const result = await uploadFile(file);
        fileUrl = result.url;
        fileName = result.name;
      } catch (err) {
        showToast('Datei-Upload fehlgeschlagen: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Speichern' : 'Erstellen';
        return;
      }
    }

    const data = {
      title_de: $('df-title_de').value.trim(),
      description_de: $('df-description_de').value.trim(),
      meta_de: $('df-meta_de').value.trim(),
      fileUrl,
      fileName,
      order: parseInt($('df-order').value) || 0,
      visible: $('df-visible').checked
    };

    try {
      if (isEdit) {
        await updateDoc(doc(db, 'gos-documents', document_.id), data);
        showToast('Dokument aktualisiert');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'gos-documents'), data);
        showToast('Dokument erstellt');
      }
      closeModal();
      loadDocuments();
    } catch (err) {
      showToast('Fehler: ' + err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Speichern' : 'Erstellen';
    }
  });
}

// File upload with progress
function uploadFile(file) {
  return new Promise((resolve, reject) => {
    // Generate unique file name to avoid collisions
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageName = `${timestamp}_${safeName}`;

    const storageRef = ref(storage, 'gos-documents/' + storageName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const progressDiv = $('uploadProgress');
    const progressBar = $('uploadProgressBar');
    if (progressDiv) progressDiv.style.display = '';

    uploadTask.on('state_changed',
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (progressBar) progressBar.style.width = pct + '%';
      },
      (error) => {
        if (progressDiv) progressDiv.style.display = 'none';
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          if (progressDiv) progressDiv.style.display = 'none';
          resolve({ url, name: storageName });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// Green badge on the Benutzer tab with the number of open requests (admins only)
async function refreshRequestBadge() {
  const tab = document.querySelector('.tab-btn[data-tab="users"]');
  if (!tab) return;
  let n = 0;
  if (currentAdmin && currentAdmin.role === 'admin') {
    try { n = (await getDocs(query(collection(db, 'gos-requests'), where('status', '==', 'pending')))).size; } catch { n = 0; }
  }
  let badge = tab.querySelector('.tab-badge');
  if (!n) { if (badge) badge.remove(); return; }
  if (!badge) { badge = document.createElement('span'); badge.className = 'tab-badge'; tab.appendChild(badge); }
  badge.textContent = n;
  badge.title = n + ' offene Anfrage' + (n === 1 ? '' : 'n');
}

// ============================================
// USERS: admins (gos-admins, by UID) + members (gos-members, by e-mail)
// ============================================
let membersCache = [];
let requestsCache = [];

async function loadUsers() {
  const list = $('usersList');

  // Only admins can view users
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    list.innerHTML = '<div class="items-empty">Keine Berechtigung.</div>';
    return;
  }

  list.innerHTML = '<div class="items-loading"><div class="spinner"></div></div>';

  try {
    const [admins, members, requests] = await Promise.all([
      getDocs(collection(db, 'gos-admins')),
      getDocs(collection(db, 'gos-members')),
      getDocs(query(collection(db, 'gos-requests'), where('status', '==', 'pending')))
    ]);
    refreshRequestBadge();
    requestsCache = requests.docs.map(d => ({ uid: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
    usersCache = admins.docs.map(d => ({ uid: d.id, ...d.data() }));
    membersCache = members.docs.map(d => ({ email: d.id, ...d.data() }))
      .sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email, 'de'));
    renderUsersList();
  } catch (err) {
    console.error('Load users error:', err);
    list.innerHTML = '<div class="items-empty">Fehler beim Laden der Benutzer.</div>';
  }
}

const TRASH_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</svg>`;

function initialsOf(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function renderUsersList() {
  const list = $('usersList');

  const memberCards = membersCache.length === 0
    ? '<div class="items-empty">Noch keine Mitglieder. Mitglieder sehen nach dem Login den Bereich «Dokumente» auf der Website.</div>'
    : membersCache.map(m => `
      <div class="user-card" data-email="${escAttr(m.email)}">
        <div class="user-avatar">${initialsOf(m.displayName || m.email)}</div>
        <div class="user-info">
          <h4>${escHtml(m.displayName || 'Unbenannt')}</h4>
          <p>${escHtml(m.email)}</p>
        </div>
        <span class="user-role role-member">Mitglied</span>
        <button class="btn-icon" data-action="promote-member" data-email="${escAttr(m.email)}" title="Zum Administrator machen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z"/></svg>
        </button>
        <button class="btn-icon" data-action="reset-member" data-email="${escAttr(m.email)}" title="Passwort-Link senden">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </button>
        <button class="btn-icon btn-icon-danger" data-action="remove-member" data-email="${escAttr(m.email)}" title="Entfernen">${TRASH_SVG}</button>
      </div>`).join('');

  const adminCards = usersCache.map(u => {
    const isCurrentUser = u.uid === currentUser?.uid;
    return `
      <div class="user-card" data-uid="${u.uid}">
        <div class="user-avatar">${initialsOf(u.displayName || u.email)}</div>
        <div class="user-info">
          <h4>${escHtml(u.displayName || 'Unbenannt')}${isCurrentUser ? ' (Sie)' : ''}</h4>
          <p>${escHtml(u.email || '')}</p>
        </div>
        <span class="user-role ${u.role === 'admin' ? 'role-admin' : ''}">${escHtml(u.role || 'editor')}</span>
        ${!isCurrentUser ? `<button class="btn-icon btn-icon-danger" data-action="remove-user" data-uid="${u.uid}" title="Entfernen">${TRASH_SVG}</button>` : ''}
      </div>`;
  }).join('');

  const requestCards = requestsCache.length === 0
    ? '<div class="items-empty">Keine offenen Anfragen.</div>'
    : requestsCache.map(r => `
      <div class="user-card" data-uid="${r.uid}">
        <div class="user-avatar">${initialsOf(r.name || r.email)}</div>
        <div class="user-info">
          <h4>${escHtml(r.name || 'Unbenannt')}</h4>
          <p>${escHtml(r.email)}${r.createdAt?.toDate ? ' · ' + r.createdAt.toDate().toLocaleDateString('de-CH') : ''}</p>
        </div>
        <button class="btn-primary btn-small" data-action="approve-request" data-uid="${r.uid}">Annehmen</button>
        <button class="btn-secondary btn-small" data-action="deny-request" data-uid="${r.uid}">Ablehnen</button>
      </div>`).join('');

  list.innerHTML = `
    <div class="users-group">
      <h3>Anfragen${requestsCache.length ? ' (' + requestsCache.length + ')' : ''}</h3>
      <p class="users-hint">Personen, die über die Website einen Mitgliederzugang beantragt haben. Beim Annehmen wird die E-Mail-Adresse als Mitglied freigeschaltet; die Person erhält in beiden Fällen eine E-Mail.</p>
      ${requestCards}
    </div>
    <div class="users-group">
      <h3>Mitglieder</h3>
      <p class="users-hint">Können sich auf der Website anmelden und sehen die Dokumente. Login mit E-Mail und Passwort oder mit einem Google-Konto derselben E-Mail-Adresse.</p>
      ${memberCards}
    </div>
    <div class="users-group">
      <h3>Administratoren</h3>
      <p class="users-hint">Haben Zugang zu diesem Admin-Portal. Mitglieder können über das Stern-Symbol zu Administratoren gemacht werden.</p>
      ${adminCards}
    </div>`;

  // Event delegation
  list.onclick = async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    if (btn.dataset.action === 'approve-request' || btn.dataset.action === 'deny-request') {
      const uid = btn.dataset.uid;
      const r = requestsCache.find(x => x.uid === uid);
      const approve = btn.dataset.action === 'approve-request';
      const confirmed = await confirmDialog(approve ? 'Anfrage annehmen' : 'Anfrage ablehnen',
        `"${r?.name || r?.email}" ${approve ? 'als Mitglied freischalten' : 'ablehnen'}? Die Person wird per E-Mail informiert.`,
        approve ? { confirmText: 'Annehmen', primary: true } : { confirmText: 'Ablehnen' });
      if (!confirmed) return;
      try {
        if (approve) {
          await setDoc(doc(db, 'gos-members', r.email), { email: r.email, displayName: r.name || '', createdAt: serverTimestamp(), addedBy: currentUser?.email || '', fromRequest: uid });
        }
        await updateDoc(doc(db, 'gos-requests', uid), { status: approve ? 'approved' : 'denied', decidedAt: serverTimestamp(), decidedBy: currentUser?.email || '' });
        showToast(approve ? 'Mitglied freigeschaltet' : 'Anfrage abgelehnt');
        loadUsers();
      } catch (err) { showToast('Fehler: ' + err.message, 'error'); }
      return;
    }

    if (btn.dataset.action === 'remove-user') {
      const uid = btn.dataset.uid;
      const u = usersCache.find(x => x.uid === uid);
      const confirmed = await confirmDialog('Administrator entfernen', `"${u?.displayName || u?.email || ''}" wirklich als Admin entfernen?`, { confirmText: 'Entfernen' });
      if (confirmed) {
        try { await deleteDoc(doc(db, 'gos-admins', uid)); showToast('Administrator entfernt'); loadUsers(); }
        catch (err) { showToast('Fehler: ' + err.message, 'error'); }
      }
    }

    if (btn.dataset.action === 'remove-member') {
      const email = btn.dataset.email;
      const m = membersCache.find(x => x.email === email);
      const confirmed = await confirmDialog('Mitglied entfernen', `"${m?.displayName || email}" wirklich entfernen? Die Person sieht die Dokumente danach nicht mehr.`, { confirmText: 'Entfernen' });
      if (confirmed) {
        try { await deleteDoc(doc(db, 'gos-members', email)); showToast('Mitglied entfernt'); loadUsers(); }
        catch (err) { showToast('Fehler: ' + err.message, 'error'); }
      }
    }

    if (btn.dataset.action === 'promote-member') {
      const email = btn.dataset.email;
      const m = membersCache.find(x => x.email === email);
      const confirmed = await confirmDialog('Zum Administrator machen', `"${m?.displayName || email}" erhält damit Zugang zum Admin-Portal und kann alle Inhalte und Benutzer verwalten.`, { confirmText: 'Zum Admin machen', primary: true });
      if (!confirmed) return;
      try {
        const res = await httpsCallable(functions, 'promoteToAdmin')({ email, role: 'admin' });
        showToast((res.data.displayName || email) + ' ist jetzt Administrator');
        loadUsers();
      } catch (err) { showToast('Fehler: ' + (err.message || err), 'error'); }
      return;
    }

    if (btn.dataset.action === 'reset-member') {
      const email = btn.dataset.email;
      try { await sendPasswordResetEmail(auth, email); showToast('Passwort-Link an ' + email + ' gesendet'); }
      catch (err) { showToast('Fehler: ' + err.message, 'error'); }
    }
  };
}

$('btnAddUser').addEventListener('click', () => showUserForm());
$('btnAddMember').addEventListener('click', () => showMemberForm());

function showMemberForm() {
  openModal('Neues Mitglied', `
    <form id="memberForm">
      <div class="form-row">
        <label for="mf-displayName">Name</label>
        <input type="text" id="mf-displayName" placeholder="Vor- und Nachname" required>
      </div>
      <div class="form-row">
        <label for="mf-email">E-Mail</label>
        <input type="email" id="mf-email" placeholder="mitglied@beispiel.ch" required>
      </div>
      <div class="form-row">
        <label for="mf-password">Start-Passwort (mind. 6 Zeichen)</label>
        <input type="text" id="mf-password" minlength="6" autocomplete="off" placeholder="Wird der Person mitgeteilt">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="document.getElementById('modal').style.display='none'">Abbrechen</button>
        <button type="submit" class="btn-primary">Hinzufügen</button>
      </div>
    </form>
    <p style="margin-top:1rem; font-size:0.82rem; color:var(--color-text-muted);">
      Mit Start-Passwort wird ein Login-Konto erstellt; die Person kann das Passwort über «Passwort vergessen?» jederzeit selbst ändern.
      Ohne Passwort wird nur die E-Mail-Adresse freigeschaltet (Login dann mit Google-Konto oder bestehendem Konto).
    </p>
  `);

  $('memberForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('mf-email').value.trim().toLowerCase();
    const displayName = $('mf-displayName').value.trim();
    const password = $('mf-password').value;
    const submitBtn = e.target.querySelector('button[type=submit]');
    submitBtn.disabled = true;

    try {
      let note = '';
      if (password) {
        // Create the login account in a second app instance so the admin stays signed in here.
        const secondary = initializeApp(firebaseConfig, 'member-signup-' + Date.now());
        try {
          await createUserWithEmailAndPassword(getAuth(secondary), email, password);
          await signOut(getAuth(secondary));
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') note = ' (Konto bestand schon, Passwort unverändert)';
          else throw err;
        }
      }
      await setDoc(doc(db, 'gos-members', email), {
        email, displayName, createdAt: serverTimestamp(), addedBy: currentUser?.email || ''
      });
      showToast('Mitglied hinzugefügt' + note);
      closeModal();
      loadUsers();
    } catch (err) {
      showToast('Fehler: ' + err.message, 'error');
      submitBtn.disabled = false;
    }
  });
}

function showUserForm() {
  openModal('Neuer Administrator', `
    <form id="userForm">
      <div class="form-row">
        <label for="uf-uid">Firebase Auth UID</label>
        <input type="text" id="uf-uid" placeholder="User UID aus Firebase Authentication" required>
      </div>
      <div class="form-row">
        <label for="uf-email">E-Mail</label>
        <input type="email" id="uf-email" placeholder="benutzer@beispiel.ch" required>
      </div>
      <div class="form-row">
        <label for="uf-displayName">Anzeigename</label>
        <input type="text" id="uf-displayName" placeholder="Vor- und Nachname" required>
      </div>
      <div class="form-row">
        <label for="uf-role">Rolle</label>
        <select id="uf-role" required>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="document.getElementById('modal').style.display='none'">Abbrechen</button>
        <button type="submit" class="btn-primary">Hinzufügen</button>
      </div>
    </form>
    <p style="margin-top:1rem; font-size:0.82rem; color:var(--color-text-muted);">
      <strong>Hinweis:</strong> Der Benutzer muss sich zuerst einmal über die
      Admin-Seite anmelden (Google oder E-Mail), damit ein Firebase Auth-Konto erstellt wird.
      Die UID finden Sie in der Firebase Console unter Authentication → Users.
    </p>
  `);

  $('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const uid = $('uf-uid').value.trim();
    const data = {
      email: $('uf-email').value.trim(),
      displayName: $('uf-displayName').value.trim(),
      role: $('uf-role').value,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'gos-admins', uid), data);
      showToast('Administrator hinzugefügt');
      closeModal();
      loadUsers();
    } catch (err) {
      showToast('Fehler: ' + err.message, 'error');
    }
  });
}

// ============================================
// TEXTS (gos-content/sections)
// ============================================
const TEXT_FIELDS = ['who_text', 'who_quote', 'goals_text', 'goals_quote', 'how_text', 'how_quote'];

async function loadTexts() {
  try {
    const snap = await getDoc(doc(db, 'gos-content', 'sections'));
    const d = snap.exists() ? snap.data() : {};
    TEXT_FIELDS.forEach(f => { $('tf-' + f).value = d[f] || ''; });
  } catch (err) {
    showToast('Fehler beim Laden der Texte: ' + err.message, 'error');
  }
}

$('btnSaveTexts').addEventListener('click', async () => {
  const data = { updatedAt: serverTimestamp(), updatedBy: currentUser?.email || '' };
  TEXT_FIELDS.forEach(f => { data[f] = $('tf-' + f).value.trim(); });
  try {
    await setDoc(doc(db, 'gos-content', 'sections'), data, { merge: true });
    showToast('Texte gespeichert');
  } catch (err) {
    showToast('Fehler: ' + err.message, 'error');
  }
});

// ============================================
// PEOPLE CRUD (gos-people)
// ============================================
let peopleCache = [];

async function loadPeople() {
  const list = $('peopleList');
  list.innerHTML = '<div class="items-loading"><div class="spinner"></div></div>';
  try {
    const snapshot = await getDocs(query(collection(db, 'gos-people'), orderBy('order')));
    peopleCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPeopleList();
  } catch (err) {
    console.error('Load people error:', err);
    list.innerHTML = '<div class="items-empty">Fehler beim Laden.</div>';
  }
}

function renderPeopleList() {
  const list = $('peopleList');
  if (peopleCache.length === 0) {
    list.innerHTML = '<div class="items-empty">Noch keine Personen erfasst.</div>';
    return;
  }
  list.innerHTML = peopleCache.map(p => `
    <div class="item-card" data-id="${p.id}">
      <div class="item-order">${p.order || ''}</div>
      <div class="item-info">
        <h4>${escHtml(p.name || '')}</h4>
        <div class="item-info-meta">
          <span>${escHtml(p.role || '')}</span>
          ${p.email ? `<span>· ${escHtml(p.email)}</span>` : ''}
          ${p.phone ? `<span>· ${escHtml(p.phone)}</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        <label class="visibility-toggle" title="${p.visible ? 'Sichtbar' : 'Versteckt'}">
          <input type="checkbox" ${p.visible ? 'checked' : ''} data-action="toggle-person" data-id="${p.id}">
          <span class="toggle-slider"></span>
        </label>
        <button class="btn-icon" data-action="edit-person" data-id="${p.id}" title="Bearbeiten">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-icon btn-icon-danger" data-action="delete-person" data-id="${p.id}" title="Löschen">${TRASH_SVG}</button>
      </div>
    </div>`).join('');

  list.onclick = async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const p = peopleCache.find(x => x.id === id);
    if (btn.dataset.action === 'toggle-person') {
      const visible = btn.checked;
      try { await updateDoc(doc(db, 'gos-people', id), { visible }); if (p) p.visible = visible; showToast(visible ? 'Sichtbar' : 'Versteckt'); }
      catch (err) { showToast('Fehler: ' + err.message, 'error'); btn.checked = !visible; }
    } else if (btn.dataset.action === 'edit-person') {
      if (p) showPersonForm(p);
    } else if (btn.dataset.action === 'delete-person') {
      if (await confirmDialog('Person löschen', `"${p?.name || ''}" wirklich löschen?`)) {
        try { await deleteDoc(doc(db, 'gos-people', id)); showToast('Gelöscht'); loadPeople(); }
        catch (err) { showToast('Fehler: ' + err.message, 'error'); }
      }
    }
  };
}

$('btnAddPerson').addEventListener('click', () => showPersonForm(null));

function showPersonForm(person) {
  const isEdit = !!person;
  const nextOrder = peopleCache.reduce((m, p) => Math.max(m, Number(p.order) || 0), 0) + 1;
  openModal(isEdit ? 'Person bearbeiten' : 'Neue Person', `
    <form id="personForm">
      <div class="form-row">
        <label for="pf-name">Name</label>
        <input type="text" id="pf-name" value="${escAttr(person?.name || '')}" required>
      </div>
      <div class="form-row">
        <label for="pf-role">Rolle / Funktion</label>
        <input type="text" id="pf-role" placeholder="z.B. Fraktionspräsident, Synodale Region Jura" value="${escAttr(person?.role || '')}">
      </div>
      <div class="form-row">
        <label for="pf-email">E-Mail</label>
        <input type="email" id="pf-email" value="${escAttr(person?.email || '')}">
      </div>
      <div class="form-row">
        <label for="pf-phone">Telefon</label>
        <input type="tel" id="pf-phone" placeholder="z.B. 031 123 45 67" value="${escAttr(person?.phone || '')}">
      </div>
      <div class="form-row">
        <label for="pf-text">Kurztext</label>
        <textarea id="pf-text" rows="3">${escHtml(person?.text || '')}</textarea>
      </div>
      <div class="form-row-half">
        <div class="form-row">
          <label for="pf-order">Reihenfolge</label>
          <input type="number" id="pf-order" value="${person?.order ?? nextOrder}">
        </div>
        <div class="form-row">
          <label class="checkbox-label"><input type="checkbox" id="pf-visible" ${person?.visible !== false ? 'checked' : ''}> Sichtbar</label>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="document.getElementById('modal').style.display='none'">Abbrechen</button>
        <button type="submit" class="btn-primary">${isEdit ? 'Speichern' : 'Erstellen'}</button>
      </div>
    </form>`);

  $('personForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: $('pf-name').value.trim(),
      role: $('pf-role').value.trim(),
      email: $('pf-email').value.trim(),
      phone: $('pf-phone').value.trim(),
      text: $('pf-text').value.trim(),
      order: parseInt($('pf-order').value) || 0,
      visible: $('pf-visible').checked
    };
    try {
      if (isEdit) { await updateDoc(doc(db, 'gos-people', person.id), data); showToast('Person aktualisiert'); }
      else { await addDoc(collection(db, 'gos-people'), data); showToast('Person erstellt'); }
      closeModal();
      loadPeople();
    } catch (err) {
      showToast('Fehler: ' + err.message, 'error');
    }
  });
}

// ============================================
// UTILITY
// ============================================
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
