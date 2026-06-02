# Backend Setup Guide

Complete setup instructions for the face-swap API backend.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Valid Replicate API token (https://replicate.com)
- Git

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

Installs: express, multer, dotenv, axios

### 2. Create .env File

Create `.env` in project root:

```bash
cat > .env << EOF
REPLICATE_API_TOKEN=your_replicate_token_here
PORT=3001
EOF
```

Replace `your_replicate_token_here` with your actual Replicate API token from https://replicate.com/account/api-tokens

### 3. Start Server

```bash
node src/backend/server.js
```

Expected output:

```
Face swap API server listening on port 3001
Health check: GET http://localhost:3001/health
Face swap endpoint: POST http://localhost:3001/api/swap
Status endpoint: GET http://localhost:3001/api/status
```

### 4. Test Server

In another terminal:

```bash
# Health check
curl http://localhost:3001/health

# Status
curl http://localhost:3001/api/status
```

Both should return 200 with JSON responses.

---

## Complete Setup (With Tests)

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Test Images

Create fixture images for testing:

```bash
mkdir -p tests/fixtures/images

# Download sample images (or add your own)
curl -o tests/fixtures/images/source.jpg \
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"

curl -o tests/fixtures/images/target.jpg \
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
```

Or manually place JPEGs named:

- `tests/fixtures/images/source.jpg`
- `tests/fixtures/images/target.jpg`

### 3. Set Up Environment

```bash
cp .env.example .env
# Edit .env and add your REPLICATE_API_TOKEN
```

Or manually:

```bash
echo "REPLICATE_API_TOKEN=your_token" > .env
echo "PORT=3001" >> .env
```

### 4. Run Unit Tests

```bash
npm test
```

Tests: ReplicateClient methods (createPrediction, pollPrediction, error handling)

Expected: 40 tests pass (including 8 ReplicateClient tests)

### 5. Start Server

```bash
node src/backend/server.js
```

### 6. Run Integration Tests

In another terminal:

```bash
node tests/test-api.integration.js
```

Tests:

1. ✅ Health check endpoint
2. ✅ Status endpoint
3. ✅ Full face-swap workflow

Expected output:

```
========================================
Face Swap API Integration Tests
========================================

1. Testing health check endpoint...
   ✅ Status: 200
   { "status": "ok", "message": "Face swap API server is running" }

2. Testing status endpoint...
   ✅ Status: 200
   { "server": "running", "replicateClient": "initialized", ... }

3. Testing face swap with fixture images...
   ✅ Status: 200
   ✅ Face swap succeeded!
   Output URL: http://localhost:3001/images/swapped_<timestamp>.png
```

---

## Manual API Testing

### Health Check

```bash
curl http://localhost:3001/health
```

Response (200):

```json
{
  "status": "ok",
  "message": "Face swap API server is running"
}
```

### Status Check

```bash
curl http://localhost:3001/api/status
```

Response (200):

```json
{
  "server": "running",
  "replicateClient": "initialized",
  "service": "Replicate",
  "outputDir": "/path/to/src/backend/frontend/assets/generated"
}
```

### Face Swap

```bash
curl -X POST http://localhost:3001/api/swap \
  -F "sourceImage=@tests/fixtures/images/source.jpg" \
  -F "targetImage=@tests/fixtures/images/target.jpg"
```

Response (200):

```json
{
  "success": true,
  "message": "Face swap completed successfully",
  "result": {
    "success": true,
    "outputPath": "http://localhost:3001/images/swapped_1717240800000.png",
    "predictionId": "pred-abc123def456",
    "attempt": 1,
    "timestamp": "2026-06-01T12:00:00.000Z"
  }
}
```

Open the `outputPath` URL in browser to view the swapped image.

### Error Cases

**Missing files:**

```bash
curl -X POST http://localhost:3001/api/swap \
  -F "sourceImage=@source.jpg"
```

Response (400):

```json
{
  "error": "Missing required files",
  "message": "Both sourceImage and targetImage are required"
}
```

**Invalid file type:**

```bash
curl -X POST http://localhost:3001/api/swap \
  -F "sourceImage=@file.txt" \
  -F "targetImage=@file.txt"
```

Response (400):

```json
{
  "error": "File upload error",
  "message": "Invalid file type. Only JPEG, PNG, and WebP are allowed."
}
```

**Invalid Replicate token:**

```
# Set bad token in .env
REPLICATE_API_TOKEN=invalid_token
```

Response (500):

```json
{
  "success": false,
  "error": "Invalid API token - check .env",
  "message": "Failed to process face swap"
}
```

---

## Project Structure

```
src/backend/
├── server.js                    # Express API server
├── replicate-client.js          # Replicate API wrapper
├── uploads/                     # Temp uploaded files (auto-created)
└── frontend/
    └── assets/
        └── generated/           # Output swapped images
```

## Environment Variables

| Variable              | Required | Default | Description                        |
| --------------------- | -------- | ------- | ---------------------------------- |
| `REPLICATE_API_TOKEN` | ✅ Yes   | -       | Replicate API authentication token |
| `PORT`                | ❌ No    | 3001    | Server port                        |

## Troubleshooting

### "REPLICATE_API_TOKEN is required"

**Problem**: Server won't start, missing .env variable

**Solution**:

```bash
# Check .env exists
cat .env

# Should show:
# REPLICATE_API_TOKEN=your_token_here

# If missing, create it:
echo "REPLICATE_API_TOKEN=your_token" > .env
```

### "Cannot find module 'express'"

**Problem**: Dependencies not installed

**Solution**:

```bash
npm install
```

### "Face swap failed: Invalid API token"

**Problem**: Bad or expired Replicate token

**Solution**:

1. Get new token: https://replicate.com/account/api-tokens
2. Update .env: `REPLICATE_API_TOKEN=new_token_here`
3. Restart server

### "Port 3001 already in use"

**Problem**: Another process using port 3001

**Solution**:

```bash
# Use different port
PORT=3002 node src/backend/server.js

# Or kill process on 3001
lsof -i :3001
kill -9 <PID>
```

### Test images not found

**Problem**: Integration tests fail with "Source file not found"

**Solution**:

```bash
# Verify files exist
ls -la tests/fixtures/images/

# Should show:
# source.jpg
# target.jpg

# If missing, download:
mkdir -p tests/fixtures/images
curl -o tests/fixtures/images/source.jpg "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
curl -o tests/fixtures/images/target.jpg "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
```

---

## Next Steps

Once backend is running:

1. **Frontend integration**: Connect frontend to `POST /api/swap` endpoint
2. **Deployment**: Deploy to production (Heroku, Railway, Render, Cloudflare Workers)
3. **Monitoring**: Add logging and error tracking
4. **Rate limiting**: Add rate limiter for production

See [ADR 0005](docs/decisions/0005-express-backend-framework.md) for architecture details.
