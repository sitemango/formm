# बालसंस्कार फेस्टिवल २०२६ — Website

Static, Marathi-first website for **बालसंस्कार फेस्टिवल २०२६**, organised by
**श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ**. Plain HTML5 / CSS3 / vanilla JavaScript —
no build step, no frameworks, no paid services, no stock photography, and no
third-party carousel library.

## Files

```
index.html                 homepage: hero, photo gallery, schedule, 10 cards,
                           eligibility, explorer, FAQ, CTA, WhatsApp group
chitrakala.html            चित्रकला स्पर्धा
mehendi.html               मेहंदी स्पर्धा
nibandh.html               निबंध स्पर्धा
vaktrutva.html             वक्तृत्व स्पर्धा
ekpatri-natya.html         एकपात्री नाट्य अभिनय स्पर्धा
rangoli.html               रांगोळी स्पर्धा
group-dance.html           समूह नृत्य        (Group Dance)        — ऑनलाइन
group-singing.html         समूह गायन        (Group Singing)      — ऑनलाइन
group-fashion-show.html    समूह फॅशन शो     (Group Fashion Show) — ऑनलाइन
reel-star.html             रील स्टार        (Reel Star)          — ऑनलाइन, इयत्ता ५ वी–१० वी
registration.html          dedicated registration page (class + competitions)

style.css                  one shared stylesheet (tokens, components, layouts)
data.js                    ALL competition data + the carousel image manifest
site.js                    shared header/nav/footer + page rendering + registration
Code.gs                    Google Apps Script backend → Google Sheets
tnc.pdf                    the terms and conditions the form links to
1.jpeg … 13.jpeg           numbered carousel photographs
WhatsApp Image … .jpeg     37 further carousel photographs (original names kept)
logo-left.png              अध्यक्षांचे छायाचित्र — hero portrait only (not in the carousel)
tests/verify.js            source-level test suite      (npm test)
tests/runtime.js           jsdom runtime test suite    (npm run test:runtime)
```

Every page loads `style.css`, `data.js` and `site.js` with **relative** paths, so any page
can be opened directly by URL and the whole thing publishes to GitHub Pages as-is.

> Note: the previous `script.js` has been split into `data.js` (content) and `site.js`
> (behaviour) so that all twelve pages share one copy of the navigation, footer and
> competition data.

---

## 1. Photo carousel — explicit image manifest

The gallery sits on the homepage, between the hero and the competition directory. It shows
**every photograph committed in the repository** — 58 files at the time of writing:

* `1.jpeg` … `13.jpeg` — the numbered photographs
* 45 more uploads whose original names are kept, e.g.
  `WhatsApp Image 2026-10-21 at 21.32.40.jpeg` and `WhatsApp Image 2026-10-21 at 21.38.49 (1).jpeg`

`logo-left.png` is deliberately **not** a slide: it is the अध्यक्ष portrait that belongs to
the hero medallion only (see **3b**), so it is the one image in the root that the gallery
skips. The tests enforce exactly that — every other photograph must be in the manifest, and
`logo-left.png` must not be.

**How the list is maintained.** `data.js` holds an explicit manifest — one entry per file,
filename and all. There is no numbering convention any more, so a file whose name does not
look like `7.jpeg` is never silently dropped:

```js
"gallery": {
  "folder": "",                       // "" = project root, or e.g. "photos/"
  "images": [
    { "src": "1.jpeg",  "alt": "बालसंस्कार फेस्टिवल २०२६ — छायाचित्र १", "caption": "" },
    { "src": "2.jpeg",  "alt": "…", "caption": "" },
    …
    { "src": "WhatsApp Image 2026-10-21 at 21.32.40.jpeg", "alt": "…", "caption": "" }
  ],
  "heading": "बालसंस्कार फेस्टिवल — छायाचित्र दालन",
  "lede": "…",
  "altPrefix": "बालसंस्कार फेस्टिवल २०२६ — छायाचित्र ",
  "intervalMs": 6000,
  "autoplay": true
}
```

* **To add a photograph:** upload the file next to `index.html` and add one line to
  `images` (`{ "src": "the-file-name.jpeg", "alt": "…", "caption": "" }`). Nothing else
  changes — the renderer, the counter, the dots and the arrows all read the manifest.
* **Duplicate entries are ignored**, so the same file can never appear twice.
* `alt` is used verbatim; if it is omitted the script falls back to
  `altPrefix` + the slide number. `caption` is only rendered when set.
* `start` / `count` / `extensions` are still in `data.js` as a **legacy fallback** for a
  project without a manifest (`1.jpeg`, `1.jpg`, `1.png` probing). With a manifest present
  they are not used.

**How it stays honest.** The manifest is painted immediately, so the counter, the dots and
the arrows describe the real list from the first frame. A small worker pool (6 at a time)
then confirms every file in the background:

* a file that 404s or cannot be decoded is removed, and the slide, the dots and the counter
  are rebuilt — no broken-image icon, no empty slide, no wrong “x / y”;
* an `<img error>` handler prunes the same way, so a file that disappears after page load
  is handled too;
* if **no** image can be displayed the whole section stays hidden;
* the visitor stays on the same photograph when a rebuild happens (`data-current`).

**Behaviour (unchanged)**

* one main image at a time, arrows + pagination dots + a “१ / ५८” counter
* swipe on touch devices, `←` / `→` on the keyboard, dots are real buttons with labels
* `width`/`height` come from the real image size and `object-fit: contain` is used, so the
  aspect ratio is preserved and nothing is stretched
* the first slide is `fetchpriority="high"`, the rest are `loading="lazy" decoding="async"`
* one image → arrows and dots are hidden; **no** images → the whole section stays hidden
* autoplay pauses on hover/focus, while the tab is hidden and after any manual navigation,
  and is switched off entirely under `prefers-reduced-motion: reduce`
* with 50+ images the dots are packed tighter (`.carousel__dots--many`) but there is still
  exactly one dot per image
* no library — the whole carousel is vanilla JavaScript in `site.js`
  (`galleryManifest()`, `galleryCandidates()`, `probeAll()`, `buildCarousel()`)

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
`appearance: none`). When ticked it shows a **black tick on a white tile** with the accent
border — drawn as an inline-SVG `background-image`, *not* an `::after` pseudo-element, because
browsers do not render pseudo-elements on `<input>` elements (that is why the old white tick
was invisible). Black-on-white is ~19:1; the old white tick on the dark maroon gradient was
unreadable even where it did render. `@media (forced-colors: active)` hands the checkbox back
to the system so High Contrast users get the native tick.
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

The अध्यक्ष's portrait appears as a circular card in the hero, **below “प्रतिभा सादर करा.”**,
with an “अध्यक्ष” badge, the अध्यक्ष's name (**श्री. संदीप गायकवाड**), the club name
(**श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ**), and a dialable phone link (**+91 98608 44503** / `tel:+919860844503`).

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
  "name": "श्री. संदीप गायकवाड",
  "club": "श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ",
  "phone": "+919860844503",
  "phoneDisplay": "+91 98608 44503",
  "alt": "श्री. संदीप गायकवाड — अध्यक्ष, श्री राधाकृष्ण फ्रेंड्स क्लब, शिरवळ"
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
* The phone number is dialable via a semantic `<a href="tel:+919860844503">`.
* The portrait is **not** part of the homepage carousel — it is only the hero medallion,
  so it never appears twice on the page.
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

For the four online competitions `kind` is `"online"` and there is no live `time` or
`venue` — the date is labelled as a **video deadline**, never as a live-event time. An online
competition may add `deadlineTime` when the organisers confirm a cut-off hour; it is printed
right after the date everywhere (`deadlineDate()`), while the “प्रत्यक्ष वेळ” row still says
there is no live event. Each competition brings its own wording through `deadlineLabel`:

```js
"schedule": {
  "kind": "online", "dateISO": "2026-11-27",
  "date": "शुक्रवार, २७ नोव्हेंबर २०२६",
  "time": null, "venue": null,
  "deadlineLabel": "व्हिडिओ पाठविण्याची अंतिम तारीख"        // the three team events
}

// रील स्टार (29 November, 5 pm submission cut-off)
"schedule": {
  "kind": "online", "dateISO": "2026-11-29",
  "date": "रविवार, २९ नोव्हेंबर २०२६",
  "deadlineTime": "संध्याकाळी ५ वाजता",
  "time": null, "venue": null,
  "deadlineLabel": "व्हिडिओ सबमिशनची अंतिम तारीख"
}
```

The २०२६ schedule:

| स्पर्धा | दिनांक | वेळ | ठिकाण |
| --- | --- | --- | --- |
| चित्रकला | रविवार, २२ नोव्हेंबर २०२६ | सकाळी ८:३० | जिल्हा परिषद प्राथमिक शाळा, मुख्य पटांगण, शिरवळ |
| मेहंदी | सोमवार, २३ नोव्हेंबर २०२६ | दुपारी ४ | अंगणवाडी क्रमांक ६, शिरवळ |
| वक्तृत्व | शनिवार, २८ नोव्हेंबर २०२६ | सकाळी ११ | आदर्श विद्यालय, शिरवळ |
| निबंध | शुक्रवार, २७ नोव्हेंबर २०२६ | दुपारी २ | ज्ञानवर्धिनी प्रशाला, शिरवळ |
| समूह नृत्य | शुक्रवार, २७ नोव्हेंबर २०२६ | *व्हिडिओ पाठविण्याची अंतिम तारीख* | ऑनलाइन |
| समूह गायन | शुक्रवार, २७ नोव्हेंबर २०२६ | *व्हिडिओ पाठविण्याची अंतिम तारीख* | ऑनलाइन |
| समूह फॅशन शो | शुक्रवार, २७ नोव्हेंबर २०२६ | *व्हिडिओ पाठविण्याची अंतिम तारीख* | ऑनलाइन |
| एकपात्री नाट्य अभिनय | शनिवार, २८ नोव्हेंबर २०२६ | दुपारी ३ | जिल्हा परिषद प्राथमिक शाळा, मुली, शिरवळ |
| रांगोळी | रविवार, २९ नोव्हेंबर २०२६ | सकाळी ९ | एम. ई. एस. इंग्लिश मिडियम स्कूल, शिरवळ |
| रील स्टार | रविवार, २९ नोव्हेंबर २०२६ | *व्हिडिओ सबमिशनची अंतिम तारीख — संध्याकाळी ५ वाजता* | ऑनलाइन — प्रत्यक्ष स्थळ नाही |

Editing a date: change `date` (and `dateISO` so the homepage list stays in order) in
`data.js` — the competition page, the homepage schedule and the card update together.

---

## 5. The three online team competitions

समूह नृत्य, समूह गायन and समूह फॅशन शो are marked **Online Competition / ऑनलाइन स्पर्धा**
on the homepage, on their own pages and in the registration form (रील स्टार, the fourth
online competition, is documented in **5b**). Their confirmed rules:

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

## 5b. रील स्टार (Reel Star) — online, इयत्ता ५ वी ते १० वी

A fourth **online** competition, added to the same data-driven architecture. Confirmed
details only:

| Field | Value |
| --- | --- |
| Competition | रील स्टार (Reel Star) |
| Eligibility | **इयत्ता ५ वी ते १० वी** — a **grade (class)** rule, exactly like the other competitions; there is no age rule anywhere |
| Format | **Online** — no physical venue, no live-event time |
| Deadline | **रविवार, २९ नोव्हेंबर २०२६, संध्याकाळी ५ वाजता** / Sunday, 29 November 2026, 5:00 pm (`dateISO: "2026-11-29"`, `deadlineTime`) |

```js
{
  "id": "reel-star",
  "name": "रील स्टार", "nameLatin": "Reel Star",
  "page": "reel-star.html",
  "mode": "online",
  "schedule": {
    "kind": "online", "dateISO": "2026-11-29", "order": "10",
    "date": "रविवार, २९ नोव्हेंबर २०२६",
    "deadlineTime": "संध्याकाळी ५ वाजता",
    "time": null, "venue": null,
    "deadlineLabel": "व्हिडिओ सबमिशनची अंतिम तारीख"
  },
  "eligibility": { "from": 5, "to": 10 },  // इयत्ता ५ वी → इयत्ता १० वी
  "eligibilityNote": "इयत्ता ५ वी ते १० वी — एकच इयत्ता-श्रेणी, स्वतंत्र गट नाहीत.",
  "groups": [],
  "isTeam": false,
  "pending": false,
  "notes": [ "…still awaiting announcement…" ]
}
```

`eligibility` uses the same `from`/`to` class indices as every other competition, so
`isEligible()` filters it by grade like the rest; `eligibilityText()` prints
“इयत्ता ५ वी ते १० वी” everywhere. What makes it special is only that it has **no groups**
(`groups: []`, `hasGroups()` is false): the cards, the pick card and the “इतर स्पर्धा”
lists then say *स्वतंत्र गट नाहीत* instead of naming a group, and no topic is ever asked.
**No `वय` / `वर्षे` wording and no age field exist anywhere in the site, the tests or the
backend** — the earlier “age 5–10” rule was removed on request.

**Where it appears — all from that one object**

* homepage **card** (`#homeCards`) with the online badge, “पात्रता: इयत्ता ५ वी ते १० वी ·
  ऑनलाइन स्पर्धा” and the २९ नोव्हेंबर २०२६, संध्याकाळी ५ वाजता deadline
* homepage **schedule** — its own row, marked *व्हिडिओ सबमिशनची अंतिम तारीख* and
  “प्रत्यक्ष स्थळ किंवा वेळ लागू नाही”
* homepage **online strip**, **eligibility overview** (an “स्वतंत्र गट नाहीत” chip) and the
  **explorer** (it appears only for इयत्ता ५ वी ते १० वी, with its class range shown)
* **`reel-star.html`** — its own page, rendered by the same `renderCompetitionPage()` as all
  the others: class eligibility, online format, “प्रत्यक्ष ठिकाण: नाही”, the deadline and a
  CTA to `registration.html?competition=reel-star`
* **header menu, footer and “इतर स्पर्धा”** lists on every competition page
* **registration** — see below

**Registration.** There is **no separate age field**. रील स्टार follows the same grade rule
as every other competition: pick इयत्ता, and the competition is offered (and preselected from
`?competition=reel-star`) only for इयत्ता ५ वी ते १० वी. Choosing इयत्ता ४ थी hides it,
drops the selection and explains why (“… पात्र नाही”). The pick card asks for neither a
topic nor a group; the entry carries `{ competitionId, competition, mode, group: "", topic: "",
status, … }` and **no `age` / `eligibilityType` / `ageRange`**. Online picks are listed only
after a class is chosen, because eligibility is grade-based.

**Backend.** `Code.gs` maps `reel-star → रील स्टार`, creates the tenth tab, and validates the
same fields as the class-based competitions — there is no age column and no age validation.

**Deliberately unannounced** (never invented): reel duration limits, video submission
mechanics, judging criteria, prizes and required documents. They appear in the page's
“अद्याप जाहीर होणे बाकी” notice and in the FAQ wording until the organisers confirm them.

---

## 5c. Join WhatsApp Group button

One invitation link, configured once in `data.js` and never edited anywhere else:

```js
"whatsapp": {
  "url": "https://chat.whatsapp.com/CCTGjn1R4vgLxWYgTySjfq?mode=gi_t",
  "label": "Join WhatsApp Group",
  "shortLabel": "WhatsApp ग्रुप",
  "ariaLabel": "Join WhatsApp Group — WhatsApp ग्रुपमध्ये सहभागी व्हा (नवीन टॅबमध्ये उघडेल)",
  "note": "स्पर्धांच्या सूचना, वेळापत्रकातील बदल आणि नोंदणीसंबंधी माहिती WhatsApp ग्रुपमध्ये मिळेल."
}
```

Where it appears:

| Placement | Rendered by | Notes |
| --- | --- | --- |
| **Hero** (`index.html`, `.hero__actions`) | static HTML | third button, beside **स्पर्धा पहा** and **नोंदणी करा** — visible without scrolling; registration stays the primary CTA |
| **Homepage CTA band** | static HTML | below the registration button, with a one-line note |
| **Header navigation** | `renderHeader()` | every page; full label on wide screens, icon + `aria-label` between 900–1180 px, full-width button inside the mobile menu |
| **Footer** (उपयुक्त दुवे column) | `renderFooter()` | every page, with the note text |
| **Registration success card** | `initRegistration()` → `#successWhatsapp` | after a confirmed registration, so the participant can join the group for next steps; the note comes from `ui.successWhatsappNote` |

Styling and behaviour:

* `target="_blank" rel="noopener noreferrer"` — always opens in a new tab
* `.btn--whatsapp` uses a WhatsApp-inspired green gradient placed inside the existing
  maroon / saffron / cream palette (no new dependency, no icon font — the glyph is an inline
  SVG symbol `#i-whatsapp` in the existing sprite)
* minimum 44 px touch target, `:focus-visible` saffron ring, white-on-green contrast,
  English label “Join WhatsApp Group” plus a Marathi `aria-label` context
* the header and footer buttons are marked `data-whatsapp-link`, which the tests use to make
  sure **every** instance points at the exact supplied URL
* if `whatsapp.url` is ever emptied, both the header and the footer button disappear rather
  than rendering a dead link

---

## 6. Connecting the form to Google Sheets

The endpoint is configured in `site.js` (`CONFIG.registrationEndpoint`), so the form posts
straight to the Apps Script web app. There is **no “endpoint not configured” banner** on the
page any more; if the endpoint is ever emptied, the form still validates normally and — on
submit — plainly states that nothing was sent instead of faking a success.

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
| 3 | विद्यार्थ्याचे नाव | 12 | स्वरूप |
| 4 | इयत्ता | 13 | गट |
| 5 | शाळेचे नाव | 14 | विषय |
| 6 | गाव / शहर | 15 | संघाचे नाव (Group Name) |
| 7 | पालकांचे / संरक्षकाचे नाव | 16 | सहभागी विद्यार्थी |
| 8 | मोबाइल क्रमांक | 17 | सहभागींची संख्या |
| 9 | ईमेल | 18 | स्थिती |

Eighteen columns, unchanged from the original design — grade is the only eligibility input,
so there is **no age column**. (A spreadsheet created while the short-lived age column
existed may carry a stray **वय (वर्षे)** header; delete that column, or run `setupSheets()`
on a fresh spreadsheet.) Individual entries leave columns 15–17 blank (no team name, no
member list, no member count) — column 18 always records **नोंदणी झाली / पुष्टी बाकी**.

### 6.4 How a submission is routed

* the server validates every field again (name, standard, school, city, guardian, mobile
  format, at least one competition, and — for team events — a group name and ≥ 5 members);
  रील स्टार needs nothing extra, because its eligibility is just इयत्ता ५ वी ते १० वी
* each entry is appended to the tab matching its `competitionId`
  (`chitrakala → चित्रकला`, `group-dance → समूह नृत्य`, `reel-star → रील स्टार`, …)
* one student entering three competitions → one row in each of the three tabs, and nothing
  in the other seven
* unknown competitions are skipped rather than guessed, and a malformed request writes
  nothing at all
* every row carries the same timestamp and a registration reference
  (`<requestId>-<n>`); a repeated delivery of the same `requestId` is ignored, and the
  browser blocks double-clicks while a submission is in flight
* `LockService` serialises concurrent submissions
* errors return a plain Marathi message with no stack traces or internals

### 6.5 Checking that all ten tabs are receiving entries

1. Submit one test registration for **one individual**, **one team** and **रील स्टार**
   competition (see 6.6) and watch the matching three tabs gain a row.
2. Check the tab name at the bottom of the sheet matches the competition — the row is only
   ever written to the tab for that competition.
3. In Apps Script: **Executions** shows one log line per request; a failed request is
   listed there with the reason.
4. `testValidation()` (in `Code.gs`, *Run* from the editor) prints three validation
   results — a good payload (individual + रील स्टार + team), a team with only three
   members, and an empty selection — without writing anything to the sheet.

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
* There is **no age field**. Every competition — रील स्टार included — is filtered by
  इयत्ता alone, and रील स्टार is offered only for इयत्ता ५ वी ते १० वी.
* रील स्टार appears in the **ऑनलाइन स्पर्धा** section once a class is chosen, is
  preselected from its page CTA (`registration.html?competition=reel-star`) when that class
  is eligible, and asks for no group and no topic. An ineligible class hides it, drops the
  selection and explains why.
* An eligible रील स्टार entry is sent with `status: "registered"` (its eligibility is
  confirmed). Only competitions whose rules are genuinely unannounced are marked
  `pending-confirmation`.
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

The homepage title **बालसंस्कार फेस्टिवल २०२६** (`h1.hero__title`) is painted with a
six-colour festival **gradient** — pink → blue → purple → orange → red → maroon — clipped to
the glyphs, so the words themselves carry the colours (no image, no extra markup):

```css
@supports (-webkit-background-clip:text){
  .hero__title{
    background-image:linear-gradient(95deg,#C2185B 0%,#1E4E9A 22%,#6A1B9A 42%,
                                     #9C4300 62%,#C1272D 82%,#7A1F2B 100%);
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color:transparent; color:transparent;
  }
}
```

* **Contrast:** every stop — and the blends between them — clears **4.5:1** on the cream
  hero (`#EFE1CC`): pink 4.6 · blue 6.3 · purple 7.3 · orange 5.1 · red 4.5 · maroon 7.9.
  The h1 uses 30–47 px bold, so that comfortably clears WCAG AA (large text needs 3:1).
* **Fallbacks:** the base rule keeps `color:var(--maroon)`, so a browser without gradient
  text shows a solid maroon title; `@media (forced-colors: active)` restores
  `CanvasText`, and `@media print` paints solid maroon again — the heading is never blank.
* The saffron bar under the title (`.hero__title::after`) is unchanged, and no other heading
  on the site was touched.

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

## Tests

Two harnesses ship in `tests/`. Both are plain Node scripts — no browser download, no
network access, no build step.

```bash
npm install            # one dependency: jsdom (dev only)
npm test               # both suites           → 525 + 114 assertions
npm run test:verify    # source-level suite    → 525 assertions
npm run test:runtime   # jsdom runtime suite    → 114 assertions
```

`tests/verify.js` inspects the source and the data: every HTML page, the competition data,
the schedule, the terms checkbox, the group-name flow, the Apps Script contract, the submit
behaviour, the अध्यक्ष card, and — for this release — **every raster image in the repository
being present in `gallery.images` (and `logo-left.png` being absent from it)**, the रील स्टार data (इयत्ता ५ वी ते १० वी,
`dateISO` `2026-11-29`, no groups, no venue, no age wording), the absence of any age field /
age column, and the exact WhatsApp URL in every button.

`tests/runtime.js` boots `index.html`, `reel-star.html` and `registration.html` in jsdom with
`data.js` + `site.js` actually running, then drives them:

* carousel — every manifest image becomes a slide, dot and counter entry (`logo-left.png`
  is asserted **not** to be one), next/previous at
  both ends, wrap-around, dots, keyboard, swipe, autoplay (and its absence under
  `prefers-reduced-motion`), and a forced `<img error>` that must remove exactly one slide
  while keeping the dots and the counter correct
* रील स्टार — page heading/facts/deadline, CTA, homepage card (grade range, no age
  wording), schedule row, online strip, explorer for इयत्ता ६ वी but not इयत्ता ४ थी
* registration — grade gating and preselection, payload contents (no `age` /
  `eligibilityType` / `ageRange`; `status: "registered"`), the success card appearing only
  after a valid `{"result":"success"}` response, and the class-based (चित्रकला) flow being
  unchanged
* no JavaScript errors are tolerated on any page

Both suites must exit 0. `tnc.pdf` is deliberately **not** asserted as present — it is a
deployment asset that is not committed in this repository snapshot (see “Still to be
configured”).

---

## Publishing on GitHub Pages

1. Push the branch.
2. **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Pick the branch and `/ (root)`, save → `https://<user>.github.io/<repo>/`.

Remember to push every photograph listed in `gallery.images` (the numbered JPEGs, the
`WhatsApp Image …` uploads and `logo-left.png`) and `tnc.pdf` too — they are part of the
site, not build artefacts.

### Cache-busting — bump `?v=` after a content change

Every page loads its assets as `style.css?v8`, `data.js?v8` and `site.js?v8`. Browsers
cache those files, so after you edit `data.js` (a new date, a new topic, a new competition)
raise the number in all twelve HTML files:

```bash
sed -i 's/?v8/?v9/g' *.html
```

Visitors then get the new content immediately instead of the copy their browser saved.

## Accessibility

Skip link, semantic landmarks, labelled controls, `aria-live` regions, visible focus rings,
keyboard-operable dropdown, carousel and accordions, `prefers-reduced-motion` support,
touch targets sized for phones, and a `<noscript>` notice on every page.

The WhatsApp group button is a real `<a>` with an `aria-label`
(“Join WhatsApp Group — WhatsApp ग्रुपमध्ये सहभागी व्हा (नवीन टॅबमध्ये उघडेल)”),
`target="_blank" rel="noopener noreferrer"`, a ≥ 44 px touch target, a saffron
`:focus-visible` ring and a contrast-safe white-on-green label. Its accessible name is
always present, even when the header collapses it to an icon between 900 and 1180 px.

## Still to be configured by the organisers

* `SPREADSHEET_ID` in `Code.gs` (placeholder: `PUT_YOUR_SPREADSHEET_ID_HERE`)
* `CONFIG.registrationEndpoint` in `site.js` is configured with the supplied Google Apps Script `/exec` deployment. Verify deployment access before accepting registrations.
* any **new photographs** — add the file plus one line to `gallery.images` in `data.js`
  (filename + alt text). No code change is needed.
* **`tnc.pdf`** — the file is linked from the registration form but is not committed in
  this repository snapshot. Add it next to `index.html` before publishing, or the link will
  404.
* रील स्टार details that are **not yet confirmed**: reel duration, video submission
  mechanics, judging criteria, prizes and required documents. They are shown as
  “अद्याप जाहीर होणे बाकी” and must not be invented.
* registration fees, prizes, contact numbers and any further rules — the site deliberately
  shows nothing for these until you supply it
