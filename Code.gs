/* =============================================================================
   Code.gs — बालसंस्कार फेस्टिवल २०२६ — registration → Google Sheets
   -----------------------------------------------------------------------------
   One spreadsheet, nine competition tabs. Every registration is written to the
   tab of the competition it belongs to; a student who enters three competitions
   produces one row in each of the three matching tabs and nothing anywhere else.

   SETUP (see README.md for the walk-through)
   ------------------------------------------
   1. Create one Google Spreadsheet.
   2. Extensions → Apps Script, paste this file, save.
   3. Set SPREADSHEET_ID below to the id from the spreadsheet URL
      (docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit).
   4. Run  setupSheets()  once from the editor to create all nine tabs.
   5. Deploy → New deployment → Web app
        Execute as: Me        Access: Anyone
      then paste the /exec URL into CONFIG.registrationEndpoint in site.js.

   Nothing secret lives here: the deployment URL is public by design, which is
   why every field is validated on this side before a row is written.
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
  'group-fashion-show': 'समूह फॅशन शो'
};

/* Competitions whose entries carry a group name and a participant list. */
var TEAM_COMPETITIONS = ['group-dance', 'group-singing', 'group-fashion-show'];

var MIN_TEAM_MEMBERS = 5;

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

/* ------------------------------------------------------------------- web app */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(25000);          // concurrent submissions queue up safely
    locked = true;

    var payload = parsePayload_(e);
    if (!payload) return out_({ result: 'error', message: 'विनंती वाचता आली नाही. कृपया पुन्हा प्रयत्न करा.' });

    var problem = validate_(payload);
    if (problem) return out_({ result: 'error', message: problem });

    if (SPREADSHEET_ID === 'PUT_YOUR_SPREADSHEET_ID_HERE' || !SPREADSHEET_ID) {
      return out_({ result: 'error', message: 'नोंदणी साठवणे सुरू झाले नाही. कृपया आयोजकांशी संपर्क करा.' });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var saved = [];
    var stamp = Utilities.formatDate(new Date(), TIME_ZONE, 'dd/MM/yyyy HH:mm:ss');

    for (var i = 0; i < payload.registrations.length; i++) {
      var reg = payload.registrations[i];
      var tabName = TABS[reg.competitionId] || tabFromName_(reg.competition);
      if (!tabName) continue;                      // unknown competition → skip, never guess
      var sheet = getOrCreateSheet_(ss, tabName);
      var reference = (payload.requestId || 'BSF26') + '-' + (i + 1);

      if (referenceExists_(sheet, reference)) continue;   // duplicate delivery

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
        reg.competitionId,
        reg.mode === 'online' ? 'ऑनलाइन' : 'प्रत्यक्ष',
        reg.group,
        reg.topic,
        reg.team ? reg.team.groupName : '',
        reg.team ? reg.team.members.join(' | ') : '',
        reg.team ? reg.team.members.length : '',
        reg.status === 'pending-confirmation' ? 'पुष्टी बाकी' : 'नोंदणी झाली'
      ]);
      saved.push({ competition: reg.competition, tab: tabName, reference: reference });
    }

    if (!saved.length) {
      return out_({ result: 'error', message: 'निवडलेल्या स्पर्धांसाठी नोंदणी करता आली नाही. कृपया पुन्हा प्रयत्न करा.' });
    }

    return out_({
      result: 'success',
      reference: saved[0].reference,
      saved: saved.length,
      tabs: saved.map(function (s) { return s.tab; })
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

function validate_(p) {
  if (!p.studentName || p.studentName.length < 3) return 'कृपया विद्यार्थ्याचे पूर्ण नाव भरा.';
  if (!p.standard) return 'कृपया इयत्ता निवडा.';
  if (!p.schoolName || p.schoolName.length < 2) return 'कृपया शाळेचे नाव भरा.';
  if (!p.city) return 'कृपया गाव / शहर भरा.';
  if (!p.guardianName || p.guardianName.length < 3) return 'कृपया पालकांचे नाव भरा.';
  if (!MOBILE_RE.test(p.mobile)) return 'कृपया वैध १० अंकी मोबाइल क्रमांक भरा.';
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) return 'कृपया वैध ईमेल पत्ता भरा.';
  if (!p.registrations.length) return 'कृपया किमान एका स्पर्धेसाठी नोंदणी करा.';

  var known = 0;
  for (var i = 0; i < p.registrations.length; i++) {
    var reg = p.registrations[i];
    var tab = TABS[reg.competitionId] || tabFromName_(reg.competition);
    if (!tab) continue;
    known++;
    if (TEAM_COMPETITIONS.indexOf(reg.competitionId) !== -1) {
      if (!reg.team || !reg.team.groupName || reg.team.groupName.length < 2) {
        return 'कृपया संघ स्पर्धांसाठी संघाचे नाव (Group Name) भरा.';
      }
      if (!reg.team.members.length || reg.team.members.length < MIN_TEAM_MEMBERS) {
        return 'कृपया किमान ५ सहभागी विद्यार्थ्यांची नावे व इयत्ता भरा.';
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

/* Run this once from the Apps Script editor to create all nine tabs. */
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
        group: 'गट ३ — इयत्ता ५ वी ते ७ वी', topic: 'कृष्ण', status: 'registered' },
      { competitionId: 'group-dance', competition: 'समूह नृत्य', mode: 'online',
        group: 'गट ३ — इयत्ता ५ वी ते ७ वी', topic: '', status: 'registered',
        team: { groupName: 'कलावंत मंडळ',
                members: ['रोहन शिंदे — इयत्ता ६ वी', 'साक्षी मोरे — इयत्ता ६ वी',
                          'अनुष्का कदम — इयत्ता ६ वी', 'वेदांत जाधव — इयत्ता ६ वी',
                          'प्रथमेश पाटील — इयत्ता ६ वी'] } }
    ]
  };
  Logger.log('valid payload → ' + (validate_(sample) || 'OK'));
  var broken = JSON.parse(JSON.stringify(sample));
  broken.registrations[1].team.members = broken.registrations[1].team.members.slice(0, 3);
  Logger.log('team with 3 members → ' + (validate_(broken) || 'OK (unexpected)'));
  var noComp = JSON.parse(JSON.stringify(sample));
  noComp.registrations = [];
  Logger.log('no competition → ' + (validate_(noComp) || 'OK (unexpected)'));
}
