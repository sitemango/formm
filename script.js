/* =============================================================================
   बालसंस्कार फेस्टिवल २०२६ — website behaviour
   -----------------------------------------------------------------------------
   Vanilla JS, no dependencies. All competition data lives in the DATA object
   below; cards, detail sections, the class explorer and the registration
   form are all rendered from it, so there is a single source of truth.

   GOOGLE SHEETS INTEGRATION
   -------------------------
   Set `CONFIG.registrationEndpoint` to the /exec URL of a Google Apps Script
   web app (Deploy → New deployment → Web app → Execute as: Me,
   Access: Anyone). Until that is set, the form validates normally but
   refuses to pretend the submission succeeded.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- config */
  var CONFIG = {
    // Example: 'https://script.google.com/macros/s/AKfycb......../exec'
    registrationEndpoint: '',
    requestTimeoutMs: 15000
  };

  /* ------------------------------------------------------------------ data */
  /* Standard order is meaningful: the index is used for eligibility ranges. */
  var STANDARDS = [
    'बालवाडी',
    'इयत्ता १ ली',
    'इयत्ता २ री',
    'इयत्ता ३ री',
    'इयत्ता ४ थी',
    'इयत्ता ५ वी',
    'इयत्ता ६ वी',
    'इयत्ता ७ वी',
    'इयत्ता ८ वी',
    'इयत्ता ९ वी',
    'इयत्ता १० वी'
  ];

  var COMPETITIONS = [
    {
      id: 'chitrakala',
      name: 'चित्रकला स्पर्धा',
      icon: '#i-paint',
      gradient: 'linear-gradient(135deg, #F2A63B 0%, #E8890C 48%, #C1272D 100%)',
      blurb: 'रंग, कुंचला आणि कल्पनाशक्ती — आपल्या कल्पनांना कागदावर मूर्त रूप द्या.',
      from: 0,
      to: 10,
      groups: [
        {
          from: 0, to: 1,
          label: 'गट १ — बालवाडी ते इयत्ता १ ली',
          note: 'फक्त रंगभरणी',
          topics: ['गणपती', 'कृष्ण', 'कार', 'रंगीत फुलपाखरे']
        },
        {
          from: 2, to: 4,
          label: 'गट २ — इयत्ता २ री ते ४ थी',
          topics: [
            'आवडते खेळ आणि खेळ मैदान',
            'माझा आवडता पाळीव प्राणी',
            'पावसाळ्याची मजा (छत्री आणि रेनकोट)',
            'माझे कुटुंब'
          ]
        },
        {
          from: 5, to: 7,
          label: 'गट ३ — इयत्ता ५ वी ते ७ वी',
          topics: [
            'माझे प्रदूषणमुक्त शिरवळ गाव',
            'निसर्गाची जादू आणि संवर्धन',
            'ऐतिहासिक किल्ला',
            'स्मार्ट गाव — माझे गाव'
          ]
        },
        {
          from: 8, to: 10,
          label: 'गट ४ — इयत्ता ८ वी ते १० वी',
          topics: [
            'डिजिटल इंडिया — एक पाऊल पुढे',
            'अंतरिक्ष संशोधन आणि मंगळ मोहीम',
            'चंद्रयान मोहिमेचे यश',
            'पाण्याचे महत्त्व आणि जलसंवर्धन',
            'व्यसनमुक्त आणि सुंदर शिरवळ'
          ]
        }
      ]
    },
    {
      id: 'mehndi',
      name: 'मेहंदी स्पर्धा',
      icon: '#i-mehndi',
      gradient: 'linear-gradient(135deg, #4E9E63 0%, #1E7A52 100%)',
      blurb: 'पारंपरिक नक्षी आणि आधुनिक डिझाईन यांचा संगम सादर करा.',
      from: 5,
      to: 10,
      groups: [
        {
          from: 5, to: 7,
          label: 'गट १ — इयत्ता ५ वी ते ७ वी',
          topics: [
            'आधुनिक फुलपाखरू व वेली डिझाईन',
            'मोर पिस डिझाईन',
            'वर्तुळाकार आधुनिक डिझाईन',
            'फिंगर पॅटर्न मेहंदी'
          ]
        },
        {
          from: 8, to: 10,
          label: 'गट २ — इयत्ता ८ वी ते १० वी',
          topics: [
            'भारतीय संस्कृती आणि सण थीम',
            'आधुनिक अरेबियन आणि इंडो-वेस्टर्न डिझाईन',
            'लग्नसोहळा स्पेशल फ्युजन डिझाईन',
            'ब्रायडल (वधू) स्टाईल पूर्ण हात रचना'
          ]
        }
      ]
    },
    {
      id: 'nibandh',
      name: 'निबंध स्पर्धा',
      icon: '#i-essay',
      gradient: 'linear-gradient(135deg, #8E2532 0%, #7A1F2B 55%, #5C131C 100%)',
      blurb: 'आपले विचार, अनुभव आणि कल्पना शब्दांतून प्रभावीपणे मांडा.',
      from: 5,
      to: 10,
      groups: [
        {
          from: 5, to: 6,
          label: 'गट १ — इयत्ता ५ वी ते ६ वी',
          topics: [
            'माझा आवडता सण आणि पर्यावरणपूरक सादरीकरण',
            'जर मी पुस्तकांच्या जगतात एक दिवस अडकलो/अडकले तर...',
            'माझ्या गावातील किंवा परिसरातील एक सुंदर निसर्गरम्य जागा',
            'मोबाइलचा अतिवापर: फायदे आणि तोटे',
            'एक झाड, माझा खरा मित्र'
          ]
        },
        {
          from: 7, to: 8,
          label: 'गट २ — इयत्ता ७ वी ते ८ वी',
          topics: [
            'माझे आदर्श व्यक्तिमत्त्व: छत्रपती शिवाजी महाराज / डॉ. बाबासाहेब आंबेडकर',
            'क्रीडांगण विसरत चाललेले आजचे तरुण आणि मोबाईल गेमिंग',
            'एक पाऊल स्वच्छतेकडे: माझी जबाबदारी',
            'कृत्रिम बुद्धिमत्ता (AI) आणि विद्यार्थ्यांचे भविष्य',
            'वाचन संस्कृती: आजची गरज आणि महत्त्व'
          ]
        },
        {
          from: 9, to: 10,
          label: 'गट ३ — इयत्ता ९ वी ते १० वी',
          topics: [
            'ग्लोबल वॉर्मिंग (जागतिक तापमानवाढ) आणि आपले भविष्य',
            'सोशल मीडिया: वरदान की शाप?',
            'माझा आवडता वैज्ञानिक आणि त्याचे विज्ञान जगतातील योगदान',
            'भारतीय संस्कृती आणि आधुनिक जीवनशैली यांचा मेळ',
            'ग्रामविकास आणि युवकांची भूमिका: शिरवळच्या विकासासाठी माझा दृष्टिकोन'
          ]
        }
      ]
    },
    {
      id: 'vaktrutva',
      name: 'वक्तृत्व स्पर्धा',
      icon: '#i-speech',
      gradient: 'linear-gradient(135deg, #E8890C 0%, #C99A3C 100%)',
      blurb: 'आत्मविश्वासाने बोला, विचार मांडा आणि श्रोत्यांची मने जिंका.',
      from: 4,
      to: 10,
      groups: [
        {
          from: 4, to: 6,
          label: 'गट १ — इयत्ता ४ थी ते ६ वी',
          topics: [
            'माझा लाडका मोबाईल मित्र की शत्रू?',
            'जर मी झाड झालो तर...',
            'माझी पहिली सहल',
            'माझे आवडते कार्टून पात्र आणि मी',
            'खेळल्याने खरी मजा येते'
          ]
        },
        {
          from: 7, to: 8,
          label: 'गट २ — इयत्ता ७ वी ते ८ वी',
          topics: [
            'आजचे बालपण आणि निसर्ग',
            'मोबाईलमुळे हरवलेले मैदानी खेळ',
            'माझा आवडता वैज्ञानिक',
            'वाचन संस्कृती आणि आजची पिढी',
            'छत्रपती शिवाजी महाराज — माझे प्रेरणास्थान'
          ]
        },
        {
          from: 9, to: 10,
          label: 'गट ३ — इयत्ता ९ वी ते १० वी',
          topics: [
            'कृत्रिम बुद्धिमत्ता (AI) आणि विद्यार्थ्यांचे भविष्य',
            'सोशल मीडिया: दिशा की दशा?',
            'आजच्या तरुणांसमोरील करिअरच्या नवीन वाटा',
            'व्यसनमुक्ती काळाची गरज',
            'ग्लोबल वॉर्मिंग आणि आपले कर्तव्य'
          ]
        }
      ]
    },
    {
      id: 'ekpatri',
      name: 'एकपात्री नाट्य अभिनय स्पर्धा',
      icon: '#i-drama',
      gradient: 'linear-gradient(135deg, #C1272D 0%, #7A1F2B 100%)',
      blurb: 'अभिनय, आवाज आणि हावभाव — एकट्याने एक संपूर्ण कथा सादर करा.',
      from: 4,
      to: 10,
      groups: [
        {
          from: 4, to: 6,
          label: 'गट १ — इयत्ता ४ थी ते ६ वी',
          topics: [
            'आईस्क्रीम आणि माझी मस्ती',
            'मी आणि माझा पहिला होमवर्क',
            'ऑनलाइन क्लासचा दिवस — एक धमाल',
            'बाबांचे ऑफिस व माझी मस्ती'
          ]
        },
        {
          from: 7, to: 8,
          label: 'गट २ — इयत्ता ७ वी ते ८ वी',
          topics: [
            'मोबाईल हरवल्यावरील माझी अवस्था',
            'परीक्षा संपल्यावरचा पहिला आनंद',
            'मी एक झाड बोलतोय...',
            'शाळेचा पहिला तास आणि शिक्षक'
          ]
        },
        {
          from: 9, to: 10,
          label: 'गट ३ — इयत्ता ९ वी ते १० वी',
          topics: [
            'छत्रपती शिवाजी महाराजांचा एक प्रसंग',
            'एका शेतकऱ्याची आर्त हाक',
            'सायबर गुन्हे आणि सावध तरुण',
            'मोबाईलच्या आहारी गेलेले आजचे मन',
            'एका दिव्यांग विद्यार्थ्याचा आत्मविश्वास'
          ]
        }
      ]
    },
    {
      id: 'rangoli',
      name: 'रांगोळी स्पर्धा',
      icon: '#i-rangoli',
      gradient: 'linear-gradient(135deg, #1E7A52 0%, #10696F 100%)',
      blurb: 'रंग, रेषा आणि आकारांच्या मांडणीने परिसर उजळून टाका.',
      from: 5,
      to: 10,
      groups: [
        {
          from: 5, to: 7,
          label: 'गट १ — इयत्ता ५ वी ते ७ वी',
          topics: [
            'मोर पक्षी डिझाईन रांगोळी',
            'भूमितिक आकारांची आधुनिक रांगोळी',
            'फुलांची आकर्षक पानांची सजावट रांगोळी',
            'बालकलाकार विशेष निसर्ग रांगोळी'
          ]
        },
        {
          from: 8, to: 10,
          label: 'गट २ — इयत्ता ८ वी ते १० वी',
          topics: [
            "'बेटी बचाओ, बेटी पढाओ' सामाजिक संदेश रांगोळी",
            'डिजिटल भारत आणि तंत्रज्ञान थीम रांगोळी',
            'चंद्रयान मोहीम गौरव रांगोळी',
            'सुंदर शिरवळ — स्वच्छ शिरवळ संदेश रांगोळी',
            'एकता आणि राष्ट्रीय अखंडता रांगोळी'
          ]
        }
      ]
    }
  ];

  /* --------------------------------------------------------------- helpers */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function standardLabel(index) { return STANDARDS[index]; }

  function rangeText(from, to) {
    if (from === to) return standardLabel(from);
    /* "इयत्ता ५ वी ते १० वी" reads better than repeating the word इयत्ता. */
    var toLabel = (from >= 1 && to >= 1) ? standardLabel(to).replace(/^इयत्ता\s*/, '') : standardLabel(to);
    return standardLabel(from) + ' ते ' + toLabel;
  }

  function groupFor(competition, standardIndex) {
    for (var i = 0; i < competition.groups.length; i++) {
      var g = competition.groups[i];
      if (standardIndex >= g.from && standardIndex <= g.to) return g;
    }
    return null;
  }

  function isEligible(competition, standardIndex) {
    return standardIndex >= competition.from && standardIndex <= competition.to;
  }

  function eligibleCompetitions(standardIndex) {
    return COMPETITIONS.filter(function (c) { return isEligible(c, standardIndex); });
  }

  /* ------------------------------------------------------- header + nav UI */
  function initHeader() {
    var header = $('#siteHeader');
    if (!header) return;

    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initNav() {
    var toggle = $('#navToggle');
    var nav = $('#primaryNav');
    if (!toggle || !nav) return;

    var closeNav = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'मेनू उघडा');
    };

    var openNav = function () {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'मेनू बंद करा');
    };

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) closeNav(); else openNav();
    });

    // Close after navigating to a section (including the mobile CTA).
    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { closeNav(); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  function initActiveLink() {
    var links = $$('.nav__link');
    var sections = links
      .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  function initReveal() {
    var items = $$('.section-head, .card, .comp, .explorer, .register-card');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }

    items.forEach(function (item) { item.classList.add('reveal'); });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    items.forEach(function (item) { observer.observe(item); });
  }

  /* ------------------------------------------------------ overview cards */
  function renderCards() {
    var host = $('#competitionCards');
    if (!host) return;

    var html = COMPETITIONS.map(function (c) {
      return '' +
        '<article class="card" style="--card-grad:' + c.gradient + '">' +
          '<span class="card__icon"><svg class="icon" aria-hidden="true"><use href="' + c.icon + '"/></svg></span>' +
          '<h3 class="card__title">' + escapeHtml(c.name) + '</h3>' +
          '<span class="card__elig">पात्रता: ' + escapeHtml(rangeText(c.from, c.to)) + '</span>' +
          '<p class="card__desc">' + escapeHtml(c.blurb) + '</p>' +
          '<p class="card__meta">' + c.groups.length + ' गट · ' + totalTopics(c) + ' विषय</p>' +
          '<button class="card__btn" type="button" data-open-competition="' + c.id + '">' +
            'विषय पहा <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>' +
          '</button>' +
        '</article>';
    }).join('');

    host.insertAdjacentHTML('beforeend', html);

    $$('[data-open-competition]', host).forEach(function (btn) {
      btn.addEventListener('click', function () { openCompetition(btn.getAttribute('data-open-competition')); });
    });
  }

  function totalTopics(competition) {
    return competition.groups.reduce(function (sum, g) { return sum + g.topics.length; }, 0);
  }

  function openCompetition(id) {
    var details = document.getElementById('comp-' + id);
    if (!details) return;
    if (!details.open) details.open = true;
    scrollTo(details, 'start');
    var summary = $('summary', details);
    if (summary) {
      window.setTimeout(function () { summary.focus({ preventScroll: true }); }, 420);
    }
  }

  /* ------------------------------------------------- competition details */
  function renderDetails() {
    var host = $('#competitionDetails');
    if (!host) return;

    host.innerHTML = COMPETITIONS.map(function (c, index) {
      var groupsHtml = c.groups.map(function (g, gi) {
        var topics = g.topics.map(function (t) {
          return '<li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>' + escapeHtml(t) + '</span></li>';
        }).join('');

        return '' +
          '<div class="group">' +
            '<h4 class="group__title">' +
              '<span class="group__badge">गट ' + toMarathi(gi + 1) + '</span>' +
              '<span>' + escapeHtml(g.label.replace(/^गट\s*[०-९\d]+\s*—\s*/, '')) + '</span>' +
              (g.note ? '<span class="group__note">' + escapeHtml(g.note) + '</span>' : '') +
            '</h4>' +
            '<ul class="topics">' + topics + '</ul>' +
          '</div>';
      }).join('');

      return '' +
        '<details class="comp" id="comp-' + c.id + '" style="--card-grad:' + c.gradient + '"' + (index === 0 ? ' open' : '') + '>' +
          '<summary>' +
            '<span class="comp__icon"><svg class="icon" aria-hidden="true"><use href="' + c.icon + '"/></svg></span>' +
            '<span class="comp__heading">' +
              '<h3 class="comp__name">' + escapeHtml(c.name) + '</h3>' +
              '<p class="comp__elig">पात्रता: ' + escapeHtml(rangeText(c.from, c.to)) + ' · गट आणि विषय इयत्तेनुसार</p>' +
            '</span>' +
            '<span class="comp__toggle" aria-hidden="true"><svg class="icon"><use href="#i-arrow"/></svg></span>' +
          '</summary>' +
          '<div class="comp__body">' + groupsHtml + '</div>' +
        '</details>';
    }).join('');
  }

  var MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  function toMarathi(number) {
    return String(number).replace(/\d/g, function (d) { return MARATHI_DIGITS[Number(d)]; });
  }

  /* -------------------------------------------------- standard <select>s */
  function fillStandardSelects() {
    $$('#standard, #explorerStandard').forEach(function (select) {
      STANDARDS.forEach(function (label, index) {
        var option = document.createElement('option');
        option.value = String(index);
        option.textContent = label;
        select.appendChild(option);
      });
    });
  }

  /* ------------------------------------------------------- class explorer */
  function initExplorer() {
    var select = $('#explorerStandard');
    var results = $('#explorerResults');
    var hint = $('#explorerHint');
    if (!select || !results) return;

    var renderEmpty = function (message) {
      results.innerHTML = '<p class="explorer__empty">' + escapeHtml(message) + '</p>';
    };

    select.addEventListener('change', function () {
      var value = select.value;
      if (value === '') {
        renderEmpty('इयत्ता निवडल्यानंतर येथे पात्र स्पर्धा आणि विषय दिसतील.');
        if (hint) hint.textContent = 'इयत्ता निवडल्यानंतर येथे पात्र स्पर्धा आणि विषय दिसतील.';
        return;
      }

      var index = Number(value);
      if (hint) {
        hint.innerHTML = 'निवडलेली इयत्ता: <strong>' + escapeHtml(standardLabel(index)) + '</strong>';
      }

      var cards = COMPETITIONS.map(function (c) {
        if (!isEligible(c, index)) {
          return '' +
            '<article class="ex-card ex-card--off" style="--card-grad:#C9BBA6">' +
              '<div class="ex-card__head">' +
                '<span class="ex-card__icon"><svg class="icon" aria-hidden="true"><use href="' + c.icon + '"/></svg></span>' +
                '<div><h3 class="ex-card__name">' + escapeHtml(c.name) + '</h3></div>' +
              '</div>' +
              '<p class="ex-card__off-text">या इयत्तेसाठी उपलब्ध नाही · पात्रता: ' + escapeHtml(rangeText(c.from, c.to)) + '</p>' +
            '</article>';
        }

        var group = groupFor(c, index);
        var topics = group.topics.map(function (t) {
          return '<li><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>' + escapeHtml(t) + '</span></li>';
        }).join('');

        return '' +
          '<article class="ex-card" style="--card-grad:' + c.gradient + '">' +
            '<div class="ex-card__head">' +
              '<span class="ex-card__icon"><svg class="icon" aria-hidden="true"><use href="' + c.icon + '"/></svg></span>' +
              '<div>' +
                '<h3 class="ex-card__name">' + escapeHtml(c.name) + '</h3>' +
                '<p class="ex-card__group">गट: <strong>' + escapeHtml(group.label.replace(/^गट\s*[०-९\d]+\s*—\s*/, '')) + '</strong>' +
                  (group.note ? ' · ' + escapeHtml(group.note) : '') + '</p>' +
              '</div>' +
            '</div>' +
            '<ul class="topics">' + topics + '</ul>' +
          '</article>';
      }).join('');

      results.innerHTML = '<div class="ex-results">' + cards + '</div>';
    });

    renderEmpty('इयत्ता निवडल्यानंतर येथे पात्र स्पर्धा आणि विषय दिसतील.');
  }

  /* --------------------------------------------------------- registration */
  var selection = []; // [{ id, topic }]

  function initRegistration() {
    var form = $('#registrationForm');
    var standardSelect = $('#standard');
    var selectionList = $('#selectionList');
    var selectionEmpty = $('#selectionEmpty');
    var pickedStandard = $('#pickedStandard');
    var configNote = $('#configNote');
    var statusBox = $('#formStatus');

    if (!form || !standardSelect || !selectionList) return;

    if (configNote && !CONFIG.registrationEndpoint) configNote.hidden = false;

    /* Only digits in the mobile field. */
    var mobile = $('#mobile');
    if (mobile) {
      mobile.addEventListener('input', function () {
        mobile.value = mobile.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    /* Changing the standard resets the competition selection entirely,
       because groups and topics are derived from it. */
    standardSelect.addEventListener('change', function () {
      var previous = selection.length;
      selection = [];
      hideStatus();
      clearError($('#err-competitions'));

      if (standardSelect.value === '') {
        selectionList.innerHTML = '';
        if (selectionEmpty) selectionEmpty.hidden = false;
        if (pickedStandard) {
          pickedStandard.hidden = true;
          pickedStandard.innerHTML = '';
        }
        return;
      }

      var index = Number(standardSelect.value);
      renderSelectionCards(index);

      if (pickedStandard) {
        pickedStandard.hidden = false;
        pickedStandard.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>' +
          '<span><strong>' + escapeHtml(standardLabel(index)) + '</strong> साठी ' +
          toMarathi(eligibleCompetitions(index).length) + ' पात्र स्पर्धा उपलब्ध आहेत. आवडीच्या स्पर्धा निवडा' +
          (previous ? ' (इयत्ता बदलल्यामुळे मागील निवड रद्द केली आहे).' : '.') + '</span>';
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitRegistration(form);
    });

    form.addEventListener('reset', function () {
      window.setTimeout(function () {
        selection = [];
        selectionList.innerHTML = '';
        if (selectionEmpty) selectionEmpty.hidden = false;
        if (pickedStandard) { pickedStandard.hidden = true; pickedStandard.innerHTML = ''; }
        clearAllErrors(form);
        hideStatus();
      }, 0);
    });

    var newBtn = $('#newRegistrationBtn');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        var success = $('#successCard');
        if (success) success.hidden = true;
        form.hidden = false;
        form.reset();
        selection = [];
        selectionList.innerHTML = '';
        if (selectionEmpty) selectionEmpty.hidden = false;
        if (pickedStandard) { pickedStandard.hidden = true; pickedStandard.innerHTML = ''; }
        scrollTo(form, 'start');
      });
    }

    /* Clear a field's error as soon as the user fixes it. */
    $$('.field__input', form).forEach(function (input) {
      input.addEventListener('input', function () { clearFieldError(input); });
      input.addEventListener('change', function () { clearFieldError(input); });
    });

    var declaration = $('#declaration');
    if (declaration) {
      declaration.addEventListener('change', function () {
        if (declaration.checked) {
          clearError($('#err-declaration'));
          var wrap = declaration.closest('.check');
          if (wrap) wrap.classList.remove('is-invalid');
        }
      });
    }
  }

  function renderSelectionCards(standardIndex) {
    var selectionList = $('#selectionList');
    var selectionEmpty = $('#selectionEmpty');
    var list = eligibleCompetitions(standardIndex);

    if (!list.length) {
      selectionList.innerHTML = '<p class="selection__empty"><svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>' +
        '<span>या इयत्तेसाठी सध्या कोणतीही स्पर्धा उपलब्ध नाही.</span></p>';
      if (selectionEmpty) selectionEmpty.hidden = true;
      return;
    }

    if (selectionEmpty) selectionEmpty.hidden = true;

    selectionList.innerHTML = list.map(function (c) {
      var group = groupFor(c, standardIndex);
      return '' +
        '<div class="comp-pick" data-comp-pick="' + c.id + '" style="--card-grad:' + c.gradient + '">' +
          '<div class="comp-pick__top">' +
            '<span class="comp-pick__icon"><svg class="icon" aria-hidden="true"><use href="' + c.icon + '"/></svg></span>' +
            '<span style="flex:1 1 auto; min-width:0;">' +
              '<label class="check" style="align-items:center;">' +
                '<input type="checkbox" value="' + c.id + '" data-comp-checkbox="' + c.id + '" />' +
                '<span class="check__box" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></span>' +
                '<span class="check__text">' +
                  '<span class="comp-pick__name">' + escapeHtml(c.name) + '</span>' +
                  '<span class="comp-pick__elig">पात्रता: ' + escapeHtml(rangeText(c.from, c.to)) + '</span>' +
                '</span>' +
              '</label>' +
            '</span>' +
          '</div>' +
          '<div class="comp-pick__body" data-comp-body="' + c.id + '" hidden>' +
            '<span class="comp-pick__group"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>' +
              'आपोआप निश्चित गट: ' + escapeHtml(group ? group.label.replace(/^गट\s*[०-९\d]+\s*—\s*/, '') : '—') +
              (group && group.note ? ' (' + escapeHtml(group.note) + ')' : '') +
            '</span>' +
            '<label class="field comp-pick__topic" for="topic-' + c.id + '">' +
              '<span class="field__label">विषय निवडा <abbr class="req" title="आवश्यक">*</abbr></span>' +
              '<span class="field__select">' +
                '<select class="field__input" id="topic-' + c.id + '" data-topic-select="' + c.id + '" aria-describedby="err-topic-' + c.id + '">' +
                  '<option value="">कृपया विषय निवडा</option>' +
                  (group ? group.topics.map(function (t) {
                    return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
                  }).join('') : '') +
                '</select>' +
                '<svg class="icon field__chevron" aria-hidden="true"><use href="#i-arrow"/></svg>' +
              '</span>' +
              '<span class="field__error" id="err-topic-' + c.id + '" role="alert"></span>' +
            '</label>' +
          '</div>' +
        '</div>';
    }).join('');

    $$('[data-comp-checkbox]', selectionList).forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        var id = checkbox.getAttribute('data-comp-checkbox');
        var pick = $('[data-comp-pick="' + id + '"]', selectionList);
        var body = $('[data-comp-body="' + id + '"]', selectionList);

        if (checkbox.checked) {
          if (!selection.some(function (s) { return s.id === id; })) selection.push({ id: id, topic: '' });
          if (pick) pick.classList.add('is-selected');
          if (body) body.hidden = false;
          clearError($('#err-competitions'));
        } else {
          selection = selection.filter(function (s) { return s.id !== id; });
          if (pick) pick.classList.remove('is-selected');
          if (body) {
            body.hidden = true;
            var select = $('select', body);
            if (select) select.value = '';
            clearError($('#err-topic-' + id));
          }
        }
      });
    });

    $$('[data-topic-select]', selectionList).forEach(function (select) {
      select.addEventListener('change', function () {
        var id = select.getAttribute('data-topic-select');
        var entry = selection.filter(function (s) { return s.id === id; })[0];
        if (entry) entry.topic = select.value;
        if (select.value) clearError($('#err-topic-' + id));
      });
    });
  }

  /* ------------------------------------------------------------ validation */
  var MOBILE_RE = /^[6-9]\d{9}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateForm(form) {
    var errors = [];

    var studentName = $('#studentName', form);
    var standard = $('#standard', form);
    var schoolName = $('#schoolName', form);
    var city = $('#city', form);
    var guardianName = $('#guardianName', form);
    var mobile = $('#mobile', form);
    var email = $('#email', form);

    clearAllErrors(form);

    /* 1. विद्यार्थ्याचे पूर्ण नाव */
    var nameValue = studentName.value.trim();
    if (!nameValue) {
      errors.push(setFieldError(studentName, 'कृपया विद्यार्थ्याचे पूर्ण नाव भरा.'));
    } else if (nameValue.length < 3) {
      errors.push(setFieldError(studentName, 'नाव किमान ३ अक्षरांचे असावे.'));
    }

    /* 2. इयत्ता */
    if (!standard.value) {
      errors.push(setFieldError(standard, 'कृपया इयत्ता निवडा.'));
    }

    /* 3. शाळेचे नाव */
    if (!schoolName.value.trim()) {
      errors.push(setFieldError(schoolName, 'कृपया शाळेचे नाव भरा.'));
    } else if (schoolName.value.trim().length < 2) {
      errors.push(setFieldError(schoolName, 'कृपया शाळेचे पूर्ण नाव भरा.'));
    }

    /* 4. गाव / शहर */
    if (!city.value.trim()) {
      errors.push(setFieldError(city, 'कृपया गाव / शहर भरा.'));
    }

    /* 5. पालकांचे किंवा संरक्षकाचे नाव */
    var guardianValue = guardianName.value.trim();
    if (!guardianValue) {
      errors.push(setFieldError(guardianName, 'कृपया पालकांचे किंवा संरक्षकाचे नाव भरा.'));
    } else if (guardianValue.length < 3) {
      errors.push(setFieldError(guardianName, 'नाव किमान ३ अक्षरांचे असावे.'));
    }

    /* 6. मोबाइल क्रमांक */
    var mobileValue = mobile.value.replace(/\D/g, '');
    if (!mobileValue) {
      errors.push(setFieldError(mobile, 'कृपया संपर्कासाठी मोबाइल क्रमांक भरा.'));
    } else if (!MOBILE_RE.test(mobileValue)) {
      errors.push(setFieldError(mobile, 'कृपया वैध १० अंकी मोबाइल क्रमांक भरा (६, ७, ८ किंवा ९ ने सुरू होणारा).'));
    }

    /* 7. ईमेल (ऐच्छिक) */
    var emailValue = email.value.trim();
    if (emailValue && !EMAIL_RE.test(emailValue)) {
      errors.push(setFieldError(email, 'कृपया वैध ईमेल पत्ता भरा.'));
    }

    /* 8. स्पर्धा निवड */
    if (!selection.length) {
      errors.push(setError($('#err-competitions'), 'कृपया किमान एका स्पर्धेसाठी नोंदणी करा.'));
    }

    /* 9. प्रत्येक निवडलेल्या स्पर्धेचा विषय */
    selection.forEach(function (entry) {
      if (!entry.topic) {
        errors.push(setError($('#err-topic-' + entry.id), 'कृपया या स्पर्धेसाठी विषय निवडा.'));
      }
    });

    /* 10. हमीपत्र */
    var declaration = $('#declaration', form);
    if (!declaration.checked) {
      var wrap = declaration.closest('.check');
      if (wrap) wrap.classList.add('is-invalid');
      errors.push(setError($('#err-declaration'), 'कृपया हमीपत्र वाचून सहमती द्या.'));
    }

    return errors.filter(Boolean);
  }

  function setFieldError(input, message) {
    var field = input.closest('.field');
    if (field) field.classList.add('is-invalid');
    var target = $('#err-' + input.id);
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
    var target = $('#err-' + input.id);
    if (target) target.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function clearError(node) {
    if (!node) return;
    node.textContent = '';
    node.style.display = '';
  }

  function clearAllErrors(form) {
    $$('.field', form).forEach(function (f) { f.classList.remove('is-invalid'); });
    $$('.field__error', form).forEach(function (e) { e.textContent = ''; e.style.display = ''; });
    $$('.check', form).forEach(function (c) { c.classList.remove('is-invalid'); });
    $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }

  function hideStatus() {
    var box = $('#formStatus');
    if (!box) return;
    box.hidden = true;
    box.className = 'form__status';
    box.innerHTML = '';
  }

  function showStatus(type, html) {
    var box = $('#formStatus');
    if (!box) return;
    box.hidden = false;
    box.className = 'form__status form__status--' + type;
    box.innerHTML = html;
  }

  function scrollTo(node, block) {
    if (!node) return;
    if (typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: block || 'center' });
    }
  }

  function focusFirstError() {
    var firstInvalid = $('.field.is-invalid .field__input, .check.is-invalid input, .field__error[style*="flex"]');
    if (firstInvalid) {
      scrollTo(firstInvalid, 'center');
      if (typeof firstInvalid.focus === 'function') {
        window.setTimeout(function () { firstInvalid.focus({ preventScroll: true }); }, 380);
      }
      return;
    }
    scrollTo($('#formStatus'), 'center');
  }

  /* -------------------------------------------------------------- submit */
  function buildPayload(form) {
    return {
      formType: 'balasanskar-festival-2026',
      submittedAt: new Date().toISOString(),
      studentName: $('#studentName', form).value.trim(),
      standard: standardLabel(Number($('#standard', form).value)),
      schoolName: $('#schoolName', form).value.trim(),
      city: $('#city', form).value.trim(),
      guardianName: $('#guardianName', form).value.trim(),
      mobile: $('#mobile', form).value.replace(/\D/g, ''),
      email: $('#email', form).value.trim(),
      registrations: selection.map(function (entry) {
        var competition = COMPETITIONS.filter(function (c) { return c.id === entry.id; })[0];
        var group = groupFor(competition, Number($('#standard', form).value));
        return {
          competition: competition.name,
          group: group ? group.label.replace(/^गट\s*[०-९\d]+\s*—\s*/, '') : '',
          topic: entry.topic
        };
      })
    };
  }

  function submitRegistration(form) {
    var errors = validateForm(form);

    if (errors.length) {
      showStatus('error',
        '<svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>' +
        '<div><strong>कृपया खालील चुका दुरुस्त करा:</strong><ul>' +
        errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') +
        '</ul></div>');
      focusFirstError();
      return;
    }

    hideStatus();

    /* No backend configured → be explicit, never fake success. */
    if (!CONFIG.registrationEndpoint) {
      showStatus('info',
        '<svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>' +
        '<div><strong>नोंदणी पाठवली गेली नाही.</strong><br/>' +
        'सध्या ऑनलाइन नोंदणीसाठी Google Apps Script endpoint कॉन्फिगर केलेला नाही, त्यामुळे आपली माहिती ' +
        'कुठेही पाठवली गेली नाही. कृपया आयोजकांशी थेट संपर्क करून नोंदणी पूर्ण करा.</div>');
      return;
    }

    var payload = buildPayload(form);
    var button = $('#submitBtn');
    var originalLabel = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'पाठवत आहे...';
    }

    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, CONFIG.requestTimeoutMs);

    /* text/plain keeps the request "simple" so Google Apps Script web apps
       answer without a CORS preflight. The Apps Script reads the JSON via
       JSON.parse(e.postData.contents). */
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
        selection = [];
        var selectionList = $('#selectionList');
        if (selectionList) selectionList.innerHTML = '';
        var selectionEmpty = $('#selectionEmpty');
        if (selectionEmpty) selectionEmpty.hidden = false;
        var pickedStandard = $('#pickedStandard');
        if (pickedStandard) { pickedStandard.hidden = true; pickedStandard.innerHTML = ''; }
      })
      .catch(function (error) {
        var message = error && error.name === 'AbortError'
          ? 'विनंती पूर्ण होण्यास जास्त वेळ लागला. कृपया आपले इंटरनेट कनेक्शन तपासून पुन्हा प्रयत्न करा.'
          : 'नोंदणी पाठवताना तांत्रिक अडचण आली. आपली माहिती सुरक्षितपणे पोहोचली नसल्यास कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.';
        showStatus('error',
          '<svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>' +
          '<div><strong>नोंदणी पूर्ण झाली नाही.</strong><br/>' + escapeHtml(message) + '</div>');
      })
      .finally(function () {
        window.clearTimeout(timer);
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      });
  }

  function showSuccess(payload) {
    var successCard = $('#successCard');
    var summary = $('#successSummary');
    if (!successCard) return;

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
        rows.map(function (row) {
          return '<dt>' + escapeHtml(row[0]) + '</dt><dd>' + escapeHtml(row[1]) + '</dd>';
        }).join('') +
        '</dl>' +
        '<dl style="margin-top:14px; border-top:1px dashed var(--line); padding-top:14px;">' +
        payload.registrations.map(function (r) {
          return '<dt>' + escapeHtml(r.competition) + '</dt><dd>' + escapeHtml(r.group) + ' — ' + escapeHtml(r.topic) + '</dd>';
        }).join('') +
        '</dl>';
    }

    successCard.hidden = false;
    scrollTo(successCard, 'start');
  }

  /* --------------------------------------------------------------- boot */
  function init() {
    initHeader();
    initNav();
    fillStandardSelects();
    renderCards();
    renderDetails();
    initExplorer();
    initRegistration();
    initActiveLink();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
