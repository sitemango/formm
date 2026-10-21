/* =============================================================================
   tests/runtime.js — jsdom runtime checks for बालसंस्कार फेस्टिवल २०२६
   -----------------------------------------------------------------------------
   Unlike tests/verify.js (which inspects the source), this harness really boots
   the pages: it runs data.js + site.js in jsdom and drives the rendered DOM.

     • homepage carousel  — every manifest image is a slide, navigation, wrap
                            around, counter, dots, keyboard, deleting bad files
     • Reel Star          — the page itself, homepage card, schedule, explorer
     • registration       — preselect, class eligibility, payload, success card
     • WhatsApp           — every rendered button uses the exact invitation URL

   Run with:  npm run test:runtime
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

let pass = 0;
const failures = [];

function check(condition, message) {
  if (condition) pass++;
  else { failures.push(message); console.error('  FAIL: ' + message); }
}

function text(node) { return node ? node.textContent.replace(/\s+/g, ' ').trim() : ''; }

async function boot(file, search, beforeParse) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => {
    /* image/font/network noise is irrelevant here — only real script errors count */
    if (!/Could not load|not implemented|css/i.test(String(e.message))) errors.push(e.message);
  });
  virtualConsole.on('error', (m) => errors.push(String(m)));

  /* a file:// URL keeps relative data.js / site.js loading from disk while the
     query string still drives registration.html?competition=… */
  const url = pathToFileURL(path.join(ROOT, file)).href + (search || '');
  const dom = await JSDOM.fromFile(path.join(ROOT, file), {
    url,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse: beforeParse || function () {}
  });

  await new Promise((resolve) => {
    if (dom.window.document.readyState === 'complete') return resolve();
    dom.window.addEventListener('load', resolve);
    setTimeout(resolve, 4000);
  });
  /* let the deferred paints / timers of site.js settle */
  await new Promise((r) => setTimeout(r, 250));
  return { dom, window: dom.window, document: dom.window.document, errors };
}

function fillRegistration(doc) {
  const w = doc.defaultView;
  const set = (id, value) => {
    const el = doc.getElementById(id);
    el.value = value;
    el.dispatchEvent(new w.Event('input', { bubbles: true }));
    el.dispatchEvent(new w.Event('change', { bubbles: true }));
    return el;
  };
  set('studentName', 'रोहन अमोल शिंदे');
  set('standard', '6');
  set('schoolName', 'शिरवळ विद्यालय');
  set('city', 'शिरवळ');
  set('guardianName', 'अमोल शिंदे');
  set('mobile', '9822112233');
  const declaration = doc.getElementById('declaration');
  declaration.checked = true;
  declaration.dispatchEvent(new w.Event('change', { bubbles: true }));
}

function stubFetch(win, response) {
  const calls = [];
  win.fetch = (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) });
    return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(response)) });
  };
  return calls;
}

(async function run() {
  console.log('--- Runtime checks (jsdom) ---');

  /* =======================================================================
     1. HOMEPAGE — carousel
     ===================================================================== */
  console.log('\n[1/4] Homepage carousel...');
  {
    const { dom, window, document, errors } = await boot('index.html');
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8')
      .match(/"images":\s*(\[[\s\S]*?\n    \])/)[1]);
    const slides = [...document.querySelectorAll('.carousel__slide')];
    const dots = [...document.querySelectorAll('.carousel__dot')];
    const counter = document.getElementById('carouselCount');

    check(document.getElementById('gallery').hidden === false, 'Gallery section is visible');
    check(slides.length === manifest.length, `All ${manifest.length} manifest images render as slides (got ${slides.length})`);
    check(dots.length === manifest.length, `Pagination has one dot per image (${dots.length})`);
    check(slides.every(s => s.querySelector('.carousel__img').getAttribute('alt')), 'Every slide has alt text');

    /* every committed gallery photograph is present, in manifest order; the
       अध्यक्ष portrait (logo-left.png) belongs to the hero, never to the gallery */
    const srcs = slides.map(s => s.querySelector('.carousel__img').getAttribute('src'));
    const repoImages = fs.readdirSync(ROOT)
      .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f) && fs.statSync(path.join(ROOT, f)).isFile()
        && f !== 'logo-left.png');
    check(repoImages.every(f => srcs.includes(f)), 'No repository photograph is missing from the carousel');
    check(!srcs.includes('logo-left.png'), 'The अध्यक्ष portrait is not a carousel slide');
    check(srcs[0] === manifest[0].src && srcs[srcs.length - 1] === manifest[manifest.length - 1].src,
      'First and last manifest images are the first and last slides');

    check(text(counter) === '१ / ' + String(manifest.length).replace(/\d/g, d => '०१२३४५६७८९'[+d]),
      'Counter shows १ / total on load');
    check(slides[0].classList.contains('is-active'), 'First slide is active on load');
    check(document.querySelectorAll('.carousel__nav').length === 2, 'Both arrows are rendered');

    const next = document.getElementById('carouselNext');
    const prev = document.getElementById('carouselPrev');
    const activeIndex = () => [...document.querySelectorAll('.carousel__slide')].findIndex(s => s.classList.contains('is-active'));

    next.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check(activeIndex() === 1, 'Next arrow moves to slide 2');

    /* middle */
    for (let i = 0; i < 20; i++) next.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check(activeIndex() === 21, 'Next arrow reaches the middle of the gallery');

    /* end + wrap */
    for (let i = 0; i < manifest.length * 2; i++) next.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const afterMany = activeIndex();
    check(afterMany >= 0 && afterMany < manifest.length, 'Next arrow always lands on a real slide');
    prev.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    next.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check(activeIndex() === afterMany, 'Previous + next return to the same slide');

    /* dots jump to the last image and back to the first */
    const allDots = () => [...document.querySelectorAll('.carousel__dot')];
    allDots()[allDots().length - 1].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check(activeIndex() === manifest.length - 1, 'Last dot selects the last image');
    check(text(counter) === String(manifest.length).replace(/\d/g, d => '०१२३४५६७८९'[+d]) + ' / ' +
      String(manifest.length).replace(/\d/g, d => '०१२३४५६७८९'[+d]), 'Counter shows the last image at the end');
    allDots()[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    check(activeIndex() === 0, 'First dot selects the first image');

    /* keyboard */
    const carousel = document.getElementById('carousel');
    carousel.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    check(activeIndex() === 1, 'ArrowRight on the carousel advances');
    carousel.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    check(activeIndex() === 0, 'ArrowLeft on the carousel goes back');

    /* an image that cannot be decoded is dropped, never shown broken */
    const before = document.querySelectorAll('.carousel__slide').length;
    const broken = document.querySelectorAll('.carousel__img')[3];
    broken.dispatchEvent(new window.Event('error'));
    const after = document.querySelectorAll('.carousel__slide').length;
    check(after === before - 1, 'A failed image removes exactly one slide');
    check(document.querySelectorAll('.carousel__dot').length === after,
      'Dots are rebuilt to match the remaining images');
    check(text(document.getElementById('carouselCount')).endsWith(
      String(after).replace(/\d/g, d => '०१२३४५६७८९'[+d])), 'Counter is rebuilt after a failed image');
    check([...document.querySelectorAll('.carousel__img')]
      .every(img => img.getAttribute('src') !== broken.getAttribute('src')),
      'The failed image is no longer rendered (no broken-image icon)');

    /* WhatsApp buttons on the homepage */
    const wa = [...document.querySelectorAll('[data-whatsapp-link]')];
    check(wa.length >= 4, `Homepage renders WhatsApp buttons in hero, header, footer and CTA (${wa.length})`);
    check(wa.every(a => a.getAttribute('href') === 'https://chat.whatsapp.com/CCTGjn1R4vgLxWYgTySjfq?mode=gi_t'),
      'Every WhatsApp button uses the exact invitation URL');
    check(wa.every(a => a.getAttribute('target') === '_blank' && /noopener/.test(a.getAttribute('rel'))),
      'Every WhatsApp button opens in a new tab with rel="noopener noreferrer"');
    check(wa.every(a => (a.getAttribute('aria-label') || '').trim().length > 0),
      'Every WhatsApp button has an accessible label');

    /* Reel Star on the homepage */
    const cards = [...document.querySelectorAll('#homeCards .ccard')];
    check(cards.length === 10, `Homepage shows 10 competition cards (${cards.length})`);
    const reelCard = cards.find(c => /reel-star\.html$/.test(c.getAttribute('href')));
    check(!!reelCard, 'Homepage has a Reel Star card linking to reel-star.html');
    check(/इयत्ता ५ वी ते १० वी/.test(text(reelCard)), 'Reel Star card shows इयत्ता ५ वी ते १० वी');
    check(/संध्याकाळी ५ वाजता/.test(text(reelCard)), 'Reel Star card shows the 5 pm deadline');
    check(!/वय/.test(text(reelCard)), 'Reel Star card carries no age wording');
    const chips = [...document.querySelectorAll('.hero__chips .chip')].map(c => text(c)).join(' | ');
    check(!/वय|वयोगट/.test(chips), 'Hero chips no longer show a Reel Star age rule: ' + chips);
    check(/२९ नोव्हेंबर २०२६/.test(text(reelCard)), 'Reel Star card shows the 29 November 2026 deadline');
    check(/ऑनलाइन/.test(text(reelCard)), 'Reel Star card is labelled as an online competition');

    const scheduleRows = [...document.querySelectorAll('#scheduleList .srow')];
    check(scheduleRows.length === 10, `Schedule lists all 10 competitions (${scheduleRows.length})`);
    const reelRow = scheduleRows.find(r => /रील स्टार/.test(text(r)));
    check(!!reelRow, 'Schedule includes Reel Star');
    check(/व्हिडिओ सबमिशनची अंतिम तारीख/.test(text(reelRow)), 'Schedule marks Reel Star as a video-submission deadline');
    check(/संध्याकाळी ५ वाजता/.test(text(reelRow)), 'Schedule shows the 5 pm Reel Star deadline');
    check(/२९ नोव्हेंबर २०२६/.test(text(reelRow)), 'Schedule shows २९ नोव्हेंबर २०२६ for Reel Star');
    check(/प्रत्यक्ष स्थळ किंवा वेळ लागू नाही/.test(text(reelRow)), 'Schedule never implies an in-person Reel Star event');

    const onlineCards = [...document.querySelectorAll('#onlineStrip .online-card')];
    check(onlineCards.length === 4, `Online strip lists all 4 online competitions (${onlineCards.length})`);
    check(onlineCards.some(c => /reel-star/.test(c.getAttribute('href'))), 'Online strip includes Reel Star');

    /* explorer filter — ইয়ত্তা based, so only the 5th–10th grades see Reel Star */
    const explorer = document.getElementById('explorerStandard');
    explorer.value = '4';
    explorer.dispatchEvent(new window.Event('change', { bubbles: true }));
    check(!/reel-star\.html/.test(document.getElementById('explorerResults').innerHTML),
      'Explorer hides Reel Star from इयत्ता ४ थी');
    explorer.value = '6';
    explorer.dispatchEvent(new window.Event('change', { bubbles: true }));
    check(/reel-star\.html/.test(document.getElementById('explorerResults').innerHTML),
      'Explorer lists Reel Star for इयत्ता ६ वी');
    check(/इयत्ता ५ वी ते १० वी/.test(text(document.getElementById('explorerResults'))),
      'Explorer shows the इयत्ता ५ वी ते १० वी eligibility for Reel Star');

    /* swipe */
    const stage = document.getElementById('carouselStage');
    const beforeSwipe = activeIndex();
    const touchStart = new window.Event('touchstart', { bubbles: true });
    const touchEnd = new window.Event('touchend', { bubbles: true });
    Object.defineProperty(touchStart, 'touches', { value: [{ clientX: 200 }] });
    Object.defineProperty(touchEnd, 'changedTouches', { value: [{ clientX: 120 }] });
    stage.dispatchEvent(touchStart);
    stage.dispatchEvent(touchEnd);
    check(activeIndex() === (beforeSwipe + 1) % document.querySelectorAll('.carousel__slide').length,
      'Swiping left moves to the next slide');

    check(errors.length === 0, 'No JavaScript errors on the homepage' + (errors.length ? ': ' + errors.join(' | ') : ''));
    dom.window.close();
  }

  /* autoplay runs when motion is allowed … */
  {
    let autoplayTick = null;
    const { dom, window, document } = await boot('index.html', '', (win) => {
      win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      const realSetInterval = win.setInterval;
      win.setInterval = function (fn, ms) {
        if (ms === 6000) { autoplayTick = fn; return 1; }
        return realSetInterval(fn, ms);
      };
    });
    await new Promise(r => setTimeout(r, 150));
    check(typeof autoplayTick === 'function', 'Autoplay timer is scheduled when motion is allowed');
    if (autoplayTick) {
      const idx = [...document.querySelectorAll('.carousel__slide')].findIndex(s => s.classList.contains('is-active'));
      autoplayTick();
      const after = [...document.querySelectorAll('.carousel__slide')].findIndex(s => s.classList.contains('is-active'));
      check(after === idx + 1, 'Autoplay advances to the next slide');
    }
    dom.window.close();
  }

  /* … and is switched off entirely under prefers-reduced-motion: reduce */
  {
    let intervalMs = [];
    const { dom, window } = await boot('index.html', '', (win) => {
      win.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
      const realSetInterval = win.setInterval;
      win.setInterval = function (fn, ms) { intervalMs.push(ms); return realSetInterval(fn, ms); };
    });
    await new Promise(r => setTimeout(r, 150));
    check(intervalMs.indexOf(6000) === -1, 'Autoplay is disabled under prefers-reduced-motion');
    dom.window.close();
  }

  /* =======================================================================
     2. REEL STAR PAGE
     ===================================================================== */
  console.log('\n[2/4] Reel Star competition page...');
  {
    const { dom, document, errors } = await boot('reel-star.html');
    const main = document.getElementById('competitionPage');
    check(/रील स्टार/.test(text(document.querySelector('.cp-head__title'))), 'Page heading is रील स्टार');
    check(document.title.includes('रील स्टार'), 'Document title is updated to रील स्टार');
    check(/इयत्ता ५ वी ते १० वी/.test(text(main)), 'Page states इयत्ता ५ वी ते १० वी eligibility');
    check(!/वय|वयोगट/.test(text(main)), 'Page carries no age wording');
    check(/स्वतंत्र गट नाहीत/.test(text(main)), 'Page explains that there are no separate groups');
    check(/ऑनलाइन स्पर्धा/.test(text(main)), 'Page is labelled as an online competition');
    check(/२९ नोव्हेंबर २०२६/.test(text(main)), 'Page shows रविवार, २९ नोव्हेंबर २०२६');
    check(/व्हिडिओ सबमिशनची अंतिम तारीख/.test(text(main)), 'Page labels the date as a submission deadline');
    check(/२९ नोव्हेंबर २०२६, संध्याकाळी ५ वाजता/.test(text(main)), 'Page shows the 5:00 pm deadline');
    check(/प्रत्यक्ष वेळ/.test(text(main)) && /संध्याकाळी ५ वाजता/.test(text(main)),
      'The 5 pm cut-off is shown as the submission deadline, not as a live event time');
    check(/नाही — ही ऑनलाइन स्पर्धा आहे/.test(text(main)), 'Page states that there is no physical venue');
    check(/अद्याप जाहीर होणे बाकी/.test(text(main)), 'Unannounced Reel Star details stay explicitly unannounced');
    const cta = document.querySelector('.cp-head__actions a.btn--primary');
    check(cta && cta.getAttribute('href') === 'registration.html?competition=reel-star',
      'Page CTA links to the registration form with the competition preselected');
    const navMenu = [...document.querySelectorAll('#allCompetitions a')].map(a => a.getAttribute('href'));
    check(navMenu.includes('reel-star.html'), 'Shared navigation lists Reel Star');
    const footerLinks = [...document.querySelectorAll('#siteFooter a')].map(a => a.getAttribute('href'));
    check(footerLinks.includes('reel-star.html'), 'Footer lists Reel Star');
    check([...document.querySelectorAll('#siteFooter [data-whatsapp-link], #siteHeader [data-whatsapp-link]')]
      .every(a => a.getAttribute('href') === 'https://chat.whatsapp.com/CCTGjn1R4vgLxWYgTySjfq?mode=gi_t'),
      'Header and footer WhatsApp buttons use the exact URL on competition pages too');
    check(errors.length === 0, 'No JavaScript errors on reel-star.html' + (errors.length ? ': ' + errors.join(' | ') : ''));
    dom.window.close();
  }

  /* =======================================================================
     3. REGISTRATION
     ===================================================================== */
  console.log('\n[3/4] Registration flow...');
  {
    const { dom, window, document, errors } = await boot('registration.html', '?competition=reel-star');
    check(document.getElementById('age') === null, 'No age field is rendered (grade-based rule)');
    check(document.getElementById('configNote') === null, 'No “endpoint not configured” notice is rendered');
    check(!/endpoint अद्याप जोडलेला नाही/.test(text(document.body)),
      'The Apps Script endpoint notice is gone from the page');
    check(document.getElementById('successCard').hidden === true,
      'The success card (with its WhatsApp button) stays hidden until a registration succeeds');
    check(document.getElementById('onlineGroup').hidden === false,
      'Online section (with its explanation) is visible before a class is chosen');
    check(document.querySelector('[data-comp-checkbox="reel-star"]') === null,
      'No online pick is offered until इयत्ता is chosen — eligibility is grade-based');
    check(/इयत्ता निवडल्यानंतर/.test(text(document.getElementById('onlineList'))),
      'Online list explains that picks follow the selected इयत्ता');
    check(/कृपया आपली इयत्ता निवडा/.test(text(document.getElementById('preselectNote'))),
      'Preselect note asks for the इयत्ता');
    check(/इयत्ता ५ वी ते १० वी/.test(text(document.getElementById('preselectNote'))),
      'Preselect note states the इयत्ता ५ वी ते १० वी range');

    /* इयत्ता ६ वी → रील स्टार is offered, preselected, with no group/topic */
    const std = document.getElementById('standard');
    std.value = '6';
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 40));
    const reelBox = document.querySelector('[data-comp-checkbox="reel-star"]');
    check(!!reelBox && reelBox.checked, 'Reel Star is preselected once an eligible इयत्ता is chosen');
    check(/इयत्ता ५ वी ते १० वी/.test(text(document.getElementById('onlineList'))),
      'Reel Star pick card shows the grade eligibility');
    check(/संध्याकाळी ५ वाजता/.test(text(document.getElementById('onlineList'))),
      'Reel Star pick card shows the 5 pm deadline');
    check(!reelBox.closest('.comp-pick').querySelector('[data-topic-select]'),
      'Reel Star asks for no topic');
    check(!reelBox.closest('.comp-pick').querySelector('[data-team-groupname]'),
      'Reel Star asks for no group');
    check([...document.querySelectorAll('#onlineList [data-comp-checkbox]')].length === 4,
      'All four online competitions are listed for an eligible class');

    const calls = stubFetch(window, { result: 'success', reference: 'BSF26-TEST-1' });
    fillRegistration(document);
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));

    check(calls.length === 1, 'Exactly one request is sent for a valid Reel Star registration');
    const payload = calls[0] && calls[0].body;
    check(payload && payload.age === undefined, 'Payload carries no age field');
    const reg = payload && payload.registrations.find(r => r.competitionId === 'reel-star');
    check(!!reg, 'Payload carries the reel-star competition id');
    check(reg && reg.status === 'registered', 'A confirmed grade-based entry is not marked pending');
    check(reg && reg.eligibilityType === undefined && reg.ageRange === undefined,
      'Payload carries no age-based eligibility');
    check(reg && reg.group === '', 'No invented group is attached to a group-less competition');
    check(document.getElementById('successCard').hidden === false, 'Success card appears only after a valid backend response');
    check(!/वय/.test(text(document.getElementById('successSummary'))), 'Success summary shows no age');

    /* the success card keeps the WhatsApp group invitation */
    const waHost = document.getElementById('successWhatsapp');
    check(waHost.hidden === false, 'Success card shows the WhatsApp group block');
    const waLink = waHost.querySelector('a[data-whatsapp-link]');
    check(!!waLink, 'Success card keeps the Join WhatsApp Group button');
    check(waLink && waLink.getAttribute('href') === 'https://chat.whatsapp.com/CCTGjn1R4vgLxWYgTySjfq?mode=gi_t',
      'Success WhatsApp button uses the exact invitation URL');
    check(waLink && waLink.getAttribute('target') === '_blank' &&
      waLink.getAttribute('rel') === 'noopener noreferrer',
      'Success WhatsApp button opens in a new tab with rel="noopener noreferrer"');
    check(waLink && waLink.getAttribute('aria-label'), 'Success WhatsApp button has an accessible label');
    check(/WhatsApp ग्रुपमध्ये/.test(text(waHost)), 'Success card explains why to join the group');

    /* the declaration tick: a real background-image, not an <input>::after */
    const declaration = document.getElementById('declaration');
    declaration.checked = true;
    const tick = window.getComputedStyle(declaration).backgroundImage || '';
    check(/svg/.test(tick), 'A tick is drawn on the checkbox with a background-image');
    check(/%23000000|%23000\b|#000/i.test(tick), 'The tick is black');

    check(errors.length === 0, 'No JavaScript errors in the registration flow' + (errors.length ? ': ' + errors.join(' | ') : ''));
    dom.window.close();
  }

  /* an ineligible class does not offer Reel Star */
  {
    const { dom, window, document } = await boot('registration.html', '?competition=reel-star');
    const std = document.getElementById('standard');
    std.value = '4';
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    check(document.querySelector('[data-comp-checkbox="reel-star"]') === null,
      'Reel Star is not offered to इयत्ता ४ थी');
    check([...document.querySelectorAll('#onlineList [data-comp-checkbox]')].length === 3,
      'The three team events remain available to इयत्ता ४ थी');
    check(/पात्र नाही/.test(text(document.getElementById('formStatus'))),
      'An ineligible class is told why Reel Star is unavailable');
    check(document.getElementById('successCard').hidden, 'No success card without an eligible entry');
    dom.window.close();
  }

  /* changing to an ineligible class drops a previously valid Reel Star pick */
  {
    const { dom, window, document, errors } = await boot('registration.html', '?competition=reel-star');
    const std = document.getElementById('standard');
    std.value = '6';
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    check(document.querySelector('[data-comp-checkbox="reel-star"]').checked, 'Reel Star is picked for इयत्ता ६ वी');
    std.value = '4';
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    check(document.querySelector('[data-comp-checkbox="reel-star"]') === null,
      'Reel Star disappears when the class drops below इयत्ता ५ वी');
    check(/काढून टाकल्या/.test(text(document.getElementById('pickedStandard'))),
      'The dropped selection is reported to the participant');
    check(errors.length === 0, 'No JavaScript errors in the registration flow' + (errors.length ? ': ' + errors.join(' | ') : ''));
    dom.window.close();
  }

  /* class-based registration is unaffected */
  {
    const { dom, window, document } = await boot('registration.html', '?competition=chitrakala');
    fillRegistration(document);
    await new Promise(r => setTimeout(r, 60));
    check(document.querySelector('[data-comp-checkbox="chitrakala"]').checked,
      'Class-based preselection still works');
    check(/विषय निवडा/.test(text(document.getElementById('offlineList'))),
      'Class-based competitions still ask for a topic');
    const calls = stubFetch(window, { result: 'success', reference: 'BSF26-TEST-2' });
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));
    check(calls.length === 0 && /विषय/.test(text(document.getElementById('err-topic-chitrakala'))),
      'A missing topic still blocks a class-based registration');
    check(document.getElementById('age') === null, 'No age field exists for class-based competitions');
    dom.window.close();
  }

  /* no valid backend response → no success claim */
  {
    const { dom, window, document } = await boot('registration.html', '?competition=reel-star');
    fillRegistration(document);
    window.fetch = () => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('not json') });
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));
    check(document.getElementById('successCard').hidden === true,
      'An unexpected backend response never claims success');
    check(/नोंदणी पूर्ण झाली नाही/.test(text(document.getElementById('formStatus'))),
      'A failed request shows the error message');
    dom.window.close();
  }

  /* =======================================================================
     4. RESULT
     ===================================================================== */
  console.log('\n========================================');
  console.log(`Runtime result: ${pass} PASS / ${failures.length} FAIL`);
  console.log('========================================\n');
  if (failures.length) {
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    process.exit(1);
  }
  process.exit(0);
})().catch((err) => {
  console.error('Runtime harness crashed:', err);
  process.exit(1);
});
