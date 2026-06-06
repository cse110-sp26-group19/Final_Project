# Deprecated: Pipeline B Backend

**Status:** ⚠️ ARCHIVED & DISCONTINUED

## Why Discontinued

This directory contains the **Pipeline B backend implementation**—one of three backend pipeline approaches evaluated by the team. Pipeline B has been **discontinued in favor of the current Express.js architecture** in `src/backend/server.js`.

## Pipeline Selection Context

The team evaluated three distinct backend pipeline options:
- **Pipeline A** - ❌ Not selected
- **Pipeline B** - ❌ Discontinued (this folder)
- **Current** - ✅ Selected & implemented: Express.js with ReplicateClient

The current implementation was chosen as the best approach for the project needs.

### What Changed

| Old Approach | New Approach |
|---|---|
| `backend-b-integration.js` | Integrated into `src/backend/server.js` |
| `backend-b-server.js` | Replaced by `src/backend/server.js` |
| Separate integration logic | Single Express server with unified endpoints |
| Manual API orchestration | ReplicateClient wrapper handles Replicate API |

## Current Architecture

The new implementation at `src/backend/server.js`:
- ✅ Single Express.js HTTP server
- ✅ Multer for file uploads
- ✅ ReplicateClient for Replicate API integration
- ✅ CORS for browser/mobile requests
- ✅ Static file serving
- ✅ Comprehensive error handling
- ✅ Full JSDoc documentation

See [ADR 0005](../../decisions/0005-express-backend-framework.md) for the architecture decision rationale.

## Usage

**Do NOT use files in this directory.**

Instead, see:
- **Backend Setup:** [BACKEND_SETUP.md](../../../../BACKEND_SETUP.md)
- **Server Implementation:** `src/backend/server.js`
- **Replicate Client:** `src/backend/replicate-client.js`

## Archives Kept For

- Historical reference (shows iteration/exploration process)
- Understanding why certain design decisions were made
- Learning what didn't work vs. what did
