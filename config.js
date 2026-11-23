/* =====================================================================
 *  SETTINGS: safe to edit
 *
 *  This is the only file you need to change to update the wording,
 *  hashtags, links, skill-focus list or suggested LinkedIn post.
 *
 *  How to edit:
 *   - Change the text between the quote marks ' '.
 *   - Keep the quote marks, and keep the comma at the end of each line.
 *   - If your text contains an apostrophe, use the curly one (’) or put a
 *     backslash before it, e.g. 'I\'m'.
 *   - Save, commit to the main branch, and the live site updates in about
 *     2 minutes.
 *
 *  Colors, fonts and the card design live in app.js (developers only).
 * ===================================================================== */
const SETTINGS = {

  /* ---------- Names ---------- */
  org: 'The Job Hackers',
  program: 'Agile MBA™',

  /* ---------- Card wording ---------- */
  headlineIntro: "I'm taking part in",   // shown above "AGILE MBA™"
  focusLabel: 'Building skills in',      // label on the skill-focus chip
  // Two short items shown under the cohort in the card's footer
  cardFooter: ['#AlwaysAJobHacker', 'thejobhackers.org'],

  /* ---------- Links ---------- */
  courseUrl: 'https://www.thejobhackers.org/participant/',
  linkedinPage: 'https://www.linkedin.com/company/the-job-hackers/',

  /* ---------- Skill improvement focus dropdown ---------- */
  focusOptions: [
    'Agile foundations',
    'Scrum in practice',
    'Product ownership & value',
    'Flow, Kanban & WIP limits',
    'Systems thinking',
    'Estimation & uncertainty',
    'TDD, BDD & technical debt',
    'Psychological safety',
    'Leading Agile teams',
    'Helping teams adopt AI',
    'Scrum certification (PSM I)',
    'Moving into an Agile role',
  ],

  /* ---------- Suggested LinkedIn post ----------
   * Placeholders filled in automatically:
   *   {cohort}    e.g. "the Q1 2027 cohort"
   *   {focus}     the chosen skill focus
   *   {courseUrl} the course link above
   * Anything in [square brackets] is a prompt for the participant to
   * replace in their own words. */
  postOpeners: [
    "I've just joined {cohort} of The Job Hackers' Agile MBA™! 🚀",
    "New chapter: I'm taking part in the Agile MBA™ from The Job Hackers ({cohort}).",
    "Back in learning mode 📚 I've signed up for The Job Hackers' Agile MBA™, {cohort}.",
    "Some personal news: I'm part of {cohort} of the Agile MBA™ with The Job Hackers.",
    '[Write your own opening line, e.g. a question or a moment that made you sign up]',
  ],
  postFocus: 'My main focus: {focus}.',
  postFocusMissing: 'My main focus: [the skill you most want to build, e.g. Scrum, flow or systems thinking].',
  postParagraphs: [
    'Why now: [In a sentence or two, what made you sign up? A challenge at work, a career move, a team you want to help?]',
    "{focusLine} [What will you do differently at work once you've built that skill?]",
    "Over six weeks of live sessions we'll cover [name 2 or 3 topics you're most curious about, e.g. Scrum, product development flow, systems thinking, psychological safety].",
    '[Optional: thank someone who recommended the course, or invite your network to join a future cohort.]',
    'Thanks to [type @The Job Hackers and pick their page from the list so they get tagged], a volunteer-led nonprofit helping people around the world grow their careers in modern knowledge work.',
    'Find out more about the Agile MBA™: {courseUrl}',
  ],
  postHashtags: ['#AgileMBA', '#AlwaysAJobHacker', '#TheJobHackers', '#Agile', '#Scrum'],

  /* ---------- Cohort dropdown ----------
   * The list moves forward automatically each quarter (see README).
   * Only change these if the course schedule changes. */
  cohorts: {
    firstYear: 2026,      // earliest cohort ever offered...
    firstQuarter: 4,      // ...is Q4 2026
    pastQuarters: 1,      // how many past quarters stay selectable
    totalOptions: 4,      // how many quarters the dropdown shows
  },
};
