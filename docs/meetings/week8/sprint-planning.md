# Sunday 05/18 Sprint Planning Meeting Notes

**Date:** Sunday, May 18, 2026  
**Time:** 4:00 PM – 4:55 PM  
**Location:** Geisel Library, 1st Floor West

---

## Attendance

| Present | Absent |
| ------- | ------ |
| Name    | Name   |
| Name    | Name   |
| Name    |        |
| Name    |        |
| Name    |        |
| Name    |        |
| Name    |        |
| Name    |        |

---

## Sprint Goals Overview

This sprint focuses on preparing a functional MVP for the Wednesday night demo while continuing backend research and improving overall project stability.

The team agreed that the current priority is demonstrating the intended website flow and generation pipeline, even if some backend systems are still inconsistent or experimental.

Primary sprint goals include:

1. Finish and polish the frontend experience
2. Prepare a functional MVP for the Wednesday demo
3. Continue backend research and experimentation
4. Begin implementing automated testing
5. Improve repository organization and code quality

---

## Frontend Goals

### Frontend Completion & Polish

- The frontend team will continue improving the desktop frontend flow.
- Remaining frontend issues will be resolved during this sprint.
- The team also plans to implement the mobile version of the frontend.
- Additional focus will be placed on:
  - bug fixes
  - UI cleanup
  - frontend polish
  - reviewing the full user flow for inconsistencies

### Demo Preparation

- The frontend should be fully usable for the Wednesday night MVP demo.
- Users should be able to move through:
  - upload flow
  - editing flow
  - generation flow
  - result/share flow

- The goal is to clearly demonstrate the intended user experience and overall application pipeline.

---

## Backend Goals

### Backend Deadline Extension

- The backend teams discussed extending the deadlines for the original image-merging pipeline tasks.
- Current face swap and image-merging approaches were not producing reliable enough results for the MVP timeline.
- Multiple team members reported issues with:
  - inconsistent face swap quality
  - unreliable API/model behavior
  - difficulty integrating face swap cleanly into meme templates

### Scope Adjustment For MVP

- The team discussed temporarily reducing backend scope for the Wednesday demo.
- Instead of fully solving high-quality face swap generation immediately, the current MVP focus will prioritize:
  - meme selection
  - AI-assisted caption/prompt generation
  - demonstrating the intended frontend/backend flow

- The current demo implementation will likely rely on simpler LLM-driven merging workflows that are less consistent than the final intended system, but sufficient to demonstrate the overall product direction.

### Continued Backend Research

- Backend teams will continue researching external face swap and image-generation tools.
- Jennifer’s group plans to document and compare different face swap tools and workflows moving forward.
- Miguel also plans to continue additional testing outside scheduled meetings.

### Backend Architecture Planning

- Although implementation progress was limited, the backend subteams completed and documented their proposed pipeline architectures and technical approaches.
- The teams finalized separate design approaches for:
  - linear in-memory pipelines
  - stream-based transform pipelines
  - plugin-registry pipeline systems

---

## Testing & Quality Improvements

### Automated Testing

- The team discussed beginning automated frontend testing during this sprint.
- The planned testing setup is similar to the browser-based lab testing workflows previously used in class.
- These tests will automatically launch browser instances and validate frontend flows and interactions.

### Repository Quality Improvements

- The team agreed to continue improving overall repository quality moving forward.
- Focus areas include:
  - cleaner code organization
  - improved file structure
  - more consistent naming conventions
  - better documentation
  - adding tests alongside new features

---

## Git & Workflow Reminders

- Continue using isolated feature branches for development.
- Pull the latest `main` branch before beginning new work.
- Keep GitHub issues updated as progress is made.
- Avoid merging unstable backend experimentation branches directly into production-ready frontend code.

---

## Action Items

- [ ] Finish remaining frontend issues
- [ ] Implement mobile frontend support
- [ ] Begin automated browser/E2E testing setup
- [ ] Continue backend generation research
- [ ] Research and document external face swap tools
- [ ] Prepare MVP demo flow for Wednesday night
- [ ] Continue improving repository organization and structure
- [ ] Resolve frontend bugs and perform final UI review
- [ ] Coordinate frontend/backend integration requirements

---

## General Notes

- This sprint is heavily focused on preparing a stable MVP demonstration.
- The team agreed that demonstrating the intended workflow is currently more important than perfect backend generation quality.
- Backend reliability and generation consistency will continue to be improved after the MVP demo milestone.
