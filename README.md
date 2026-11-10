# Mahmoud Ashraf — Portfolio

A responsive Arabic/English portfolio for Mahmoud Ashraf, a software developer focused on practical full-stack web applications.

## Highlights

- Responsive dark interface with Arabic RTL support
- Accessible navigation, reduced-motion support, and keyboard-friendly controls
- Optimized pointer-based 3D interactions and a single animated particle layer
- Verified case studies for the University Activities Portal and TeamDesk
- Direct email, GitHub, and LinkedIn contact flows

## Project structure

```text
dist/
├── index.html                    Portfolio page
├── app.js                       Language, navigation, motion, and contact behavior
├── styles.css                   Core visual system and responsive layout
├── enhancements.css             Header and interaction refinements
├── nexus-project.css            TeamDesk project presentation
├── portfolio-motion.css         Motion and 3D interaction styles
├── skills.css                   Skills layout and card interactions
├── section-headings.css         Shared section-title hierarchy
├── assets/                      Images and favicon used by the site
└── projects/teamdesk/           Standalone employee dashboard demo
    └── calm-dashboard.css       Calm light dashboard identity
```

The deployable static site is contained entirely in `dist/`. No build step or package installation is required.

## Local preview

Run:

```powershell
node preview.mjs
```

Then open `http://127.0.0.1:4173`.

## Featured projects

### University Courses & Activities Portal

A bilingual Django application with authentication, protected student profiles, catalogue search and filtering, safe activity enrollment rules, Django Admin, and PostgreSQL in production.

### TeamDesk

A responsive employee-management dashboard using the Fetch API with DummyJSON. It demonstrates CRUD flows, search, filters, sorting, pagination, reports, CSV export, validation, and local persistence.

## Deployment

Publish the static `dist/` directory. For GitHub Pages, select **Settings → Pages → Source → GitHub Actions**; the included workflow deploys pushes to `main`.

Run `npm start` for local preview and `npm run check` to check JavaScript syntax. No dependency installation is required.

Run `npm test` for regression checks covering local page links and assets, preview HTTP responses, dashboard filtering and pagination, local CRUD persistence, unavailable storage, API errors, and CSV escaping. The tests run the dashboard with controlled API and DOM boundaries; they do not replace visual checks in a browser.

TeamDesk requires an internet connection to load DummyJSON. API writes are simulated; employee changes are saved in browser storage. If storage is blocked or full, changes fail with a message and the displayed data stays unchanged.
