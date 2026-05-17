# Sunday 05/10 Sprint Retrospective Meeting Notes

## Date

Sunday, May 10, 2026

## Attendance

### Present

- Tybalt
- Steven
- Anlisa
- Lorenzo
- Eric
- Miguel
- Abhay

### Missing

- Omar
- George
- Jennifer

## Discussion Summary

The team held its sprint retrospective meeting to review the progress made during the initial research and planning sprint. The meeting focused on evaluating current research results, identifying gaps in planning, discussing potential backend implementation approaches, and preparing for the next sprint structure.

## Research Review & Remaining Gaps

### Website Theme & Aesthetic Direction

- The team agreed that the general direction and wireframes for the website are now mostly established.
- However, the group felt additional work is needed to better define the website’s overall visual identity and theme.
- More discussion will be dedicated next sprint toward:
  - aesthetic consistency
  - branding direction
  - overall UI style
  - frontend visual polish

### Frontend Planning

- The team discussed potentially transitioning the wireframes into Figma designs during the next sprint.
- This will help the frontend team better organize implementation and establish clearer visual specifications before development progresses further.

## Meme Database Research

### Research Findings

- Steven presented research results regarding potential meme databases and meme template sources.
- Multiple databases and sources were identified.
- Some datasets included meme templates without embedded text, which the team considered useful for more flexible editing workflows.

### Backend Pipeline Discussion

- A significant portion of the meeting focused on discussing how the backend generation pipeline may function based on the database research findings.
- Steven proposed a possible approach where:
  - the AI system generates the merged image/background containing the meme and uploaded user image
  - meme text could potentially be treated as a separate editable asset
  - JavaScript/frontend tooling could then manipulate or overlay text independently from the generated image

- The team agreed this separation between image assets and text assets may provide:
  - better editing flexibility
  - faster regeneration workflows
  - easier frontend customization

### Additional Research Integration

- These discussions were also connected to Anlisa’s research into similar applications and platforms.
- Her research focused on:
  - how comparable products structure their workflows
  - what APIs and tools they use
  - how image editing and generation pipelines are handled in existing applications

- The team plans to continue evaluating these approaches as research materials are uploaded and documented.

## Sprint Retrospective

### What Went Well

- The team successfully completed a significant amount of initial planning and exploratory research.
- Wireframes and overall product direction are becoming more clearly defined.
- Research efforts helped generate productive discussions around both frontend and backend architecture.

### Areas For Improvement

- The team agreed that the visual identity and branding direction of the application still need more refinement.
- More structured organization of research findings and technical documentation is needed moving forward.
- The group wants to improve task ownership and GitHub organization before implementation accelerates.

### Process Improvements For Next Sprint

- Introduce more structured GitHub issue assignment and tracking.
- Establish clearer development role responsibilities.
- Continue improving documentation consistency and meeting notes.
- Ensure all members regularly use isolated branches and meaningful commit messages.
- Require merge reviews and approvals before integrating major changes.

## Monday Sprint Planning Preparation

- The team spent a considerable amount of time discussing how Monday’s sprint planning meeting should be structured.
- The group agreed that the next sprint will include:
  - more clearly defined development roles
  - structured GitHub issue assignment
  - improved task ownership and delegation

## General Notes

- The retrospective primarily focused on improving planning, organization, and architectural direction before heavy implementation begins.
- Additional technical discussions and sprint organization decisions will continue during Monday’s sprint planning meeting.
