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

## The three online team competitions

समूह नृत्य, समूह गायन and समूह फॅशन शो are marked **Online Competition / ऑनलाइन स्पर्धा**
on the homepage, on their own pages and in the registration form. Their rules are now
confirmed by the organisers and are rendered on every one of those three pages:

* **पात्रता** — बालवाडी ते इयत्ता १० वी, in four groups:
  गट १ बालवाडी · गट २ इयत्ता १ ली ते ४ थी · गट ३ इयत्ता ५ वी ते ७ वी · गट ४ इयत्ता ८ वी ते १० वी
* **सादरीकरणाचे स्वरूप व कालावधी** — online; a clear video sent through the medium the
  organisers specify; every participant and the whole presentation must be clearly visible
  and audible; **३ ते ५ मिनिटे**
* **सहभागींची संख्या** — **किमान ५ सहभागी**, with the team leader’s name and the names and
  classes of all participating students given at registration
* **निर्णायक निकष** — out of १००: कल्पकता व नावीन्य २० · सादरीकरणाची गुणवत्ता व कौशल्य २५ ·
  संघातील समन्वय व सहभाग २० · विषयाची निवड व सुसंगती १५ ·
  एकूण प्रभाव व सादरीकरणाची छाप २० · **एकूण १००**. The judges’ decision is final.

Two details are still genuinely unannounced, and the site says so rather than inventing
them: the **final video-submission date and technical instructions**, and the **maximum
team size** (“आयोजकांच्या नियमानुसार”). Both appear under “अद्याप जाहीर होणे बाकी” on the
three pages and in the registration form.

### How they behave in the registration form

These are team events, so they work a little differently from the six individual ones:

* they appear in their own **संघ स्पर्धा — ऑनलाइन** section, with the group worked out
  from the class you picked (इयत्ता ६ वी → गट ३)
* there is **no topic dropdown** — the team chooses its own presentation
* the form asks for the **संघप्रमुखाचे नाव** and a textarea for
  **संघातील सर्व सहभागी विद्यार्थ्यांची नावे व इयत्ता** (one per line)
* validation is real: the leader’s name is required and at least five participants must
  be listed before the form will submit
* the payload carries them as `team: { leader, members: [...] }`, so the spreadsheet
  receives one row per team entry

### Filling in or changing details later

Open `data.js` and edit the relevant competition object:

```js
{
  id: "group-dance",
  eligibility: { from: 0, to: 10 },          // indices in the standards array
  groups: [
    { label: "गट १ — बालवाडी", from: 0, to: 0, topics: [] },
    ...
  ],
  isTeam: true,                              // team event → no topics, team fields instead
  teamMin: 5,                                // minimum participants, enforced on submit
  duration: "३ ते ५ मिनिटे",
  format: [ "...", "..." ],                  // सादरीकरणाचे स्वरूप
  teamRules: [ "..." ],                      // सहभागींची संख्या
  criteria: [ { label: "...", marks: "२०" }, ..., { label: "एकूण", marks: "१००", total: true } ],
  judgingNotes: [ "..." ],
  notes: [ "..." ],                          // what is still awaiting announcement
  pending: false,                            // true re-shows the "not yet announced" notice
  pendingItems: []
}
```

The renderer only prints the sections that exist in the data, so removing a key simply
removes that section from the page — and adding one adds it everywhere, including the
homepage summary and the registration form.

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
* Changing the class drops only the selections the new class cannot enter, and the note
  says how many were removed.
* Each competition page links to `registration.html?competition=<id>`, which pre-selects
  that competition as soon as a class is chosen, with an honest message if that class is
  not eligible.
* Team entries additionally require the संघप्रमुखाचे नाव and at least five participants.
* Marathi inline errors, an error summary, focus management and a हमीपत्र confirmation.
* Success is shown **only** after the endpoint confirms the save; HTTP errors, network
  failures and timeouts show an error and keep the typed data.

## Accessibility

Skip link, semantic landmarks, labelled controls, `aria-live` regions, visible focus rings,
keyboard-operable dropdown and accordions, `prefers-reduced-motion` support, and a
`<noscript>` notice on every page.
