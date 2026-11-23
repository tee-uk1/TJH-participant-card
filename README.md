# Agile MBA Participant Card

A small static web page where people who have enrolled in The Job Hackers' Agile MBA™ can make an image to share on LinkedIn, either before their course starts or while it's running. It's a prototype that will be refined through the Kaizen process.

- Everything runs in the browser. Nothing people type is uploaded or stored.
- Square format (1080×1080) and landscape format (1200×627).
- Photo upload with zoom. If there's no photo, the card shows initials.
- Download the card as a PNG, or copy it to the clipboard and paste it straight into a LinkedIn post.
- Generates a suggested LinkedIn post with a copy button.

## Run locally

```powershell
python -m http.server 5173
```

Then open http://localhost:5173.

## Customize branding

Edit the `CONFIG` block at the top of `app.js`:

- `logos`: logo variants in `assets/`. Each theme chooses `white` (dark backgrounds) or `lapis` (light backgrounds).
- `themes`: two card themes built from the brand palette. **Saffron** (default) has a soft Saffron background, a light top band with the Lapis logo, and Lapis text. **Lapis** is the dark version with the white logo and Saffron highlights. Both use the same "iteration loop" arrows as a background motif, a loop around the photo, and a forward-pointing ribbon for the cohort and hashtags.
- `headingFont` / `bodyFont`: Lato (the primary brand font). Poppins is loaded too if you want to switch the headings to it.
- `cardHashtags`: hashtags on the image (`#AgileMBA #AlwaysAJobHacker`). `hashtags`: hashtags in the post.
- `courseUrl`: course page linked at the end of the post.
- `headlineIntro`: the line above "AGILE MBA™" on the card.

## Form fields

- **Full name** (required), **Role**, **Organization** (optional) and **Country** (optional, with autocomplete).
- **Cohort**: a dropdown of quarters that updates itself (see below).
- **Skill improvement focus** (optional): edit the list in `CONFIG.focusOptions` in `app.js`.
- **What are you looking forward to?**: shown as a quote on the card.

## Rolling cohort list

`cohorts.js` works out which quarters to offer from today's date in Pacific Time. There's no server and nothing to update by hand.

- The default is the current calendar quarter: Jan–Mar is Q1, Apr–Jun is Q2, Jul–Sep is Q3, Oct–Dec is Q4. There is one cohort per quarter.
- The list starts at the previous quarter (but never before Q4 2026) and shows 4 quarters, so people can still pick the next quarter if they enrolled early.
- When a quarter ends, the oldest option drops off and the next one is added. For example, on April 1, 2027, Q4 2026 is removed and Q4 2027 is added.
- To preview a future date, add `?today=YYYY-MM-DD` to the URL, e.g. `http://localhost:5173/?today=2027-04-01`.
- Change `COHORT_CONFIG` to adjust the first cohort, how many past quarters stay listed, or how many options to show.

## Suggested LinkedIn post

The post is a skeleton, not a finished post. It fills in the cohort, focus and goal, and leaves `[bracketed]` prompts for people to answer in their own words. The opening line varies, so posts from the same cohort don't read like copies. A counter shows how many brackets are still left. Edit the wording in `OPENERS` and `buildPost()` in `app.js`.

## Usage counting

The tool can count how often it's used, without collecting anything people type. It uses [GoatCounter](https://www.goatcounter.com/): free for nonprofits, no cookies, no consent banner needed, and it works on any host.

It counts:
- page visits (automatic)
- `card-download/<cohort>/<format>/<theme>`, e.g. `card-download/q4-2026/square/saffron`
- `card-copied/<cohort>/<format>/<theme>` (when the image is copied instead of downloaded)
- `post-copied`

To turn it on, sign up at goatcounter.com, pick a site code (e.g. `tjh-agile-card`), and set `goatcounterCode: 'tjh-agile-card'` in `app.js`. While the code is empty, nothing is sent anywhere.

## Deploy

The site is plain HTML, CSS and JS with no build step. You can host it on GitHub Pages, Netlify or any static host.
