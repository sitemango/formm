# बालसंस्कार फेस्टिवल २०२६ — Website

Static website for **बालसंस्कार फेस्टिवल २०२६**, organised by **श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ**.
Marathi-first, responsive, and built with plain HTML5 / CSS3 / vanilla JavaScript — no build step, no
frameworks, no paid services.

```
index.html   — markup, inline SVG emblem/rangoli/icon sprite
style.css    — theme, layout, components, responsive rules
script.js    — competition data (single source of truth) + all behaviour
```

## Features

* Sticky navigation with a working mobile hamburger menu that closes on navigation.
* Hero with a CSS/SVG rangoli mandala, paint strokes, book, diya and floral motifs (no stock photos).
* Six competition cards, each opening its full group/topic detail panel.
* **इयत्तेनुसार explorer** — pick a standard and see exactly which competitions, groups and topics apply.
* **Registration form** with real client-side validation:
  * only competitions eligible for the chosen class are offered;
  * the group is derived automatically from the class — never chosen by the participant;
  * a required topic dropdown appears for every selected competition and disappears on deselect;
  * changing the class resets the selection (groups/topics change with it);
  * inline Marathi error messages, an error summary, focus management, and a mandatory हमीपत्र checkbox.
* Honest submission handling: **nothing is reported as successful unless the backend confirms it.**
* Accessible: skip link, semantic landmarks, labelled controls, `aria-live` regions, visible focus
  rings, keyboard-operable accordions, `prefers-reduced-motion` support.

## Running it locally

No dependencies — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Publishing on GitHub Pages

1. Push this branch.
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Choose the branch and `/ (root)`, save. The site is served from `https://<user>.github.io/<repo>/`.

## Connecting the form to Google Sheets

Until an endpoint is configured the form validates normally but refuses to pretend the data was sent:
it shows an explicit Marathi notice and sends nothing.

1. Create a Google Sheet for the responses.
2. **Extensions → Apps Script** and paste the script below.
3. **Deploy → New deployment → Web app**
   * Execute as: **Me**
   * Access: **Anyone** (needed so the browser can POST without signing in)
4. Copy the `/exec` URL and paste it into `CONFIG.registrationEndpoint` at the top of `script.js`:

```js
var CONFIG = {
  registrationEndpoint: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',
  requestTimeoutMs: 15000
};
```

5. Re-run the deployment (**Deploy → Manage deployments → Edit → Version: New**) after every edit to
   `Code.gs`; the `/exec` URL stays the same.

The page sends a simple `POST` with `Content-Type: text/plain` and a JSON body, which avoids a CORS
preflight and works with Apps Script web apps. Never put secrets in this file: the endpoint URL is
public by design, so validate/limit the data on the Apps Script side.

### Apps Script (`Code.gs`)

```javascript
const SHEET_NAME = 'नोंदणी'; // sheet tab name

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    const required = ['studentName', 'standard', 'schoolName', 'city', 'guardianName', 'mobile'];
    for (const key of required) {
      if (!String(data[key] || '').trim()) {
        return json({ result: 'error', message: 'Missing field: ' + key });
      }
    }
    if (!/^[6-9]\d{9}$/.test(String(data.mobile))) {
      return json({ result: 'error', message: 'Invalid mobile number' });
    }
    if (!Array.isArray(data.registrations) || !data.registrations.length) {
      return json({ result: 'error', message: 'No competition selected' });
    }

    const sheet = getSheet();
    data.registrations.forEach(function (r) {
      sheet.appendRow([
        new Date(),
        data.studentName,
        data.standard,
        data.schoolName,
        data.city,
        data.guardianName,
        data.mobile,
        data.email || '',
        r.competition || '',
        r.group || '',
        r.topic || ''
      ]);
    });

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Keeps a plain GET from throwing, e.g. when the URL is opened in a browser tab.
function doGet() {
  return json({ result: 'error', message: 'Use POST' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'तारीख / वेळ', 'विद्यार्थ्याचे नाव', 'इयत्ता', 'शाळेचे नाव', 'गाव / शहर',
      'पालकांचे नाव', 'मोबाइल क्रमांक', 'ईमेल', 'स्पर्धा', 'गट', 'विषय'
    ]);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Editing competition content

All competitions, class ranges, groups and topics live in the `STANDARDS` and `COMPETITIONS` arrays at
the top of `script.js`. The overview cards, the detail panels, the class explorer and the registration
options are rendered from that data, so editing it once updates the whole site.

`STANDARDS` is order-sensitive: eligibility is stored as index ranges, so append new classes at the end
rather than inserting them in the middle.

## Fonts

Devanagari web fonts (Noto Sans Devanagari, Noto Serif Devanagari, Yatra One) load from Google Fonts.
If they are unavailable the stack falls back to locally installed Devanagari fonts
(`Nirmala UI`, `Kokila`, `Mangal`, `Sahyadri`) and then to system UI fonts.
