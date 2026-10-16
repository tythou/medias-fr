/* medias.fr · consentement aux cookies
   Rien n'est déposé sans accord. Le choix est gardé six mois, puis redemandé.
   Pour brancher un outil de mesure : écouter l'événement « medias:consent »
   ou lire window.mediasConsent.analytics. Le mode consentement Google est mis à jour. */
(function () {
  'use strict';
  var KEY = 'mfr-consent';
  var MAX = 1000 * 60 * 60 * 24 * 182;
  var doc = document;
  var box = null;

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (v && v.d && Date.now() - v.d < MAX) return v;
    } catch (e) {}
    return null;
  }

  function apply(c) {
    window.mediasConsent = { analytics: !!c.a };
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: c.a ? 'granted' : 'denied' });
    try { doc.dispatchEvent(new CustomEvent('medias:consent', { detail: window.mediasConsent })); } catch (e) {}
  }

  function save(a) {
    var c = { a: a, d: Date.now(), v: 1 };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    apply(c);
    close();
  }

  function build() {
    box = doc.createElement('div');
    box.className = 'consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'consent-titre');
    box.innerHTML =
      '<h2 id="consent-titre">Votre choix sur les cookies</h2>' +
      '<p>Avec votre accord, medias.fr utilise des cookies de mesure d’audience pour comprendre l’usage du site. Aucun n’est déposé sans votre choix. <a href="mentions-legales.html#cookies">En savoir plus</a></p>' +
      '<div class="consent__actions">' +
      '<button type="button" class="btn btn--sm btn--secondary" data-choice="0">Tout refuser</button>' +
      '<button type="button" class="btn btn--sm" data-choice="1">Tout accepter</button>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-choice]');
      if (b) save(b.getAttribute('data-choice') === '1');
    });
    doc.body.appendChild(box);
  }

  function open() {
    if (!box) build();
    box.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-open'); }); });
  }

  function close() {
    if (!box) return;
    box.classList.remove('is-open');
    setTimeout(function () { box.hidden = true; }, 380);
  }

  doc.addEventListener('click', function (e) {
    if (e.target.closest('[data-consent-open]')) { e.preventDefault(); open(); }
  });

  var c = read();
  if (c) apply(c); else open();
})();
