# Sunday 05/24 Sprint Retrospective Meeting Notes

## Date

Sunday, May 24, 2026

## Attendance

### Present

- Tybalt
- Steven
- Anlisa
- Lorenzo
- Eric
- Miguel
- Abhay
- Omar
- George
- Jennifer

### Missing

- None

## Discussion Summary

The team reviewed the Week 8 sprint, which centered on the Wednesday MVP demo. The frontend was working, but the real backend was not, so the demo ran on a temporary backend the frontend team built. The team also decided how to move backend work forward.

## MVP Demo

- The demo ran on a **temporary backend built by the frontend team**: it prompted the "nano banana" image model directly to merge the face from the user's photo onto the selected meme template.
- This worked for memes with a single, clearly distinct, central face, but broke down on harder cases — multiple faces, or faces that weren't central enough.
- The demo landed well: it was chosen as one of the hand-selected good demo videos shown to the class.

## Backend Decision

- The team compared the backend pipelines and selected **Jennifer's backend** as the approach to move forward with.
- The real backend still wasn't working: the earlier research didn't prepare the backend team as well as it should have, and the task turned out more complicated than anticipated — especially multi-face and other complex cases.
- Tybalt reminded the team that getting the real backend implemented is critical before we move on to anything else.
- The team agreed to restructure backend work next sprint (see Week 9 sprint planning).

## Sprint Retrospective

### What Went Well

- The frontend MVP flow was solid and demoed well — selected as one of the class's highlighted demo videos.
- The team reached a clear decision on which backend approach to pursue.

### Areas For Improvement

- Backend research didn't prepare the team for how hard the real merging task would be, especially multi-face/complex situations.
- The repository has unused/experimental backend code that needs cleanup.

### Process Improvements For Next Sprint

- Finish and integrate the selected backend before moving on — this is the top priority.
- Document the backend decision and rationale in ADRs.
- Clean up the repo and move unused backend code into a deprecated/research area.

## General Notes

- This retro set up the Week 9 plan: integrate the selected backend and reorganize the team around it.
