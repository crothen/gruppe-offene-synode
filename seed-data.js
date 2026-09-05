/* ============================================
   GOS Firestore Seed Script
   ============================================
   Run this ONCE to populate Firestore with the
   existing hardcoded events and documents.

   USAGE:
   1. Open the GOS admin page (admin.html) or
      the main site (index.html) in your browser
   2. Open the browser console (F12 → Console)
   3. Paste this entire file and press Enter
   4. Wait for "Seeding complete!" message

   BOOTSTRAP — First Admin User:
   Before running this seed script, you must manually
   create the first admin entry in Firestore:

   1. Go to https://console.firebase.google.com
   2. Select project "web-sandbox-crothen"
   3. Go to Firestore Database
   4. Create collection "gos-admins"
   5. Add a document with ID = your Firebase Auth UID
      Fields:
        email (string): your-email@example.com
        displayName (string): Your Name
        role (string): admin
        createdAt (timestamp): now

   To find your UID:
   - Go to Firebase Console → Authentication → Users
   - Sign in once via the admin page to create your account
   - Copy your UID from the Authentication users list
   ============================================ */

(async function seedFirestore() {
  'use strict';

  // Dynamic imports from Firebase CDN
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js');
  const { getFirestore, collection, addDoc, serverTimestamp } =
    await import('https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js');

  const firebaseConfig = {
    apiKey: "AIzaSyDdwhb53zDuh18aOJKA0j5y-_Xx1SPIyrs",
    authDomain: "gruppe-offene-synode.firebaseapp.com",
    projectId: "gruppe-offene-synode",
    storageBucket: "gruppe-offene-synode.firebasestorage.app",
    messagingSenderId: "283371158939",
    appId: "1:283371158939:web:9820dcc989a77b336f753e"
  };

  const app = initializeApp(firebaseConfig, 'seed');
  const db = getFirestore(app);

  // --- Events Data ---
  const events = [
    {
      dateDisplay: "14.",
      dateSort: "2026-03-14",
      category: "gos",
      badgeClass: "badge-gos",
      title_de: "Fraktionssitzung",
      title_fr: "Réunion de fraction",
      description_de: "Interne Sitzung der Gruppe Offene Synode. Vorbereitung der Frühlingssession und Besprechung aktueller Traktanden.",
      description_fr: "Séance interne du Groupe Synode Ouverte. Préparation de la session de printemps et discussion des tractanda actuels.",
      month_de: "März 2026",
      month_fr: "mars 2026",
      order: 1,
      visible: true
    },
    {
      dateDisplay: "2.–3.",
      dateSort: "2026-06-02",
      category: "synode",
      badgeClass: "badge-spring",
      title_de: "Ordentliche Frühlingssession",
      title_fr: "Session ordinaire de printemps",
      description_de: "Zweitägige ordentliche Session der Synode der Reformierten Kirchen Bern-Jura-Solothurn. Traktanden werden vorgängig publiziert.",
      description_fr: "Session ordinaire de deux jours du Synode des Églises réformées Berne-Jura-Soleure. Les tractanda sont publiés au préalable.",
      month_de: "Juni 2026",
      month_fr: "juin 2026",
      order: 2,
      visible: true
    },
    {
      dateDisplay: "27.",
      dateSort: "2026-06-27",
      category: "gos",
      badgeClass: "badge-gos",
      title_de: "Fraktionsausflug",
      title_fr: "Excursion de fraction",
      description_de: "Gemeinsamer Ausflug nach Adelboden mit Besuch der Kirche Adelboden. Ein Tag für Begegnung und Austausch ausserhalb des Sitzungsraums — im Herzen des Berner Oberlandes.",
      description_fr: "Excursion commune à Adelboden avec visite de l'église d'Adelboden. Une journée de rencontre et d'échange en dehors de la salle de réunion — au cœur de l'Oberland bernois.",
      month_de: "Juni 2026",
      month_fr: "juin 2026",
      order: 3,
      visible: true
    },
    {
      dateDisplay: "22.",
      dateSort: "2026-08-22",
      category: "gos",
      badgeClass: "badge-gos",
      title_de: "Fraktionssitzung",
      title_fr: "Réunion de fraction",
      description_de: "Vorbereitung der Gesprächssynode und der Herbstsession. Thematische Schwerpunkte und Positionierung.",
      description_fr: "Préparation du synode de discussion et de la session d'automne. Priorités thématiques et positionnement.",
      month_de: "August 2026",
      month_fr: "août 2026",
      order: 4,
      visible: true
    },
    {
      dateDisplay: "8.",
      dateSort: "2026-09-08",
      category: "synode",
      badgeClass: "badge-dialogue",
      title_de: "Gesprächssynode",
      title_fr: "Synode de discussion",
      description_de: "Die Gesprächssynode bietet Raum für vertieften Austausch zu aktuellen kirchlichen und gesellschaftlichen Themen — ohne Abstimmungsdruck.",
      description_fr: "Le synode de discussion offre un espace d'échange approfondi sur des thèmes ecclésiastiques et sociétaux actuels — sans pression de vote.",
      month_de: "September 2026",
      month_fr: "septembre 2026",
      order: 5,
      visible: true
    },
    {
      dateDisplay: "17.–18.",
      dateSort: "2026-11-17",
      category: "synode",
      badgeClass: "badge-autumn",
      title_de: "Ordentliche Herbstsession",
      title_fr: "Session ordinaire d'automne",
      description_de: "Zweitägige ordentliche Herbstsession mit Budget-Beratungen und weiteren Geschäften der Synode.",
      description_fr: "Session ordinaire d'automne de deux jours avec délibérations budgétaires et autres affaires du Synode.",
      month_de: "November 2026",
      month_fr: "novembre 2026",
      order: 6,
      visible: true
    },
    {
      dateDisplay: "5.",
      dateSort: "2026-12-05",
      category: "gos",
      badgeClass: "badge-gos",
      title_de: "Jahresrückblick & Planung",
      title_fr: "Bilan annuel & planification",
      description_de: "Rückblick auf das vergangene Jahr und gemeinsame Planung der Schwerpunkte für 2027.",
      description_fr: "Rétrospective de l'année écoulée et planification commune des priorités pour 2027.",
      month_de: "Dezember 2026",
      month_fr: "décembre 2026",
      order: 7,
      visible: true
    }
  ];

  // --- Documents Data ---
  const documents = [
    {
      title_de: "Informationsblatt GOS",
      title_fr: "Fiche d'information GOS",
      description_de: "Kurzportrait und Grundsätze der Gruppe Offene Synode",
      description_fr: "Portrait et principes du Groupe Synode Ouverte",
      meta_de: "PDF · Herunterladen",
      meta_fr: "PDF · Télécharger",
      fileUrl: "",
      fileName: "",
      order: 1,
      visible: true,
      createdAt: serverTimestamp()
    },
    {
      title_de: "Sessionsbericht Herbst 2025",
      title_fr: "Rapport de session automne 2025",
      description_de: "Zusammenfassung der Herbstsession und Beschlüsse",
      description_fr: "Résumé de la session d'automne et décisions",
      meta_de: "PDF · Herunterladen",
      meta_fr: "PDF · Télécharger",
      fileUrl: "",
      fileName: "",
      order: 2,
      visible: true,
      createdAt: serverTimestamp()
    }
  ];

  // --- Seed Events ---
  console.log('Seeding events...');
  for (const event of events) {
    const ref = await addDoc(collection(db, 'gos-events'), event);
    console.log(`  ✓ Event "${event.title_de}" → ${ref.id}`);
  }

  // --- Seed Documents ---
  console.log('Seeding documents...');
  for (const doc of documents) {
    const ref = await addDoc(collection(db, 'gos-documents'), doc);
    console.log(`  ✓ Document "${doc.title_de}" → ${ref.id}`);
  }

  console.log('\n✅ Seeding complete! Refresh the page to see dynamic content.');
})();
