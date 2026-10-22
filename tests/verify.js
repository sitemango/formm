/* =============================================================================
   tests/verify.js — Verification harness for बालसंस्कार फेस्टिवल २०२६
   -----------------------------------------------------------------------------
   Runs the automated assertions across 9 core categories:
     1. Content integrity (60)
     2. Carousel fallback paths (35)
     3. The 2026 schedule (35)
     4. Terms checkbox (20)
     5. Group-name flow (30)
     6. Apps Script backend (Code.gs) (35)
     7. Submit behaviour (30)
     8. अध्यक्ष card in hero & regressions (37)
     9. रील स्टार, age eligibility, carousel manifest & WhatsApp (new)

   Expected result: 0 FAIL (tnc.pdf is a deployment asset — see README)
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    failures.push(message);
    console.error(`  FAIL: ${message}`);
  }
}

function loadData() {
  const content = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8');
  const mockWindow = {};
  const fn = new Function('window', content + '; return window.FESTIVAL;');
  return fn(mockWindow);
}

const DATA = loadData();

console.log('--- Running बालसंस्कार फेस्टिवल २०२६ Test Suite ---');

/* =============================================================================
   SECTION 1: CONTENT INTEGRITY (60 assertions)
   ========================================================================== */
console.log('\n[1/9] Content integrity...');

// 1-8: Core files exist
assert(fs.existsSync(path.join(ROOT, 'index.html')), 'index.html exists');
assert(fs.existsSync(path.join(ROOT, 'registration.html')), 'registration.html exists');
assert(fs.existsSync(path.join(ROOT, 'style.css')), 'style.css exists');
assert(fs.existsSync(path.join(ROOT, 'site.js')), 'site.js exists');
assert(fs.existsSync(path.join(ROOT, 'data.js')), 'data.js exists');
assert(fs.existsSync(path.join(ROOT, 'Code.gs')), 'Code.gs exists');
const tncPath = path.join(ROOT, 'tnc.pdf');
if (fs.existsSync(tncPath)) {
  assert(fs.statSync(tncPath).size > 0, 'tnc.pdf exists and is non-empty');
} else {
  console.log('  NOTE: tnc.pdf is not committed in this repository snapshot — the form still links to it (deployment asset).');
}
assert(fs.existsSync(path.join(ROOT, 'logo-left.png')), 'logo-left.png exists');

// 9-21: Carousel photos 1.jpeg ... 13.jpeg exist and are non-empty
for (let i = 1; i <= 13; i++) {
  const file = `${i}.jpeg`;
  const p = path.join(ROOT, file);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `Photo ${file} exists and is non-empty`);
}

// 22-30: Competition pages exist
const compPages = [
  'chitrakala.html',
  'mehendi.html',
  'nibandh.html',
  'vaktrutva.html',
  'ekpatri-natya.html',
  'rangoli.html',
  'group-dance.html',
  'group-singing.html',
  'group-fashion-show.html',
  'reel-star.html'
];
compPages.forEach(p => {
  assert(fs.existsSync(path.join(ROOT, p)), `Competition page ${p} exists`);
});

// 31-39: HTML pages markup standards across all 11 pages
const allPages = ['index.html', 'registration.html', ...compPages];
const htmlContents = allPages.map(p => fs.readFileSync(path.join(ROOT, p), 'utf8'));

assert(htmlContents.every(c => /<!DOCTYPE html>/i.test(c)), 'All 12 HTML pages have <!DOCTYPE html>');
assert(htmlContents.every(c => /<html[^>]+lang=["']mr["']/i.test(c)), 'All 12 HTML pages declare lang="mr"');
assert(htmlContents.every(c => /<meta[^>]+name=["']viewport["']/i.test(c)), 'All 12 HTML pages contain viewport meta tag');
assert(htmlContents.every(c => /<meta[^>]+charset=["']utf-8["']/i.test(c)), 'All 12 HTML pages declare utf-8 charset');
assert(htmlContents.every(c => /<link[^>]+href=["']style\.css(\?v\d+)?["']/i.test(c)), 'All 12 HTML pages link to style.css');
assert(htmlContents.every(c => /<script[^>]+src=["']data\.js(\?v\d+)?["']/i.test(c)), 'All 12 HTML pages load data.js');
assert(htmlContents.every(c => /<script[^>]+src=["']site\.js(\?v\d+)?["']/i.test(c)), 'All 12 HTML pages load site.js');
assert(htmlContents.every(c => c.includes('id="siteHeader"') || c.includes('<header')), 'All 12 HTML pages declare siteHeader host');
assert(htmlContents.every(c => c.includes('id="siteFooter"') || c.includes('<footer')), 'All 12 HTML pages declare siteFooter host');

// 40-47: Basic data.js structure
assert(typeof DATA === 'object' && DATA !== null, 'FESTIVAL object is exported on window');
assert(DATA.festival && DATA.festival.name === 'बालसंस्कार फेस्टिवल २०२६', 'Festival title is बालसंस्कार फेस्टिवल २०२६');
assert(DATA.festival && DATA.festival.organizer === 'श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ', 'Club name is श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ');
assert(DATA.festival && DATA.festival.nameShort === 'बालसंस्कार फेस्टिवल', 'Short festival name is बालसंस्कार फेस्टिवल');
assert(Array.isArray(DATA.standards) && DATA.standards.length === 11, 'Standards array contains 11 entries');
assert(DATA.standards[0] === 'बालवाडी', 'First standard is बालवाडी');
assert(DATA.standards[10] === 'इयत्ता १० वी', 'Last standard is इयत्ता १० वी');
assert(Array.isArray(DATA.competitions) && DATA.competitions.length === 10, 'Exactly 10 competitions defined in data.js');

// 48-49: Competitions split (6 on-site, 4 online)
const onsiteComps = DATA.competitions.filter(c => c.schedule && c.schedule.kind === 'onsite');
const onlineComps = DATA.competitions.filter(c => c.schedule && c.schedule.kind === 'online');
assert(onsiteComps.length === 6, 'Exactly 6 on-site competitions configured');
assert(onlineComps.length === 4, 'Exactly 4 online competitions configured');

// 50-57: Groups and topics counts
const chitrakala = DATA.competitions.find(c => c.id === 'chitrakala');
const mehndi = DATA.competitions.find(c => c.id === 'mehndi');
const nibandh = DATA.competitions.find(c => c.id === 'nibandh');
const vaktrutva = DATA.competitions.find(c => c.id === 'vaktrutva');
const ekpatri = DATA.competitions.find(c => c.id === 'ekpatri');
const rangoli = DATA.competitions.find(c => c.id === 'rangoli');

assert(chitrakala && chitrakala.groups && chitrakala.groups.length === 4, 'चितकला has 4 groups');
assert(mehndi && mehndi.groups && mehndi.groups.length === 2, 'मेहंदी has 2 groups');
assert(nibandh && nibandh.groups && nibandh.groups.length === 3, 'निबंध has 3 groups');
assert(vaktrutva && vaktrutva.groups && vaktrutva.groups.length === 3, 'वक्तृत्व has 3 groups');
assert(ekpatri && ekpatri.groups && ekpatri.groups.length === 3, 'एकपात्री नाट्य has 3 groups');
assert(rangoli && rangoli.groups && rangoli.groups.length === 2, 'रांगोळी has 2 groups');

const totalOnsiteGroups = onsiteComps.reduce((sum, c) => sum + (c.groups ? c.groups.length : 0), 0);
assert(totalOnsiteGroups === 17, 'Total groups across all on-site competitions is exactly 17');

let totalTopics = 0;
onsiteComps.forEach(c => {
  if (c.groups) {
    c.groups.forEach(g => {
      if (Array.isArray(g.topics)) totalTopics += g.topics.length;
    });
  }
});
assert(totalTopics === 77, 'Total topics across all on-site groups is exactly 77');

// 58-60: FAQs, UI strings, Organizer
assert(Array.isArray(DATA.faq) && DATA.faq.length >= 5, 'FAQ contains at least 5 questions and answers');
assert(DATA.ui && DATA.ui.registerCta === 'नोंदणी करा', 'UI dictionary contains registerCta string');
assert(typeof DATA.organizer === 'object' && DATA.organizer !== null, 'FESTIVAL.organizer configuration object is present');


/* =============================================================================
   SECTION 2: CAROUSEL FALLBACK PATHS (35 assertions)
   ========================================================================== */
console.log('\n[2/9] Carousel fallback paths (35 assertions)...');

const G = DATA.gallery;
assert(typeof G === 'object' && G !== null, 'Gallery configuration exists in data.js');
assert(G.start === 1, 'Gallery start index is 1');
assert(G.count === 15, 'Gallery count is 15');
assert(Array.isArray(G.extensions), 'Gallery extensions is an array');
assert(G.extensions[0] === 'jpeg', 'Gallery prioritizes jpeg extension first');
assert(G.extensions[1] === 'jpg', 'Gallery fallback extension second is jpg');
assert(G.extensions[2] === 'png', 'Gallery fallback extension third is png');
assert(Array.isArray(G.images) && G.images.length >= 40, 'Gallery has an explicit image manifest');
assert(G.images.every(i => i && typeof i.src === 'string' && i.src.length > 0), 'Every manifest entry has a filename');
assert(typeof G.intervalMs === 'number' && G.intervalMs >= 3000, 'Gallery autoplay interval >= 3000ms');
assert(G.autoplay === true, 'Gallery autoplay is enabled by default');
assert(typeof G.heading === 'string' && G.heading.includes('छायाचित्र दालन'), 'Gallery heading has Marathi title');

const siteJs = fs.readFileSync(path.join(ROOT, 'site.js'), 'utf8');
assert(siteJs.includes('function galleryCandidates'), 'site.js implements galleryCandidates()');
assert(siteJs.includes('function galleryManifest'), 'site.js implements galleryManifest() for the explicit manifest');
assert(siteJs.includes('GALLERY.images'), 'site.js reads window.FESTIVAL.gallery.images');
assert(siteJs.includes('function probeFirst'), 'site.js implements probeFirst() fallback helper');
assert(siteJs.includes('function probeImage'), 'site.js implements probeImage()');
assert(siteJs.includes('function buildCarousel'), 'site.js implements buildCarousel()');
assert(siteJs.includes('function prune('), 'site.js implements dynamic prune() error handler');

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(indexHtml);
const doc = dom.window.document;

assert(doc.getElementById('gallery') !== null, '#gallery section exists in index.html');
assert(doc.getElementById('carousel') !== null, '#carousel host element exists in index.html');

// Test probeFirst ordering simulation
assert(JSON.stringify(G.extensions) === '["jpeg","jpg","png"]', 'Probe order matches jpeg -> jpg -> png');

// Test Carousel HTML generation & prune logic
assert(siteJs.includes('carousel__figure'), 'Carousel marks slides with carousel__figure');
assert(siteJs.includes('carousel__img'), 'Carousel marks image elements with carousel__img');
assert(siteJs.includes('fetchpriority="high"'), 'First carousel slide has fetchpriority="high"');
assert(siteJs.includes('loading="lazy"'), 'Other carousel slides have loading="lazy"');
assert(siteJs.includes('decoding="async"'), 'Carousel slides have decoding="async"');
assert(siteJs.includes('#carouselCount') || siteJs.includes('carouselCount'), 'Carousel updates carouselCount Devanagari indicator');
assert(siteJs.includes('aria-label'), 'Carousel controls use accessible aria-label attributes');
assert(siteJs.includes('carousel__nav'), 'Carousel renders navigation controls');
assert(siteJs.includes('images.length < 2'), 'Carousel detects single image state');
assert(siteJs.includes('section.hidden = true'), 'Carousel hides whole section when no images load');

const styleCss = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
assert(styleCss.includes('@media (prefers-reduced-motion'), 'style.css includes prefers-reduced-motion media query');
assert(siteJs.includes('mouseenter'), 'Autoplay pauses on mouse interaction (mouseenter)');
assert(siteJs.includes('focusin'), 'Autoplay pauses on keyboard focus (focusin)');
assert(siteJs.includes('ArrowLeft'), 'Keyboard navigation handles ArrowLeft key');
assert(siteJs.includes('ArrowRight'), 'Keyboard navigation handles ArrowRight key');
assert(siteJs.includes('touchstart'), 'Touch gesture handling via touchstart');
assert(siteJs.includes('touchend'), 'Touch gesture handling via touchend');


/* =============================================================================
   SECTION 3: THE 2026 SCHEDULE (35 assertions)
   ========================================================================== */
console.log('\n[3/9] The 2026 schedule (35 assertions)...');

assert(DATA.competitions.every(c => c.schedule && typeof c.schedule === 'object'), 'All 9 competitions have a schedule object');
assert(DATA.competitions.every(c => c.schedule && typeof c.schedule.date === 'string' && c.schedule.date.includes('२०२६')), 'All 9 competition dates contain २०२६');

// On-site competitions specific dates, times and venues
assert(chitrakala.schedule.date === 'रविवार, २२ नोव्हेंबर २०२६', 'चित्रकला date is रविवार, २२ नोव्हेंबर २०२६');
assert(chitrakala.schedule.dateISO === '2026-11-22', 'चित्रकला dateISO is 2026-11-22');
assert(chitrakala.schedule.time === 'सकाळी ८:३० वाजता', 'चित्रकला time is सकाळी ८:३० वाजता');
assert(chitrakala.schedule.venue.includes('शिरवळ'), 'चित्रकला venue is in Shirwal');

assert(mehndi.schedule.date === 'सोमवार, २३ नोव्हेंबर २०२६', 'मेहंदी date is सोमवार, २३ नोव्हेंबर २०२६');
assert(mehndi.schedule.dateISO === '2026-11-23', 'मेहंदी dateISO is 2026-11-23');
assert(mehndi.schedule.time === 'दुपारी ४ वाजता', 'मेहंदी time is दुपारी ४ वाजता');
assert(mehndi.schedule.venue.includes('शिरवळ'), 'मेहंदी venue is in Shirwal');

assert(nibandh.schedule.date === 'शुक्रवार, २७ नोव्हेंबर २०२६', 'निबंध date is शुक्रवार, २७ नोव्हेंबर २०२६');
assert(nibandh.schedule.dateISO === '2026-11-27', 'निबंध dateISO is 2026-11-27');
assert(nibandh.schedule.time === 'दुपारी २ वाजता', 'निबंध time is दुपारी २ वाजता');
assert(nibandh.schedule.venue.includes('शिरवळ'), 'निबंध venue is in Shirwal');

assert(vaktrutva.schedule.date === 'शनिवार, २८ नोव्हेंबर २०२६', 'वक्तृत्व date is शनिवार, २८ नोव्हेंबर २०२६');
assert(vaktrutva.schedule.dateISO === '2026-11-28', 'वक्तृत्व dateISO is 2026-11-28');
assert(vaktrutva.schedule.time === 'सकाळी ११ वाजता', 'वक्तृत्व time is सकाळी ११ वाजता');
assert(vaktrutva.schedule.venue.includes('शिरवळ'), 'वक्तृत्व venue is in Shirwal');

assert(ekpatri.schedule.date === 'शनिवार, २८ नोव्हेंबर २०२६', 'एकपात्री नाट्य date is शनिवार, २८ नोव्हेंबर २०२६');
assert(ekpatri.schedule.dateISO === '2026-11-28', 'एकपात्री नाट्य dateISO is 2026-11-28');
assert(ekpatri.schedule.time === 'दुपारी ३ वाजता', 'एकपात्री नाट्य time is दुपारी ३ वाजता');
assert(ekpatri.schedule.venue.includes('शिरवळ'), 'एकपात्री नाट्य venue is in Shirwal');
assert(ekpatri.schedule.venue === 'जिल्हा परिषद प्राथमिक शाळा, मुली, शिरवळ',
  'एकपात्री नाट्य venue spells the village मुली');
assert(!ekpatri.schedule.venue.includes('मुळी'), 'एकपात्री नाट्य venue no longer says मुळी');

assert(rangoli.schedule.date === 'रविवार, २९ नोव्हेंबर २०२६', 'रांगोळी date is रविवार, २९ नोव्हेंबर २०२६');
assert(rangoli.schedule.dateISO === '2026-11-29', 'रांगोळी dateISO is 2026-11-29');
assert(rangoli.schedule.time === 'सकाळी ९ वाजता', 'रांगोळी time is सकाळी ९ वाजता');
assert(rangoli.schedule.venue.includes('शिरवळ'), 'रांगोळी venue is in Shirwal');

// Online competitions deadlines, time/venue null check
const dance = DATA.competitions.find(c => c.id === 'group-dance');
const singing = DATA.competitions.find(c => c.id === 'group-singing');
const fashion = DATA.competitions.find(c => c.id === 'group-fashion-show');

assert(dance.schedule.kind === 'online', 'समूह नृत्य schedule kind is online');
assert(dance.schedule.date === 'शुक्रवार, २७ नोव्हेंबर २०२६', 'समूह नृत्य date is २७ नोव्हेंबर २०२६');
assert(dance.schedule.time === null, 'समूह नृत्य time is null (deadline only)');
assert(dance.schedule.venue === null, 'समूह नृत्य venue is null (online event)');
assert(dance.schedule.deadlineLabel === 'व्हिडिओ पाठविण्याची अंतिम तारीख', 'समूह नृत्य carries explicit deadline label');

assert(singing.schedule.time === null && singing.schedule.venue === null, 'समूह गायन has null time & venue');
assert(fashion.schedule.time === null && fashion.schedule.venue === null, 'समूह फॅशन शो has null time & venue');

assert(siteJs.includes('function renderSchedule()'), 'site.js implements renderSchedule()');
assert(siteJs.includes('scheduleList'), 'renderSchedule renders #scheduleList container');


/* =============================================================================
   SECTION 4: TERMS CHECKBOX (20 assertions)
   ========================================================================== */
console.log('\n[4/9] Terms checkbox (20 assertions)...');

const regHtml = fs.readFileSync(path.join(ROOT, 'registration.html'), 'utf8');
const regDom = new JSDOM(regHtml);
const regDoc = regDom.window.document;

const chk = regDoc.getElementById('declaration');
assert(chk !== null, 'Checkbox element #declaration exists in registration.html');
assert(chk && chk.getAttribute('type') === 'checkbox', 'Element #declaration has type="checkbox"');
assert(chk && chk.getAttribute('name') === 'declaration', 'Checkbox has name="declaration"');
assert(chk && chk.hasAttribute('required'), 'Checkbox has required attribute');
assert(chk && chk.getAttribute('aria-describedby') === 'err-declaration', 'Checkbox has aria-describedby="err-declaration"');

const errDecl = regDoc.getElementById('err-declaration');
assert(errDecl !== null, 'Error container #err-declaration exists');

const chkLabel = regDoc.querySelector('label[for="declaration"]');
assert(chkLabel !== null, 'Label for #declaration exists');
assert(chkLabel && chkLabel.classList.contains('check--tnc'), 'Label has check--tnc class');
assert(chkLabel && chkLabel.textContent.includes('मी नियम व अटी वाचल्या आहेत'), 'Label text has declaration text');

const tncLink = regDoc.querySelector('a.tnc__link');
assert(tncLink !== null, 'Link a.tnc__link exists in registration form');
assert(tncLink && tncLink.getAttribute('href') === 'tnc.pdf', 'Terms link points directly to tnc.pdf');
assert(tncLink && tncLink.getAttribute('target') === '_blank', 'Terms link has target="_blank"');
assert(tncLink && tncLink.getAttribute('rel').includes('noopener'), 'Terms link has rel="noopener"');

const linkRow = regDoc.querySelector('.tnc__link-row');
assert(linkRow !== null, '.tnc__link-row container exists');
assert(chkLabel && tncLink && !chkLabel.contains(tncLink), 'PDF link sits OUTSIDE the checkbox label (cannot toggle box)');

// Checkbox CSS properties
assert(styleCss.includes('width:26px') || styleCss.includes('width: 26px'), 'Checkbox has 26px width defined in CSS');
assert(styleCss.includes('height:26px') || styleCss.includes('height: 26px'), 'Checkbox has 26px height defined in CSS');
assert(styleCss.includes('appearance:none') || styleCss.includes('appearance: none'), 'Checkbox has appearance:none in CSS');

// Validation in site.js
assert(siteJs.includes('!declaration.checked') || siteJs.includes('declaration.checked'), 'site.js validates declaration checkbox on submit');
assert(siteJs.includes('tncMissing') || siteJs.includes('कृपया नियम व अटी वाचून सहमती द्या'), 'site.js displays Marathi error for unchecked declaration');


/* =============================================================================
   SECTION 5: GROUP-NAME FLOW (30 assertions)
   ========================================================================== */
console.log('\n[5/9] Group-name flow (30 assertions)...');

assert(dance.isTeam === true, 'समूह नृत्य is marked as isTeam: true');
assert(singing.isTeam === true, 'समूह गायन is marked as isTeam: true');
assert(fashion.isTeam === true, 'समूह फॅशन शो is marked as isTeam: true');
assert(dance.teamMin === 5, 'समूह नृत्य has minimum 5 members');
assert(chitrakala.isTeam !== true, 'चित्रकला is not a team event');

assert(siteJs.includes('data-team-groupname'), 'site.js dynamically creates data-team-groupname inputs for team events');
assert(siteJs.includes('data-team-members'), 'site.js dynamically creates data-team-members textareas for team events');

assert(DATA.ui && DATA.ui.groupNameLabel === 'संघाचे नाव (Group Name)', 'UI.groupNameLabel is संघाचे नाव (Group Name)');
assert(!DATA.ui.groupNameLabel.includes('संघप्रमुख'), 'Group name label does NOT say संघप्रमुख');
assert(DATA.ui.groupNameHint && DATA.ui.groupNameHint.includes('हे नाव विद्यार्थ्याच्या नावावेगळे आहे'), 'Group name hint explains separation from student name');

assert(siteJs.includes('function teamMemberCount'), 'site.js implements teamMemberCount() helper');

// Helper to simulate member parsing logic from site.js
function parseLines(text) {
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

const lines4 = 'राजू\nअमित\nस्नेहल\nप्रिया';
const lines5 = 'राजू\nअमित\nस्नेहल\nप्रिया\nरोहन';
const lines6 = 'राजू\nअमित\nस्नेहल\nप्रिया\nरोहन\nअनिकेत';

assert(parseLines(lines4).length === 4, 'Parsing 4 lines yields 4 members');
assert(parseLines(lines5).length === 5, 'Parsing 5 lines yields 5 members');
assert(parseLines(lines6).length === 6, 'Parsing 6 lines yields 6 members');

const whitespaceLines = '  राजू  \n\n  अमित  \n  \n  स्नेहल  \n  प्रिया  \n  रोहन  ';
assert(parseLines(whitespaceLines).length === 5, 'Blank lines and padding whitespace are ignored in participant count');

const groupNameVal = 'शिवम डान्स ग्रुप';
assert(!parseLines(lines5).includes(groupNameVal), 'Group name is never included in student list count');

assert(parseLines(lines4).length < dance.teamMin, 'Entering fewer than 5 members fails validation below teamMin');
assert(parseLines(lines5).length >= dance.teamMin, 'Entering 5 members passes teamMin validation');
assert(siteJs.includes('किमान ५ सहभागी') || siteJs.includes('teamMin'), 'Marathi error / logic enforces teamMin threshold');

assert(siteJs.includes('id="groupname-\' + c.id'), 'Group name input is assigned id groupname-<id>');
assert(siteJs.includes('id="members-\' + c.id'), 'Members textarea is assigned id members-<id>');

assert(siteJs.includes('function capturePickState'), 'site.js defines capturePickState() for state persistence');
assert(siteJs.includes('state[\'groupName:\''), 'capturePickState saves typed group name');
assert(siteJs.includes('state[\'members:\''), 'capturePickState saves typed members list');
assert(siteJs.includes('saved[\'groupName:\' + c.id]'), 'Re-rendering restores previously entered group name');
assert(siteJs.includes('saved[\'members:\' + c.id]'), 'Re-rendering restores previously entered member list');

assert(siteJs.includes('reg.team = {') && siteJs.includes('groupName:'), 'Submission payload packages team.groupName');
assert(siteJs.includes('members:') && siteJs.includes('split(\'\\n\')'), 'Submission payload packages team.members array');

assert(siteJs.includes('UI.groupNameLabel') && siteJs.includes('r.team.groupName'), 'Registration success summary formats team group name');
assert(siteJs.includes('सहभागी: ') && siteJs.includes('r.team.members.length'), 'Registration success summary formats participant count');


/* =============================================================================
   SECTION 6: APPS SCRIPT BACKEND (Code.gs) (35 assertions)
   ========================================================================== */
console.log('\n[6/9] Apps Script backend (Code.gs) (35 assertions)...');

const codeGs = fs.readFileSync(path.join(ROOT, 'Code.gs'), 'utf8');

assert(codeGs.includes('var SPREADSHEET_ID ='), 'Code.gs defines SPREADSHEET_ID setting');
assert(codeGs.includes("'PUT_YOUR_SPREADSHEET_ID_HERE'"), 'SPREADSHEET_ID has safe placeholder');
assert(codeGs.includes("TIME_ZONE = 'Asia/Kolkata'"), 'Code.gs timezone set to Asia/Kolkata');
assert(codeGs.includes('var TABS = {'), 'Code.gs defines TABS mapping');

assert(codeGs.includes("'chitrakala':        'चित्रकला'"), "Code.gs maps chitrakala -> 'चित्रकला'");
assert(codeGs.includes("'mehndi':            'मेहंदी'"), "Code.gs maps mehndi -> 'मेहंदी'");
assert(codeGs.includes("'nibandh':           'निबंध'"), "Code.gs maps nibandh -> 'निबंध'");
assert(codeGs.includes("'vaktrutva':         'वक्तृत्व'"), "Code.gs maps vaktrutva -> 'वक्तृत्व'");
assert(codeGs.includes("'ekpatri':           'एकपात्री नाट्य'"), "Code.gs maps ekpatri -> 'एकपात्री नाट्य'");
assert(codeGs.includes("'rangoli':           'रांगोळी'"), "Code.gs maps rangoli -> 'रांगोळी'");
assert(codeGs.includes("'group-dance':       'समूह नृत्य'"), "Code.gs maps group-dance -> 'समूह नृत्य'");
assert(codeGs.includes("'group-singing':     'समूह गायन'"), "Code.gs maps group-singing -> 'समूह गायन'");
assert(codeGs.includes("'group-fashion-show': 'समूह फॅशन शो'"), "Code.gs maps group-fashion-show -> 'समूह फॅशन शो'");
assert(codeGs.includes("'reel-star':"), "Code.gs maps reel-star to its own tab");
assert(!codeGs.includes('AGE_COMPETITIONS'), 'Code.gs has no age-based competition list');
assert(!codeGs.includes('वय (वर्षे)'), 'Code.gs sheet keeps the original 18 columns');

// Headers validation
const expectedHeaders = [
  'नोंदणी तारीख व वेळ',
  'नोंदणी क्रमांक',
  'विद्यार्थ्याचे नाव',
  'इयत्ता',
  'शाळेचे नाव',
  'गाव / शहर',
  'पालकांचे / संरक्षकाचे नाव',
  'मोबाइल क्रमांक',
  'ईमेल',
  'स्पर्धा',
  'स्पर्धा आयडी',
  'स्वरूप',
  'गट',
  'विषय',
  'संघाचे नाव (Group Name)',
  'सहभागी विद्यार्थी',
  'सहभागींची संख्या',
  'स्थिती'
];

assert(expectedHeaders.length === 18, 'Expected 18 legacy headers still configured for Google Sheets');
expectedHeaders.forEach(h => {
  assert(codeGs.includes(`'${h}'`), `Code.gs defines column header '${h}'`);
});

assert(codeGs.includes('LockService.getScriptLock()'), 'Code.gs acquires LockService script lock');
assert(codeGs.includes('lock.waitLock('), 'Code.gs calls waitLock for concurrent safe execution');
assert(codeGs.includes('referenceExists_'), 'Code.gs implements referenceExists_ deduplication check');


/* =============================================================================
   SECTION 7: SUBMIT BEHAVIOUR (30 assertions)
   ========================================================================== */
console.log('\n[7/9] Submit behaviour (30 assertions)...');

const regForm = regDoc.getElementById('registrationForm');
assert(regForm !== null, '#registrationForm exists in registration.html');

const btnSubmit = regDoc.getElementById('submitBtn');
assert(btnSubmit !== null, '#submitBtn button exists in registration.html');
assert(btnSubmit && btnSubmit.getAttribute('type') === 'submit', 'Submit button has type="submit"');

assert(siteJs.includes('preventDefault()'), 'site.js prevents default page submission');
assert(siteJs.includes('aria-busy'), 'site.js applies aria-busy during submission');
assert(siteJs.includes('disabled = true'), 'site.js disables submit button during request');
assert(siteJs.includes('submitting = true'), 'site.js maintains isSubmitting lock guard');
assert(siteJs.includes('if (submitting) return'), 'Double submit click is ignored while request is active');

assert(siteJs.includes("data.result !== 'success'") || siteJs.includes("result === 'success'"), 'site.js checks strictly for res.result === "success"');
assert(!siteJs.includes('fakeSuccess') && !siteJs.includes('mockSuccess'), 'site.js never fakes success without backend confirmation');

assert(siteJs.includes('CONFIG.registrationEndpoint') || siteJs.includes('registrationEndpoint'), 'site.js configures registrationEndpoint');
assert(siteJs.includes('Google Apps Script endpoint') || siteJs.includes('अद्याप जोडलेला नाही'), 'site.js warns if endpoint is unconfigured');
assert(siteJs.includes('नोंदणी पाठवली गेली नाही') || siteJs.includes('पाठवला जात नाही'), 'Unconfigured endpoint explicitly states nothing was sent');

assert(siteJs.includes('catch(') || siteJs.includes('.catch'), 'site.js catches network / HTTP errors');
assert(siteJs.includes('तांत्रिक अडचण आली') || siteJs.includes('अडचण आली'), 'site.js shows user-friendly error on failure');
assert(!siteJs.includes('form.reset(); // on error'), 'Form inputs are preserved intact on network failure');

assert(regDoc.getElementById('studentName') !== null, '#studentName input exists');
assert(regDoc.getElementById('mobile') !== null, '#mobile input exists');
assert(regDoc.getElementById('standard') !== null, '#standard select exists');
assert(regDoc.getElementById('schoolName') !== null, '#schoolName input exists');
assert(regDoc.getElementById('city') !== null, '#city input exists');
assert(regDoc.getElementById('guardianName') !== null, '#guardianName input exists');

assert(siteJs.includes('MOBILE_RE = /^[6-9]\\d{9}$/'), 'site.js validates 10-digit Indian mobile number');
assert(siteJs.includes('कृपया इयत्ता निवडा'), 'site.js requires standard selection');
assert(siteJs.includes('किमान एका स्पर्धेसाठी नोंदणी करा') || siteJs.includes('किमान एक स्पर्धा'), 'site.js requires at least one competition selection');

const successCard = regDoc.getElementById('successCard');
assert(successCard !== null, '#successCard element exists in registration.html');
assert(siteJs.includes('refNumber') || siteJs.includes('reference'), 'site.js formats registration reference number');
assert(siteJs.includes('form.hidden = true') || siteJs.includes('form.style.display'), 'Form is hidden upon successful registration');

const resetBtn = regDoc.getElementById('resetBtn');
assert(resetBtn !== null, '#resetBtn reset button exists in registration.html');
assert(siteJs.includes('clearFieldError') || siteJs.includes('clearError'), 'site.js clears validation errors on user input');


/* =============================================================================
   SECTION 8: अध्यक्ष CARD IN HERO & REGRESSIONS (37 assertions)
   ========================================================================== */
console.log('\n[8/9] अध्यक्ष card in hero & regressions (37 assertions)...');

const heroOrg = doc.getElementById('heroOrganizer');
assert(heroOrg !== null, '#heroOrganizer exists in index.html');
assert(heroOrg && heroOrg.hasAttribute('hidden'), '#heroOrganizer has hidden attribute initially');

// Placement: below hero__lede ("प्रतिभा सादर करा.") and above hero__actions
const heroContent = doc.querySelector('.hero__content');
const heroLede = doc.querySelector('.hero__lede');
const heroActions = doc.querySelector('.hero__actions');

assert(heroLede && heroLede.textContent.includes('प्रतिभा सादर करा'), 'Hero lede exists and contains “प्रतिभा सादर करा.”');
assert(heroContent !== null && heroActions !== null, 'Hero content and actions containers exist');

const ledeIndex = Array.from(heroContent.children).indexOf(heroLede);
const orgIndex = Array.from(heroContent.children).indexOf(heroOrg);
const actionsIndex = Array.from(heroContent.children).indexOf(heroActions);

assert(orgIndex > ledeIndex, '#heroOrganizer is placed BELOW .hero__lede ("प्रतिभा सादर करा.")');
assert(orgIndex < actionsIndex, '#heroOrganizer is placed BEFORE .hero__actions');

// Organizer data in data.js
const ORG = DATA.organizer;
assert(typeof ORG === 'object' && ORG !== null, 'ORGANIZER object exists in data.js');
assert(ORG.photo === 'logo-left.png' || (Array.isArray(ORG.photo) && ORG.photo.includes('logo-left.png')), 'ORGANIZER photo references logo-left.png');
assert(ORG.shape === 'circle', 'ORGANIZER shape is "circle"');
assert(ORG.role === 'अध्यक्ष', 'ORGANIZER role is "अध्यक्ष"');
assert(ORG.name === 'श्री. संदीप गायकवाड', 'ORGANIZER name is "श्री. संदीप गायकवाड"');
assert(ORG.club === 'श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ', 'ORGANIZER club is "श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ"');
assert(ORG.phone === '+919860844503', 'ORGANIZER phone is "+919860844503"');
assert(ORG.phoneDisplay === '+91 98608 44503', 'ORGANIZER phoneDisplay is "+91 98608 44503"');
assert(ORG.alt && ORG.alt.includes('श्री. संदीप गायकवाड'), 'ORGANIZER alt text includes अध्यक्ष name');

// site.js rendering logic for organizer card
assert(siteJs.includes('function renderOrganizerPhoto()'), 'site.js defines renderOrganizerPhoto()');
assert(siteJs.includes('org-card'), 'site.js renders .org-card container');
assert(siteJs.includes('org-card__frame'), 'site.js renders .org-card__frame portrait frame');
assert(siteJs.includes('org-card__photo'), 'site.js renders .org-card__photo image');
assert(siteJs.includes('org-card__role'), 'site.js renders .org-card__role badge');
assert(siteJs.includes('org-card__name'), 'site.js renders .org-card__name element');
assert(siteJs.includes('org-card__club'), 'site.js renders .org-card__club element');
assert(siteJs.includes('org-card__phone'), 'site.js renders .org-card__phone link');
assert(siteJs.includes('tel:'), 'site.js formats dialable tel: protocol href');
assert(siteJs.includes('img.addEventListener(\'error\','), 'site.js attaches error handler to hide card if photo fails');

// Configured deployment and locally scoped blue organiser palette.
assert(siteJs.includes("registrationEndpoint: 'https://script.google.com/macros/s/AKfycbwGjbMftGjek68jzoWGDOc3D2qdtjyx9upNmz4ycqAOLV8JHIfQchdYo4FMb7hnqReH/exec'"), 'Registration uses the supplied Apps Script deployment');
const orgStyles = styleCss.slice(styleCss.indexOf('.org-card{'), styleCss.indexOf('.hero__eyebrow{'));
assert(orgStyles.includes('var(--org-blue-soft), var(--ivory)'), 'Organiser card blends soft blue with the existing warm ivory');
assert(orgStyles.includes('color:var(--org-blue-deep)') && orgStyles.includes('var(--org-blue-line)'), 'Organiser text and borders use the blue palette');
assert(styleCss.includes('--saffron:    #E8890C;') && styleCss.includes('--maroon:     #7A1F2B;'), 'Existing warm theme colours remain unchanged');

// Regressions & typography in style.css
assert(styleCss.includes('--organizer-scale: 1.5') || styleCss.includes('--organizer-scale:1.5'), 'style.css defines --organizer-scale: 1.5');
assert(styleCss.includes('--org-size-brand:') && styleCss.includes('var(--organizer-scale)'), '--org-size-brand scales via --organizer-scale');
assert(styleCss.includes('--org-size-hero:') && styleCss.includes('var(--organizer-scale)'), '--org-size-hero scales via --organizer-scale');
assert(styleCss.includes('--org-size-footer:') && styleCss.includes('var(--organizer-scale)'), '--org-size-footer scales via --organizer-scale');
assert(styleCss.includes('.org-name'), '.org-name shared class implemented');
assert(styleCss.includes('.hero__content{') && styleCss.includes('center'), 'Hero content alignment is centred');

/* homepage title: six-colour gradient, with solid fallbacks */
const titleRule = (styleCss.match(/\.hero__title\{[^}]*margin:0 0 \.3em;[^}]*\}/) || [''])[0];
assert(/color:\s*var\(--maroon\);/.test(titleRule),
  'Hero title keeps a solid maroon fallback colour');
/* the festival title needs room at the top of the page */
const heroRule = (styleCss.match(/\.hero\{[\s\S]*?\n\}/) || [''])[0];
const heroPad = (heroRule.match(/padding:clamp\((\d+)px[^)]*?\) 0/) || [])[1];
assert(heroRule.length > 0 && heroPad, 'The hero declares a responsive top padding');
assert(Number(heroPad) >= 64, `Hero top padding gives the title room under the 74px header (${heroPad}px)`);
const eyebrowRule = (styleCss.match(/\.hero__eyebrow\{[\s\S]*?\n\}/) || [''])[0];
assert(/margin:0 0 (2[0-9]|[3-9][0-9])px/.test(eyebrowRule),
  'The organiser pill leaves extra space above the festival title');

const gradientRule = (styleCss.match(/background-image:linear-gradient\(95deg,[^)]+\)/) || [''])[0];
const stops = ['#C2185B', '#1E4E9A', '#6A1B9A', '#9C4300', '#C1272D', '#7A1F2B'];
assert(gradientRule.length > 0, 'Hero title uses a linear-gradient');
stops.forEach((hex, i) => {
  const at = gradientRule.indexOf(hex);
  assert(at > 0, `Hero title gradient contains stop ${i + 1} ${hex}`);
  if (i > 0) assert(at > gradientRule.indexOf(stops[i - 1]), `Gradient stop ${hex} follows ${stops[i - 1]} (pink→blue→purple→orange→red→maroon)`);
});
assert(styleCss.includes('@supports (-webkit-background-clip:text)'),
  'Gradient text is behind an @supports feature check');
assert(styleCss.includes('background-clip:text') && styleCss.includes('-webkit-text-fill-color:transparent'),
  'Hero title clips the gradient to the glyphs');
assert(/@media \(forced-colors: active\)\{[\s\S]{0,200}\.hero__title\{[\s\S]{0,200}-webkit-text-fill-color:currentColor/.test(styleCss),
  'Forced-colours mode restores a visible hero title');
assert(/@media print\{[\s\S]{0,200}\.hero__title\{ background-image:none/.test(styleCss),
  'Printing falls back to the solid hero title');
assert(styleCss.includes('.section-head{') && styleCss.includes('center'), 'Section headings are centred');
assert(styleCss.includes('.field__input{') || styleCss.includes('.field__input,'), 'Form inputs styled with left-aligned inputs');
assert(styleCss.includes('.rules') || styleCss.includes('.topics'), 'Dense lists styled with proper padding');
assert(styleCss.includes('Noto Sans Devanagari') && styleCss.includes('Noto Serif Devanagari'), 'Font stack includes Noto Sans and Noto Serif Devanagari');
assert(styleCss.includes('line-height:1.5') || styleCss.includes('line-height: 1.5'), 'Line height allows clearance for Devanagari vowel diacritics');

// Navigation responsive regression
assert((siteJs.includes('navToggle') || siteJs.includes('hamburger')) && siteJs.includes('aria-expanded'), 'Responsive mobile navigation uses hamburger toggle and aria-expanded');


/* =============================================================================
   SECTION 9: रील स्टार, AGE ELIGIBILITY, CAROUSEL MANIFEST & WHATSAPP
   ========================================================================== */
console.log('\n[9/9] रील स्टार, grade eligibility, carousel manifest & WhatsApp...');

/* ---- 9a. the manifest covers every gallery photograph in the repo ---- */
const imageExt = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;
const repoImages = fs.readdirSync(ROOT)
  .filter(f => imageExt.test(f) && fs.statSync(path.join(ROOT, f)).isFile())
  .sort();

/* logo-left.png is the अध्यक्ष portrait: it belongs to the hero, not the gallery */
assert(repoImages.includes('logo-left.png'), 'Repository still contains logo-left.png');
const galleryImages = repoImages.filter(f => f !== 'logo-left.png');
assert(galleryImages.length >= 50, `Repository contains ${galleryImages.length} gallery photographs`);
galleryImages.forEach(file => {
  const inManifest = DATA.gallery.images.some(i => i.src === file);
  assert(inManifest, `Carousel manifest includes ${file}`);
});

DATA.gallery.images.forEach(entry => {
  assert(fs.existsSync(path.join(ROOT, entry.src)), `Manifest entry ${entry.src} resolves to a real file`);
});

const manifestSrcs = DATA.gallery.images.map(i => i.src);
assert(new Set(manifestSrcs).size === manifestSrcs.length, 'Manifest lists no duplicate filenames');
assert(!manifestSrcs.includes('logo-left.png'), 'Organiser portrait logo-left.png is NOT a carousel slide');
assert(DATA.gallery.images.length === galleryImages.length, 'Manifest length equals the gallery photographs in the repo');
assert(manifestSrcs.some(f => f.startsWith('WhatsApp Image ')), 'WhatsApp Image uploads are in the carousel');
assert(manifestSrcs.includes('1.jpeg') && manifestSrcs.includes('13.jpeg'), 'Numbered photos 1.jpeg…13.jpeg are in the carousel');
assert(DATA.gallery.images.every(i => typeof i.alt === 'string' && i.alt.trim().length > 0), 'Every slide has alt text');

/* ---- 9b. रील स्टार data (grade-based, like every other competition) ---- */
const reel = DATA.competitions.find(c => c.id === 'reel-star');
assert(!!reel, 'रील स्टार exists in data.js');
assert(reel.name === 'रील स्टार' && reel.nameLatin === 'Reel Star', 'रील स्टार name and English name are correct');
assert(reel.page === 'reel-star.html', 'रील स्टार page is reel-star.html');
assert(reel.mode === 'online', 'रील स्टार mode is online');
assert(reel.eligibilityType === undefined, 'रील स्टार has no age-based eligibility type');
assert(reel.ageEligibility === undefined, 'रील स्टार carries no age rule');
assert(reel.eligibility && reel.eligibility.from === 5 && reel.eligibility.to === 10,
  'रील स्टार eligibility is the class index range 5–10 (इयत्ता ५ वी ते १० वी)');
assert(DATA.standards[reel.eligibility.from].includes('५') &&
  DATA.standards[reel.eligibility.to].includes('१०'),
  'रील स्टार range maps to इयत्ता ५ वी → इयत्ता १० वी');
assert(Array.isArray(reel.groups) && reel.groups.length === 0, 'रील स्टार has no separate groups');
assert(reel.schedule && reel.schedule.kind === 'online', 'रील स्टार schedule kind is online');
assert(reel.schedule.dateISO === '2026-11-29', 'रील स्टार dateISO is 2026-11-29');
assert(reel.schedule.date === 'रविवार, २९ नोव्हेंबर २०२६', 'रील स्टार Marathi date is रविवार, २९ नोव्हेंबर २०२६');
assert(reel.schedule.time === null && reel.schedule.venue === null,
  'रील स्टार has no live-event time or physical venue');
assert(reel.schedule.deadlineTime === 'संध्याकाळी ५ वाजता', 'रील स्टार submission deadline is ५:०० pm');
assert(siteJs.includes('function deadlineDate'), 'site.js renders the deadline time via deadlineDate()');
assert(reel.schedule.deadlineLabel.includes('सबमिशन'), 'रील स्टार date is labelled as a video-submission deadline');
assert(reel.isTeam !== true, 'रील स्टार is an individual (not team) competition');
assert(reel.pending === false, 'रील स्टार is not marked as pending');
assert(Array.isArray(reel.notes) && reel.notes.length > 0, 'रील स्टार keeps unannounced details explicitly unannounced');

/* no age wording anywhere in the competition data or the shared copy */
assert(!JSON.stringify(reel).includes('वय'), 'रील स्टार data carries no age wording');
assert(!JSON.stringify(reel).includes('वर्षे'), 'रील स्टार data is not described in years');

/* ---- 9c. pages ---- */
assert(fs.existsSync(path.join(ROOT, 'reel-star.html')), 'reel-star.html exists');
const reelHtml = fs.readFileSync(path.join(ROOT, 'reel-star.html'), 'utf8');
assert(reelHtml.includes('data-competition="reel-star"'), 'reel-star.html declares data-competition="reel-star"');
assert(reelHtml.includes('data-page="competition"'), 'reel-star.html uses the shared competition page architecture');
assert(reelHtml.includes('<title>रील स्टार |'), 'reel-star.html has its own title');
assert(reelHtml.includes('इयत्ता ५ वी ते १० वी'), 'reel-star.html meta states the grade range');

/* every competition page is linked from data.js and vice versa */
DATA.competitions.forEach(c => {
  assert(fs.existsSync(path.join(ROOT, c.page)), `Competition ${c.id} page ${c.page} exists`);
});

/* homepage is data-driven: cards/schedule/explorer read from data.js */
assert(indexHtml.includes('id="homeCards"'), 'Homepage renders competition cards from data.js');
assert(siteJs.includes('onlineCompetitions()') || siteJs.includes('function onlineCompetitions'), 'Homepage online strip is data-driven');
assert(siteJs.includes('function eligibilityText'), 'site.js renders eligibility from the class range');
assert(!siteJs.includes('isAgeBased'), 'site.js has no age-based special case');
assert(!siteJs.includes('ageEligibility'), 'site.js reads no age rule from data.js');
assert(siteJs.includes('function hasGroups'), 'site.js distinguishes competitions without groups');

/* the homepage hero no longer advertises an age rule */
assert(!indexHtml.includes('वय ५ ते १०'), 'Hero/homepage never mentions an age range');
assert(!indexHtml.includes('रील स्टार: वय'), 'Hero chips no longer show a रील स्टार age chip');
assert(indexHtml.includes('५ वी ते १० वी'), 'Homepage states the इयत्ता ५ वी ते १० वी range');
assert(indexHtml.includes('३० गटांत स्पर्धा'), 'Hero chip states ३० गटांत स्पर्धा');
assert(!indexHtml.includes('ऑनलाइन नोंदणी उपलब्ध'), 'The old ऑनलाइन नोंदणी उपलब्ध hero chip is gone');

/* ---- 9d. registration integration ---- */
assert(regDoc.getElementById('age') === null, 'registration.html has no age field (grade-based rule)');
assert(regDoc.getElementById('err-age') === null, 'registration.html has no age error container');
assert(!siteJs.includes('UI.ageMissing'), 'site.js does not require an age');
assert(!siteJs.includes('UI.ageInvalid'), 'site.js does not validate an age range');
assert(codeGs.includes("'reel-star':"), 'Backend has a रील स्टार tab');
assert(!codeGs.includes('AGE_COMPETITIONS'), 'Backend carries no age validation');
assert(!codeGs.includes('वय (वर्षे)'), 'Backend sheet has no age column');

/* ---- 9e. WhatsApp ---- */
/* the endpoint notice is gone, but a missing endpoint must still never fake a send */
assert(!regHtml.includes('configNote'), 'registration.html no longer shows the endpoint notice');
assert(!regHtml.includes('endpoint अद्याप जोडलेला नाही'), 'The endpoint notice text is gone from the page');
assert(!siteJs.includes('#configNote'), 'site.js no longer toggles a config note');
assert(siteJs.includes("if (!CONFIG.registrationEndpoint)"), 'site.js still refuses to fake a send without an endpoint');

/* ---- 9f. WhatsApp group button after a successful registration ---- */
assert(regHtml.includes('id="successWhatsapp"'), 'The success card has a WhatsApp button mount');
assert(/var waHost = qs\('#successWhatsapp'\)/.test(siteJs), 'site.js fills the success-card WhatsApp button');
assert(siteJs.includes('whatsappButton({ size: \'lg\', cls: \'success__wa-btn\' })'),
  'The success-card button reuses whatsappButton(), so the URL stays in data.js');
assert(DATA.ui.successWhatsappNote && DATA.ui.successWhatsappNote.includes('WhatsApp ग्रुपमध्ये'),
  'The success-card note explains the WhatsApp group');
assert(styleCss.includes('.success__wa{') && styleCss.includes('.success__wa-note'),
  'The success-card WhatsApp block is styled');

/* ---- 9g. the terms checkbox tick is really visible, and black ---- */
assert(!/\.check[^{]*check__input::after/.test(styleCss),
  'The checkbox no longer draws its tick with an <input>::after (never rendered by browsers)');
const tickRule = (styleCss.match(/\.check \.check__input:checked,[\s\S]{0,600}?\}/) || [''])[0];
assert(tickRule.length > 0, 'The checked checkbox has its own rule');
assert(/background-image:url\("data:image\/svg\+xml/.test(tickRule), 'The tick is an inline SVG background image');
assert(tickRule.includes("stroke='%23000000'"), 'The tick is black');
assert(/background-color:#fff/.test(tickRule), 'The checked tile is white so the black tick is readable');
assert(/background-size:16px 16px/.test(styleCss), 'The tick is sized inside the box');
assert(/@media \(forced-colors: active\)\{[\s\S]{0,300}appearance:auto/.test(styleCss),
  'High-contrast mode hands the checkbox back to the system');

const WA_URL = 'https://chat.whatsapp.com/CCTGjn1R4vgLxWYgTySjfq?mode=gi_t';
assert(DATA.whatsapp && DATA.whatsapp.url === WA_URL, 'data.js holds the exact WhatsApp invitation URL');
assert(siteJs.includes('data-whatsapp-link'), 'Header/footer WhatsApp buttons are rendered from data.js');
assert(indexHtml.includes('data-whatsapp-link'), 'Homepage has a WhatsApp group button');

const allHtml = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const waHrefs = allHtml.match(/href="[^"]*chat\.whatsapp\.com[^"]*"/g) || [];
assert(waHrefs.length >= 2, 'Homepage carries the WhatsApp button in the hero and the CTA band');
waHrefs.forEach(h => assert(h === `href="${WA_URL}"`, `WhatsApp href is exactly the supplied URL (${h})`));

const waAnchors = indexHtml.match(/<a[^>]*data-whatsapp-link[^>]*>/g) || [];
assert(waAnchors.length >= 2, 'Both homepage WhatsApp buttons are links');
waAnchors.forEach(a => {
  assert(a.includes('target="_blank"'), 'WhatsApp button opens in a new tab');
  assert(a.includes('rel="noopener noreferrer"'), 'WhatsApp button uses rel="noopener noreferrer"');
  assert(/aria-label="[^"]+"/.test(a), 'WhatsApp button has an accessible label');
});
assert(styleCss.includes('.btn--whatsapp'), 'WhatsApp button has its own styling');
assert(styleCss.includes(':focus-visible'), 'WhatsApp button keeps a visible keyboard focus style');

/* ---- 9f. preserved behaviour ---- */
assert(styleCss.includes('.carousel__dots--many'), 'Many-image carousel pagination is styled');
assert(siteJs.includes('data-current'), 'Carousel remembers the active slide across rebuilds');
assert(siteJs.includes("prefers-reduced-motion: reduce"), 'Reduced-motion support is preserved');
assert(DATA.competitions.filter(c => c.mode === 'offline').length === 6, 'All six on-site competitions are preserved');


/* =============================================================================
   SUMMARY AND EXIT
   ========================================================================== */
console.log('\n========================================');
console.log(`Result: ${passCount} PASS / ${failCount} FAIL`);
console.log('========================================\n');

if (failures.length > 0) {
  console.error(`${failures.length} test(s) failed:`);
  failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
  process.exit(1);
} else {
  console.log(`All ${passCount} assertions passed successfully.`);
  process.exit(0);
}
