// Single JSON document for the whole site. With Supabase on it is stored as the
// `content` jsonb of portfolio_data row 'main'; in preview mode it lives in localStorage.
export const STORAGE_KEY = 'portfolio.studio.v1';

export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 8);

export const DEFAULT_DATA = {
  version: 3,
  meta: { showSampleNotice: true, updatedAt: null },
  sections: [
    { id: 'hero', label: 'Hero', visible: true },
    { id: 'skills', label: 'Skills & interests', visible: true },
    { id: 'achievements', label: 'Achievements', visible: true },
    { id: 'caseStudy', label: 'Mind Predictor', visible: true },
    { id: 'projects', label: 'Projects', visible: true },
    { id: 'contact', label: 'Contact', visible: true },
  ],
  profile: {
    name: 'Your Name',
    initials: 'YN',
    roles: ['Data Analyst', 'DevOps Engineer', 'Full-Stack Builder'],
    tagline:
      'I turn messy operational data into decisions, then ship the pipelines and apps that keep those answers fresh.',
    location: 'Your City · Open to remote',
    availability: 'Available for new roles',
    avatar: '',
    resumeUrl: 'https://example.com/resume.pdf',
    ctaPrimary: 'Play the Mind Predictor',
    ctaSecondary: 'Get in touch',
  },
  skillsHeading: 'Active skills',
  skills: [
    {
      id: 'sk_data', title: 'Data', icon: 'Database',
      summary: 'Modelling, analysis and dashboards people actually open.',
      items: [
        { id: 'i1', name: 'SQL (Postgres, BigQuery)', level: 92 },
        { id: 'i2', name: 'Python · pandas', level: 88 },
        { id: 'i3', name: 'Power BI / Looker', level: 80 },
        { id: 'i4', name: 'Statistics & anomaly detection', level: 76 },
      ],
    },
    {
      id: 'sk_devops', title: 'DevOps', icon: 'Server',
      summary: 'Reproducible environments and boring, reliable deploys.',
      items: [
        { id: 'i5', name: 'Docker', level: 85 },
        { id: 'i6', name: 'GitHub Actions CI/CD', level: 82 },
        { id: 'i7', name: 'Terraform · AWS', level: 68 },
        { id: 'i8', name: 'Monitoring (Grafana)', level: 72 },
      ],
    },
    {
      id: 'sk_fs', title: 'Full-Stack', icon: 'Code2',
      summary: 'APIs and front-ends that put the data in front of users.',
      items: [
        { id: 'i9', name: 'React · TypeScript', level: 80 },
        { id: 'i10', name: 'Node.js · FastAPI', level: 78 },
        { id: 'i11', name: 'REST & auth design', level: 74 },
        { id: 'i12', name: 'Supabase', level: 70 },
      ],
    },
  ],
  interestsHeading: 'Fields of interest',
  interests: [
    { id: 'in1', label: 'Anomaly detection', blurb: 'Catching revenue leaks and bad deploys before a human notices.' },
    { id: 'in2', label: 'Data observability', blurb: 'Freshness, volume and schema checks as first-class tests.' },
    { id: 'in3', label: 'MLOps', blurb: 'Taking notebooks to scheduled, versioned, monitored jobs.' },
    { id: 'in4', label: 'Cloud cost', blurb: 'Right-sizing containers and queries so dashboards stay cheap.' },
    { id: 'in5', label: 'Developer experience', blurb: 'Fast local setups, one-command deploys, readable logs.' },
    { id: 'in6', label: 'Data storytelling', blurb: 'One clear chart and a sentence that says what to do next.' },
  ],
  achievementsHeading: 'Achievements',
  achievements: [
    { id: 'a1', date: '2025', title: 'Automated weekly sales reporting', org: 'Sample Co.', metric: '−12 h', metricLabel: 'manual work per week', description: 'Replaced spreadsheet exports with a scheduled SQL + Python job feeding a shared dashboard.' },
    { id: 'a2', date: '2024', title: 'Containerised the analytics stack', org: 'Sample Co.', metric: '4 min', metricLabel: 'from commit to deploy', description: 'Dockerised ETL jobs and moved releases to a GitHub Actions pipeline with tests on every push.' },
    { id: 'a3', date: '2023', title: 'Built an internal KPI API', org: 'Side project', metric: '120 ms', metricLabel: 'p95 response time', description: 'A small FastAPI service with caching that serves KPIs to three internal front-ends.' },
  ],
  caseStudy: {
    title: 'Mind Predictor: can a model read your next move?',
    summary: 'Pick an arrow as randomly as you can, with 2 or 4 arrows. Before every pick, a pattern model locks in its guess: Hard reads your last two or three moves, Brutal blends seven experts that re-weight themselves every round. Most people drift into habits within 20 rounds, and the accuracy meter shows it.',
    stack: ['Markov chains', 'n-gram counts', 'Online ensembles', 'React', 'Live metrics'],
    leftLabel: 'Left',
    rightLabel: 'Right',
    upLabel: 'Up',
    downLabel: 'Down',
    insight1: 'Humans are poor random generators: we avoid long streaks and over-alternate, which leaves a fingerprint in short move sequences.',
    insight2: 'The same n-gram counting powers churn signals and next-purchase models: count what usually follows a pattern, then predict it.',
  },
  companion: {
    enabled: true,
    style: 'stickman', // 'stickman' (top-hat gentleman) or 'ball' (rolling facial ball)
    face: '', // optional data URL for the companion's face; '' keeps the drawn face
    hero: 'Hello!',
    skills: 'Looks good!',
    achievements: 'Hats off!',
    caseStudy: 'Look here',
    projects: 'Nice builds',
    contact: 'Bye!',
  },
  projectsHeading: 'Projects',
  projects: [
    { id: 'p1', title: 'Churn early-warning model', description: 'Gradient-boosted model scoring accounts nightly, surfaced in the CRM.', tags: ['Python', 'scikit-learn', 'Airflow'], url: 'https://example.com', image: '' },
    { id: 'p2', title: 'Self-hosted metrics stack', description: 'Prometheus + Grafana on Docker Compose with alert routing to chat.', tags: ['Docker', 'Grafana', 'Linux'], url: 'https://example.com', image: '' },
    { id: 'p3', title: 'Inventory dashboard app', description: 'React front-end on a Supabase backend with row-level security.', tags: ['React', 'Supabase', 'Tailwind'], url: 'https://example.com', image: '' },
  ],
  contact: {
    heading: "Let's build something measurable",
    text: 'The quickest way to reach me is email. I usually reply within a day.',
    email: 'you@example.com',
  },
  socials: [
    { id: 's1', platform: 'GitHub', label: 'github.com/yourname', url: 'https://github.com/' },
    { id: 's2', platform: 'LinkedIn', label: 'linkedin.com/in/yourname', url: 'https://www.linkedin.com/' },
    { id: 's3', platform: 'Website', label: 'yourname.dev', url: 'https://example.com' },
  ],
  media: [],
};

export const COMPANION_STYLES = ['stickman', 'ball'];
export const SPEECH_KEYS = ['hero', 'skills', 'caseStudy', 'achievements', 'projects', 'contact'];

export const SCHEMA_NOTE = `Supabase storage (see supabase/setup.sql):
portfolio_data   one row, id = 'main'
  content        jsonb  ← this whole JSON object
  updated_at     timestamptz
portfolio-media  public Storage bucket
  images/ videos/ faces/  → public URLs saved in the JSON
Reads are public; writes need a signed-in admin.`

// Older saves (v1) carried the Sales Anomaly case study; swap in the game copy
// and fill any keys added since, keeping every other edit.
export function migrate(p) {
  const d = { ...DEFAULT_DATA, ...p };
  if (!p.version || p.version < 2) {
    d.caseStudy = DEFAULT_DATA.caseStudy;
    if (p.profile?.ctaPrimary === 'See the live case study') d.profile = { ...d.profile, ctaPrimary: DEFAULT_DATA.profile.ctaPrimary };
    if (p.sections) d.sections = p.sections.map((s) => (s.id === 'caseStudy' && s.label === 'Case study' ? { ...s, label: 'Mind Predictor' } : s));
  }
  d.caseStudy = { ...DEFAULT_DATA.caseStudy, ...d.caseStudy };
  // v2 → v3: companion gains a style; older saves keep their speech lines and face.
  const c = p.companion && typeof p.companion === 'object' ? p.companion : {};
  d.companion = { ...DEFAULT_DATA.companion, ...c };
  if (!COMPANION_STYLES.includes(d.companion.style)) d.companion.style = DEFAULT_DATA.companion.style;
  for (const k of SPEECH_KEYS) if (typeof d.companion[k] !== 'string') d.companion[k] = DEFAULT_DATA.companion[k];
  d.meta = { ...DEFAULT_DATA.meta, ...d.meta };
  d.version = DEFAULT_DATA.version;
  return d;
}

// Storage with graceful fallback to memory when localStorage is blocked.
export function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: DEFAULT_DATA, mode: 'local' };
    return { data: migrate(JSON.parse(raw)), mode: 'local' };
  } catch (e) {
    return { data: DEFAULT_DATA, mode: 'memory' };
  }
}

export function saveData(data) {
  try {
    // blob: URLs die with the tab, so they are not persisted.
    const clean = JSON.stringify(data, (k, v) => (typeof v === 'string' && v.startsWith('blob:') ? '' : v));
    window.localStorage.setItem(STORAGE_KEY, clean);
    return 'local';
  } catch (e) {
    return e && (e.name === 'QuotaExceededError' || e.code === 22) ? 'quota' : 'memory';
  }
}

export function clearData() {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* memory mode */ }
}
