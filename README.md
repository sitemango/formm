# बालसंस्कार फेस्टिवल २०२६ — Website

Static, Marathi-first website for **बालसंस्कार फेस्टिवल २०२६**, organised by
**श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ**. Plain HTML5 / CSS3 / vanilla JavaScript —
no build step, no frameworks, no paid services, no stock photography.

## Files

```
index.html                 homepage: hero, 9 cards, eligibility, FAQ, CTA
chitrakala.html            चित्रकला स्पर्धा
mehendi.html               मेहंदी स्पर्धा
nibandh.html               निबंध स्पर्धा
vaktrutva.html             वक्तृत्व स्पर्धा
ekpatri-natya.html         एकपात्री नाट्य अभिनय स्पर्धा
rangoli.html               रांगोळी स्पर्धा
group-dance.html           समूह नृत्य        (Group Dance)        — ऑनलाइन
group-singing.html         समूह गायन        (Group Singing)      — ऑनलाइन
group-fashion-show.html    समूह फॅशन शो     (Group Fashion Show) — ऑनलाइन
registration.html          dedicated registration page

style.css                  one shared stylesheet (tokens, components, layouts)
data.js                    ALL competition data — the single source of truth
site.js                    shared header/nav/footer + page rendering + registration
```

Every page loads `style.css`, `data.js` and `site.js` with **relative** paths, so any page
can be opened directly by URL and the whole thing publishes to GitHub Pages as-is.

> Note: the previous `script.js` has been split into `data.js` (content) and `site.js`
> (behaviour) so that all eleven pages share one copy of the navigation, footer and
> competition data.

## The three online competitions

समूह नृत्य, समूह गायन and समूह फॅशन शो are marked **Online Competition / ऑनलाइन स्पर्धा**
on the homepage, on their own pages and in the registration form.

Their eligibility, rules, submission format, group size and judging criteria have **not**
been announced, so the site does not invent them:

* `eligibility: null` and `groups: []` in `data.js`
* each page shows the transparent notice
  “या स्पर्धेची पात्रता, नियम व सादरीकरणासंबंधी माहिती आयोजकांकडून निश्चित झाल्यानंतर येथे प्रसिद्ध केली जाईल.”
  plus a short list of the details still pending
* the registration form accepts them with no class filter, never asks for a topic, and
  states that registering does **not** guarantee participation
* submitted entries are tagged `status: "pending-confirmation"`, and the success screen
  repeats that the organisers will confirm

### Filling the details in later

Open `data.js` and edit the relevant competition object:

```js
{
  id: "group-dance",
  ...
  eligibility: { from: 1, to: 10 },          // indices in the standards array
  groups: [
    { label: "गट १ — इयत्ता १ ली ते ४ थी", from: 1, to: 4,
      topics: ["विषय १", "विषय २"] }
  ],
  pending: false,                             // hides the "not yet announced" notice
  pendingItems: [],
  rules: ["आयोजकांनी जाहीर केलेला नियम"]       // only what has actually been confirmed
}
```

The moment you do that: the page gains its eligibility block, group/topic lists and rules;
the competition starts obeying the class filter in the registration form; and the topic
dropdown appears automatically. Nothing else needs editing.

## Typography

Marathi and Latin are served by different families on purpose:

| Token | Family | Used for |
|---|---|---|
| `--font-marathi` | Noto Sans Devanagari | Marathi body text and headings |
| `--font-display` | Noto Serif Devanagari | page titles (`h1`) |
| `--font-latin` | Inter | English-only UI text — `.english-text` (badges, “Group Dance”, step numbers) |

* Weights 400 / 500 / 600 / 700 are loaded explicitly for both Noto Sans Devanagari and Inter.
* Every stack falls back to locally installed Devanagari fonts (`Nirmala UI`, `Kokila`,
  `Mangal`, `Sahyadri`) and then to system UI fonts, so the site stays readable offline.
* No letter-spacing and no uppercase on Devanagari; the Marathi “स्पर्धा क्र. ७” tag
  explicitly resets both.
* Line heights (body 1.85, headings 1.26–1.45) leave room for vowel signs and the शिरोरेखा.
* `overflow-wrap: break-word` on headings and body, so long Marathi compounds wrap instead
  of widening the page.
* Headings use fluid `clamp()` sizes and `text-wrap: balance`.
* Mixed-script headings such as **समूह नृत्य — Group Dance** keep the Devanagari in Noto and
  put the Latin part in a `<span class="english-text">`, so both scripts shape correctly.

## Running it locally

No dependencies — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000     # → http://localhost:8000
```

## Publishing on GitHub Pages

1. Push the branch.
2. **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Pick the branch and `/ (root)`, save → `https://<user>.github.io/<repo>/`.

## Connecting the form to Google Sheets

Until an endpoint is configured the form validates normally but never pretends the data was
sent — it shows an explicit Marathi notice and posts nothing.

1. Create a Google Sheet for the responses.
2. **Extensions → Apps Script**, paste the script below.
3. **Deploy → New deployment → Web app** — Execute as: **Me**, Access: **Anyone**.
4. Copy the `/exec` URL into `CONFIG.registrationEndpoint` at the top of `site.js`:

```js
var CONFIG = {
  registrationEndpoint: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',
  requestTimeoutMs: 15000
};
```

5. After editing `Code.gs`, re-deploy (**Deploy → Manage deployments → Edit → Version: New**).
   The `/exec` URL stays the same.

The page POSTs with `Content-Type: text/plain` and a JSON body, which avoids a CORS
preflight and works with Apps Script web apps. The URL is public by design — validate and
limit the data on the Apps Script side.

### Apps Script (`Code.gs`)

```javascript
const SHEET_NAME = 'नोंदणी';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    const required = ['studentName', 'standard', 'schoolName', 'city', 'guardianName', 'mobile'];
    for (const key of required) {
      if (!String(data[key] || '').trim()) return json({ result: 'error', message: 'Missing field: ' + key });
    }
    if (!/^[6-9]\d{9}$/.test(String(data.mobile))) return json({ result: 'error', message: 'Invalid mobile number' });
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
        r.mode || '',            // "offline" | "online"
        r.group || '',
        r.topic || '',
        r.status || ''           // "registered" | "pending-confirmation"
      ]);
    });

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return json({ result: 'error', message: 'Use POST' }); }

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'तारीख / वेळ', 'विद्यार्थ्याचे नाव', 'इयत्ता', 'शाळेचे नाव', 'गाव / शहर',
      'पालकांचे नाव', 'मोबाइल क्रमांक', 'ईमेल',
      'स्पर्धा', 'स्वरूप', 'गट', 'विषय', 'स्थिती'
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

## Registration behaviour

* Class selector: बालवाडी → इयत्ता १० वी (order matters — eligibility is stored as index
  ranges, so append new classes at the end).
* Only competitions eligible for the chosen class are offered; the group is derived
  automatically and cannot be picked by the participant; only that group's topics appear.
* Changing the class clears invalid selections and tells the visitor.
* Each competition page links to `registration.html?competition=<id>`, which pre-selects
  that competition (immediately for the online ones, as soon as the class is chosen for the
  rest, with an honest message if the class is not eligible).
* Marathi inline errors, an error summary, focus management and a हमीपत्र confirmation.
* Success is shown **only** after the endpoint confirms the save; HTTP errors, network
  failures and timeouts show an error and keep the typed data.

## Accessibility

Skip link, semantic landmarks, labelled controls, `aria-live` regions, visible focus rings,
keyboard-operable dropdown and accordions, `prefers-reduced-motion` support, and a
`<noscript>` notice on every page.
