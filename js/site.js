/* medias.fr · interactions et animations du site
   Les animations reposent sur GSAP et ScrollTrigger. Sans eux, ou si le visiteur
   a demandé moins d'animations, tout le contenu s'affiche simplement. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------- Menu mobile ---------- */
  var burger = doc.querySelector('.burger');
  var nav = doc.getElementById('nav');
  if (burger && nav) {
    var closeNav = function () {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------- Repère de la rubrique en cours ---------- */
  var links = nav ? nav.querySelectorAll('a[href^="#"]:not(.nav__contact)') : [];
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (!entry.isIntersecting) { link.classList.remove('is-current'); return; }
        links.forEach(function (a) { a.classList.remove('is-current'); });
        link.classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Filtre des titres par univers ---------- */
  var filters = doc.querySelectorAll('.filter');
  var medias = doc.querySelectorAll('.media[data-family]');
  var animated = false;
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var family = btn.getAttribute('data-filter');
      var shown = [];
      filters.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      medias.forEach(function (m) {
        var hide = family !== 'all' && m.getAttribute('data-family') !== family;
        m.hidden = hide;
        if (!hide) shown.push(m);
      });
      if (animated) {
        window.gsap.fromTo(shown, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.04, overwrite: true });
        window.ScrollTrigger.refresh();
      }
    });
  });

  /* ---------- Sans animation : tout afficher ---------- */
  function showAll() { root.classList.add('no-motion'); }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) { showAll(); return; }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  // Découpe un texte en mots pour les animer un à un (le texte complet reste lisible par les lecteurs d'écran)
  function splitWords(el, cls) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var parts = [];
    text.split(' ').forEach(function (word, i, all) {
      var outer = doc.createElement('span');
      outer.className = cls;
      outer.setAttribute('aria-hidden', 'true');
      var inner = doc.createElement('span');
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < all.length - 1) el.appendChild(doc.createTextNode(' '));
      parts.push(inner);
    });
    return parts;
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out', duration: 0.8 });
    animated = true;

    /* Barre de progression de lecture et ombre de l'en-tête */
    gsap.to('.progress i', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: doc.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });
    var header = doc.querySelector('.header');
    ScrollTrigger.create({
      start: 12, end: 'max',
      onToggle: function (self) { header.classList.toggle('is-stuck', self.isActive); }
    });

    /* Ouverture */
    var h1 = doc.querySelector('.hero [data-split]');
    var words = splitWords(h1, 'sw');
    gsap.set(h1, { visibility: 'visible' });
    gsap.timeline({ delay: 0.1 })
      .from('.hero .dots i', { scale: 0, duration: 0.5, stagger: 0.09 })
      .from('.hero__kicker > span:last-child', { autoAlpha: 0, x: -10, duration: 0.6 }, '<0.15')
      .from(words, { yPercent: 115, duration: 1, stagger: 0.05, ease: 'power4.out' }, '<0.05')
      .fromTo('.hero [data-hero]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, '-=0.65')
      .fromTo('.mast', { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1 }, '<-0.25')
      .from('.mast__list li', { autoAlpha: 0, x: 14, duration: 0.6, stagger: 0.09 }, '-=0.6');

    /* Titre tournant dans la carte d'ouverture */
    var titles = [
      ['sorties', 'red', 'Art de vivre'], ['audio', 'blue', 'Tech & savoirs'], ['etudiant', 'yellow', 'Vie pratique'],
      ['alimentation', 'red', 'Art de vivre'], ['sciences', 'blue', 'Tech & savoirs'], ['mecanique', 'yellow', 'Vie pratique'],
      ['boisson', 'red', 'Art de vivre'], ['micro', 'blue', 'Tech & savoirs'], ['rajeunir', 'yellow', 'Vie pratique'],
      ['gadget', 'blue', 'Tech & savoirs']
    ];
    var rotWord = doc.querySelector('[data-rot-word]');
    var rotName = doc.querySelector('[data-rot-name]');
    var rotFam = doc.querySelector('[data-rot-fam]');
    var rotIndex = doc.querySelector('[data-rot-index]');
    var current = 0;
    var inView = true;
    function nextTitle() {
      if (!inView || doc.hidden) return;
      current = (current + 1) % titles.length;
      var t = titles[current];
      gsap.timeline()
        .to(rotWord, { yPercent: -120, duration: 0.42, ease: 'power3.in' })
        .to(rotFam, { autoAlpha: 0, duration: 0.25 }, 0)
        .add(function () {
          rotName.textContent = t[0];
          rotWord.className = 'mast__word t-' + t[1];
          rotFam.textContent = t[2];
          rotIndex.textContent = ('0' + (current + 1)).slice(-2);
        })
        .fromTo(rotWord, { yPercent: 120 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' })
        .to(rotFam, { autoAlpha: 1, duration: 0.4 }, '<0.15');
    }
    if (rotWord) {
      ScrollTrigger.create({ trigger: '.mast', onToggle: function (self) { inView = self.isActive; } });
      window.setInterval(nextTitle, 2400);
    }

    /* Bandeau défilant : accélère avec le défilement de la page */
    var track = doc.querySelector('.marquee__track');
    if (track) {
      track.style.animation = 'none';
      var loop = gsap.to(track, { xPercent: -50, duration: 48, ease: 'none', repeat: -1 });
      ScrollTrigger.create({
        onUpdate: function (self) {
          var boost = Math.min(Math.abs(self.getVelocity()) / 350, 5);
          gsap.killTweensOf(loop);
          loop.timeScale(1 + boost);
          gsap.to(loop, { timeScale: 1, duration: 1.2, ease: 'power2.out' });
        }
      });
    }

    /* Apparitions au défilement, par vagues */
    gsap.set('.reveal', { y: 28 });
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%', once: true,
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.09, overwrite: true });
      }
    });

    /* Chiffres qui se comptent */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      var state = { v: parseInt(el.getAttribute('data-from') || '0', 10) };
      el.textContent = state.v;
      gsap.to(state, {
        v: end, duration: 1.8, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(state.v); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    /* Histoire : fil du temps, années, repères */
    if (doc.querySelector('.rail')) {
      gsap.fromTo('.rail i', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.story__chapters', start: 'top 62%', end: 'bottom 62%', scrub: 0.4 }
      });
    }
    gsap.utils.toArray('.chapter').forEach(function (chapter) {
      ScrollTrigger.create({
        trigger: chapter, start: 'top+=96 62%',
        onEnter: function () { chapter.classList.add('is-on'); },
        onLeaveBack: function () { chapter.classList.remove('is-on'); }
      });
      gsap.from(chapter.querySelectorAll('.chapter__year span'), {
        yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'power4.out',
        scrollTrigger: { trigger: chapter, start: 'top 82%', once: true }
      });
    });

    /* Registre du 13 juin 2007 : les lignes s'inscrivent une à une, l'horloge suit */
    var registre = doc.querySelector('.registre');
    if (registre) {
      var rows = registre.querySelectorAll('li');
      var clock = registre.querySelector('[data-clock]');
      var minutes = [7, 7, 7, 8, 14, 16, 26, 27];
      var time = { m: 7 };
      var step = 0.22;
      var writeClock = function () { clock.textContent = '16 h ' + ('0' + Math.round(time.m)).slice(-2); };
      writeClock();
      var tl = gsap.timeline({ scrollTrigger: { trigger: registre, start: 'top 75%', once: true } });
      tl.from(registre, { autoAlpha: 0, y: 28, duration: 0.7 });
      rows.forEach(function (row, i) {
        var at = 0.35 + i * step;
        tl.from(row, { autoAlpha: 0, x: -24, duration: 0.55 }, at);
        tl.to(time, { m: minutes[i], duration: step, ease: 'none', onUpdate: writeClock }, at);
      });
      tl.fromTo('.registre li.is-us',
        { backgroundColor: '#ffffff', color: '#111318' },
        { backgroundColor: '#111318', color: '#ffffff', duration: 0.7, ease: 'power2.inOut' }, '-=0.3');
      tl.from('.registre__note', { autoAlpha: 0, duration: 0.6 }, '-=0.4');
    }

    /* Dix-neuf années, une barre par an */
    if (doc.querySelector('.ticks')) {
      gsap.from('.ticks i', {
        scaleY: 0.12, opacity: 0.18, duration: 0.5, stagger: 0.05,
        scrollTrigger: { trigger: '.ticks', start: 'top 88%', once: true }
      });
    }

    /* Manifeste : les mots s'éclairent au fil du défilement */
    var manifesto = doc.querySelector('[data-scrub]');
    if (manifesto) {
      var lit = splitWords(manifesto, 'mw');
      gsap.fromTo(lit, { opacity: 0.16 }, {
        opacity: 1, ease: 'none', duration: 1, stagger: 0.6,
        scrollTrigger: { trigger: manifesto, start: 'top 85%', end: 'bottom 62%', scrub: 0.5 }
      });
    }

    /* Cartes des titres et portraits : un second temps à l'intérieur de la carte */
    gsap.utils.toArray('.media__head .wm').forEach(function (wm) {
      gsap.from(wm, {
        autoAlpha: 0, y: 26, duration: 0.9, delay: 0.2,
        scrollTrigger: { trigger: wm.closest('.media'), start: 'top 88%', once: true }
      });
    });
    gsap.utils.toArray('.founder__av').forEach(function (av) {
      gsap.from(av, {
        scale: 0.5, autoAlpha: 0, duration: 0.8, delay: 0.25,
        scrollTrigger: { trigger: av.closest('.founder'), start: 'top 88%', once: true }
      });
    });
    gsap.from('.cta', {
      scale: 0.96, duration: 1.1, ease: 'power2.out',
      scrollTrigger: { trigger: '.cta', start: 'top 92%', once: true }
    });

    /* Recalage une fois les polices chargées */
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  try { init(); } catch (err) { showAll(); }
})();
