# Sunday 05/11 Sprint Planning Meeting Notes

**Date:** Sunday, May 11, 2026
**Time:** 4:00 PM – 4:52 PM
**Location:** Geisel Library, 1st Floor West

---

## Attendance

| Present | Absent |
|---------|--------|
| Tybalt | George |
| Steven | Miguel |
| Anlisa | |
| Lorenzo | |
| Eric | |
| Abhay | |
| Omar | |
| Jennifer | |

---

## Sprint Goals Overview

This sprint focuses on setting up the foundational architecture for the meme generator application. Key objectives include:

1. Implement basic HTML/CSS/JS structure based on wireframes
2. Stand up the meme template database with manual labeling
3. Prototype three independent backend pipelines for meme + user image merging
4. Select the best-performing pipeline through head-to-head comparison

---

## Subteam Structure

Work this sprint is divided into independent subteams. Each subteam owns its workstream end-to-end: they will create their own GitHub issues, define their own milestones, and merge into their feature branch before integration.

| Subteam | Members | Responsibility |
|---------|---------|----------------|
| Database | Omar | Build and populate the meme template database |
| Frontend | Tybalt, Eric | Implement the UI based on approved wireframes |
| Backend Pipeline A | Steven + 1 absent member | Independent meme/user-image merge pipeline |
| Backend Pipeline B | Abhay + 1 absent member | Independent meme/user-image merge pipeline |
| Backend Pipeline C | Anlisa, Jennifer, Lorenzo | Independent meme/user-image merge pipeline |

The two absent members (George, Miguel) will be assigned to the two-person backend pipeline subteams once they confirm availability.

---

## Subteam Workstreams

### Database (Omar)

**Objective:** Stand up the meme template library and seed it with manually labeled templates.

- Create the meme template library in Firebase Firestore
- Manually label initial meme templates with structured context (visual layout, tone, text zones)
- Store metadata following the agreed schema:
  - `context`: Hand-written description of meme layout and tone
  - `text`: Populated dynamically at request time
  - `user_image`: Injected with user uploads at request time
- Configure Firebase Storage for image blob storage
- Document the schema so all three backend subteams can consume it consistently

**Deliverables:**
- Firestore collection with 5–10 labeled templates
- Schema documentation in the repo
- Subteam-owned GitHub issues and milestones

---

### Frontend (Tybalt, Eric)

**Objective:** Build the initial UI skeleton based on approved wireframes.

- Generate HTML structure for all core pages
- Apply base CSS styling (responsive layout, component styles)
- Implement JavaScript interactions for navigation and state handling
- Ensure components are modular for future iteration
- Wire upload + result views so any of the three backend pipelines can be plugged in

**Deliverables:**
- Wireframe-aligned HTML/CSS/JS scaffold
- Image upload + result display flow
- Subteam-owned GitHub issues and milestones

---

### Backend Pipelines (Three Parallel Subteams)

**Objective:** Each subteam independently designs a pipeline that takes two images — a meme template and a user image — and merges them into a final meme. We do not yet know the ideal way to do this, so the three subteams will explore different approaches in parallel. The strongest pipeline will be selected at the end of the sprint based on output quality, latency, and cost.

Each backend subteam owns:
- Their own approach to prompt design, API selection, and merge logic
- Their own GitHub issues and milestones
- Their own feature branch and test harness
- A short written justification of their approach and trade-offs

**Shared input contract for all three pipelines:**
- Meme template image + labeled `context` from the database
- User-uploaded image
- Returns: generated meme image + caption with placement metadata

**APIs / LLMs in scope (each subteam picks their own mix):**
- Gemini
- GPT-4o / Sora
- Claude
- Any custom programmatic image compositing the subteam wants to layer in

#### Pipeline A — Steven + 1 absent member
Independent approach; details TBD by subteam.

#### Pipeline B — Abhay + 1 absent member
Independent approach; details TBD by subteam.

#### Pipeline C — Anlisa, Jennifer, Lorenzo
Independent approach; details TBD by subteam.

**Selection criteria (end of sprint):**
- Output quality on a shared test set of meme + user-image pairs
- Latency per generation
- Cost per generation
- Robustness to edge cases (low-quality uploads, unusual aspect ratios, etc.)

---

## Cross-Cutting Concerns

### User Design Flow
- DBML diagrams for database schema (Omar coordinates with backend subteams)
- UML diagrams for system interactions across the three candidate pipelines
- Document expected user paths through the application

### Testing
- **Unit tests:** Per-subteam, covering each subteam's own modules
- **End-to-end tests:** Shared harness so all three pipelines can be evaluated against the same inputs
- **CI/CD:** Automated testing on PR for every subteam branch

### Open Optimization Questions
- Expected latency for LLM prompt responses across the three pipelines
- Handling concurrent generation requests
- Merging logic for text overlay on generated images
- Caching strategy for frequently used templates

---

## Git Workflow

- **Branching:** Each subteam works in their own feature branch
- **Issues:** Each subteam creates and owns their GitHub issues; assign a reviewer from outside the subteam
- **Milestones:** Each subteam defines their own milestones and tracks them in GitHub
- **Code Review:** All PRs require review before merging
- **⚠️ DO NOT use `git push --force`** — this can destroy others' work

---

## Action Items

- [ ] Each subteam creates their GitHub issues and milestones for this sprint
- [ ] Omar: set up Firebase project and configure Firestore + Storage
- [ ] Omar: create initial set of 5–10 manually labeled meme templates
- [ ] Tybalt + Eric: scaffold frontend HTML/CSS based on wireframes
- [ ] Backend subteams: document each pipeline's chosen APIs and approach
- [ ] Backend subteams: agree on a shared test set for end-of-sprint comparison
- [ ] Set up testing framework (Jest for unit, Cypress/Playwright for E2E)
- [ ] Create DBML/UML diagrams for system architecture
- [ ] Configure CI/CD pipeline
- [ ] Assign George and Miguel to backend pipeline subteams once availability is confirmed

---

## Meeting Adjourned

**4:52 PM**
