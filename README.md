# 🚼 DevPulse – Internal Tech Issue & Feature Tracker

DevPulse is a streamlined, enterprise-grade collaboration backend designed for software engineering units to seamlessly document application bugs, map system requirements, track feature development, and monitor resolution loops.

## Live Deployment Links
- **REST Engine Live URL:** [https://assingment-ii.vercel.app/](https://assingment-ii.vercel.app/)
- **Source Repository:** [https://github.com/aayasIbrahim/Assignment-2](https://github.com/aayasIbrahim/Assignment-2)

## Core Capabilities
- **Role Isolation Matrix:** Differentiated privileges for `contributors` (creation and basic ownership updates) and `maintainers` (global operations, deletions, system data metrics monitoring).
- **No-JOIN Structural Architecture:** Relational aggregation engineered purely within memory loops to minimize database joining overhead and optimize horizontal operational scaling.
- **Strict Cryptographic Security:** Hashed passwords leveraging native `bcrypt` dynamics, paired with state-aware JSON Web Token checks across private routing paths.

## Tech Stack Definition
- **Engine Runtime:** Node.js (v24.x LTS)
- **Programming Language:** TypeScript
- **Web Frame Routing:** Express.js 
- **Database Engine:** PostgreSQL (Native `pg` pool driver configuration, explicit Raw SQL commands only)

## API Reference At A Glance

### Authentication Module
- `POST /api/auth/signup` - Register a user (Public)
- `POST /api/auth/login` - Authenticate & obtain JWT (Public)

### Issues Module
- `POST /api/issues` - Submit a new bug or feature request (Authenticated)
- `GET /api/issues` - Fetch all items with dynamic sort & filter options (Public)
- `GET /api/issues/:id` - Fetch comprehensive individual issue summaries (Public)
- `PATCH /api/issues/:id` - Modify an active issue description or state indicators (Owner/Maintainer)
- `DELETE /api/issues/:id` - Permanently remove an issue entry (Maintainer Only)
