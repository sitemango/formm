# बालसंस्कार फेस्टिवल २०२६ — Website

Static, Marathi-first website for **बालसंस्कार फेस्टिवल २०२६**, organised by
**श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ**. Plain HTML5 / CSS3 / vanilla JavaScript —
no build step, no frameworks, no paid services, no stock photography, and no
third-party carousel library.

## Files

```
index.html                 homepage: hero, photo gallery, schedule, 9 cards,
                           eligibility, explorer, FAQ, CTA
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
Code.gs                    Google Apps Script backend → Google Sheets
tnc.pdf                    the terms and conditions the form links to
1.jpeg … 13.jpeg           carousel photographs (add 14./15. when you have them)
logo-left.png              अध्यक्षांचे छायाचित्र — hero portrait (cut-out PNG)
```

Every page loads `style.css`, `data.js` and `site.js` with **relative** paths, so any page
can be opened directly by URL and the whole thing publishes to GitHub Pages as-is.

> Note: the previous `script.js` has been split into `data.js` (content) and `site.js`
> (behaviour) so that all eleven pages share one copy of the navigation, footer and
> competition data.

---

## 1. Photo carousel — `1.jpeg` … `15.jpeg`

The gallery sits on the homepage, between the hero and the competition directory.

**Where the images go:** the project root, next to `index.html`, named

```
1.jpeg   2.jpeg   3.jpeg   4.jpeg   5.jpeg   6.jpeg   7.jpeg   8.jpeg
9.jpeg   10.jpeg  11.jpeg  12.jpeg  13.jpeg  14.jpeg  15.jpeg
```

The thirteen photographs you uploaded are already committed as `1.jpeg` … `13.jpeg`, so
the gallery currently shows **13 slides**. Add `14.jpeg` / `15.jpeg` (any time, same
place) and they appear automatically — no code change.

**How detection works.** On page load the script builds the list of candidate filenames
from `window.FESTIVAL.gallery` in `data.js`, then checks each one in the background. A
file that returns 404 or fails to decode is dropped before it is counted, so a missing
`7.jpeg` never becomes a slide — there is never a broken-image icon or an empty slide.
Only the images that actually exist are counted, so the counter, the dots and the arrows
always match reality.

It is written to fail safe:

* the photographs are put on screen quickly even if that background check is slow — after
  ~1.2 s the gallery simply shows what it has and drops the files that then turn out to be
  missing (the slide, the dots and the counter are corrected on the spot);
* on a browser that never reports the check back at all, the photographs still appear, and
  any file that cannot be displayed is removed the moment the browser says so;
* if **no** photograph can be displayed, the section stays hidden — never a row of broken
  image icons.

**Any format works.** For every number the script tries `extensions` in order — currently
`jpeg`, then `jpg`, then `png` — and uses the first file that really exists. You can
therefore upload photographs in whatever format your camera or phone produces without
renaming them.

**Configuring it** — everything lives in `data.js`:

```js
"gallery": {
  "folder": "",          // "" = project root; use "photos/" to keep them in a folder
  "start": 1,            // first image number
  "count": 15,           // how many numbers to probe
  "extensions": ["jpeg", "jpg", "png"],   // first one that exists wins
  "heading": "बालसंस्कार फेस्टिवल — छायाचित्र दालन",
  "lede": "…",
  "altPrefix": "बालसंस्कार फेस्टिवल २०२६ — छायाचित्र ",
  "captions": { "1": "…", "2": "…" },   // optional caption per image number
  "autoplay": true,
  "intervalMs": 6000
}
```

**Behaviour**

* one main image at a time, arrows + pagination dots + a “१ / ५” counter
* swipe on touch devices, `←` / `→` on the keyboard, dots are real buttons
* `width`/`height` are set from the real image size and `object-fit: contain` is used, so
  the aspect ratio is preserved and nothing is stretched
* all slides after the first are `loading="lazy"`
* alt text comes from `altPrefix` + the image number; add a `captions` entry to show a
  caption instead
* one image → arrows and dots are hidden; **no** images → the whole section stays hidden
* autoplay pauses on hover/focus, when the tab is hidden, after any manual navigation, and
  is switched off entirely under `prefers-reduced-motion: reduce`
* no library — about 60 lines of JavaScript in `buildCarousel()`

---

## 2. Terms and conditions — `tnc.pdf`

The registration form links to **`tnc.pdf`**, which must stay in the project root next to
`index.html` (the link is `href="tnc.pdf"`, a relative path, so it works on GitHub Pages).

* The file shipped here is **your own document** (uploaded १४ ऑक्टोबर २०२६, ३२९ KB). It is
  already live: the form links straight to it. To update the terms later, replace
  `tnc.pdf` with the new version — keep the same filename and nothing else needs changing.
* The link opens in a new tab (`target="_blank" rel="noopener noreferrer"`).
* The link sits **outside** the checkbox `<label>`, so clicking it can never tick the box.

The checkbox itself is a real, visible `<input type="checkbox">` (26 × 26 px, styled with
`appearance: none`, a CSS-drawn tick, a saffron focus ring and a maroon checked state).
It is required: submitting without it shows
“कृपया नियम व अटी वाचून सहमती द्या.” and the form is not sent.

---

## 3. Organiser name size and centring

The organiser identity — **श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ** — is sized from **one**
place in `style.css`:

```css
:root{
  --organizer-scale: 1.5;                                  /* ← change this */

  --org-size-brand:  calc(0.74rem * var(--organizer-scale));   /* header brand  */
  --org-size-hero:   calc(0.85rem * var(--organizer-scale));   /* hero eyebrow  */
  --org-size-footer: calc(0.88rem * var(--organizer-scale));   /* footer        */
}
.org-name{ font-family:var(--font-display); font-weight:700; color:var(--maroon);
           line-height:1.5; letter-spacing:0; text-transform:none;
           overflow-wrap:break-word; }
```

Each `--org-size-*` is the size that element used to have multiplied by the scale, so the
organiser name is now **≈ 1.5× larger** in the header brand block, the hero and the footer
without any scattered overrides. Change `--organizer-scale` to make it larger or smaller
everywhere at once. `.org-name` keeps the Devanagari stack (Noto Serif Devanagari), keeps
`line-height: 1.5` so bigger type never clips a vowel sign or a conjunct, and wraps rather
than forcing horizontal scrolling on a phone.

**Centring** is also driven by shared rules, not per-page tweaks: `.hero__content`,
`.section-head`, `.cp-head__inner` (every competition page title, intro, facts and CTA),
`.cp-block`, `.cp-others`, `.carousel`, `.footer__brand` are centred, while dense content —
`.topics`, `.rules`, `.criteria`, `.steps`, `.sched`, `.srow` and every form field — stays
left-aligned for readability.

---

## 3b. अध्यक्षांचे छायाचित्र — `logo-left.png`

The अध्यक्ष's portrait appears as a small circular medallion in the hero, **directly under
the organiser name** (श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ आयोजित), with an “अध्यक्ष” badge
and the club name beside it.

**Where the image goes:** the project root, next to `index.html`, named

```
logo-left.png
```

The file you supplied is a **cut-out portrait with a transparent background** (511 × 488,
near-square). Inside the circular medallion the head and face are fully visible and only
the outer edges of the shoulders are trimmed — the usual avatar crop. The transparent
background simply lets the cream frame show through, so no white box appears around it.

**Configured in `data.js`:**

```js
"organizer": {
  "photo": "logo-left.png",        // or a list: ["logo-left.png", "organizer.jpg"]
  "shape": "circle",               // "circle" = portrait crop · "square" = logo, uncropped
  "role": "अध्यक्ष",
  "name": "श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ",
  "alt": "श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ — अध्यक्ष"
}
```

`photo` accepts **one name or a list** — with a list the first file that really exists is
used, which is handy while a new photograph is being prepared:

```js
"photo": ["logo-left.png", "organizer.jpg"],   // first one that exists wins
```

**Behaviour**

* The file is probed first: if `logo-left.png` is missing the whole block stays hidden, so
  there is never a broken-image icon or an empty frame in the hero.
* `shape: "circle"` crops the photo to a circle with `object-fit: cover` and draws a
  saffron/gold ring; `shape: "square"` shows it whole (`object-fit: contain`) — useful if
  you prefer the club logo there instead of a person.
* The `width`/`height` attributes come from the real image, so nothing jumps when it loads.
* The portrait is 76 px (64 px on phones), the caption wraps, and the medallion shrinks
  with the hero, so it never pushes the festival title out of place.
* To change the picture later, replace `logo-left.png` (or point `photo` at a new file
  name in `data.js`). Nothing else needs to be touched.

---

## 4. Competition dates, times and venues

**Single source of truth: `data.js`.** Every competition object carries a `schedule`
block; the competition page, the homepage schedule section, the homepage cards and the
online strip all read from it, so they can never disagree.

```js
"schedule": {
  "kind": "onsite",                    // "onsite" | "online"
  "dateISO": "2026-11-22",             // used for sorting only
  "order": "1",                        // tie-break within the same day
  "date": "रविवार, २२ नोव्हेंबर २०२६",
  "time": "सकाळी ८:३० वाजता",
  "venue": "जिल्हा परिषद प्राथमिक शाळा, मुख्य पटांगण, शिरवळ"
}
```

For the three online competitions `kind` is `"online"` and there is no `time` or `venue` —
the date is labelled **व्हिडिओ पाठविण्याची अंतिम तारीख**, never as a live-event time:

```js
"schedule": {
  "kind": "online", "dateISO": "2026-11-27",
  "date": "शुक्रवार, २७ नोव्हेंबर २०२६",
  "time": null, "venue": null,
  "deadlineLabel": "व्हिडिओ पाठविण्याची अंतिम तारीख"
}
```

The २०२६ schedule:

| स्पर्धा | दिनांक | वेळ | ठिकाण |
| --- | --- | --- | --- |
| चित्रकला | रविवार, २२ नोव्हेंबर २०२६ | सकाळी ८:३० | जिल्हा परिषद प्राथमिक शाळा, मुख्य पटांगण, शिरवळ |
| मेहंदी | सोमवार, २३ नोव्हेंबर २०२६ | दुपारी ४ | अंगणवाडी क्रमांक ६, शिरवळ |
| वक्तृत्व | शुक्रवार, २७ नोव्हेंबर २०२६ | सकाळी ११ | आदर्श विद्यालय, शिरवळ |
| निबंध | शुक्रवार, २७ नोव्हेंबर २०२६ | दुपारी २ | ज्ञानवर्धिनी प्रशाला, शिरवळ |
| समूह नृत्य | शुक्रवार, २७ नोव्हेंबर २०२६ | *व्हिडिओ पाठविण्याची अंतिम तारीख* | ऑनलाइन |
| समूह गायन | शुक्रवार, २७ नोव्हेंबर २०२६ | *व्हिडिओ पाठविण्याची अंतिम तारीख* | ऑनलाइन |
| समूह फॅशन शो | शुक्रवार, २७ नोव्हेंबर २०२६ | *व्हिडिओ पाठविण्याची अंतिम तारीख* | ऑनलाइन |
| एकपात्री नाट्य अभिनय | शनिवार, २८ नोव्हेंबर २०२६ | दुपारी ३ | जिल्हा परिषद प्राथमिक शाळा, मुळी, शिरवळ |
| रांगोळी | रविवार, २९ नोव्हेंबर २०२६ | सकाळी ९ | एम. ई. एस. इंग्लिश मिडियम स्कूल, शिरवळ |

Editing a date: change `date` (and `dateISO` so the homepage list stays in order) in
`data.js` — the competition page, the homepage schedule and the card update together.

---

## 5. The three online team competitions

समूह नृत्य, समूह गायन and समूह फॅशन शो are marked **Online Competition / ऑनलाइन स्पर्धा**
on the homepage, on their own pages and in the registration form. Their confirmed rules:

* **पात्रता** — बालवाडी ते इयत्ता १० वी, in four groups:
  गट १ बालवाडी · गट २ इयत्ता १ ली ते ४ थी · गट ३ इयत्ता ५ वी ते ७ वी · गट ४ इयत्ता ८ वी ते १० वी
* **सादरीकरणाचे स्वरूप व कालावधी** — online; a clear video sent through the medium the
  organisers specify; every participant and the whole presentation must be clearly visible
  and audible; **३ ते ५ मिनिटे**
* **सहभागींची संख्या** — **किमान ५ सहभागी**, and the form asks for the
  **संघाचे नाव (Group Name)** plus the names and classes of every participant
* **निर्णायक निकष** — out of १००: कल्पकता व नावीन्य २० · सादरीकरणाची गुणवत्ता व कौशल्य २५ ·
  संघातील समन्वय व सहभाग २० · विषयाची निवड व सुसंगती १५ ·
  एकूण प्रभाव व सादरीकरणाची छाप २० · **एकूण १००**. The judges’ decision is final.

Still unannounced and shown as such (never invented): the **technical instructions** for
sending the video, and the **maximum team size**.

### How they behave in the registration form

* they appear in their own **संघ स्पर्धा — ऑनलाइन** section with the group worked out from
  the class (इयत्ता ६ वी → गट ३)
* there is **no topic dropdown** — the team chooses its own presentation
* the form asks for **संघाचे नाव (Group Name)** and a textarea for
  **संघातील सर्व सहभागी विद्यार्थ्यांची नावे व इयत्ता** (one per line)
* validation: the group name is required (≥ 3 characters) and **at least five**
  participants must be listed. The group name is a separate field and is never counted as
  a participant — only the lines of the textarea are
* the payload carries `team: { groupName, members: [...] }`
* typed group names and participant lists survive a class change or another selection
  being ticked

### Adding or changing details later

Open `data.js` and edit the competition object:

```js
{
  id: "group-dance",
  eligibility: { from: 0, to: 10 },          // indices in the standards array
  groups: [ { label: "गट १ — बालवाडी", from: 0, to: 0, topics: [] }, … ],
  isTeam: true,                              // team event → group name, no topics
  teamMin: 5,                                // minimum participants, enforced twice
  duration: "३ ते ५ मिनिटे",
  format: [ "…" ],                           // सादरीकरणाचे स्वरूप
  teamRules: [ "…" ],                        // सहभागींची संख्या
  criteria: [ { label: "…", marks: "२०" }, …, { label: "एकूण", marks: "१००", total: true } ],
  judgingNotes: [ "…" ],
  notes: [ "…" ],                            // what is still awaiting announcement
  pending: false,                            // true re-shows the "not yet announced" notice
  pendingItems: []
}
```

The renderer only prints the sections that exist in the data, so removing a key simply
removes that section from the page — and adding one adds it everywhere.

---

## 6. Connecting the form to Google Sheets

Until an endpoint is configured the form validates normally but never pretends the data was
sent — it shows an explicit Marathi notice and posts nothing.

### 6.1 Create the spreadsheet and find its id

1. Create **one** Google Spreadsheet (for example “बालसंस्कार फेस्टिवल २०२६ — नोंदणी”).
2. Look at its URL:
   `https://docs.google.com/spreadsheets/d/`**`1AbC…xyz`**`/edit#gid=0`
   — the long string between `/d/` and `/edit` is the **spreadsheet id**.
3. Keep it to yourself: it is pasted into `Code.gs` (server side) only, never into the
   website’s JavaScript. The spreadsheet itself stays private — visitors talk to the Apps
   Script web app, not to the sheet.

### 6.2 Paste and deploy `Code.gs`

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the sample code, paste the contents of `Code.gs` from this repository, save.
3. Set the id at the top of the file:

   ```javascript
   var SPREADSHEET_ID = '1AbC…xyz';   // ← paste your id here
   ```

4. Run **`setupSheets`** once (select it in the function list, press *Run*, approve the
   permissions). That creates all nine tabs with their header rows:

   `चित्रकला` · `मेहंदी` · `निबंध` · `वक्तृत्व` · `एकपात्री नाट्य` · `रांगोळी` ·
   `समूह नृत्य` · `समूह गायन` · `समूह फॅशन शो`

   (Any tab that is ever missing is also created on the fly when a registration arrives.)
5. **Deploy → New deployment → Web app**
   * Execute as: **Me**
   * Who has access: **Anyone**
6. Copy the `/exec` URL and paste it into `site.js`:

   ```js
   var CONFIG = {
     registrationEndpoint: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',
     requestTimeoutMs: 15000
   };
   ```

7. After editing `Code.gs`, re-deploy
   (**Deploy → Manage deployments → Edit → Version: New**). The `/exec` URL stays the same.

The page POSTs with `Content-Type: text/plain` and a JSON body, which avoids a CORS
preflight and works with Apps Script web apps.

### 6.3 Columns written to every tab

| # | Column | # | Column |
| --- | --- | --- | --- |
| 1 | नोंदणी तारीख व वेळ | 10 | स्पर्धा |
| 2 | नोंदणी क्रमांक | 11 | स्पर्धा आयडी |
| 3 | विद्यार्थ्याचे नाव | 12 | स्वरूप (प्रत्यक्ष / ऑनलाइन) |
| 4 | इयत्ता | 13 | गट |
| 5 | शाळेचे नाव | 14 | विषय |
| 6 | गाव / शहर | 15 | संघाचे नाव (Group Name) |
| 7 | पालकांचे / संरक्षकाचे नाव | 16 | सहभागी विद्यार्थी |
| 8 | मोबाइल क्रमांक | 17 | सहभागींची संख्या |
| 9 | ईमेल | 18 | स्थिती |

Individual entries leave columns 15–17 blank; team entries fill them.

### 6.4 How a submission is routed

* the server validates every field again (name, standard, school, city, guardian, mobile
  format, at least one competition, and — for team events — a group name and ≥ 5 members)
* each entry is appended to the tab matching its `competitionId`
  (`chitrakala → चित्रकला`, `group-dance → समूह नृत्य`, …)
* one student entering three competitions → one row in each of the three tabs, and nothing
  in the other six
* unknown competitions are skipped rather than guessed, and a malformed request writes
  nothing at all
* every row carries the same timestamp and a registration reference
  (`<requestId>-<n>`); a repeated delivery of the same `requestId` is ignored, and the
  browser blocks double-clicks while a submission is in flight
* `LockService` serialises concurrent submissions
* errors return a plain Marathi message with no stack traces or internals

### 6.5 Checking that all nine tabs are receiving entries

1. Submit one test registration for **one individual** and **one team** competition
   (see 6.6) and watch the matching two tabs gain a row.
2. Check the tab name at the bottom of the sheet matches the competition — the row is only
   ever written to the tab for that competition.
3. In Apps Script: **Executions** shows one log line per request; a failed request is
   listed there with the reason.
4. `testValidation()` (in `Code.gs`, *Run* from the editor) prints three validation
   results — a good payload, a team with only three members, and an empty selection —
   without writing anything to the sheet.

### 6.6 Testing the form without creating false registrations

* **Leave `CONFIG.registrationEndpoint` empty.** The form validates everything, then says
  plainly “नोंदणी पाठवली गेली नाही … आपली माहिती कुठेही पाठवली गेली नाही.” — nothing is
  posted and no row is created. This is the safest way to click through the whole flow.
* **Use a second, throwaway spreadsheet**: deploy a copy of `Code.gs` with a test
  `SPREADSHEET_ID`, point `site.js` at it, submit as many times as you like, and delete the
  rows (or the whole spreadsheet) afterwards.
* **Never** rely on the browser message alone: the success screen only appears after the
  Apps Script returns `{"result":"success"}`. A 500, a `{"result":"error"}` response, an
  unparseable body or a network failure all show an error and keep the typed data.
* To prove the failure path: temporarily set the endpoint to a URL that returns 500 and
  submit — you should get “नोंदणी पूर्ण झाली नाही.” and no success card.

---

## Registration behaviour

* Class selector: बालवाडी → इयत्ता १० वी (order matters — eligibility is stored as index
  ranges, so append new classes at the end).
* Only competitions eligible for the chosen class are offered; the group is derived
  automatically and cannot be picked by the participant; only that group’s topics appear.
* Changing the class drops only the selections the new class cannot enter, and the note
  says how many were removed.
* Each competition page links to `registration.html?competition=<id>`, which pre-selects
  that competition as soon as a class is chosen, with an honest message if that class is
  not eligible.
* Team entries require the **संघाचे नाव (Group Name)** and at least five participants.
* Marathi inline errors, an error summary, focus management, a terms checkbox and a हमीपत्र
  confirmation.
* A loading state appears while the form is being sent; the button is disabled and marked
  `aria-busy`, so a second click cannot create a duplicate registration.
* Success is shown **only** after the endpoint confirms the save; HTTP errors, server-side
  errors, network failures and timeouts show an error and keep the typed data.

## Typography

| Role | Family | Weights |
| --- | --- | --- |
| Marathi body + headings | Noto Sans Devanagari | 400 / 500 / 600 / 700 |
| Marathi page titles, organiser name | Noto Serif Devanagari | 600 / 700 |
| English-only interface text (`.english-text`, badges, “Group Dance”) | Inter | 400 / 500 / 600 / 700 |

Local fallbacks: `Nirmala UI`, `Kokila`, `Mangal`, `Sahyadri` (Devanagari), Georgia /
Times (serif), system-ui / Segoe UI / Roboto (Latin). Body line-height is 1.85, headings
wrap long Marathi words, and Devanagari text is never letter-spaced or uppercased.

## Running it locally

Any static server works; from the project folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000/index.html
```

Opening the files directly with `file://` also works, except that the carousel probes the
images over the file protocol — use a server when you want to preview the gallery.

## Publishing on GitHub Pages

1. Push the branch.
2. **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Pick the branch and `/ (root)`, save → `https://<user>.github.io/<repo>/`.

Remember to push the images (`1.jpeg` …) and `tnc.pdf` too — they are part of the site, not
build artefacts.

### Cache-busting — bump `?v=` after a content change

Every page loads its assets as `style.css?v2`, `data.js?v2` and `site.js?v2`. Browsers
cache those files, so after you edit `data.js` (a new date, a new topic, a new competition)
raise the number in all eleven HTML files:

```bash
sed -i 's/?v2/?v3/g' *.html
```

Visitors then get the new content immediately instead of the copy their browser saved.

## Accessibility

Skip link, semantic landmarks, labelled controls, `aria-live` regions, visible focus rings,
keyboard-operable dropdown, carousel and accordions, `prefers-reduced-motion` support,
touch targets sized for phones, and a `<noscript>` notice on every page.

## Still to be configured by the organisers

* `SPREADSHEET_ID` in `Code.gs` (placeholder: `PUT_YOUR_SPREADSHEET_ID_HERE`)
* `CONFIG.registrationEndpoint` in `site.js` (empty → the form says nothing was sent)
* more photographs as `14.` / `15.`
* registration fees, prizes, contact numbers and any further rules — the site deliberately
  shows nothing for these until you supply it
