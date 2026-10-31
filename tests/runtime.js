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
     4. CERTIFICATE OF PARTICIPATION ACROSS PAGES
     ===================================================================== */
  console.log('\n[4/7] Certificate of Participation notices across pages...');
  {
    const { dom, document } = await boot('index.html');
    const heroCert = document.querySelector('.cert-callout--hero');
    check(!!heroCert && /प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(heroCert)),
      'Homepage hero displays Certificate of Participation notice');
    check(/सहभाग प्रमाणपत्र/.test(text(document.querySelector('.hero__chips'))),
      'Homepage hero chips highlight Certificate of Participation');
    check(/प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(document.querySelector('.cta-band'))),
      'Homepage CTA band displays Certificate of Participation notice');
    check(/प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र मिळेल का/.test(text(document.getElementById('faqList'))),
      'Homepage FAQ includes dedicated Certificate of Participation Q&A');
    check(/प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(document.getElementById('siteFooter'))),
      'Shared footer displays Certificate of Participation notice');
    dom.window.close();
  }

  for (const page of [
    'chitrakala.html', 'mehendi.html', 'nibandh.html', 'vaktrutva.html',
    'ekpatri-natya.html', 'rangoli.html', 'group-dance.html',
    'group-singing.html', 'group-fashion-show.html', 'reel-star.html'
  ]) {
    const { dom, document, errors } = await boot(page);
    const certBlock = document.getElementById('certificate');
    check(!!certBlock && /प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(certBlock)),
      `${page} renders #certificate block with Certificate of Participation notice`);
    check(/सहभाग प्रमाणपत्र/.test(text(document.querySelector('.facts'))),
      `${page} facts list mentions सहभाग प्रमाणपत्र`);
    check(errors.length === 0, `${page} boots cleanly without script errors`);
    dom.window.close();
  }

  {
    const { dom, document } = await boot('registration.html');
    check(/प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(document.querySelector('.cert-callout--reg'))),
      'Registration page header callout announces Certificate of Participation');
    check(/प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(document.querySelector('.form__note'))),
      'Registration form footer note announces Certificate of Participation');
    check(/प्रत्येक सहभागी विद्यार्थ्याला सहभाग प्रमाणपत्र/.test(text(document.querySelector('#successCard .cert-callout'))),
      'Registration confirmation card includes Certificate of Participation notice');
    dom.window.close();
  }

  /* =======================================================================
     5. PER-COMPETITION REGISTRATION DEADLINE (IST) & MULTI-COMPETITION FLOW
     ===================================================================== */
  console.log('\n[5/7] Per-competition registration deadlines & multi-competition rules...');
  {
    const { dom, window, document } = await boot('index.html', '', (w) => {
      w.__FESTIVAL_NOW = '2026-11-15T10:00:00+05:30';
    });
    const H = window.__FESTIVAL_HELPERS;
    const byId = (id) => window.FESTIVAL.competitions.find(c => c.id === id);

    /* Exact one-day-before calculation for every onsite competition */
    check(H.registrationDeadlineISO(byId('chitrakala')) === '2026-11-21', 'चित्रकला deadline is 2026-11-21 (one day before 2026-11-22)');
    check(H.registrationDeadlineISO(byId('mehndi')) === '2026-11-22', 'मेहंदी deadline is 2026-11-22 (one day before 2026-11-23)');
    check(H.registrationDeadlineISO(byId('nibandh')) === '2026-11-26', 'निबंध deadline is 2026-11-26 (one day before 2026-11-27)');
    check(H.registrationDeadlineISO(byId('vaktrutva')) === '2026-11-27', 'वक्तृत्व deadline is 2026-11-27 (one day before 2026-11-28)');
    check(H.registrationDeadlineISO(byId('ekpatri')) === '2026-11-27', 'एकपात्री नाट्य deadline is 2026-11-27 (one day before 2026-11-28)');
    check(H.registrationDeadlineISO(byId('rangoli')) === '2026-11-28', 'रांगोळी deadline is 2026-11-28 (one day before 2026-11-29)');

    /* Online video-submission deadlines are never treated as event dates */
    for (const onlineId of ['group-dance', 'group-singing', 'group-fashion-show', 'reel-star']) {
      check(H.registrationDeadlineISO(byId(onlineId)) === null,
        `${onlineId} has null registrationDeadlineISO so video submission deadline is untouched`);
      check(H.isRegistrationClosed(byId(onlineId), '2026-11-27T12:00:00+05:30') === false,
        `${onlineId} is not closed by registration-deadline logic based on video submission date`);
    }

    /* Exact 11:59 PM IST (Asia/Kolkata) boundary checks */
    check(H.isRegistrationClosed(byId('chitrakala'), '2026-11-21T23:59:59+05:30') === false,
      'चित्रकला remains OPEN at 2026-11-21 23:59:59 IST');
    check(H.isRegistrationClosed(byId('chitrakala'), '2026-11-21T18:29:59Z') === false,
      'चित्रकला remains OPEN at UTC equivalent of 2026-11-21 23:59:59 IST');
    check(H.isRegistrationClosed(byId('chitrakala'), '2026-11-22T00:00:00+05:30') === true,
      'चित्रकला CLOSES at 2026-11-22 00:00:00 IST (start of competition day)');
    check(H.isRegistrationClosed(byId('chitrakala'), '2026-11-21T18:30:00Z') === true,
      'चित्रकला CLOSES at UTC equivalent of 2026-11-22 00:00:00 IST');
    check(H.isRegistrationClosed(byId('chitrakala'), '2026-11-25T09:00:00+05:30') === true,
      'चित्रकला remains CLOSED on subsequent dates');

    /* On 2026-11-22, मेहंदी (2026-11-23) is still open until 23:59:59 IST */
    check(H.isRegistrationClosed(byId('mehndi'), '2026-11-22T23:59:59+05:30') === false,
      'मेहंदी remains OPEN through 2026-11-22 23:59:59 IST');
    check(H.isRegistrationClosed(byId('mehndi'), '2026-11-23T00:00:00+05:30') === true,
      'मेहंदी CLOSES on 2026-11-23 00:00:00 IST');

    /* Homepage cards show नोंदणीची अंतिम तारीख on onsite cards and NOT on online video cards */
    check(document.querySelectorAll('[data-reg-deadline]').length === 6,
      'All 6 onsite homepage competition cards display नोंदणीची अंतिम तारीख');
    check(/नोंदणीची अंतिम तारीख:\s*२१ नोव्हेंबर २०२६/.test(text(document.querySelector('[data-reg-deadline="chitrakala"]'))),
      'Homepage चित्रकला card displays २१ नोव्हेंबर २०२६ registration deadline');
    dom.window.close();
  }

  /* Competition page open vs closed states on 2026-11-22 10:00 IST */
  {
    const { dom: closedDom, document: closedDoc } = await boot('chitrakala.html', '', (w) => {
      w.__FESTIVAL_NOW = '2026-11-22T10:00:00+05:30';
    });
    check(!!closedDoc.querySelector('[data-competition-closed]'),
      'Closed competition page (चित्रकला on 22 Nov) shows closed banner');
    check(closedDoc.querySelectorAll('[data-cta-closed]').length === 2,
      'Closed competition page disables both primary registration CTAs');
    closedDom.window.close();

    const { dom: openDom, document: openDoc } = await boot('mehendi.html', '', (w) => {
      w.__FESTIVAL_NOW = '2026-11-22T10:00:00+05:30';
    });
    check(openDoc.querySelector('[data-competition-closed]') === null,
      'Open competition page (मेहंदी on 22 Nov) shows no closed banner');
    check(openDoc.querySelectorAll('a[href="registration.html?competition=mehndi"]').length === 2,
      'Open competition page keeps active registration CTAs');
    openDom.window.close();
  }

  /* Multi-competition registration when one competition is closed & others are open */
  {
    const { dom, window, document } = await boot('registration.html', '?competition=chitrakala', (w) => {
      w.__FESTIVAL_NOW = '2026-11-22T12:00:00+05:30';
    });
    check(/नोंदणी बंद झाली आहे/.test(text(document.getElementById('preselectNote'))),
      'Visiting ?competition=chitrakala after its deadline displays closed notice');

    fillRegistration(document); // selects इयत्ता ६ वी
    await new Promise(r => setTimeout(r, 60));

    const chitraBox = document.querySelector('[data-comp-checkbox="chitrakala"]');
    const mehndiBox = document.querySelector('[data-comp-checkbox="mehndi"]');
    const nibandhBox = document.querySelector('[data-comp-checkbox="nibandh"]');
    const reelBox = document.querySelector('[data-comp-checkbox="reel-star"]');

    check(chitraBox && chitraBox.disabled === true && chitraBox.checked === false,
      'Closed competition (चित्रकला) checkbox is disabled and not preselected');
    check(!!document.querySelector('[data-pick-closed="chitrakala"]'),
      'Closed competition card shows नोंदणी बंद झाली आहे message');
    check(mehndiBox && !mehndiBox.disabled && nibandhBox && !nibandhBox.disabled && reelBox && !reelBox.disabled,
      'Open competitions (मेहंदी, निबंध, रील स्टार) remain enabled on the same date');

    /* Select multiple open competitions and submit */
    mehndiBox.click();
    nibandhBox.click();
    reelBox.click();
    await new Promise(r => setTimeout(r, 40));

    const mehndiSel = document.querySelector('[data-topic-select="mehndi"]');
    mehndiSel.value = mehndiSel.options[1].value;
    mehndiSel.dispatchEvent(new window.Event('change', { bubbles: true }));

    const nibandhSel = document.querySelector('[data-topic-select="nibandh"]');
    nibandhSel.value = nibandhSel.options[1].value;
    nibandhSel.dispatchEvent(new window.Event('change', { bubbles: true }));

    const calls = stubFetch(window, { result: 'success', reference: 'BSF26-MULTI-OPEN-1' });
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));

    check(calls.length === 1, 'Multi-competition submission of open competitions succeeds');
    const sentIds = calls[0].body.registrations.map(r => r.competitionId);
    check(JSON.stringify(sentIds) === JSON.stringify(['mehndi', 'nibandh', 'reel-star']),
      'Submitted payload contains only the open selected competitions');
    check(document.getElementById('successCard').hidden === false,
      'Confirmation card is shown for open multi-competition registration');
    dom.window.close();
  }

  /* Mid-session deadline expiration blocks closed competition at submit time */
  {
    const { dom, window, document } = await boot('registration.html', '', (w) => {
      w.__FESTIVAL_NOW = '2026-11-21T23:58:00+05:30';
    });
    fillRegistration(document);
    await new Promise(r => setTimeout(r, 60));
    const chitraBox = document.querySelector('[data-comp-checkbox="chitrakala"]');
    chitraBox.click();
    const sel = document.querySelector('[data-topic-select="chitrakala"]');
    sel.value = sel.options[1].value;
    sel.dispatchEvent(new window.Event('change', { bubbles: true }));

    /* Clock crosses 11:59:59 PM IST before user clicks submit */
    window.__FESTIVAL_NOW = '2026-11-22T00:00:05+05:30';
    const calls = stubFetch(window, { result: 'success', reference: 'BSF26-NEVER' });
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));
    check(calls.length === 0, 'Mid-session expired competition is blocked before network send');
    check(/नोंदणी बंद झाली आहे/.test(text(document.getElementById('formStatus'))),
      'Mid-session expiration displays clear Marathi closed error');
    dom.window.close();
  }

  /* =======================================================================
     6. BALWADI COMPETITION-DAY RANDOM ALLOTMENT & CLASS 1+ MANUAL SELECTION
     ===================================================================== */
  console.log('\n[6/7] Balwadi competition-day random allotment & Class 1+ manual selection...');
  {
    const allowedBalwadi = ['गणपती', 'कृष्ण', 'कार', 'रंगीत फुलपाखरे'];
    const expectedSheetNote =
      'प्रत्यक्ष स्पर्धेच्या वेळी ४ विषयांपैकी १ यादृच्छिक विषय (गणपती / कृष्ण / कार / रंगीत फुलपाखरे)';

    const { dom, window, document } = await boot('registration.html', '', (w) => {
      w.__FESTIVAL_NOW = '2026-11-15T10:00:00+05:30';
    });
    const H = window.__FESTIVAL_HELPERS;
    const chitraComp = window.FESTIVAL.competitions.find(c => c.id === 'chitrakala');
    check(H.balwadiSheetTopicNote(chitraComp) === expectedSheetNote,
      'Frontend balwadiSheetTopicNote lists all 4 written topics for competition-day random allotment');

    document.getElementById('studentName').value = 'स्वरा संदीप कुलकर्णी';
    document.getElementById('schoolName').value = 'शिरवळ बालवाडी';
    document.getElementById('city').value = 'शिरवळ';
    document.getElementById('guardianName').value = 'संदीप कुलकर्णी';
    document.getElementById('mobile').value = '9822334455';
    document.getElementById('declaration').checked = true;

    const std = document.getElementById('standard');
    std.value = '0'; // बालवाडी
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));

    /* Balwadi hides manual subject dropdown and shows all 4 written topics as read-only reference */
    check(document.querySelector('[data-topic-select="chitrakala"]') === null,
      'Balwadi hides manual subject-selection dropdown');
    const chitraBox = document.querySelector('[data-comp-checkbox="chitrakala"]');
    chitraBox.click();
    await new Promise(r => setTimeout(r, 40));

    const allotCard = document.querySelector('[data-allotted-topic="chitrakala"]');
    const topicItems = [...document.querySelectorAll('[data-balwadi-topics-list="chitrakala"] li')]
      .map(li => text(li).replace(/^[१२३४]\s*/, ''));
    check(!!allotCard && /प्रत्यक्ष स्पर्धेच्या वेळी यादृच्छिक पद्धतीने/.test(text(allotCard)),
      'Balwadi registration form explains that 1 of the 4 topics will be randomly given during the actual competition');
    check(/विषयाचे यादृच्छिक वाटप/.test(text(allotCard)),
      'Balwadi registration form displays विषयाचे यादृच्छिक वाटप badge');
    check(JSON.stringify(topicItems) === JSON.stringify(allowedBalwadi),
      'Balwadi registration form lists all 4 existing topics (' + topicItems.join(', ') + ') without pre-picking 1');
    check(document.querySelector('[data-allotted-topic-value="chitrakala"]') === null,
      'Balwadi registration form does not pre-assign a single random topic at registration time');

    /* Switching to इयत्ता १ ली (index 1) restores manual subject selection and does not leak Balwadi note */
    std.value = '1'; // इयत्ता १ ली
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    const class1Select = document.querySelector('[data-topic-select="chitrakala"]');
    check(!!class1Select && class1Select.tagName === 'SELECT',
      'इयत्ता १ ली shows manual subject-selection dropdown');
    check(class1Select.value === '',
      'Balwadi competition-day note never leaks into इयत्ता १ ली manual dropdown');
    check(document.querySelector('[data-allotted-topic="chitrakala"]') === null,
      'इयत्ता १ ली does not render Balwadi random allotment card');

    /* Switching back to बालवाडी (index 0) restores the 4-topic competition-day allotment card */
    std.value = '0';
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));
    check(document.querySelectorAll('[data-balwadi-topics-list="chitrakala"] li').length === 4,
      'Returning to बालवाडी restores the 4 listed topics cleanly');

    /* Also add an eligible Balwadi team competition (समूह नृत्य) to verify team + Balwadi coexistence */
    const danceBox = document.querySelector('[data-comp-checkbox="group-dance"]');
    danceBox.click();
    await new Promise(r => setTimeout(r, 40));
    document.getElementById('groupname-group-dance').value = 'चिमुकले कलाकार';
    document.getElementById('members-group-dance').value = [
      'स्वरा कुलकर्णी — बालवाडी',
      'आरव पाटील — बालवाडी',
      'काव्या शिंदे — बालवाडी',
      'विहान मोरे — बालवाडी',
      'अन्वी कदम — बालवाडी'
    ].join('\n');

    const calls = stubFetch(window, {
      result: 'success',
      reference: 'BSF26-BALWADI-1',
      allottedTopics: { chitrakala: expectedSheetNote }
    });
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 120));

    check(calls.length === 1, 'Balwadi registration submits cleanly');
    check(calls[0].body.standard === 'बालवाडी', 'Balwadi payload standard is बालवाडी');
    const sentChitra = calls[0].body.registrations.find(r => r.competitionId === 'chitrakala');
    const sentDance = calls[0].body.registrations.find(r => r.competitionId === 'group-dance');
    check(sentChitra && sentChitra.topic === expectedSheetNote,
      'Balwadi payload records competition-day 1-of-4 random allotment note');
    check(sentDance && sentDance.team && sentDance.team.members.length === 5,
      'Balwadi team registration preserves 5-member team structure');

    const summaryText = text(document.getElementById('successSummary'));
    check(/प्रत्यक्ष स्पर्धेच्या वेळी ४ विषयांपैकी १ यादृच्छिक विषय/.test(summaryText),
      'Confirmation screen clearly states that 1 of the 4 topics will be randomly given during the actual competition');
    check(!/वय/.test(summaryText), 'Balwadi confirmation summary contains no age wording');
    dom.window.close();
  }

  /* Flagging safeguard when a Balwadi competition does not have 4 existing topics */
  {
    const { dom, window, document } = await boot('registration.html', '', (w) => {
      w.__FESTIVAL_NOW = '2026-11-15T10:00:00+05:30';
    });
    const chitra = window.FESTIVAL.competitions.find(c => c.id === 'chitrakala');
    chitra.groups[0].topics = ['गणपती', 'कृष्ण', 'कार']; // simulate 3 topics instead of 4

    fillRegistration(document);
    const std = document.getElementById('standard');
    std.value = '0';
    std.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 60));

    document.querySelector('[data-comp-checkbox="chitrakala"]').click();
    await new Promise(r => setTimeout(r, 40));

    const flagNode = document.querySelector('[data-balwadi-flag="chitrakala"]');
    check(!!flagNode && /नेमके ४ विषय निश्चित केलेले नाहीत/.test(text(flagNode)),
      'Balwadi competition without 4 topics is flagged rather than inventing subjects');
    const calls = stubFetch(window, { result: 'success', reference: 'NEVER' });
    document.getElementById('registrationForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 100));
    check(calls.length === 0, 'Flagged Balwadi competition blocks submission until 4 topics exist');
    dom.window.close();
  }

  /* =======================================================================
     7. GOOGLE APPS SCRIPT BACKEND (Code.gs) RUNTIME VERIFICATION
     ===================================================================== */
  console.log('\n[7/7] Google Apps Script backend (Code.gs) runtime checks...');
  {
    const vm = require('vm');
    const codeGsSrc = fs.readFileSync(path.join(ROOT, 'Code.gs'), 'utf8');

    function createGasHarness(nowIso) {
      const sheets = {};
      const makeSheet = (name) => {
        const rows = [];
        return {
          name,
          rows,
          appendRow(r) { rows.push(r.slice()); },
          getLastRow() { return rows.length; },
          setFrozenRows() {},
          getRange(row, col, numRows, numCols) {
            return {
              setFontWeight() { return this; },
              setBackground() { return this; },
              getValues() {
                const out = [];
                for (let r = row - 1; r < row - 1 + numRows; r++) {
                  const line = [];
                  for (let c = col - 1; c < col - 1 + (numCols || 1); c++) {
                    line.push(rows[r] ? rows[r][c] : '');
                  }
                  out.push(line);
                }
                return out;
              }
            };
          }
        };
      };

      const sandbox = {
        __TEST_NOW: nowIso,
        SPREADSHEET_ID: 'TEST_SHEET_ID',
        LockService: {
          getScriptLock: () => ({ waitLock() {}, releaseLock() {} })
        },
        ContentService: {
          MimeType: { JSON: 'application/json' },
          createTextOutput(str) {
            return {
              _text: str,
              setMimeType() { return this; },
              getContent() { return this._text; }
            };
          }
        },
        Utilities: {
          formatDate(date, tz, pattern) {
            const parts = new Intl.DateTimeFormat('en-GB', {
              timeZone: tz,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              hour12: false
            }).formatToParts(date);
            const m = {};
            parts.forEach(p => { m[p.type] = p.value; });
            if (pattern === 'yyyy-MM-dd') return `${m.year}-${m.month}-${m.day}`;
            return `${m.day}/${m.month}/${m.year} ${m.hour}:${m.minute}:${m.second}`;
          }
        },
        SpreadsheetApp: {
          openById() {
            return {
              getSheetByName(n) { return sheets[n] || null; },
              insertSheet(n) { sheets[n] = makeSheet(n); return sheets[n]; }
            };
          }
        },
        Logger: { log() {} }
      };

      vm.createContext(sandbox);
      vm.runInContext(codeGsSrc, sandbox);
      sandbox.SPREADSHEET_ID = 'TEST_SHEET_ID_ACTIVE';

      function post(bodyObj) {
        const res = sandbox.doPost({ postData: { contents: JSON.stringify(bodyObj) } });
        return JSON.parse(res.getContent());
      }

      return { sandbox, sheets, post };
    }

    const basePayload = (overrides = {}) => Object.assign({
      requestId: 'BSF26-GAS-1',
      studentName: 'रोहन अमोल शिंदे',
      standard: 'इयत्ता ६ वी',
      schoolName: 'शिरवळ विद्यालय',
      city: 'शिरवळ',
      guardianName: 'अमोल शिंदे',
      mobile: '9822112233',
      email: 'rohan@example.com',
      registrations: [
        {
          competitionId: 'chitrakala',
          competition: 'चित्रकला स्पर्धा',
          mode: 'offline',
          group: 'गट ३ — इयत्ता ५ वी ते ७ वी',
          topic: 'माझे प्रदूषणमुक्त शिरवळ गाव',
          status: 'registered'
        }
      ]
    }, overrides);

    /* 7a. Open at 11:59:59 PM IST on previous day */
    {
      const gas = createGasHarness('2026-11-21T23:59:59+05:30');
      const res = gas.post(basePayload({ requestId: 'BSF26-OPEN-2359' }));
      check(res.result === 'success' && res.saved === 1,
        'Code.gs accepts चित्रकला registration at 2026-11-21 23:59:59 IST');
      check(gas.sheets['चित्रकला'] && gas.sheets['चित्रकला'].rows.length === 2,
        'Code.gs creates header + 1 registration row in चित्रकला sheet');
      check(gas.sheets['चित्रकला'].rows[1].length === 18,
        'Code.gs preserves exact 18-column Google Sheets structure');

      /* Advance clock past deadline on the SAME workbook: direct POST to closed चित्रकला is rejected
         and previously submitted registration row in चित्रकला remains untouched! */
      gas.sandbox.__TEST_NOW = '2026-11-22T00:00:00+05:30';
      const closedRes = gas.post(basePayload({ requestId: 'BSF26-CLOSED-0000' }));
      check(closedRes.result === 'error' && /नोंदणी बंद झाली आहे/.test(closedRes.message),
        'Code.gs rejects direct POST to चित्रकला at 2026-11-22 00:00:00 IST');
      check(gas.sheets['चित्रकला'].rows.length === 2,
        'Previously submitted registration row in Google Sheets remains completely unaffected');

      /* Bypass attempt omitting competitionId and passing only Marathi name is also blocked */
      const omitIdRes = gas.post(basePayload({
        requestId: 'BSF26-OMIT-ID',
        registrations: [{
          competitionId: '',
          competition: 'चित्रकला स्पर्धा',
          mode: 'offline',
          group: 'गट ३ — इयत्ता ५ वी ते ७ वी',
          topic: 'माझे प्रदूषणमुक्त शिरवळ गाव',
          status: 'registered'
        }]
      }));
      check(omitIdRes.result === 'error' && /नोंदणी बंद झाली आहे/.test(omitIdRes.message),
        'Code.gs blocks closed competition even when competitionId is omitted from payload');

      /* Multi-competition submission on 2026-11-22 12:00 IST succeeds for open competitions */
      gas.sandbox.__TEST_NOW = '2026-11-22T12:00:00+05:30';
      const multiOpenRes = gas.post(basePayload({
        requestId: 'BSF26-OPEN-MULTI',
        registrations: [
          {
            competitionId: 'mehndi',
            competition: 'मेहंदी स्पर्धा',
            mode: 'offline',
            group: 'गट २ — इयत्ता ५ वी ते ७ वी',
            topic: 'पारंपरिक भारतीय मेहंदी',
            status: 'registered'
          },
          {
            competitionId: 'reel-star',
            competition: 'रील स्टार',
            mode: 'online',
            group: '',
            topic: '',
            status: 'registered'
          }
        ]
      }));
      check(multiOpenRes.result === 'success' && multiOpenRes.saved === 2,
        'Code.gs accepts multi-competition registration for open competitions (मेहंदी + रील स्टार) on 22 Nov');
    }

    /* 7b. Backend Balwadi competition-day random allotment & manipulation protection */
    {
      const gas = createGasHarness('2026-11-15T10:00:00+05:30');
      const allowed = ['गणपती', 'कृष्ण', 'कार', 'रंगीत फुलपाखरे'];
      const expectedSheetNote =
        'प्रत्यक्ष स्पर्धेच्या वेळी ४ विषयांपैकी १ यादृच्छिक विषय (गणपती / कृष्ण / कार / रंगीत फुलपाखरे)';

      /* Reject tampered arbitrary topic OR manual attempt to pre-pick one of the 4 topics */
      const tamperedRes = gas.post(basePayload({
        requestId: 'BSF26-BAL-TAMPER',
        standard: 'बालवाडी',
        registrations: [{
          competitionId: 'chitrakala',
          competition: 'चित्रकला स्पर्धा',
          mode: 'offline',
          group: 'गट १ — बालवाडी ते इयत्ता १ ली',
          topic: 'अवैध फेरफार केलेला विषय',
          status: 'registered'
        }]
      }));
      check(tamperedRes.result === 'error' && /प्रत्यक्ष स्पर्धेच्या वेळी/.test(tamperedRes.message),
        'Code.gs rejects tampered/invalid Balwadi subject');

      const manualPickAttemptRes = gas.post(basePayload({
        requestId: 'BSF26-BAL-MANUAL-PICK',
        standard: 'बालवाडी',
        registrations: [{
          competitionId: 'chitrakala',
          competition: 'चित्रकला स्पर्धा',
          mode: 'offline',
          group: 'गट १ — बालवाडी ते इयत्ता १ ली',
          topic: 'गणपती',
          status: 'registered'
        }]
      }));
      check(manualPickAttemptRes.result === 'error' && /विषय निवडता येत नाही/.test(manualPickAttemptRes.message),
        'Code.gs rejects Balwadi payload attempting to manually pre-select one of the 4 topics');

      /* Competition-day helper drawRandomBalwadiTopic_ distributes uniformly across all 4 topics */
      const serverCounts = { 'गणपती': 0, 'कृष्ण': 0, 'कार': 0, 'रंगीत फुलपाखरे': 0 };
      let serverAllValid = true;
      for (let i = 0; i < 400; i++) {
        const picked = gas.sandbox.drawRandomBalwadiTopic_('chitrakala');
        if (!allowed.includes(picked)) serverAllValid = false;
        else serverCounts[picked]++;
      }
      check(serverAllValid && allowed.every(t => serverCounts[t] >= 60 && serverCounts[t] <= 145),
        'Code.gs drawRandomBalwadiTopic_ draws uniformly across all 4 listed topics (' +
        JSON.stringify(serverCounts) + ')');

      const balRes = gas.post(basePayload({
        requestId: 'BSF26-BAL-VALID',
        standard: 'बालवाडी',
        registrations: [{
          competitionId: 'chitrakala',
          competition: 'चित्रकला स्पर्धा',
          mode: 'offline',
          group: 'गट १ — बालवाडी ते इयत्ता १ ली',
          topic: '',
          status: 'registered'
        }]
      }));
      check(balRes.result === 'success' && balRes.allottedTopics && balRes.allottedTopics.chitrakala === expectedSheetNote,
        'Code.gs records competition-day 1-of-4 random topic note for Balwadi');
      const writtenRow = gas.sheets['चित्रकला'].rows[1];
      check(writtenRow[13] === expectedSheetNote,
        'Code.gs writes competition-day random topic note in Google Sheets column 14 (विषय)');

      /* Duplicate requestId delivery is ignored */
      const dupRes = gas.post(basePayload({
        requestId: 'BSF26-BAL-VALID',
        standard: 'बालवाडी',
        registrations: [{
          competitionId: 'chitrakala',
          competition: 'चित्रकला स्पर्धा',
          mode: 'offline',
          group: 'गट १ — बालवाडी ते इयत्ता १ ली',
          topic: '',
          status: 'registered'
        }]
      }));
      check(dupRes.result === 'error' && gas.sheets['चित्रकला'].rows.length === 2,
        'Code.gs duplicate protection prevents writing a second row for the same requestId');
    }
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
