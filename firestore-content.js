/* ============================================
   Gruppe Offene Synode — Dynamic Firestore Content
   ============================================
   Loads events and documents from Firestore and
   renders them into the public site. Handles i18n
   re-rendering on language switch.
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, orderBy }
  from 'https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js';
import { firebaseConfig } from '../../firebase/config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- State ---
let eventsData = [];
let documentsData = [];

// --- Helpers ---
function getLang() {
  // Use I18N if available, fall back to document lang attribute
  if (typeof I18N !== 'undefined' && I18N.getLang) {
    return I18N.getLang();
  }
  return document.documentElement.lang || 'de';
}

function localizedField(doc, field) {
  const lang = getLang();
  return doc[field + '_' + lang] || doc[field + '_de'] || '';
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
  const lang = getLang();
  const msg = lang === 'fr'
    ? 'Le contenu n\'est pas disponible pour le moment.'
    : 'Inhalte sind derzeit nicht verfügbar.';
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
(async function init() {
  // Load content from Firestore
  await Promise.all([loadEvents(), loadDocuments()]);

  // Re-render on language change
  if (typeof I18N !== 'undefined' && I18N.onChange) {
    I18N.onChange(function () {
      renderEvents();
      renderDocuments();
    });
  }
})();
