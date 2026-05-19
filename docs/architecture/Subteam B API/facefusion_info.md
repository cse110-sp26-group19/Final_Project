# FaceFusion Overview

FaceFusion is a free, open-source face manipulation platform for swapping and enhancing faces in photos, videos, and GIFs. It has 27,000+ GitHub stars.

## What It Can Do

- Swap faces in photos, videos, and GIFs
- Swap up to 6 faces at once in a single image
- Sync expressions and lip movements in video
- Output up to 4K resolution
- Auto-enhance faces after swapping (fixes quality, upscales the result)
- Batch process multiple images/videos
- Runs fully offline. no data sent anywhere

## Limitations

- Source photo should be front-facing with flat lighting. Harsh shadows degrade output
- Hair/bangs can cause layering artifacts
- Requires NVIDIA GPU for self-hosted setup

## Proposed Feature Options

- **Option A — Swap facial features:** Replace just the face region. Hair and head shape stay from the meme.
- **Option B — Swap full head + adjust expression:** Replace the entire head, then apply expression restoration to match the meme's original pose.

- ## Multi-Face Targeting

Detection order isn't guaranteed left-to-right. Sort by X coordinate to target a specific face
