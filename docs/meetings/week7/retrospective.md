# Sunday 05/17 Sprint Retrospective Meeting Notes

## Date

Sunday, May 17, 2026

## Discussion Summary

The team held its sprint retrospective meeting to review the progress made during the week. The meeting mainly focused on frontend implementation progress, frontend utility modules, backend research blockers, and sprint planning adjustments moving into the next week.

## Frontend Progress

### Frontend Implementation

- The frontend team successfully completed frontend issues #1–#10 during this sprint.
- The desktop frontend flow is now functional without backend integration.
- Users can move through the application pipeline from:
  - upload screens
  - editing pages
  - result pages
  - share/download pages

- Buttons and navigation are functioning throughout the current frontend flow.
- The share page currently supports downloading and sharing functionality.

### Frontend Utility Modules

- Omar completed several utility modules required for the Edit and Result pages.
- These were merged through PR #30.
- The completed modules include:
  - `templates.js` for fetching Imgflip templates with a 24-hour cache
  - `image-loader.js` for handling user uploads and remote templates
  - `meme-canvas.js` for rendering memes with Impact-style text
  - `export.js` for downloading the final meme image as a PNG

- Additional GitHub issues (#26–#29) were also created to organize tracking for these utility systems.
- The repository was updated to use ESM along with a proper npm test script.

## Imgflip CORS Issue

- Omar identified a CORS issue involving Imgflip’s CDN.
- This issue may prevent proper canvas exports when using externally hosted meme templates.
- The team discussed possible solutions, including:
  - proxying images
  - limiting exports to user-uploaded images only

- The team agreed more investigation is needed before finalizing the export pipeline implementation.

## Backend Progress

### Backend Research & Testing

- The backend teams spent most of the sprint researching and testing possible image generation pipelines.
- One backend group experimented with a face-swap API approach.
- Other members tested different LLM and image model workflows.

### Backend Blockers

- While backend issues were created and organized, none of the backend teams were able to fully resolve their assigned backend tasks during this sprint.
- The primary issue was poor model and API performance.
- Current generation quality and reliability were not consistent enough for integration into the application.

### Backend Architecture Planning

- Although implementation progress was limited, the backend subteams completed and documented their proposed pipeline architectures and technical approaches.
- The teams finalized separate design approaches for:
  - linear in-memory pipelines
  - stream-based transform pipelines
  - plugin-registry pipeline systems

### Next Steps

- The team agreed to extend backend experimentation and research into the next sprint.
- Additional work will focus on:
  - testing alternative APIs
  - improving generation quality
  - improving response speed
  - finding more reliable image generation workflows

## Sprint Retrospective

### What Went Well

- The frontend team completed a significant amount of implementation progress this sprint.
- Frontend issues #1–#10 were successfully completed.
- The desktop frontend flow is now functional and demonstrates the full intended user pipeline.
- Utility modules and frontend infrastructure became more organized and reusable.

### Areas For Improvement

- Backend implementation proved more difficult than initially expected.
- The tested APIs and models did not produce reliable enough results for production use.
- The team still needs to decide how to handle the Imgflip export/CORS issue.

### Process Improvements For Next Sprint

- Continue backend research and experimentation.
- Finalize a solution for the Imgflip export problem.
- Continue organizing work through GitHub issues.
- Ensure team members pull the latest `main` branch before starting additional frontend work.
- Start including tests as new features and utilities are implemented.
- Continue improving the overall quality of the repository, including both code quality and file/project structure.

## General Notes

- This sprint marked the project’s transition from planning into active implementation.
- The frontend made major progress and now has a usable desktop flow.
- Backend work will continue into the next sprint due to unresolved API and model performance issues.
