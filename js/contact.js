/* medias.fr · formulaire de contact
   Envoi vers contact.php (hébergement de medias.fr). Si le serveur ne répond pas
   en JSON (version de consultation sans PHP), la messagerie du visiteur prend le relais. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = form.querySelector('.form__status');
  var btn = form.querySelector('button[type="submit"]');
  var f = form.elements;
  f.t.value = String(Date.now());

  function say(msg, kind) {
    status.textContent = msg;
    status.className = 'form__status' + (kind ? ' is-' + kind : '');
  }

  function check() {
    var first = null;
    ['nom', 'email', 'objet', 'message'].forEach(function (n) {
      var el = f[n];
      var v = (el.value || '').trim();
      var bad = !v || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !first) first = el;
    });
    var cb = f.consentement;
    cb.setAttribute('aria-invalid', cb.checked ? 'false' : 'true');
    if (!cb.checked && !first) first = cb;
    if (first) first.focus();
    return !first;
  }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
  });
  form.addEventListener('change', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false');
  });

  function viaMail() {
    var body = 'Nom : ' + f.nom.value + '\nSociété : ' + (f.societe.value || '-') + '\nE-mail : ' + f.email.value + '\n\n' + f.message.value;
    window.location.href = 'mailto:hello@medias.fr?subject=' + encodeURIComponent('[medias.fr] ' + f.objet.value + ' · ' + f.nom.value) + '&body=' + encodeURIComponent(body);
    say('Votre messagerie s’ouvre pour finaliser l’envoi.', 'ok');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!check()) { say('Merci de compléter les champs signalés.', 'err'); return; }
    btn.disabled = true;
    say('Envoi en cours…');
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          form.reset();
          f.t.value = String(Date.now());
          say('Merci. Votre message a bien été transmis à la régie.', 'ok');
        } else {
          say((d && d.error) || 'L’envoi n’a pas abouti. Écrivez-nous à hello@medias.fr.', 'err');
        }
      })
      .catch(viaMail)
      .then(function () { btn.disabled = false; });
  });
})();
