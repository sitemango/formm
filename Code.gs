/* =============================================================================
   Code.gs — बालसंस्कार फेस्टिवल २०२६ — registration → Google Sheets
   -----------------------------------------------------------------------------
   One spreadsheet, ten competition tabs. Every registration is written to the
   tab of the competition it belongs to; a student who enters three competitions
   produces one row in each of the three matching tabs and nothing anywhere else.

   SETUP (see README.md for the walk-through)
   ------------------------------------------
   1. Create one Google Spreadsheet.
   2. Extensions → Apps Script, paste this file, save.
   3. Set SPREADSHEET_ID below to the id from the spreadsheet URL
      (docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit).
   4. Run  setupSheets()  once from the editor to create all ten tabs.
   5. Deploy → New deployment → Web app
        Execute as: Me        Access: Anyone
      then paste the /exec URL into CONFIG.registrationEndpoint in site.js.

   Nothing secret lives here: the deployment URL is public by design, which is
   why every field, per-competition registration deadline (Asia/Kolkata), and
   Balwadi competition-day random subject rule is enforced on this side before
   a row is written.
   ========================================================================== */

/* ------------------------------------------------------------------ settings */

/* PASTE YOUR SPREADSHEET ID HERE — keep it a placeholder in the repository. */
var SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE';

var TIME_ZONE = 'Asia/Kolkata';

/* competition id (from data.js) → worksheet tab name */
var TABS = {
  'chitrakala':        'चित्रकला',
  'mehndi':            'मेहंदी',
  'nibandh':           'निबंध',
  'vaktrutva':         'वक्तृत्व',
  'ekpatri':           'एकपात्री नाट्य',
  'rangoli':           'रांगोळी',
  'group-dance':       'समूह नृत्य',
  'group-singing':     'समूह गायन',
  'group-fashion-show': 'समूह फॅशन शो',
  'reel-star':         'रील स्टार'
};

/* Actual competition event dates (YYYY-MM-DD in Asia/Kolkata), synchronised
   with schedule.competitionDateISO in data.js.
   Registration for each competition closes one calendar day before its actual
   event date at 11:59 PM IST (23:59:59.999+05:30).
   Online competitions whose published dates are video-submission deadlines and
   have no separate confirmed competition date keep null here — never derive a
   registration deadline from a video-submission deadline or invent dates. */
var COMPETITION_DATES_ISO = {
  'chitrakala':         '2026-11-22',
  'mehndi':             '2026-11-23',
  'nibandh':            '2026-11-27',
  'vaktrutva':          '2026-11-28',
  'ekpatri':            '2026-11-28',
  'rangoli':            '2026-11-29',
  'group-dance':        null,
  'group-singing':      null,
  'group-fashion-show': null,
  'reel-star':          null
};

/* Competitions whose entries carry a group name and a participant list. */
var TEAM_COMPETITIONS = ['group-dance', 'group-singing', 'group-fashion-show'];

var MIN_TEAM_MEMBERS = 5;

/* Balwadi random subject allotment (विषयाचे यादृच्छिक वाटप), synchronised with
   data.js. Only individual subject-based competitions eligible for Balwadi
   appear here, and each must define exactly 4 existing topics. For Balwadi,
   no topic is chosen at registration time — any 1 of the 4 listed topics is
   randomly given during the actual competition. */
var BALWADI_STANDARD = 'बालवाडी';
var BALWADI_SHEET_NOTE_PREFIX = 'प्रत्यक्ष स्पर्धेच्या वेळी ४ विषयांपैकी १ यादृच्छिक विषय';
var BALWADI_TOPICS = {
  'chitrakala': ['गणपती', 'कृष्ण', 'कार', 'रंगीत फुलपाखरे']
};

/* One header row for every tab — identical structure everywhere. */
var HEADERS = [
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

var MAX_TEXT = 600;      // guards against junk payloads
var MOBILE_RE = /^[6-9]\d{9}$/;

var MARATHI_DIGITS_ = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
var MARATHI_WEEKDAYS_ = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
var MARATHI_MONTHS_ = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
];

/* ------------------------------------------------------------------- web app */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(25000);          // concurrent submissions queue up safely
    locked = true;

    var now = currentNow_();
    var payload = parsePayload_(e);
    if (!payload) return out_({ result: 'error', message: 'विनंती वाचता आली नाही. कृपया पुन्हा प्रयत्न करा.' });

    var problem = validate_(payload, now);
    if (problem) return out_({ result: 'error', message: problem });

    if (SPREADSHEET_ID === 'PUT_YOUR_SPREADSHEET_ID_HERE' || !SPREADSHEET_ID) {
      return out_({ result: 'error', message: 'नोंदणी साठवणे सुरू झाले नाही. कृपया आयोजकांशी संपर्क करा.' });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var saved = [];
    var allottedTopics = {};
    var stamp = formatStampIST_(now);

    for (var i = 0; i < payload.registrations.length; i++) {
      var reg = payload.registrations[i];
      var compId = resolveCompetitionId_(reg);
      var tabName = (compId && TABS[compId]) || tabFromName_(reg.competition);
      if (!tabName) continue;                      // unknown competition → skip, never guess
      if (compId && isRegistrationClosed_(compId, now)) continue; // never write after deadline

      var sheet = getOrCreateSheet_(ss, tabName);
      var reference = (payload.requestId || 'BSF26') + '-' + (i + 1);

      if (referenceExists_(sheet, reference)) continue;   // duplicate delivery

      /* Authoritative server-side Balwadi topic record: Balwadi participants
         cannot choose a topic during registration — 1 of the 4 listed topics
         will be randomly given during the actual competition. */
      var finalTopic = reg.topic;
      if (isBalwadi_(payload.standard) && compId && TEAM_COMPETITIONS.indexOf(compId) === -1) {
        var sheetNote = balwadiSheetTopicNote_(compId);
        if (!sheetNote) continue;
        finalTopic = sheetNote;
        allottedTopics[compId] = finalTopic;
      }

      sheet.appendRow([
        stamp,
        reference,
        payload.studentName,
        payload.standard,
        payload.schoolName,
        payload.city,
        payload.guardianName,
        payload.mobile,
        payload.email,
        reg.competition,
        compId || reg.competitionId,
        reg.mode === 'online' ? 'ऑनलाइन' : 'प्रत्यक्ष',
        reg.group,
        finalTopic,
        reg.team ? reg.team.groupName : '',
        reg.team ? reg.team.members.join(' | ') : '',
        reg.team ? reg.team.members.length : '',
        reg.status === 'pending-confirmation' ? 'पुष्टी बाकी' : 'नोंदणी झाली'
      ]);
      saved.push({
        competitionId: compId || reg.competitionId,
        competition: reg.competition,
        tab: tabName,
        reference: reference,
        topic: finalTopic
      });
    }

    if (!saved.length) {
      return out_({ result: 'error', message: 'निवडलेल्या स्पर्धांसाठी नोंदणी करता आली नाही. कृपया पुन्हा प्रयत्न करा.' });
    }

    return out_({
      result: 'success',
      reference: saved[0].reference,
      saved: saved.length,
      tabs: saved.map(function (s) { return s.tab; }),
      allottedTopics: allottedTopics,
      registrations: saved
    });
  } catch (err) {
    /* Report the problem without leaking the script internals. */
    return out_({ result: 'error', message: 'नोंदणी साठवताना तांत्रिक अडचण आली. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.' });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function doGet() {
  return out_({ result: 'error', message: 'हा endpoint फक्त नोंदणीसाठी आहे.' });
}

/* ------------------------------------------- deadlines & Balwadi allotment */

function currentNow_() {
  if (typeof __TEST_NOW !== 'undefined' && __TEST_NOW) return new Date(__TEST_NOW);
  return new Date();
}

function formatStampIST_(now) {
  if (typeof Utilities !== 'undefined' && Utilities && typeof Utilities.formatDate === 'function') {
    return Utilities.formatDate(now, TIME_ZONE, 'dd/MM/yyyy HH:mm:ss');
  }
  var ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  var pad = function (n) { return ('0' + n).slice(-2); };
  return pad(ist.getUTCDate()) + '/' + pad(ist.getUTCMonth() + 1) + '/' + ist.getUTCFullYear() + ' ' +
    pad(ist.getUTCHours()) + ':' + pad(ist.getUTCMinutes()) + ':' + pad(ist.getUTCSeconds());
}

/* Subtract exactly one calendar day from a YYYY-MM-DD date string. */
function previousDayISO_(dateISO) {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
  var parts = dateISO.split('-');
  var d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) - 1));
  var y = d.getUTCFullYear();
  var m = ('0' + (d.getUTCMonth() + 1)).slice(-2);
  var day = ('0' + d.getUTCDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

/* Individual registration deadline date (YYYY-MM-DD in Asia/Kolkata):
   one calendar day before the competition's actual event date. */
function registrationDeadlineISO_(compId) {
  if (!compId || !Object.prototype.hasOwnProperty.call(COMPETITION_DATES_ISO, compId)) return null;
  var eventDate = COMPETITION_DATES_ISO[compId];
  if (!eventDate) return null;
  return previousDayISO_(eventDate);
}

/* Exact cutoff instant: 23:59:59.999 IST (11:59 PM IST, end of previous day). */
function registrationDeadlineCutoffMs_(compId) {
  var deadlineISO = registrationDeadlineISO_(compId);
  if (!deadlineISO) return null;
  return Date.parse(deadlineISO + 'T23:59:59.999+05:30');
}

function currentDateIST_(nowOpt) {
  var now = nowOpt instanceof Date ? nowOpt : (nowOpt ? new Date(nowOpt) : currentNow_());
  if (typeof Utilities !== 'undefined' && Utilities && typeof Utilities.formatDate === 'function') {
    return Utilities.formatDate(now, TIME_ZONE, 'yyyy-MM-dd');
  }
  var ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  var y = ist.getUTCFullYear();
  var m = ('0' + (ist.getUTCMonth() + 1)).slice(-2);
  var d = ('0' + ist.getUTCDate()).slice(-2);
  return y + '-' + m + '-' + d;
}

function isRegistrationClosed_(compId, nowOpt) {
  var deadlineISO = registrationDeadlineISO_(compId);
  if (!deadlineISO) return false;
  var now = nowOpt instanceof Date ? nowOpt : (nowOpt ? new Date(nowOpt) : currentNow_());
  var dateIST = currentDateIST_(now);
  if (dateIST !== deadlineISO) {
    return dateIST > deadlineISO;
  }
  var cutoff = registrationDeadlineCutoffMs_(compId);
  return cutoff !== null && !isNaN(cutoff) ? now.getTime() > cutoff : false;
}

function toMarathiDigits_(value) {
  return String(value).replace(/\d/g, function (d) { return MARATHI_DIGITS_[Number(d)]; });
}

function formatDateMarathi_(dateISO) {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return '';
  var parts = dateISO.split('-');
  var y = Number(parts[0]);
  var m = Number(parts[1]) - 1;
  var day = Number(parts[2]);
  var d = new Date(Date.UTC(y, m, day));
  return MARATHI_WEEKDAYS_[d.getUTCDay()] + ', ' +
    toMarathiDigits_(day) + ' ' + MARATHI_MONTHS_[m] + ' ' + toMarathiDigits_(y);
}

function isBalwadi_(standard) {
  return String(standard || '').trim() === BALWADI_STANDARD;
}

function balwadiTopicsFor_(compId) {
  if (!compId || !Object.prototype.hasOwnProperty.call(BALWADI_TOPICS, compId)) return null;
  return BALWADI_TOPICS[compId];
}

function balwadiSheetTopicNote_(compId) {
  var allowed = balwadiTopicsFor_(compId);
  if (!Array.isArray(allowed) || allowed.length !== 4) return null;
  return BALWADI_SHEET_NOTE_PREFIX + ' (' + allowed.join(' / ') + ')';
}

/* Competition-day helper: uniformly draw 1 of the 4 listed Balwadi topics. */
function drawRandomBalwadiTopic_(compId) {
  var allowed = balwadiTopicsFor_(compId);
  if (!Array.isArray(allowed) || allowed.length !== 4) return null;
  var idx = Math.floor(Math.random() * allowed.length);
  var chosen = allowed[idx];
  return allowed.indexOf(chosen) !== -1 ? chosen : null;
}

/* ---------------------------------------------------------------- validation */

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  var data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return null; }
  if (!data || typeof data !== 'object') return null;
  if (!Array.isArray(data.registrations)) return null;

  var clean = {
    requestId: text_(data.requestId, 60),
    studentName: text_(data.studentName),
    standard: text_(data.standard, 40),
    schoolName: text_(data.schoolName),
    city: text_(data.city, 80),
    guardianName: text_(data.guardianName),
    mobile: String(data.mobile || '').replace(/\D/g, ''),
    email: text_(data.email, 120),
    registrations: []
  };

  for (var i = 0; i < data.registrations.length && i < 12; i++) {
    var r = data.registrations[i] || {};
    var entry = {
      competitionId: text_(r.competitionId, 60),
      competition: text_(r.competition, 120),
      mode: text_(r.mode, 20),
      group: text_(r.group, 120),
      topic: text_(r.topic, 200),
      status: text_(r.status, 40)
    };
    if (r.team && typeof r.team === 'object') {
      entry.team = {
        groupName: text_(r.team.groupName, 120),
        members: Array.isArray(r.team.members)
          ? r.team.members.map(function (m) { return text_(m, 160); })
              .filter(function (m) { return m.length > 0; }).slice(0, 40)
          : []
      };
    }
    clean.registrations.push(entry);
  }
  return clean;
}

function validate_(p, nowOpt) {
  if (!p.studentName || p.studentName.length < 3) return 'कृपया विद्यार्थ्याचे पूर्ण नाव भरा.';
  if (!p.standard) return 'कृपया इयत्ता निवडा.';
  if (!p.schoolName || p.schoolName.length < 2) return 'कृपया शाळेचे नाव भरा.';
  if (!p.city) return 'कृपया गाव / शहर भरा.';
  if (!p.guardianName || p.guardianName.length < 3) return 'कृपया पालकांचे नाव भरा.';
  if (!MOBILE_RE.test(p.mobile)) return 'कृपया वैध १० अंकी मोबाइल क्रमांक भरा.';
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) return 'कृपया वैध ईमेल पत्ता भरा.';
  if (!p.registrations.length) return 'कृपया किमान एका स्पर्धेसाठी नोंदणी करा.';

  var now = nowOpt instanceof Date ? nowOpt : (nowOpt ? new Date(nowOpt) : currentNow_());
  var known = 0;
  for (var i = 0; i < p.registrations.length; i++) {
    var reg = p.registrations[i];
    var compId = resolveCompetitionId_(reg);
    var tab = (compId && TABS[compId]) || tabFromName_(reg.competition);
    if (!tab || !compId) continue;
    known++;

    /* Per-competition registration deadline enforcement (Asia/Kolkata). */
    if (isRegistrationClosed_(compId, now)) {
      var dISO = registrationDeadlineISO_(compId);
      return (reg.competition || tab) +
        ' या स्पर्धेसाठी नोंदणी बंद झाली आहे (नोंदणीची अंतिम तारीख: ' +
        formatDateMarathi_(dISO) + ', रात्री ११:५९ वाजेपर्यंत).';
    }

    if (TEAM_COMPETITIONS.indexOf(compId) !== -1) {
      if (!reg.team || !reg.team.groupName || reg.team.groupName.length < 2) {
        return 'कृपया संघ स्पर्धांसाठी संघाचे नाव (Group Name) भरा.';
      }
      if (!reg.team.members.length || reg.team.members.length < MIN_TEAM_MEMBERS) {
        return 'कृपया किमान ५ सहभागी विद्यार्थ्यांची नावे व इयत्ता भरा.';
      }
    } else if (isBalwadi_(p.standard)) {
      /* Balwadi individual competitions must have 4 listed topics; participants
         cannot pick or submit a single topic at registration time because 1 of
         the 4 topics is randomly given during the actual competition. */
      var allowed = balwadiTopicsFor_(compId);
      var expectedNote = balwadiSheetTopicNote_(compId);
      if (!Array.isArray(allowed) || allowed.length !== 4 || !expectedNote) {
        return (reg.competition || tab) +
          ' या बालवाडी स्पर्धेसाठी नेमके ४ विषय उपलब्ध नाहीत. कृपया आयोजकांशी संपर्क करा.';
      }
      if (reg.topic && reg.topic !== expectedNote) {
        return 'बालवाडीच्या विद्यार्थ्यांना नोंदणीच्या वेळी विषय निवडता येत नाही; दिलेल्या ४ विषयांपैकी कोणताही १ विषय प्रत्यक्ष स्पर्धेच्या वेळी यादृच्छिक पद्धतीने दिला जाईल.';
      }
    }
  }
  if (!known) return 'निवडलेल्या स्पर्धा ओळखता आल्या नाहीत. कृपया पुन्हा प्रयत्न करा.';
  return null;
}

function text_(value, max) {
  var limit = max || MAX_TEXT;
  return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, limit);
}

function resolveCompetitionId_(reg) {
  if (!reg) return null;
  if (reg.competitionId && TABS[reg.competitionId]) return reg.competitionId;
  var name = String(reg.competition || '');
  var keys = Object.keys(TABS);
  for (var i = 0; i < keys.length; i++) {
    if (name.indexOf(TABS[keys[i]]) === 0) return keys[i];
  }
  return null;
}

function tabFromName_(name) {
  var keys = Object.keys(TABS);
  for (var i = 0; i < keys.length; i++) {
    var tab = TABS[keys[i]];
    if (String(name || '').indexOf(tab) === 0) return tab;   // "चित्रकला स्पर्धा" → "चित्रकला"
  }
  return null;
}

/* -------------------------------------------------------------------- sheets */

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F5EADA');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F5EADA');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function referenceExists_(sheet, reference) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var from = Math.max(2, last - 399);
  var values = sheet.getRange(from, 2, last - from + 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === reference) return true;
  }
  return false;
}

/* Run this once from the Apps Script editor to create all ten tabs. */
function setupSheets() {
  if (SPREADSHEET_ID === 'PUT_YOUR_SPREADSHEET_ID_HERE' || !SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID is still a placeholder — paste your spreadsheet id first.');
  }
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var created = [];
  Object.keys(TABS).forEach(function (id) {
    var sheet = ss.getSheetByName(TABS[id]);
    if (!sheet) {
      sheet = ss.insertSheet(TABS[id]);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F5EADA');
      sheet.setFrozenRows(1);
      created.push(TABS[id]);
    }
  });
  Logger.log('Tabs ready: ' + Object.keys(TABS).map(function (id) { return TABS[id]; }).join(', '));
  Logger.log('Newly created: ' + (created.length ? created.join(', ') : 'none — all tabs already existed'));
  return created;
}

/* --------------------------------------------------------------------- output */

function out_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Local sanity check — run testValidation() in the editor to see it work. */
function testValidation() {
  var openNow = new Date('2026-11-15T10:00:00+05:30');
  var closedChitrakalaNow = new Date('2026-11-22T00:00:01+05:30');
  var sample = {
    requestId: 'BSF26-test-1',
    studentName: 'रोहन अमोल शिंदे',
    standard: 'इयत्ता ६ वी',
    schoolName: 'शिरवळ विद्यालय',
    city: 'शिरवळ',
    guardianName: 'अमोल शिंदे',
    mobile: '9822112233',
    email: '',
    registrations: [
      { competitionId: 'chitrakala', competition: 'चित्रकला स्पर्धा', mode: 'offline',
        group: 'गट ३ — इयत्ता ५ वी ते ७ वी', topic: 'माझे प्रदूषणमुक्त शिरवळ गाव', status: 'registered' },
      { competitionId: 'reel-star', competition: 'रील स्टार', mode: 'online',
        group: '', topic: '', status: 'registered' },
      { competitionId: 'group-dance', competition: 'समूह नृत्य', mode: 'online',
        group: 'गट ३ — इयत्ता ५ वी ते ७ वी', topic: '', status: 'registered',
        team: { groupName: 'कलावंत मंडळ',
                members: ['रोहन शिंदे — इयत्ता ६ वी', 'साक्षी मोरे — इयत्ता ६ वी',
                          'अनुष्का कदम — इयत्ता ६ वी', 'वेदांत जाधव — इयत्ता ६ वी',
                          'प्रथमेश पाटील — इयत्ता ६ वी'] } }
    ]
  };
  Logger.log('valid payload (open) → ' + (validate_(sample, openNow) || 'OK'));
  Logger.log('closed chitrakala → ' + (validate_(sample, closedChitrakalaNow) || 'OK (unexpected)'));
  var broken = JSON.parse(JSON.stringify(sample));
  broken.registrations[2].team.members = broken.registrations[2].team.members.slice(0, 3);
  Logger.log('team with 3 members → ' + (validate_(broken, openNow) || 'OK (unexpected)'));
  var noComp = JSON.parse(JSON.stringify(sample));
  noComp.registrations = [];
  Logger.log('no competition → ' + (validate_(noComp, openNow) || 'OK (unexpected)'));
  Logger.log('balwadi sheet topic note → ' + balwadiSheetTopicNote_('chitrakala'));
}
