/* =============================================================================
   site.js — shared behaviour for every page of बालसंस्कार फेस्टिवल २०२६
   -----------------------------------------------------------------------------
   Reads window.FESTIVAL (see data.js) and renders:

     • the icon sprite, header + navigation and footer (shared partials)
     • the homepage (cards, eligibility overview, explorer, FAQ)
     • each competition page (breadcrumb, intro, groups/topics, CTA, links)
     • the registration page (validation + Google Apps Script submission)

   Pages only need:  <body data-page="home|competition|registration"
                           data-competition="<id>">  and the mount points.

   GOOGLE SHEETS INTEGRATION
   -------------------------
   Set CONFIG.registrationEndpoint to the /exec URL of a Google Apps Script web
   app. Until then the form validates but states plainly that nothing was sent.
   See README.md for the Apps Script code.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */
  var CONFIG = {
    registrationEndpoint: '',   // e.g. 'https://script.google.com/macros/s/XXXX/exec'
    requestTimeoutMs: 15000
  };

  var DATA = window.FESTIVAL;
  if (!DATA) { return; }

  var F = DATA.festival;
  var S = DATA.standards;
  var C = DATA.competitions;
  var FAQ = DATA.faq;
  var UI = DATA.ui;

  /* ---------------------------------------------------------------- helpers */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id) { return C.filter(function (c) { return c.id === id; })[0]; }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function standardLabel(i) { return S[i]; }

  function rangeText(from, to) {
    if (from === to) return standardLabel(from);
    var toLabel = (from >= 1 && to >= 1) ? standardLabel(to).replace(/^इयत्ता\s*/, '') : standardLabel(to);
    return standardLabel(from) + ' ते ' + toLabel;
  }

  /* "गट ३ — इयत्ता ५ वी ते ७ वी"  →  "इयत्ता ५ वी ते ७ वी" (badge carries the number) */
  function stripGroupPrefix(label) {
    return String(label).replace(/^गट\s*[०-९\d]+\s*[-–—]\s*/, '');
  }

  function groupFor(c, standardIndex) {
    if (!c.groups || !c.groups.length) return null;
    for (var i = 0; i < c.groups.length; i++) {
      var g = c.groups[i];
      if (standardIndex >= g.from && standardIndex <= g.to) return g;
    }
    return null;
  }

  function isEligible(c, standardIndex) {
    if (!c.eligibility) return true;            // unconfirmed online events: never blocked
    return standardIndex >= c.eligibility.from && standardIndex <= c.eligibility.to;
  }

  function eligibleFor(standardIndex) {
    return C.filter(function (c) { return c.eligibility && isEligible(c, standardIndex); });
  }

  function onlineCompetitions() {
    return C.filter(function (c) { return c.mode === 'online'; });
  }

  function topicCount(c) {
    return (c.groups || []).reduce(function (n, g) { return n + g.topics.length; }, 0);
  }

  var MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  function toMarathi(n) {
    return String(n).replace(/\d/g, function (d) { return MARATHI_DIGITS[Number(d)]; });
  }

  function scrollTo(node, block) {
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: block || 'center' });
    }
  }

  function icon(id, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="' + id + '"/></svg>';
  }

  /* ----------------------------------------------------------- icon sprite */
  /* Injected once, so every page shares a single copy of the artwork. */
  var SPRITE = '' +
    '<svg class="sprite" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      '<symbol id="emblem" viewBox="0 0 48 48">' +
        '<circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".55"/>' +
        '<circle cx="24" cy="24" r="18.5" fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="2 3.4" opacity=".8"/>' +
        '<g fill="currentColor" opacity=".92">' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(45 24 24)"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(90 24 24)"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(135 24 24)"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(180 24 24)"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(225 24 24)"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(270 24 24)"/>' +
          '<ellipse cx="24" cy="12.5" rx="3.1" ry="6.2" transform="rotate(315 24 24)"/>' +
        '</g>' +
        '<circle cx="24" cy="24" r="5.4" fill="currentColor"/>' +
        '<circle cx="24" cy="24" r="2.1" fill="#FFF7E8"/>' +
      '</symbol>' +

      '<symbol id="i-paint" viewBox="0 0 24 24">' +
        '<path d="M12 3.2c-4.9 0-8.8 3.3-8.8 7.4 0 2.5 1.6 4.3 3.7 5.1.5.2.8.6.8 1.1 0 .7-.6 1.2-1.3 1.2h-.6c-.6 0-1 .5-1 1.1 0 1.2 1 2.1 2.6 2.1h9.4c3.4 0 5.7-2.2 5.7-5.3 0-4.1-4.3-7.6-9.5-7.6Z"/>' +
        '<circle cx="8.2" cy="9.4" r="1.25" fill="currentColor" stroke="none"/>' +
        '<circle cx="13.1" cy="7.8" r="1.25" fill="currentColor" stroke="none"/>' +
        '<circle cx="17.2" cy="10.4" r="1.25" fill="currentColor" stroke="none"/>' +
        '<circle cx="10.2" cy="13.4" r="1.25" fill="currentColor" stroke="none"/>' +
      '</symbol>' +

      '<symbol id="i-mehndi" viewBox="0 0 24 24">' +
        '<path d="M4.6 19.4c1.6-5.6 5.2-10.6 12.3-14.6 1.6 6.6-2.6 13.4-8.4 16.1"/>' +
        '<path d="M17.6 4.6c1.9 3.4 1.6 7.2-.5 10.1"/>' +
        '<path d="M13.2 13.6c1.4 1.1 2.4 2.7 2.7 4.6"/>' +
        '<circle cx="7.4" cy="16.2" r=".95" fill="currentColor" stroke="none"/>' +
        '<circle cx="10.2" cy="10.4" r=".95" fill="currentColor" stroke="none"/>' +
      '</symbol>' +

      '<symbol id="i-essay" viewBox="0 0 24 24">' +
        '<path d="M12 6.6C10.4 5.3 8.2 4.6 5 4.6v13.2c3.2 0 5.4.7 7 2 1.6-1.3 3.8-2 7-2V4.6c-3.2 0-5.4.7-7 2Z"/>' +
        '<path d="M12 6.6v12.8"/><path d="M16.2 8.6h2.4M16.2 12h2.4"/>' +
      '</symbol>' +

      '<symbol id="i-speech" viewBox="0 0 24 24">' +
        '<rect x="9" y="2.8" width="6" height="10.6" rx="3"/>' +
        '<path d="M5.2 11.2a6.8 6.8 0 0 0 13.6 0"/><path d="M12 18v2.8"/><path d="M8.4 20.8h7.2"/>' +
      '</symbol>' +

      '<symbol id="i-drama" viewBox="0 0 24 24">' +
        '<path d="M4 4.6h16v8.2a8 8 0 0 1-16 0V4.6Z"/>' +
        '<path d="M8.4 10.2h.02M15.6 10.2h.02" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M8.6 15.4c1.3 1.5 5.5 1.5 6.8 0"/>' +
        '<path d="M6.6 4.6c-.9 1-1.4 2.3-1.4 3.7M17.4 4.6c.9 1 1.4 2.3 1.4 3.7"/>' +
      '</symbol>' +

      '<symbol id="i-rangoli" viewBox="0 0 24 24">' +
        '<circle cx="12" cy="12" r="3.1"/>' +
        '<g><ellipse cx="12" cy="5.6" rx="2" ry="3.5"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(45 12 12)"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(90 12 12)"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(135 12 12)"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(180 12 12)"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(225 12 12)"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(270 12 12)"/>' +
        '<ellipse cx="12" cy="5.6" rx="2" ry="3.5" transform="rotate(315 12 12)"/></g>' +
      '</symbol>' +

      '<symbol id="i-dance" viewBox="0 0 24 24">' +
        '<circle cx="12.4" cy="5.2" r="2.2"/>' +
        '<path d="M12.4 7.6 9.6 12l-3.4 2.6"/>' +
        '<path d="M12.4 7.6 15.2 12l3.4 2.6"/>' +
        '<path d="M12.4 7.6v5.2"/>' +
        '<path d="M9.6 12.8 7.2 20.4"/>' +
        '<path d="M15.2 12.8 17.6 20.4"/>' +
        '<path d="M9.4 15.6h5.6"/>' +
      '</symbol>' +

      '<symbol id="i-music" viewBox="0 0 24 24">' +
        '<path d="M9.4 17.6V5.4l9.2-2v12.2"/>' +
        '<circle cx="6.6" cy="17.9" r="2.7"/>' +
        '<circle cx="15.9" cy="15.9" r="2.7"/>' +
      '</symbol>' +

      '<symbol id="i-fashion" viewBox="0 0 24 24">' +
        '<path d="M12 5.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z"/>' +
        '<path d="M12 9.9v3.2"/>' +
        '<path d="M4.4 17.4 12 10.6l7.6 6.8"/>' +
        '<path d="M4.4 17.4h15.2"/>' +
        '<path d="M9.2 20.4h5.6"/>' +
      '</symbol>' +

      '<symbol id="i-online" viewBox="0 0 24 24">' +
        '<circle cx="12" cy="12" r="8.6"/>' +
        '<path d="M3.6 12h16.8"/>' +
        '<path d="M12 3.4c2.4 2.6 3.6 5.6 3.6 8.6s-1.2 6-3.6 8.6c-2.4-2.6-3.6-5.6-3.6-8.6S9.6 6 12 3.4Z"/>' +
      '</symbol>' +

      '<symbol id="i-users" viewBox="0 0 24 24">' +
        '<circle cx="9.2" cy="8.4" r="3.2"/>' +
        '<path d="M3.6 19.4c0-3 2.5-5.3 5.6-5.3s5.6 2.3 5.6 5.3"/>' +
        '<path d="M16.2 5.8a3.2 3.2 0 0 1 0 6.1"/>' +
        '<path d="M17.6 14.4c1.7.6 2.9 2.1 2.9 4"/>' +
      '</symbol>' +

      '<symbol id="i-check" viewBox="0 0 24 24"><path d="M4.5 12.6l4.6 4.6L19.5 6.8"/></symbol>' +
      '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5"/></symbol>' +
      '<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.6l2.5 5.3 5.7.8-4.2 4.1 1 5.8-5-2.8-5 2.8 1-5.8L3.8 9.7l5.7-.8L12 3.6Z"/></symbol>' +
      '<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4M12 7.9h.02" stroke-width="2" stroke-linecap="round"/></symbol>' +

      '<defs>' +
        '<path id="m-petal" d="M0,-16 C16,-42 16,-74 0,-102 C-16,-74 -16,-42 0,-16 Z"/>' +
        '<path id="m-petal-sm" d="M0,-10 C9,-26 9,-46 0,-64 C-9,-46 -9,-26 0,-10 Z"/>' +
        '<circle id="m-dot" cx="0" cy="-84" r="4.2"/>' +
      '</defs>' +
      '<symbol id="mandala-ring1" viewBox="-110 -110 220 220"><g fill="rgba(232,137,12,.30)" stroke="rgba(193,39,45,.45)" stroke-width="1.1">' +
        ringUses('#m-petal', 0, 30) + '</g></symbol>' +
      '<symbol id="mandala-ring2" viewBox="-110 -110 220 220"><g fill="rgba(193,39,45,.18)" stroke="rgba(122,31,43,.32)" stroke-width="1">' +
        ringUses('#m-petal-sm', 15, 30) + '</g></symbol>' +
      '<symbol id="mandala-ring3" viewBox="-110 -110 220 220"><g fill="rgba(30,122,82,.55)">' +
        ringUses('#m-dot', 0, 30) + '</g></symbol>' +
      '<symbol id="mandala-core" viewBox="-110 -110 220 220">' +
        '<circle cx="0" cy="0" r="20" fill="rgba(255,255,255,.85)" stroke="rgba(201,154,60,.85)" stroke-width="1.4"/>' +
        '<circle cx="0" cy="0" r="10" fill="#C1272D" opacity=".85"/>' +
      '</symbol>' +
    '</svg>';

  function ringUses(href, start, step) {
    var out = '';
    for (var a = start; a < start + 360; a += step) {
      out += '<use href="' + href + '" transform="rotate(' + a + ')"/>';
    }
    return out;
  }

  function injectSprite() {
    var host = qs('#iconSprite');
    if (host) host.innerHTML = SPRITE;
  }

  /* ----------------------------------------------------------- shared head */
  function onlineBadge(size) {
    return '<span class="badge badge--online' + (size === 'sm' ? ' badge--sm' : '') + '">' +
      icon('#i-online') +
      '<span class="english-text badge__latin">Online Competition</span>' +
      '<span class="badge__mr">ऑनलाइन स्पर्धा</span>' +
    '</span>';
  }

  function renderHeader() {
    var host = qs('#siteHeader');
    if (!host) return;

    var page = document.body.getAttribute('data-page');
    var current = document.body.getAttribute('data-competition');

    var menu = C.map(function (c) {
      var isCurrent = (page === 'competition' && current === c.id);
      return '<li><a class="nav__menu-link' + (isCurrent ? ' is-current' : '') + '" href="' + c.page + '"' +
        (isCurrent ? ' aria-current="page"' : '') + '>' +
        '<span class="nav__menu-icon" data-accent="' + c.accent + '">' + icon(c.icon) + '</span>' +
        '<span class="nav__menu-text">' + escapeHtml(c.name) +
        (c.mode === 'online' ? ' <span class="tag tag--online english-text">Online</span>' : '') +
        '</span></a></li>';
    }).join('');

    host.className = 'site-header';
    host.innerHTML = '' +
      '<div class="container header__inner">' +
        '<a class="brand" href="index.html" aria-label="' + escapeHtml(F.name) + ' — मुख्यपृष्ठ">' +
          '<span class="brand__emblem">' + icon('#emblem') + '</span>' +
          '<span class="brand__text">' +
            '<span class="brand__title">' + escapeHtml(F.name) + '</span>' +
            '<span class="brand__sub">' + escapeHtml(F.organizer) + '</span>' +
          '</span>' +
        '</a>' +
        '<button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-controls="primaryNav" aria-label="मेनू उघडा">' +
          '<span class="nav-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '</button>' +
        '<nav class="nav" id="primaryNav" aria-label="मुख्य नेव्हिगेशन">' +
          '<ul class="nav__list">' +
            '<li><a class="nav__link' + (page === 'home' ? ' is-active' : '') + '" href="index.html">' + escapeHtml(UI.navHome) + '</a></li>' +
            '<li class="nav__item nav__item--has-menu">' +
              '<button class="nav__link nav__link--button' + (page === 'competition' ? ' is-active' : '') + '" type="button" ' +
                'aria-expanded="false" aria-controls="allCompetitions" id="allCompetitionsBtn">' +
                escapeHtml(UI.navAll) + '<svg class="icon nav__chevron" aria-hidden="true"><use href="#i-arrow"/></svg>' +
              '</button>' +
              '<ul class="nav__menu" id="allCompetitions" aria-labelledby="allCompetitionsBtn">' + menu + '</ul>' +
            '</li>' +
            '<li><a class="nav__link' + (page === 'registration' ? ' is-active' : '') + '" href="registration.html">' + escapeHtml(UI.navRegister) + '</a></li>' +
          '</ul>' +
          '<a class="btn btn--primary nav__cta" href="registration.html">' + escapeHtml(UI.navRegister) + '</a>' +
        '</nav>' +
      '</div>';
  }

  function renderFooter() {
    var host = qs('#siteFooter');
    if (!host) return;

    var links = C.map(function (c) {
      return '<li><a href="' + c.page + '">' + escapeHtml(c.name) +
        (c.mode === 'online' ? ' <span class="tag tag--online english-text">Online</span>' : '') + '</a></li>';
    }).join('');

    host.className = 'site-footer';
    host.innerHTML = '' +
      '<div class="container footer__inner">' +
        '<div class="footer__top">' +
          '<div class="footer__brand">' +
            '<span class="brand__emblem brand__emblem--footer">' + icon('#emblem') + '</span>' +
            '<div>' +
              '<p class="footer__title">' + escapeHtml(F.name) + '</p>' +
              '<p class="footer__org">आयोजक: ' + escapeHtml(F.organizer) + '</p>' +
            '</div>' +
          '</div>' +
          '<nav class="footer__nav" aria-label="स्पर्धा">' +
            '<p class="footer__nav-title">' + escapeHtml(UI.navAll) + '</p>' +
            '<ul>' + links + '</ul>' +
          '</nav>' +
          '<nav class="footer__nav footer__nav--short" aria-label="तळ नेव्हिगेशन">' +
            '<p class="footer__nav-title">उपयुक्त दुवे</p>' +
            '<ul>' +
              '<li><a href="index.html">मुख्यपृष्ठ</a></li>' +
              '<li><a href="index.html#competitions">स्पर्धांची माहिती</a></li>' +
              '<li><a href="index.html#eligibility">इयत्तेनुसार पात्रता</a></li>' +
              '<li><a href="index.html#faq">नेहमी विचारले जाणारे प्रश्न</a></li>' +
              '<li><a href="registration.html">नोंदणी करा</a></li>' +
            '</ul>' +
          '</nav>' +
        '</div>' +
        '<p class="footer__note">' + escapeHtml(F.tagline) + '<br/>' +
          'स्पर्धेचा दिनांक, वेळ, ठिकाण आणि इतर तपशील आयोजकांमार्फत स्वतंत्रपणे जाहीर केले जातील.</p>' +
        '<p class="footer__copy">© २०२६ ' + escapeHtml(F.organizer) + '. सर्व हक्क राखीव.</p>' +
      '</div>';
  }

  /* -------------------------------------------------------------- nav logic */
  function initNav() {
    var toggle = qs('#navToggle');
    var nav = qs('#primaryNav');
    if (!toggle || !nav) return;

    var close = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'मेनू उघडा');
    };
    var open = function () {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'मेनू बंद करा');
    };

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) close(); else open();
    });

    qsa('a[href]', nav).forEach(function (link) {
      link.addEventListener('click', close);
    });

    /* "सर्व स्पर्धा" submenu — click on touch/keyboard, hover+focus on desktop. */
    var menuBtn = qs('#allCompetitionsBtn');
    var menu = qs('#allCompetitions');
    if (menuBtn && menu) {
      var setMenu = function (isOpen) {
        menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        qs('.nav__item--has-menu').classList.toggle('is-open', isOpen);
      };
      menuBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
      });
      document.addEventListener('click', function (event) {
        if (!qs('.nav__item--has-menu').contains(event.target)) setMenu(false);
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { setMenu(false); menuBtn.focus(); }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { close(); toggle.focus(); }
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      close();
    });

    window.addEventListener('resize', function () { if (window.innerWidth > 900) close(); });
  }

  function initHeaderScroll() {
    var header = qs('.site-header');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initReveal() {
    var items = qsa('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (i) { i.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    items.forEach(function (i) { observer.observe(i); });
  }

  /* ============================================================== HOMEPAGE */
  function competitionCard(c, index) {
    return '' +
      '<a class="ccard reveal" href="' + c.page + '" data-accent="' + c.accent + '">' +
        '<span class="ccard__top">' +
          '<span class="ccard__icon">' + icon(c.icon) + '</span>' +
          (c.mode === 'online' ? onlineBadge('sm') : '<span class="tag tag--num">स्पर्धा क्र. ' + toMarathi(index + 1) + '</span>') +
        '</span>' +
        '<h3 class="ccard__title">' + escapeHtml(c.name) +
          (c.nameLatin ? ' <span class="ccard__latin english-text">— ' + escapeHtml(c.nameLatin) + '</span>' : '') +
        '</h3>' +
        '<p class="ccard__desc">' + escapeHtml(c.blurb) + '</p>' +
        '<span class="ccard__meta">' +
          (c.eligibility
            ? 'पात्रता: ' + escapeHtml(rangeText(c.eligibility.from, c.eligibility.to)) + ' · ' + toMarathi(c.groups.length) + ' गट'
            : 'पात्रता: ' + '<span class="ccard__pending">निश्चित होणे बाकी</span>') +
        '</span>' +
        '<span class="ccard__go">तपशील पहा ' + icon('#i-arrow') + '</span>' +
      '</a>';
  }

  function renderHomeCards() {
    var host = qs('#homeCards');
    if (!host) return;
    host.innerHTML = C.map(competitionCard).join('');
  }

  function renderEligibilityOverview() {
    var host = qs('#eligibilityList');
    if (!host) return;

    host.innerHTML = C.filter(function (c) { return c.eligibility; }).map(function (c) {
      var chips = c.groups.map(function (g) {
        return '<li class="chip chip--soft"><span class="chip__no english-text">G' + (c.groups.indexOf(g) + 1) + '</span> ' +
          escapeHtml(stripGroupPrefix(g.label)) + '</li>';
      }).join('');
      return '' +
        '<article class="erow reveal" data-accent="' + c.accent + '">' +
          '<div class="erow__head">' +
            '<span class="erow__icon">' + icon(c.icon) + '</span>' +
            '<h3 class="erow__title"><a href="' + c.page + '">' + escapeHtml(c.name) + '</a></h3>' +
            '<p class="erow__range">पात्रता: <strong>' + escapeHtml(rangeText(c.eligibility.from, c.eligibility.to)) + '</strong></p>' +
          '</div>' +
          '<ul class="erow__chips">' + chips + '</ul>' +
        '</article>';
    }).join('');
  }

  function renderExplorer() {
    var select = qs('#explorerStandard');
    var results = qs('#explorerResults');
    var hint = qs('#explorerHint');
    if (!select || !results) return;

    S.forEach(function (label, index) {
      var option = document.createElement('option');
      option.value = String(index);
      option.textContent = label;
      select.appendChild(option);
    });

    var empty = function (message) {
      results.innerHTML = '<p class="explorer__empty">' + escapeHtml(message) + '</p>';
    };

    select.addEventListener('change', function () {
      if (select.value === '') {
        empty('इयत्ता निवडल्यानंतर येथे पात्र स्पर्धा आणि गट दिसतील.');
        if (hint) hint.textContent = 'इयत्ता निवडल्यानंतर येथे पात्र स्पर्धा आणि गट दिसतील.';
        return;
      }
      var index = Number(select.value);
      if (hint) hint.innerHTML = 'निवडलेली इयत्ता: <strong>' + escapeHtml(standardLabel(index)) + '</strong>';

      var list = eligibleFor(index).map(function (c) {
        var g = groupFor(c, index);
        return '' +
          '<li class="ex-item" data-accent="' + c.accent + '">' +
            '<span class="ex-item__icon">' + icon(c.icon) + '</span>' +
            '<span class="ex-item__body">' +
              '<a class="ex-item__name" href="' + c.page + '">' + escapeHtml(c.name) + '</a>' +
              '<span class="ex-item__group">गट: <strong>' + escapeHtml(g ? stripGroupPrefix(g.label) : '—') + '</strong>' +
                (g && g.note ? ' · ' + escapeHtml(g.note) : '') + '</span>' +
            '</span>' +
            '<span class="ex-item__go">' + icon('#i-arrow') + '</span>' +
          '</li>';
      }).join('');

      var online = onlineCompetitions().map(function (c) {
        return '<li class="ex-item ex-item--online" data-accent="' + c.accent + '">' +
          '<span class="ex-item__icon">' + icon(c.icon) + '</span>' +
          '<span class="ex-item__body">' +
            '<a class="ex-item__name" href="' + c.page + '">' + escapeHtml(c.name) + '</a>' +
            '<span class="ex-item__group">ऑनलाइन स्पर्धा · पात्रता निश्चित होणे बाकी</span>' +
          '</span>' +
          '<span class="ex-item__go">' + icon('#i-arrow') + '</span>' +
        '</li>';
      }).join('');

      results.innerHTML =
        '<div class="ex-group"><p class="ex-group__title">इयत्तेनुसार उपलब्ध स्पर्धा (' +
          toMarathi(eligibleFor(index).length) + ')</p><ul class="ex-list">' + list + '</ul></div>' +
        '<div class="ex-group"><p class="ex-group__title">ऑनलाइन स्पर्धा</p><ul class="ex-list">' + online + '</ul></div>';
    });

    empty('इयत्ता निवडल्यानंतर येथे पात्र स्पर्धा आणि गट दिसतील.');
  }

  function renderOnlineStrip() {
    var host = qs('#onlineStrip');
    if (!host) return;
    var items = onlineCompetitions().map(function (c) {
      return '<a class="online-card reveal" href="' + c.page + '" data-accent="' + c.accent + '">' +
        '<span class="online-card__icon">' + icon(c.icon) + '</span>' +
        '<span class="online-card__body">' +
          '<span class="online-card__name">' + escapeHtml(c.name) +
            ' <span class="online-card__latin english-text">— ' + escapeHtml(c.nameLatin) + '</span></span>' +
          '<span class="online-card__note">' + escapeHtml(UI.pendingNotice) + '</span>' +
        '</span>' +
        '<span class="online-card__go">' + icon('#i-arrow') + '</span>' +
      '</a>';
    }).join('');
    host.innerHTML = items;
  }

  function renderFaq() {
    var host = qs('#faqList');
    if (!host) return;
    host.innerHTML = FAQ.map(function (item, i) {
      return '' +
        '<details class="faq reveal"' + (i === 0 ? ' open' : '') + '>' +
          '<summary><span class="faq__q">' + escapeHtml(item.q) + '</span>' +
            '<span class="faq__toggle" aria-hidden="true">' + icon('#i-arrow') + '</span></summary>' +
          '<div class="faq__a"><p>' + escapeHtml(item.a) + '</p></div>' +
        '</details>';
    }).join('');
  }

  /* ==================================================== COMPETITION PAGES */
  function renderCompetitionPage() {
    var host = qs('#competitionPage');
    var id = document.body.getAttribute('data-competition');
    var c = byId(id);
    if (!host || !c) return;

    var index = C.indexOf(c);
    var isOnline = c.mode === 'online';

    /* --- facts ------------------------------------------------------------ */
    var facts = [];
    facts.push('<li><span class="fact__k">पात्रता</span><span class="fact__v">' +
      (c.eligibility ? escapeHtml(rangeText(c.eligibility.from, c.eligibility.to)) : 'निश्चित होणे बाकी') + '</span></li>');
    if (c.groups.length) {
      facts.push('<li><span class="fact__k">गट</span><span class="fact__v">' + toMarathi(c.groups.length) + ' (इयत्तेनुसार)</span></li>');
      facts.push('<li><span class="fact__k">एकूण विषय</span><span class="fact__v">' + toMarathi(topicCount(c)) + '</span></li>');
    } else {
      facts.push('<li><span class="fact__k">गट</span><span class="fact__v">निश्चित होणे बाकी</span></li>');
    }
    facts.push('<li><span class="fact__k">स्वरूप</span><span class="fact__v">' +
      (isOnline ? 'ऑनलाइन स्पर्धा' : 'स्पर्धा') + '</span></li>');

    /* --- groups + topics -------------------------------------------------- */
    var groupsHtml = '';
    if (c.groups.length) {
      groupsHtml = '<section class="cp-block" id="topics">' +
        '<h2 class="cp-block__title">गट आणि विषय</h2>' +
        '<p class="cp-block__lead">विद्यार्थ्याच्या इयत्तेनुसार गट आपोआप निश्चित होतो. ' +
          'खालील यादीत आपल्या गटाचे विषय पहा.</p>' +
        '<div class="groups">' +
        c.groups.map(function (g, gi) {
          var topics = g.topics.map(function (t) {
            return '<li>' + icon('#i-check') + '<span>' + escapeHtml(t) + '</span></li>';
          }).join('');
          return '' +
            '<article class="group">' +
              '<h3 class="group__title">' +
                '<span class="group__badge">गट ' + toMarathi(gi + 1) + '</span>' +
                '<span class="group__label">' + escapeHtml(stripGroupPrefix(g.label)) + '</span>' +
                (g.note ? '<span class="group__note">' + escapeHtml(g.note) + '</span>' : '') +
              '</h3>' +
              '<ul class="topics">' + topics + '</ul>' +
            '</article>';
        }).join('') +
        '</div></section>';
    }

    /* --- pending notice for the online events ----------------------------- */
    var pendingHtml = '';
    if (c.pending) {
      pendingHtml = '' +
        '<section class="cp-block" id="status">' +
          '<h2 class="cp-block__title">स्पर्धेची सद्यस्थिती</h2>' +
          '<div class="notice notice--pending">' +
            '<span class="notice__icon">' + icon('#i-info') + '</span>' +
            '<div class="notice__body">' +
              '<p class="notice__lead">' + escapeHtml(UI.pendingNotice) + '</p>' +
              (c.pendingItems && c.pendingItems.length
                ? '<p class="notice__label">खालील तपशील अद्याप जाहीर झालेले नाहीत:</p>' +
                  '<ul class="notice__list">' + c.pendingItems.map(function (p) {
                    return '<li>' + icon('#i-check') + '<span>' + escapeHtml(p) + '</span></li>';
                  }).join('') + '</ul>'
                : '') +
              '<p class="notice__foot">वरील तपशील आयोजकांकडून निश्चित झाल्यानंतर या पृष्ठावर तसेच ' +
                'नोंदणी पृष्ठावर आपोआप दिसतील.</p>' +
            '</div>' +
          '</div>' +
        '</section>';
    }

    /* --- eligibility detail ----------------------------------------------- */
    var eligHtml = '';
    if (c.eligibility) {
      eligHtml = '' +
        '<section class="cp-block" id="eligibility-detail">' +
          '<h2 class="cp-block__title">पात्रता</h2>' +
          '<p class="cp-block__lead">ही स्पर्धा <strong>' + escapeHtml(rangeText(c.eligibility.from, c.eligibility.to)) +
            '</strong> मधील विद्यार्थ्यांसाठी खुली आहे. नोंदणी करताना विद्यार्थ्याची इयत्ता निवडल्यानंतर ' +
            'योग्य गट आपोआप निश्चित होतो.</p>' +
        '</section>';
    }

    /* --- process note (never invents rules) ------------------------------- */
    var processHtml = '';
    if (c.groups.length) {
      processHtml = '' +
        '<section class="cp-block">' +
          '<h2 class="cp-block__title">नोंदणी प्रक्रिया</h2>' +
          '<ul class="steps">' +
            '<li><span class="steps__no english-text">1</span>नोंदणी पृष्ठावर विद्यार्थ्याची माहिती व इयत्ता भरा.</li>' +
            '<li><span class="steps__no english-text">2</span>इयत्तेनुसार उपलब्ध स्पर्धांमधून ही स्पर्धा निवडा.</li>' +
            '<li><span class="steps__no english-text">3</span>आपल्या गटासाठी दाखवलेल्या विषयांपैकी एक विषय निवडा.</li>' +
            '<li><span class="steps__no english-text">4</span>माहिती तपासून नोंदणी पाठवा.</li>' +
          '</ul>' +
          '<p class="cp-note">' + icon('#i-info') +
            '<span>स्पर्धेचे अंतिम नियम, वेळापत्रक व इतर सूचना आयोजकांमार्फत जाहीर केल्या जातील.</span></p>' +
        '</section>';
    }

    /* --- other competitions ----------------------------------------------- */
    var others = C.filter(function (o) { return o.id !== c.id; }).map(function (o) {
      return '<a class="mini" href="' + o.page + '" data-accent="' + o.accent + '">' +
        '<span class="mini__icon">' + icon(o.icon) + '</span>' +
        '<span class="mini__name">' + escapeHtml(o.name) + '</span>' +
        (o.mode === 'online' ? '<span class="tag tag--online english-text">Online</span>' : '') +
      '</a>';
    }).join('');

    host.innerHTML = '' +
      '<nav class="breadcrumb" aria-label="ब्रेडक्रंब">' +
        '<ol>' +
          '<li><a href="index.html">मुख्यपृष्ठ</a></li>' +
          '<li><a href="index.html#competitions">सर्व स्पर्धा</a></li>' +
          '<li aria-current="page">' + escapeHtml(c.name) + '</li>' +
        '</ol>' +
      '</nav>' +

      '<header class="cp-head cp-head--' + c.layout + ' reveal">' +
        '<div class="cp-head__decor" aria-hidden="true">' +
          '<span class="cp-arc cp-arc--1"></span><span class="cp-arc cp-arc--2"></span>' +
          '<span class="cp-dots"></span>' +
        '</div>' +
        '<div class="cp-head__inner">' +
          '<p class="cp-head__eyebrow">स्पर्धा क्र. ' + toMarathi(index + 1) + ' · ' + escapeHtml(F.nameShort) + '</p>' +
          (isOnline ? onlineBadge() : '') +
          '<h1 class="cp-head__title">' + escapeHtml(c.name) +
            (c.nameLatin ? ' <span class="cp-head__latin english-text">— ' + escapeHtml(c.nameLatin) + '</span>' : '') +
          '</h1>' +
          '<p class="cp-head__intro">' + escapeHtml(c.intro) + '</p>' +
          '<ul class="facts">' + facts.join('') + '</ul>' +
          '<div class="cp-head__actions">' +
            '<a class="btn btn--primary btn--lg" href="registration.html?competition=' + encodeURIComponent(c.id) + '">' +
              escapeHtml(UI.registerForThis) + ' ' + icon('#i-arrow') + '</a>' +
            '<a class="btn btn--outline btn--lg" href="index.html#competitions">सर्व स्पर्धा पहा</a>' +
          '</div>' +
        '</div>' +
      '</header>' +

      '<div class="cp-body">' + eligHtml + groupsHtml + processHtml + pendingHtml + '</div>' +

      '<section class="cp-others reveal">' +
        '<h2 class="cp-others__title">इतर स्पर्धा</h2>' +
        '<div class="minis">' + others + '</div>' +
      '</section>' +

      '<section class="cp-cta reveal">' +
        '<div class="cp-cta__inner">' +
          '<h2 class="cp-cta__title">' + escapeHtml(c.name) + ' — नोंदणी</h2>' +
          '<p class="cp-cta__text">नोंदणी पृष्ठावर आपली इयत्ता निवडल्यानंतर उपलब्ध स्पर्धा व विषय दिसतील. ' +
            (isOnline ? 'ऑनलाइन स्पर्धांचे नियम निश्चित झाल्यावर आयोजक अंतिम पुष्टी देतील.'
                      : 'ही स्पर्धा आपोआप निवडलेली असेल.') + '</p>' +
          '<a class="btn btn--primary btn--lg" href="registration.html?competition=' + encodeURIComponent(c.id) + '">' +
            escapeHtml(UI.registerForThis) + ' ' + icon('#i-arrow') + '</a>' +
        '</div>' +
      '</section>';

    document.title = c.name + ' | ' + F.name;
  }

  /* ========================================================= REGISTRATION */
  var selection = [];        // [{ id, topic }]
  var preselectId = null;

  function initRegistration() {
    var form = qs('#registrationForm');
    var standardSelect = qs('#standard');
    if (!form || !standardSelect) return;

    var configNote = qs('#configNote');
    if (configNote && !CONFIG.registrationEndpoint) configNote.hidden = false;

    S.forEach(function (label, index) {
      var option = document.createElement('option');
      option.value = String(index);
      option.textContent = label;
      standardSelect.appendChild(option);
    });

    var mobile = qs('#mobile');
    if (mobile) {
      mobile.addEventListener('input', function () {
        mobile.value = mobile.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    /* Which competition sent us here? */
    var params = new URLSearchParams(window.location.search);
    var requested = params.get('competition');
    if (requested && byId(requested)) preselectId = requested;

    renderOnlinePicks();
    renderPreselectHint();
    /* Online competitions have no class filter, so a ?competition=… link can be
       honoured straight away. Class-based ones wait for the standard. */
    applyPreselect(null);

    standardSelect.addEventListener('change', function () {
      var previous = selection.length;
      /* Drop selections that are no longer valid for the new class. */
      selection = selection.filter(function (entry) {
        var c = byId(entry.id);
        return c && (!c.eligibility || c.mode === 'online');
      });
      hideStatus();
      clearError(qs('#err-competitions'));

      if (standardSelect.value === '') {
        qs('#offlineList').innerHTML = '';
        var offlineGroup = qs('#offlineGroup');
        if (offlineGroup) offlineGroup.hidden = true;
        var picked = qs('#pickedStandard');
        if (picked) { picked.hidden = true; picked.innerHTML = ''; }
        return;
      }

      var index = Number(standardSelect.value);
      renderOfflinePicks(index);
      applyPreselect(index);

      var pickedBox = qs('#pickedStandard');
      if (pickedBox) {
        pickedBox.hidden = false;
        pickedBox.innerHTML = icon('#i-info') +
          '<span><strong>' + escapeHtml(standardLabel(index)) + '</strong> साठी ' +
          toMarathi(eligibleFor(index).length) + ' स्पर्धा उपलब्ध आहेत. आवडीच्या स्पर्धा निवडा' +
          (previous ? ' (इयत्ता बदलल्यामुळे आधीची निवड रद्द केली आहे).' : '.') + '</span>';
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitRegistration(form);
    });

    form.addEventListener('reset', function () {
      window.setTimeout(function () {
        selection = [];
        resetSelectionUI();
        clearAllErrors(form);
        hideStatus();
        renderPreselectHint();
      }, 0);
    });

    var newBtn = qs('#newRegistrationBtn');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        var success = qs('#successCard');
        if (success) success.hidden = true;
        form.hidden = false;
        form.reset();
        resetSelectionUI();
        renderPreselectHint();
        scrollTo(form, 'start');
      });
    }

    qsa('.field__input', form).forEach(function (input) {
      input.addEventListener('input', function () { clearFieldError(input); });
      input.addEventListener('change', function () { clearFieldError(input); });
    });

    var declaration = qs('#declaration');
    if (declaration) {
      declaration.addEventListener('change', function () {
        if (declaration.checked) {
          clearError(qs('#err-declaration'));
          var wrap = declaration.closest('.check');
          if (wrap) wrap.classList.remove('is-invalid');
        }
      });
    }
  }

  function resetSelectionUI() {
    var offlineList = qs('#offlineList');
    var offlineGroup = qs('#offlineGroup');
    var onlineList = qs('#onlineList');
    if (offlineList) offlineList.innerHTML = '';
    if (offlineGroup) offlineGroup.hidden = true;
    if (onlineList) renderOnlinePicks();
  }

  /* --- rendering the pickable competition cards --------------------------- */
  function pickCard(c, standardIndex) {
    var checked = selection.some(function (s) { return s.id === c.id; });
    var group = (standardIndex != null && c.eligibility) ? groupFor(c, standardIndex) : null;
    var isOnline = c.mode === 'online';

    var body = '';
    if (isOnline) {
      body = '' +
        '<div class="comp-pick__body" data-comp-body="' + c.id + '"' + (checked ? '' : ' hidden') + '>' +
          '<p class="comp-pick__pending">' + icon('#i-info') +
            '<span>ही ऑनलाइन स्पर्धा आहे. या स्पर्धेची पात्रता, नियम व सादरीकरणाचे तपशील ' +
            'आयोजकांकडून निश्चित होणे बाकी आहेत. नोंदणी केल्याने सहभाग निश्चित होत नाही; ' +
            'अंतिम पुष्टी आयोजक देतील.</span></p>' +
        '</div>';
    } else {
      body = '' +
        '<div class="comp-pick__body" data-comp-body="' + c.id + '"' + (checked ? '' : ' hidden') + '>' +
          '<span class="comp-pick__group">' + icon('#i-check') +
            'आपोआप निश्चित गट: ' + escapeHtml(group ? stripGroupPrefix(group.label) : '—') +
            (group && group.note ? ' (' + escapeHtml(group.note) + ')' : '') +
          '</span>' +
          '<label class="field comp-pick__topic" for="topic-' + c.id + '">' +
            '<span class="field__label">विषय निवडा <abbr class="req" title="आवश्यक">*</abbr></span>' +
            '<span class="field__select">' +
              '<select class="field__input" id="topic-' + c.id + '" data-topic-select="' + c.id + '" aria-describedby="err-topic-' + c.id + '">' +
                '<option value="">कृपया विषय निवडा</option>' +
                (group ? group.topics.map(function (t) {
                  return '<option value="' + escapeHtml(t) + '"' +
                    ((selection.filter(function (s) { return s.id === c.id; })[0] || {}).topic === t ? ' selected' : '') +
                    '>' + escapeHtml(t) + '</option>';
                }).join('') : '') +
              '</select>' +
              '<svg class="icon field__chevron" aria-hidden="true"><use href="#i-arrow"/></svg>' +
            '</span>' +
            '<span class="field__error" id="err-topic-' + c.id + '" role="alert"></span>' +
          '</label>' +
        '</div>';
    }

    return '' +
      '<div class="comp-pick' + (checked ? ' is-selected' : '') + '" data-comp-pick="' + c.id + '" data-accent="' + c.accent + '">' +
        '<div class="comp-pick__top">' +
          '<span class="comp-pick__icon">' + icon(c.icon) + '</span>' +
          '<label class="check">' +
            '<input type="checkbox" value="' + c.id + '" data-comp-checkbox="' + c.id + '"' + (checked ? ' checked' : '') + ' />' +
            '<span class="check__box" aria-hidden="true">' + icon('#i-check') + '</span>' +
            '<span class="check__text">' +
              '<span class="comp-pick__name">' + escapeHtml(c.name) +
                (c.nameLatin ? ' <span class="english-text comp-pick__latin">(' + escapeHtml(c.nameLatin) + ')</span>' : '') + '</span>' +
              '<span class="comp-pick__elig">' +
                (c.eligibility
                  ? 'पात्रता: ' + escapeHtml(rangeText(c.eligibility.from, c.eligibility.to))
                  : 'पात्रता: निश्चित होणे बाकी') +
                (isOnline ? ' · ऑनलाइन' : '') +
              '</span>' +
            '</span>' +
          '</label>' +
        '</div>' +
        body +
      '</div>';
  }

  function bindPicks(root) {
    qsa('[data-comp-checkbox]', root).forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        var id = checkbox.getAttribute('data-comp-checkbox');
        var pick = qs('[data-comp-pick="' + id + '"]', root);
        var body = qs('[data-comp-body="' + id + '"]', root);
        var c = byId(id);

        if (checkbox.checked) {
          if (!selection.some(function (s) { return s.id === id; })) {
            selection.push({ id: id, topic: '', mode: c ? c.mode : 'offline' });
          }
          if (pick) pick.classList.add('is-selected');
          if (body) body.hidden = false;
          clearError(qs('#err-competitions'));
        } else {
          selection = selection.filter(function (s) { return s.id !== id; });
          if (pick) pick.classList.remove('is-selected');
          if (body) {
            body.hidden = true;
            var select = qs('select', body);
            if (select) select.value = '';
            clearError(qs('#err-topic-' + id));
          }
        }
      });
    });

    qsa('[data-topic-select]', root).forEach(function (select) {
      select.addEventListener('change', function () {
        var id = select.getAttribute('data-topic-select');
        var entry = selection.filter(function (s) { return s.id === id; })[0];
        if (entry) entry.topic = select.value;
        if (select.value) clearError(qs('#err-topic-' + id));
      });
    });
  }

  function renderOfflinePicks(standardIndex) {
    var list = qs('#offlineList');
    var group = qs('#offlineGroup');
    if (!list) return;
    var eligible = eligibleFor(standardIndex);
    if (group) group.hidden = false;
    list.innerHTML = eligible.map(function (c) { return pickCard(c, standardIndex); }).join('');
    bindPicks(list);
  }

  function renderOnlinePicks() {
    var list = qs('#onlineList');
    if (!list) return;
    list.innerHTML = onlineCompetitions().map(function (c) { return pickCard(c, null); }).join('');
    bindPicks(list);
  }

  function renderPreselectHint() {
    var box = qs('#preselectNote');
    if (!box) return;
    if (!preselectId) { box.hidden = true; box.innerHTML = ''; return; }
    var c = byId(preselectId);
    box.hidden = false;
    box.innerHTML = icon('#i-check') +
      '<span><strong>' + escapeHtml(c.name) + '</strong> या स्पर्धेसाठी तुम्ही नोंदणी पृष्ठावर आला आहात. ' +
      (c.eligibility
        ? 'कृपया आपली इयत्ता निवडा — ही स्पर्धा आपोआप निवडली जाईल.'
        : 'ही ऑनलाइन स्पर्धा खाली आपोआप निवडलेली आहे.') +
      '</span>';
  }

  function applyPreselect(standardIndex) {
    if (!preselectId) return;
    var c = byId(preselectId);
    if (!c) return;

    /* Online event: nothing to check against, select it right away. */
    if (!c.eligibility) { checkPreselect(c, null); return; }

    /* Class-based event: wait until the participant has picked a standard. */
    if (standardIndex == null) return;

    if (!isEligible(c, standardIndex)) {
      showStatus('info', icon('#i-info') +
        '<div><strong>' + escapeHtml(c.name) + ' या स्पर्धेसाठी ' + escapeHtml(standardLabel(standardIndex)) +
        ' पात्र नाही.</strong><br/>ही स्पर्धा ' + escapeHtml(rangeText(c.eligibility.from, c.eligibility.to)) +
        ' मधील विद्यार्थ्यांसाठी आहे. आपण येथून इतर उपलब्ध स्पर्धा निवडू शकता.</div>');
      return;
    }
    checkPreselect(c, standardIndex);
  }

  function checkPreselect(c, standardIndex) {
    if (selection.some(function (s) { return s.id === c.id; })) return;

    selection.push({ id: c.id, topic: '', mode: c.mode });

    var checkbox = qs('[data-comp-checkbox="' + c.id + '"]');
    var pick = qs('[data-comp-pick="' + c.id + '"]');
    var body = qs('[data-comp-body="' + c.id + '"]');
    if (checkbox) checkbox.checked = true;
    if (pick) pick.classList.add('is-selected');
    if (body) body.hidden = false;

    var note = qs('#preselectNote');
    if (note) {
      var group = (c.eligibility && standardIndex != null) ? groupFor(c, standardIndex) : null;
      note.innerHTML = icon('#i-check') + '<span><strong>' + escapeHtml(c.name) + '</strong> आपोआप निवडली आहे. ' +
        (group
          ? 'आपला गट: <strong>' + escapeHtml(stripGroupPrefix(group.label)) + '</strong>. कृपया विषय निवडा.'
          : 'या ऑनलाइन स्पर्धेची पात्रता व नियम निश्चित होणे बाकी आहेत.') +
        '</span>';
    }
  }

  /* --- validation --------------------------------------------------------- */
  var MOBILE_RE = /^[6-9]\d{9}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateForm(form) {
    var errors = [];
    clearAllErrors(form);

    var studentName = qs('#studentName', form);
    var standard = qs('#standard', form);
    var schoolName = qs('#schoolName', form);
    var city = qs('#city', form);
    var guardianName = qs('#guardianName', form);
    var mobile = qs('#mobile', form);
    var email = qs('#email', form);

    var nameValue = studentName.value.trim();
    if (!nameValue) errors.push(setFieldError(studentName, 'कृपया विद्यार्थ्याचे पूर्ण नाव भरा.'));
    else if (nameValue.length < 3) errors.push(setFieldError(studentName, 'नाव किमान ३ अक्षरांचे असावे.'));

    if (!standard.value) errors.push(setFieldError(standard, 'कृपया इयत्ता निवडा.'));

    var schoolValue = schoolName.value.trim();
    if (!schoolValue) errors.push(setFieldError(schoolName, 'कृपया शाळेचे नाव भरा.'));
    else if (schoolValue.length < 2) errors.push(setFieldError(schoolName, 'कृपया शाळेचे पूर्ण नाव भरा.'));

    if (!city.value.trim()) errors.push(setFieldError(city, 'कृपया गाव / शहर भरा.'));

    var guardianValue = guardianName.value.trim();
    if (!guardianValue) errors.push(setFieldError(guardianName, 'कृपया पालकांचे किंवा संरक्षकाचे नाव भरा.'));
    else if (guardianValue.length < 3) errors.push(setFieldError(guardianName, 'नाव किमान ३ अक्षरांचे असावे.'));

    var mobileValue = mobile.value.replace(/\D/g, '');
    if (!mobileValue) errors.push(setFieldError(mobile, 'कृपया संपर्कासाठी मोबाइल क्रमांक भरा.'));
    else if (!MOBILE_RE.test(mobileValue)) {
      errors.push(setFieldError(mobile, 'कृपया वैध १० अंकी मोबाइल क्रमांक भरा (६, ७, ८ किंवा ९ ने सुरू होणारा).'));
    }

    var emailValue = email.value.trim();
    if (emailValue && !EMAIL_RE.test(emailValue)) errors.push(setFieldError(email, 'कृपया वैध ईमेल पत्ता भरा.'));

    if (!selection.length) errors.push(setError(qs('#err-competitions'), 'कृपया किमान एका स्पर्धेसाठी नोंदणी करा.'));

    selection.forEach(function (entry) {
      var c = byId(entry.id);
      if (c && c.groups.length && !entry.topic) {
        errors.push(setError(qs('#err-topic-' + entry.id), 'कृपया या स्पर्धेसाठी विषय निवडा.'));
      }
    });

    var declaration = qs('#declaration', form);
    if (!declaration.checked) {
      var wrap = declaration.closest('.check');
      if (wrap) wrap.classList.add('is-invalid');
      errors.push(setError(qs('#err-declaration'), 'कृपया हमीपत्र वाचून सहमती द्या.'));
    }

    return errors.filter(Boolean);
  }

  function setFieldError(input, message) {
    var field = input.closest('.field');
    if (field) field.classList.add('is-invalid');
    var target = qs('#err-' + input.id);
    if (target) target.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    return message;
  }

  function setError(node, message) {
    if (!node) return message;
    node.textContent = message;
    node.style.display = 'flex';
    return message;
  }

  function clearFieldError(input) {
    var field = input.closest('.field');
    if (field) field.classList.remove('is-invalid');
    var target = qs('#err-' + input.id);
    if (target) target.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function clearError(node) {
    if (!node) return;
    node.textContent = '';
    node.style.display = '';
  }

  function clearAllErrors(form) {
    qsa('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); });
    qsa('.field__error', form).forEach(function (e) { e.textContent = ''; e.style.display = ''; });
    qsa('.check', form).forEach(function (c) { c.classList.remove('is-invalid'); });
    qsa('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }

  function hideStatus() {
    var box = qs('#formStatus');
    if (!box) return;
    box.hidden = true;
    box.className = 'form__status';
    box.innerHTML = '';
  }

  function showStatus(type, html) {
    var box = qs('#formStatus');
    if (!box) return;
    box.hidden = false;
    box.className = 'form__status form__status--' + type;
    box.innerHTML = html;
  }

  function focusFirstError() {
    var firstInvalid = qs('.field.is-invalid .field__input, .check.is-invalid input, .field__error[style*="flex"]');
    if (firstInvalid) {
      scrollTo(firstInvalid, 'center');
      if (typeof firstInvalid.focus === 'function') {
        window.setTimeout(function () { firstInvalid.focus({ preventScroll: true }); }, 380);
      }
      return;
    }
    scrollTo(qs('#formStatus'), 'center');
  }

  /* --- submit -------------------------------------------------------------- */
  function buildPayload(form) {
    var standardIndex = Number(qs('#standard', form).value);
    return {
      formType: 'balasanskar-festival-2026',
      submittedAt: new Date().toISOString(),
      studentName: qs('#studentName', form).value.trim(),
      standard: standardLabel(standardIndex),
      schoolName: qs('#schoolName', form).value.trim(),
      city: qs('#city', form).value.trim(),
      guardianName: qs('#guardianName', form).value.trim(),
      mobile: qs('#mobile', form).value.replace(/\D/g, ''),
      email: qs('#email', form).value.trim(),
      registrations: selection.map(function (entry) {
        var c = byId(entry.id);
        var group = (c && c.eligibility) ? groupFor(c, standardIndex) : null;
        return {
          competition: c ? c.name : entry.id,
          mode: c ? c.mode : 'offline',
          group: group ? stripGroupPrefix(group.label) : '',
          topic: entry.topic || '',
          status: (c && (!c.eligibility || !c.groups.length)) ? 'pending-confirmation' : 'registered'
        };
      })
    };
  }

  function submitRegistration(form) {
    var errors = validateForm(form);

    if (errors.length) {
      showStatus('error', icon('#i-info') +
        '<div><strong>कृपया खालील चुका दुरुस्त करा:</strong><ul>' +
        errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') +
        '</ul></div>');
      focusFirstError();
      return;
    }

    hideStatus();

    if (!CONFIG.registrationEndpoint) {
      showStatus('info', icon('#i-info') +
        '<div><strong>नोंदणी पाठवली गेली नाही.</strong><br/>' +
        'सध्या ऑनलाइन नोंदणीसाठी Google Apps Script endpoint कॉन्फिगर केलेला नाही, त्यामुळे आपली माहिती ' +
        'कुठेही पाठवली गेली नाही. कृपया आयोजकांशी थेट संपर्क करून नोंदणी पूर्ण करा.</div>');
      return;
    }

    var payload = buildPayload(form);
    var button = qs('#submitBtn');
    var originalLabel = button ? button.textContent : '';
    if (button) { button.disabled = true; button.textContent = 'पाठवत आहे...'; }

    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, CONFIG.requestTimeoutMs);

    fetch(CONFIG.registrationEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'follow'
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (e) { data = null; }
        if (data && data.result === 'error') throw new Error(data.message || 'server error');
        showSuccess(payload);
        form.hidden = true;
        form.reset();
        resetSelectionUI();
        renderPreselectHint();
      })
      .catch(function (error) {
        var message = (error && error.name === 'AbortError')
          ? 'विनंती पूर्ण होण्यास जास्त वेळ लागला. कृपया आपले इंटरनेट कनेक्शन तपासून पुन्हा प्रयत्न करा.'
          : 'नोंदणी पाठवताना तांत्रिक अडचण आली. आपली माहिती सुरक्षितपणे पोहोचली नसल्यास कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.';
        showStatus('error', icon('#i-info') +
          '<div><strong>नोंदणी पूर्ण झाली नाही.</strong><br/>' + escapeHtml(message) + '</div>');
      })
      .finally(function () {
        window.clearTimeout(timer);
        if (button) { button.disabled = false; button.textContent = originalLabel; }
      });
  }

  function showSuccess(payload) {
    var successCard = qs('#successCard');
    var summary = qs('#successSummary');
    if (!successCard) return;

    var hasPending = payload.registrations.some(function (r) { return r.status === 'pending-confirmation'; });

    if (summary) {
      var rows = [
        ['विद्यार्थ्याचे नाव', payload.studentName],
        ['इयत्ता', payload.standard],
        ['शाळा', payload.schoolName],
        ['गाव / शहर', payload.city],
        ['मोबाइल क्रमांक', payload.mobile]
      ];
      if (payload.email) rows.push(['ईमेल', payload.email]);

      summary.innerHTML = '<dl>' +
        rows.map(function (r) { return '<dt>' + escapeHtml(r[0]) + '</dt><dd>' + escapeHtml(r[1]) + '</dd>'; }).join('') +
        '</dl>' +
        '<dl class="success__picks">' +
        payload.registrations.map(function (r) {
          var line = r.mode === 'online'
            ? 'ऑनलाइन स्पर्धा · ' + (r.status === 'pending-confirmation' ? 'अंतिम पुष्टी बाकी' : 'नोंदणी झाली')
            : escapeHtml(r.group) + ' — ' + escapeHtml(r.topic);
          return '<dt>' + escapeHtml(r.competition) + '</dt><dd>' + line + '</dd>';
        }).join('') +
        '</dl>';
    }

    var pendingNote = qs('#successPendingNote');
    if (pendingNote) {
      pendingNote.hidden = !hasPending;
      pendingNote.innerHTML = icon('#i-info') +
        '<span>ऑनलाइन स्पर्धांची पात्रता व नियम अद्याप निश्चित झाले नसल्याने, त्या नोंदणीची ' +
        'अंतिम पुष्टी आयोजकांकडून केली जाईल.</span>';
    }

    successCard.hidden = false;
    scrollTo(successCard, 'start');
  }

  /* ------------------------------------------------------------------ boot */
  function init() {
    /* Guard against the script ever being included twice. */
    if (window.__festivalInitialised) return;
    window.__festivalInitialised = true;

    renderHeader();
    renderFooter();
    initNav();
    initHeaderScroll();

    var page = document.body.getAttribute('data-page');
    if (page === 'home') {
      renderHomeCards();
      renderEligibilityOverview();
      renderExplorer();
      renderOnlineStrip();
      renderFaq();
    } else if (page === 'competition') {
      renderCompetitionPage();
    } else if (page === 'registration') {
      initRegistration();
    }

    initReveal();
  }

  /* The sprite lives at the top of <body> and site.js at the end of it, so the
     artwork can be injected straight away — no icon flash. */
  injectSprite();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
