# Mahmoud Ashraf — Portfolio

A responsive Arabic/English portfolio for Mahmoud Ashraf, a software developer focused on practical full-stack web applications.

## Highlights

- Responsive dark interface with Arabic RTL support
- Accessible navigation, reduced-motion support, and keyboard-friendly controls
- Optimized pointer-based 3D interactions and a single animated particle layer
- Verified case studies for the University Activities Portal and TeamDesk
- Direct email, GitHub, LinkedIn, and WhatsApp contact flows

## Project structure

```text
dist/
├── index.html                    Portfolio page
├── app.js                       Language, navigation, motion, and contact behavior
├── styles.css                   Core visual system and responsive layout
├── enhancements.css             Header and interaction refinements
├── nexus-project.css            TeamDesk project presentation
├── portfolio-motion.css         Motion and 3D interaction styles
├── assets/                      Images and favicon used by the site
└── projects/teamdesk/           Standalone employee dashboard demo
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

`.openai/hosting.json` contains the Sites hosting configuration. Only the static `dist/` directory is published.
