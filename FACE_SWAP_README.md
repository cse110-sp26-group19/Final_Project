# Face Swap API Setup

Face swapping using Replicate API with Express.js backend.

## Prerequisites

- Node.js v16+
- Replicate account with API token: https://replicate.com/account/api-tokens
- Credits on Replicate account (add payment method at https://replicate.com/account/billing)

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add API Token to `.env`
```
REPLICATE_API_TOKEN=your-token-here
PORT=3001
```

### 3. Start Server
```bash
npm run server
```

Server runs on `http://localhost:3001`

## Testing

Place test images in `src/backend/pipelines/b/images/`:
- `source.jpg` - Face to swap from
- `target.png` - Face to swap to

Run test script:
```bash
node src/backend/pipelines/b/test-swap.js
```

Or use curl:
```powershell
curl.exe -X POST http://localhost:3001/api/swap `
  -F "sourceImage=@path/to/source.jpg" `
  -F "targetImage=@path/to/target.png"
```

## API Endpoints

**POST `/api/swap`** - Perform face swap
- `sourceImage` (File) - Face to swap from
- `targetImage` (File) - Face to swap to
- Supported: JPEG, PNG, WebP (max 50MB)

**GET `/health`** - Health check

**GET `/api/status`** - Server status

## Output

Generated images saved to: `src/frontend/assets/generated/`

## Troubleshooting

| Error | Fix |
|-------|-----|
| `REPLICATE_API_TOKEN is required` | Add token to `.env` file |
| `402 - Insufficient credits` | Add payment method and credits to Replicate account |
| `401 - Invalid API token` | Verify token is correct (no extra spaces) |
| `429 - Rate limited` | Wait 1-2 minutes and try again |

## Important

- Never commit `.env` to Git (keep token private)
- Each swap costs ~$0.01-$0.05
- Works best with clear frontal faces
- Processing takes 10-30 seconds
