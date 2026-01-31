/* ============================================
   Gruppe Offene Synode — Internationalisation
   ============================================ */

var I18N = (function () {
  'use strict';

  var translations = {
    de: {
      // Nav
      'nav.about':        'Über uns',
      'nav.dates':        'Termine',
      'nav.documents':    'Dokumente',
      'nav.contact':      'Kontakt',

      // Hero
      'hero.eyebrow':     'Synode der Reformierten Kirchen Bern-Jura-Solothurn',
      'hero.title':       'Gruppe Offene Synode',
      'hero.tagline':     'Für Gerechtigkeit und Vielfalt',
      'hero.intro':       'Als jüngste Fraktion in der Synode setzen wir uns ein für Gerechtigkeit, Frieden und die Bewahrung der Schöpfung. Wir stehen für eine offene, solidarische Kirche, die allen Menschen Gehör schenkt.',
      'hero.cta':         'Mehr erfahren',

      // About
      'about.title':      'Über uns',
      'about.subtitle':   'Die Gruppe Offene Synode vertritt rund 200 Mitglieder in der Synode der Reformierten Kirchen Bern-Jura-Solothurn. Unsere Arbeit ruht auf drei Pfeilern.',
      'about.c1.title':   'Für Gerechtigkeit und Vielfalt',
      'about.c1.text':    'Wir setzen uns ein für Gerechtigkeit, Frieden und die Bewahrung der Schöpfung. Als offene Fraktion fördern wir den Dialog innerhalb der Kirche und mit anderen christlichen Gemeinschaften. Vielfalt verstehen wir als Bereicherung und Auftrag.',
      'about.c2.title':   'Stimme für Benachteiligte',
      'about.c2.text':    'Wir erheben unsere Stimme für jene, die oft überhört werden: Frauen, Erwerbslose, sozial Schwache. Wir unterstützen die kirchliche Entwicklungszusammenarbeit und engagieren uns für eine Kirche, die Solidarität nicht nur predigt, sondern lebt.',
      'about.c3.title':   'Verantwortung in Gemeinschaft',
      'about.c3.text':    'Gemeinschaft bedeutet Verantwortung — füreinander und für die Welt. Wir fördern den ökumenischen Dialog, stärken die Zusammenarbeit zwischen den Kirchgemeinden und setzen uns für eine zukunftsfähige, weltoffene reformierte Kirche ein.',

      // Termine
      'dates.title':      'Termine 2026',
      'dates.subtitle':   'Übersicht der Synodetermine und GOS-internen Anlässe.',
      'filter.all':       'Alle',
      // Event 1
      'ev1.month':        'März 2026',
      'ev1.title':        'Fraktionssitzung',
      'ev1.text':         'Interne Sitzung der Gruppe Offene Synode. Vorbereitung der Frühlingssession und Besprechung aktueller Traktanden.',
      // Event 2
      'ev2.month':        'Juni 2026',
      'ev2.title':        'Ordentliche Frühlingssession',
      'ev2.text':         'Zweitägige ordentliche Session der Synode der Reformierten Kirchen Bern-Jura-Solothurn. Traktanden werden vorgängig publiziert.',
      // Event Ausflug
      'ev_ausflug.month': 'Juni 2026',
      'ev_ausflug.title': 'Fraktionsausflug',
      'ev_ausflug.text':  'Gemeinsamer Ausflug nach Adelboden mit Besuch der Kirche Adelboden. Ein Tag für Begegnung und Austausch ausserhalb des Sitzungsraums — im Herzen des Berner Oberlandes.',
      // Event 3
      'ev3.month':        'August 2026',
      'ev3.title':        'Fraktionssitzung',
      'ev3.text':         'Vorbereitung der Gesprächssynode und der Herbstsession. Thematische Schwerpunkte und Positionierung.',
      // Event 4
      'ev4.month':        'September 2026',
      'ev4.title':        'Gesprächssynode',
      'ev4.text':         'Die Gesprächssynode bietet Raum für vertieften Austausch zu aktuellen kirchlichen und gesellschaftlichen Themen — ohne Abstimmungsdruck.',
      // Event 5
      'ev5.month':        'November 2026',
      'ev5.title':        'Ordentliche Herbstsession',
      'ev5.text':         'Zweitägige ordentliche Herbstsession mit Budget-Beratungen und weiteren Geschäften der Synode.',
      // Event 6
      'ev6.month':        'Dezember 2026',
      'ev6.title':        'Jahresrückblick & Planung',
      'ev6.text':         'Rückblick auf das vergangene Jahr und gemeinsame Planung der Schwerpunkte für 2027.',

      // Documents
      'docs.title':       'Dokumente',
      'docs.subtitle':    'Hier finden Sie Publikationen, Informationsblätter und weitere Unterlagen der Gruppe Offene Synode zum Herunterladen.',
      'doc1.title':       'Informationsblatt GOS',
      'doc1.desc':        'Kurzportrait und Grundsätze der Gruppe Offene Synode',
      'doc1.meta':        'PDF · Herunterladen',
      'doc2.title':       'Sessionsbericht Herbst 2025',
      'doc2.desc':        'Zusammenfassung der Herbstsession und Beschlüsse',
      'doc2.meta':        'PDF · Herunterladen',

      // Contact
      'contact.title':    'Kontakt',
      'contact.subtitle': 'Haben Sie Fragen oder Anregungen? Wir freuen uns auf Ihre Nachricht.',
      'form.name':        'Name',
      'form.email':       'E-Mail',
      'form.message':     'Nachricht',
      'form.name.ph':     'Ihr Name',
      'form.email.ph':    'ihre.email@beispiel.ch',
      'form.message.ph':  'Ihre Nachricht an uns...',
      'form.name.err':    'Bitte geben Sie Ihren Namen ein.',
      'form.email.err':   'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      'form.message.err': 'Bitte geben Sie eine Nachricht ein.',
      'form.submit':      'Nachricht senden',
      'contact.pres':     'Fraktionspräsident',
      'contact.synodalrat':'Vertreter im Synodalrat',
      'contact.church':   'Reformierte Kirchen Bern-Jura-Solothurn',

      // Footer
      'footer.name':      '✦ Gruppe Offene Synode',
      'footer.desc':      'Fraktion der Synode der Reformierten Kirchen Bern-Jura-Solothurn',
      'footer.copy':      '© 2025 Gruppe Offene Synode. Alle Rechte vorbehalten.',

      // Meta
      'meta.desc':        'Gruppe Offene Synode (GOS) – Fraktion der Synode der Reformierten Kirchen Bern-Jura-Solothurn. Für Gerechtigkeit, Frieden und Bewahrung der Schöpfung.',
      'meta.title':       'Gruppe Offene Synode (GOS) – Für Gerechtigkeit und Vielfalt'
    },

    fr: {
      // Nav
      'nav.about':        'À propos',
      'nav.dates':        'Dates',
      'nav.documents':    'Documents',
      'nav.contact':      'Contact',

      // Hero
      'hero.eyebrow':     'Synode des Églises réformées Berne-Jura-Soleure',
      'hero.title':       'Groupe Synode Ouverte',
      'hero.tagline':     'Pour la justice et la diversité',
      'hero.intro':       'En tant que plus jeune fraction du Synode, nous nous engageons pour la justice, la paix et la sauvegarde de la Création. Nous défendons une Église ouverte et solidaire, à l\'écoute de toutes et tous.',
      'hero.cta':         'En savoir plus',

      // About
      'about.title':      'À propos',
      'about.subtitle':   'Le Groupe Synode Ouverte représente environ 200 membres au sein du Synode des Églises réformées Berne-Jura-Soleure. Notre travail repose sur trois piliers.',
      'about.c1.title':   'Pour la justice et la diversité',
      'about.c1.text':    'Nous nous engageons pour la justice, la paix et la sauvegarde de la Création. En tant que fraction ouverte, nous favorisons le dialogue au sein de l\'Église et avec d\'autres communautés chrétiennes. La diversité est pour nous une richesse et une mission.',
      'about.c2.title':   'Voix des défavorisés',
      'about.c2.text':    'Nous élevons notre voix pour celles et ceux qui sont souvent ignorés : femmes, personnes sans emploi, personnes socialement défavorisées. Nous soutenons la coopération ecclésiale au développement et nous engageons pour une Église qui ne se contente pas de prêcher la solidarité, mais la vit.',
      'about.c3.title':   'Responsabilité communautaire',
      'about.c3.text':    'La communauté implique la responsabilité — les uns envers les autres et envers le monde. Nous encourageons le dialogue œcuménique, renforçons la collaboration entre les paroisses et œuvrons pour une Église réformée tournée vers l\'avenir et ouverte sur le monde.',

      // Termine
      'dates.title':      'Dates 2026',
      'dates.subtitle':   'Aperçu des sessions du Synode et des événements internes du GOS.',
      'filter.all':       'Tous',
      // Event 1
      'ev1.month':        'mars 2026',
      'ev1.title':        'Réunion de fraction',
      'ev1.text':         'Séance interne du Groupe Synode Ouverte. Préparation de la session de printemps et discussion des tractanda actuels.',
      // Event 2
      'ev2.month':        'juin 2026',
      'ev2.title':        'Session ordinaire de printemps',
      'ev2.text':         'Session ordinaire de deux jours du Synode des Églises réformées Berne-Jura-Soleure. Les tractanda sont publiés au préalable.',
      // Event Ausflug
      'ev_ausflug.month': 'juin 2026',
      'ev_ausflug.title': 'Excursion de fraction',
      'ev_ausflug.text':  'Excursion commune à Adelboden avec visite de l\'église d\'Adelboden. Une journée de rencontre et d\'échange en dehors de la salle de réunion — au cœur de l\'Oberland bernois.',
      // Event 3
      'ev3.month':        'août 2026',
      'ev3.title':        'Réunion de fraction',
      'ev3.text':         'Préparation du synode de discussion et de la session d\'automne. Priorités thématiques et positionnement.',
      // Event 4
      'ev4.month':        'septembre 2026',
      'ev4.title':        'Synode de discussion',
      'ev4.text':         'Le synode de discussion offre un espace d\'échange approfondi sur des thèmes ecclésiastiques et sociétaux actuels — sans pression de vote.',
      // Event 5
      'ev5.month':        'novembre 2026',
      'ev5.title':        'Session ordinaire d\'automne',
      'ev5.text':         'Session ordinaire d\'automne de deux jours avec délibérations budgétaires et autres affaires du Synode.',
      // Event 6
      'ev6.month':        'décembre 2026',
      'ev6.title':        'Bilan annuel & planification',
      'ev6.text':         'Rétrospective de l\'année écoulée et planification commune des priorités pour 2027.',

      // Documents
      'docs.title':       'Documents',
      'docs.subtitle':    'Vous trouverez ici les publications, fiches d\'information et autres documents du Groupe Synode Ouverte à télécharger.',
      'doc1.title':       'Fiche d\'information GOS',
      'doc1.desc':        'Portrait et principes du Groupe Synode Ouverte',
      'doc1.meta':        'PDF · Télécharger',
      'doc2.title':       'Rapport de session automne 2025',
      'doc2.desc':        'Résumé de la session d\'automne et décisions',
      'doc2.meta':        'PDF · Télécharger',

      // Contact
      'contact.title':    'Contact',
      'contact.subtitle': 'Vous avez des questions ou des suggestions ? Nous nous réjouissons de votre message.',
      'form.name':        'Nom',
      'form.email':       'E-mail',
      'form.message':     'Message',
      'form.name.ph':     'Votre nom',
      'form.email.ph':    'votre.email@exemple.ch',
      'form.message.ph':  'Votre message...',
      'form.name.err':    'Veuillez entrer votre nom.',
      'form.email.err':   'Veuillez entrer une adresse e-mail valide.',
      'form.message.err': 'Veuillez entrer un message.',
      'form.submit':      'Envoyer le message',
      'contact.pres':     'Président de fraction',
      'contact.synodalrat':'Représentant au Conseil synodal',
      'contact.church':   'Églises réformées Berne-Jura-Soleure',

      // Footer
      'footer.name':      '✦ Groupe Synode Ouverte',
      'footer.desc':      'Fraction du Synode des Églises réformées Berne-Jura-Soleure',
      'footer.copy':      '© 2025 Groupe Synode Ouverte. Tous droits réservés.',

      // Meta
      'meta.desc':        'Groupe Synode Ouverte (GOS) – Fraction du Synode des Églises réformées Berne-Jura-Soleure. Pour la justice, la paix et la sauvegarde de la Création.',
      'meta.title':       'Groupe Synode Ouverte (GOS) – Pour la justice et la diversité'
    }
  };

  var currentLang = 'de';

  function t(key) {
    var dict = translations[currentLang] || translations.de;
    return dict[key] || translations.de[key] || key;
  }

  function applyAll() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    // Placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    // aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    // Update html lang
    document.documentElement.lang = currentLang;
    // Update meta
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('meta.desc'));
    document.title = t('meta.title');
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    try { localStorage.setItem('gos-lang', lang); } catch (e) {}
    applyAll();
    // Update switcher active state
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function init() {
    // Detect saved or browser language
    var saved = null;
    try { saved = localStorage.getItem('gos-lang'); } catch (e) {}
    if (saved && translations[saved]) {
      currentLang = saved;
    } else {
      var browserLang = (navigator.language || '').substring(0, 2).toLowerCase();
      if (translations[browserLang]) currentLang = browserLang;
    }
    applyAll();

    // Wire up switcher buttons
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
      btn.addEventListener('click', function () {
        setLang(this.getAttribute('data-lang'));
      });
    });
  }

  return { init: init, setLang: setLang, t: t };
})();
