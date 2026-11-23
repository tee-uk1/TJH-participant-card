# Agile MBA™ Participant Card Generator

**Live:** https://tee-uk1.github.io/TJH-participant-card/

A small web page where people enrolled in The Job Hackers' Agile MBA™ can make a branded card to share on LinkedIn, before their course starts or while it's running. It also gives them a starting point for their LinkedIn post.

It's a prototype that will be refined through the Kaizen process.

## What it does

- **Form:** full name (required), role, organization, country, cohort, skill improvement focus and an optional photo.
- **Card:** drawn live as people type, in two themes (**Lavender** and **Lapis**) and two sizes (**square** 1080×1080 and **landscape** 1200×627).
- **Photo:** zoom with a slider. To reposition it, tap the bright yellow **Move photo** button (on the card's top-right corner, or next to the photo field), drag the photo (mouse or touch), then tap **Done**. Dragging only works in this mode, so the page scrolls normally on phones the rest of the time. The button pulses briefly whenever a photo is added.
  - Without a photo, the preview shows "YOUR PHOTO HERE" and a tip suggests adding one.
  - The final image uses The Job Hackers logo in the photo circle instead.
- **Getting the card out:**
  - **Download PNG** on any device.
  - **Copy image**, to paste straight into a LinkedIn post.
  - **Share…**, only on phones and tablets that support it, which opens the share sheet to send it to the LinkedIn app.
- **LinkedIn post:** a skeleton with `[bracketed]` prompts for people to fill in themselves.
  - Opening lines vary, so posts from the same cohort don't read like copies.
  - A counter shows how many brackets are left.
- **Alt text:** a ready-to-paste image description for screen-reader users.
- **"How to post on LinkedIn" guide:** five steps, including tagging The Job Hackers' page.
- **Phones:** the page works on phones as well as desktop.
- **Privacy:** everything runs in the browser. Nothing people type or upload is sent anywhere. The only outside request is for Google Fonts (Lato).

## The card

Top to bottom:
1. Logo band
2. "I'M TAKING PART IN THE AGILE MBA™"
3. Photo inside a loop arrow
4. Name
5. Country, with a location pin
6. Role · Organization
7. "BUILDING SKILLS IN" chip with the chosen focus
8. A forward-pointing ribbon with the cohort ("Q4 2026 COHORT") and `#AlwaysAJobHacker · thejobhackers.org`

The photo and text are centered together. Long names shrink to fit on one line, and only wrap onto two lines when they're very long. The photo gets a little smaller if it needs the room.

All colors come from The Job Hackers brand palette: Lapis Lazuli `#333399`, Deep Saffron `#FF9933`, Mute Green `#99CC99`, and their tints. The font is Lato.

## Editing wording, links and lists (no coding needed)

Everything non-technical is in **`config.js`**, with instructions at the top of the file:

| Setting | What it controls |
|---|---|
| `headlineIntro` | The line above "AGILE MBA™" on the card |
| `focusLabel` | The label on the skill-focus chip ("Building skills in") |
| `cardFooter` | The two items under the cohort in the card's footer |
| `courseUrl` | The course link at the end of the suggested post |
| `linkedinPage` | The Job Hackers LinkedIn page, linked from the "How to post" guide |
| `focusOptions` | The skill improvement focus dropdown |
| `postOpeners`, `postFocus`, `postFocusMissing`, `postParagraphs` | The suggested LinkedIn post. `{cohort}`, `{focus}`, `{focusLine}` and `{courseUrl}` are filled in automatically; `[brackets]` are prompts for the participant |
| `postHashtags` | Hashtags at the end of the post |
| `cohorts` | Rules for the cohort dropdown (see below) |

Commit the change to `main` and the live site updates in about 2 minutes.

## Cohort dropdown

`cohorts.js` works out which quarters to offer from today's date, in Pacific Time. There's no server and nothing to update by hand.

- **Default:** the current calendar quarter. Jan–Mar is Q1, Apr–Jun is Q2, Jul–Sep is Q3, Oct–Dec is Q4. There's one cohort per quarter.
- **Range:** the list starts at the previous quarter (but never before Q4 2026) and shows 4 quarters, so people who enrolled early can pick a future cohort.
- **Rolling forward:** when a quarter ends, the oldest option drops off and the next one is added. For example, on April 1, 2027, Q4 2026 is removed and Q4 2027 is added. Cards already made are unaffected, since they're just images.
- **Testing a future date:** add `?today=YYYY-MM-DD` to the URL, e.g. `…/?today=2027-04-01`.

## Files

| File | What it is | Who edits it |
|---|---|---|
| `config.js` | Wording, links, focus list, post text, hashtags, cohort rules | Anyone |
| `index.html` | The page and form | Developers |
| `style.css` | Page styling, including the phone layout | Developers |
| `app.js` | Card themes and drawing, the post and alt text, download/copy/share, Move photo mode | Developers |
| `cohorts.js` | Works out the quarters in the cohort dropdown | Developers |
| `countries.js` | Country suggestions for the Country field | Rarely |
| `assets/` | The Lapis and white Job Hackers logos | Rarely |

To change the card design (colors, layout, fonts), edit the `CONFIG` block and the drawing code in `app.js`.

## Run locally

```powershell
python -m http.server 5173
```

Then open http://localhost:5173. Use a local server rather than opening `index.html` straight from disk: the page will display, but browsers treat images opened from disk as untrusted, so Download, Copy image and Share won't work.

## Deploy

The site is plain HTML, CSS and JavaScript with no build step. It's hosted on GitHub Pages from the `main` branch, and every push to `main` redeploys it within a couple of minutes. It will also run on Netlify, Cloudflare Pages or any static host.

## Known limits

- **Copy image** has been tested in a desktop browser, but not yet on a real phone.
- **Share…** hasn't been tested at all yet: the button only appears in browsers that can share files (mainly phones), and none was available during development. It needs a first test on a real iPhone and Android phone.

## Handing over to The Job Hackers

When the repository moves to a Job Hackers GitHub account:

- **New address:** the live site moves to `https://<new-owner>.github.io/TJH-participant-card/`, or a custom domain if one is set up (e.g. `card.thejobhackers.org`). GitHub redirects the old repo URL, but **not** the old GitHub Pages address, so update any links you've shared.
- **Pages setting:** check GitHub Pages is still switched on (Settings → Pages → deploy from `main`, folder `/`).

## License and credits

Released under the [MIT License](LICENSE). Copyright (c) 2026 The Job Hackers.

Created by [tee-uk1](https://github.com/tee-uk1) for The Job Hackers.
