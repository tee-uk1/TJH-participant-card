/* =========================================================
 * Rolling cohort (quarter) options
 *
 * The cohort dropdown always shows a fixed-size window of quarters that
 * moves forward automatically as each quarter ends. No one has to edit it.
 *
 *   window start = max(previous quarter, FIRST cohort)
 *   options      = COUNT quarters from that start
 *
 * With the default settings (see SETTINGS.cohorts in config.js):
 *   Q4 2026 (now) -> Q4 2026, Q1 2027, Q2 2027, Q3 2027
 *   Q1 2027       -> Q4 2026, Q1 2027, Q2 2027, Q3 2027
 *   Q2 2027       -> Q1 2027, Q2 2027, Q3 2027, Q4 2027
 *   Q3 2027       -> Q2 2027, Q3 2027, Q4 2027, Q1 2028   ...and so on
 *
 * The previous quarter stays listed so people who finish a cohort can still
 * share it into the next quarter.
 *
 * Quarters are worked out in Pacific Time, which the course runs on.
 *
 * Testing: add ?today=YYYY-MM-DD to the page URL to see what the
 * dropdown will look like on that date, e.g. index.html?today=2027-04-01
 * ========================================================= */
// Values come from SETTINGS.cohorts in config.js when it's loaded.
const COHORT_SETTINGS = (typeof SETTINGS !== 'undefined' && SETTINGS.cohorts) || {};
const COHORT_CONFIG = {
  first: { year: COHORT_SETTINGS.firstYear || 2026, q: COHORT_SETTINGS.firstQuarter || 4 }, // earliest cohort ever offered
  lookback: COHORT_SETTINGS.pastQuarters ?? 1,   // how many past quarters stay selectable
  count: COHORT_SETTINGS.totalOptions || 4,      // how many options to show in total
  timeZone: 'America/Los_Angeles',
};

/** Calendar quarter of `date` in the configured time zone. */
function quarterOf(date, timeZone = COHORT_CONFIG.timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric' }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year').value);
  const month = Number(parts.find((p) => p.type === 'month').value);
  return { year, q: Math.floor((month - 1) / 3) + 1 };
}

const quarterIndex = ({ year, q }) => year * 4 + (q - 1);
const fromIndex = (i) => ({ year: Math.floor(i / 4), q: (i % 4) + 1 });
const quarterLabel = ({ year, q }) => `Q${q} ${year}`;

/** The cohort options available on `date`, oldest first. */
function cohortOptions(date, cfg = COHORT_CONFIG) {
  const current = quarterIndex(quarterOf(date, cfg.timeZone));
  const start = Math.max(current - cfg.lookback, quarterIndex(cfg.first));
  return Array.from({ length: cfg.count }, (_, i) => fromIndex(start + i));
}

/** Today's date, or the ?today=YYYY-MM-DD override used for testing. */
function cohortToday() {
  const override = typeof location !== 'undefined' && new URLSearchParams(location.search).get('today');
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return new Date(`${override}T20:00:00Z`);
  return new Date();
}

if (typeof module !== 'undefined') {
  module.exports = { COHORT_CONFIG, quarterOf, cohortOptions, quarterLabel };
}
