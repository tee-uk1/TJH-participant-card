# Agile MBA™ Participant Card Generator

**Live:** https://tee-uk1.github.io/TJH-participant-card/

A small static web page where people who have enrolled in The Job Hackers' Agile MBA™ can make an image to share on LinkedIn, either before their course starts or while it's running. It's a prototype that will be refined through the Kaizen process.

- Everything runs in the browser. Nothing people type is uploaded or stored.
- Square format (1080×1080) and landscape format (1200×627), in two themes (Lavender and Lapis).
- Photo upload with zoom and drag-to-reposition. Without a photo, the preview shows "YOUR PHOTO HERE", the page suggests adding one, and the downloaded/copied/shared image uses The Job Hackers logo in the circle instead.
- Download the card as a PNG, copy it to the clipboard and paste it straight into a LinkedIn post, or (on phones) send it to the LinkedIn app with the Share button.
- Ready-to-paste image description (alt text) for screen-reader users.
- Works on phones as well as desktop.
- Generates a suggested LinkedIn post (a skeleton with prompts), plus a short "how to post on LinkedIn" guide.

## Files

| File | What it is | Who edits it |
|---|---|---|
| `config.js` | Wording, links, focus list, post text, hashtags, cohort rules, usage counting | Anyone |
| `index.html` | The page and form | Developers |
| `style.css` | Page styling | Developers |
| `app.js` | Draws the card, builds the post and alt text, handles download/copy/share and photo dragging | Developers |
| `cohorts.js` | Works out which quarters appear in the cohort dropdown | Developers |
| `countries.js` | Country suggestions for the Country field | Rarely |
| `assets/` | The Lapis and white Job Hackers logos | Rarely |

## Run locally

```powershell
python -m http.server 5173
```

Then open http://localhost:5173.

## Editing wording, links and lists (no coding needed)

Everything non-technical lives in **`config.js`**, with instructions at the top of the file:

- card wording (`headlineIntro`, `focusLabel`, `cardFooter`)
- links (`courseUrl`, `linkedinPage`)
- the skill-focus list (`focusOptions`)
- the suggested LinkedIn post (`postOpeners`, `postParagraphs`, `postHashtags`)
- cohort dropdown rules (`cohorts`)
- usage counting (`goatcounterCode`)

Commit the change to `main` and the live site updates in about 2 minutes.

## Customize the design (developers)

Edit the `CONFIG` block at the top of `app.js`:

- `logos`: logo variants in `assets/`. Each theme chooses `white` (dark backgrounds) or `lapis` (light backgrounds).
- `themes`: two card themes built from the brand palette. **Lavender** (default) has a soft Lapis-tint background (`#CACAED`), a light top band with the Lapis logo, and Lapis text. **Lapis** is the dark version with the white logo and Saffron highlights. Both use the same "iteration loop" arrows as a background motif, a loop around the photo, and a forward-pointing ribbon for the cohort and the `cardFooter` items (`#AlwaysAJobHacker · thejobhackers.org`).
- `headingFont` / `bodyFont`: Lato (the primary brand font). Poppins is loaded too if you want to switch the headings to it.

## Form fields

- **Full name** (required), **Role**, **Organization** (optional) and **Country** (optional, with autocomplete; shown under the name with a location pin).
- **Cohort**: a dropdown of quarters that updates itself (see below).
- **Skill improvement focus** (optional): shown on the card as "BUILDING SKILLS IN …". Edit the list in `config.js`.

## Rolling cohort list

`cohorts.js` works out which quarters to offer from today's date in Pacific Time. There's no server and nothing to update by hand.

- The default is the current calendar quarter: Jan–Mar is Q1, Apr–Jun is Q2, Jul–Sep is Q3, Oct–Dec is Q4. There is one cohort per quarter.
- The list starts at the previous quarter (but never before Q4 2026) and shows 4 quarters, so people can still pick the next quarter if they enrolled early.
- When a quarter ends, the oldest option drops off and the next one is added. For example, on April 1, 2027, Q4 2026 is removed and Q4 2027 is added.
- To preview a future date, add `?today=YYYY-MM-DD` to the URL, e.g. `http://localhost:5173/?today=2027-04-01`.
- Change `cohorts` in `config.js` to adjust the first cohort, how many past quarters stay listed, or how many options to show.

## Suggested LinkedIn post

The post is a skeleton, not a finished post. It fills in the cohort and focus, and leaves `[bracketed]` prompts for people to answer in their own words. The opening line varies, so posts from the same cohort don't read like copies. A counter shows how many brackets are still left. It includes a prompt to tag The Job Hackers' LinkedIn page. Edit the wording in `config.js`.

## Usage counting

The tool can count how often it's used, without collecting anything people type. It uses [GoatCounter](https://www.goatcounter.com/): free for nonprofits, no cookies, no consent banner needed, and it works on any host.

It counts:
- page visits (automatic)
- `card-download/<cohort>/<format>/<theme>`, e.g. `card-download/q4-2026/square/lavender`
- `card-copied/<cohort>/<format>/<theme>` (when the image is copied instead of downloaded)
- `card-shared/<cohort>/<format>/<theme>` (when shared from a phone)
- `post-copied`

To turn it on, sign up at goatcounter.com, pick a site code (e.g. `tjh-agile-card`), and set `goatcounterCode: 'tjh-agile-card'` in `config.js`. While the code is empty, nothing is sent anywhere.

## Deploy

The site is plain HTML, CSS and JS with no build step. It's hosted on GitHub Pages from the `main` branch: every push to `main` redeploys it within a couple of minutes. It will also work on Netlify, Cloudflare Pages or any static host.

## Handing over to The Job Hackers

When the repository is transferred to a Job Hackers GitHub account:

- The live address changes to `https://<new-owner>.github.io/TJH-participant-card/`, or to a custom domain if one is set up (e.g. `card.thejobhackers.org`). GitHub redirects the old repo URL, but **not** the old GitHub Pages address, so update any links you've shared.
- Check GitHub Pages is still switched on (Settings → Pages → deploy from `main`, folder `/`).
- If usage counting is wanted, create the GoatCounter account under The Job Hackers and add its code to `config.js`.

## License and credits

Released under the [MIT License](LICENSE). Copyright (c) 2026 The Job Hackers.

Created by [tee-uk1](https://github.com/tee-uk1) for The Job Hackers.
