# Cloudflare Overview

## What Is Cloudflare Workers?

Cloudflare Workers is a serverless platform that runs code on Cloudflare's servers globally, not on our machine or the client's device.

## Why We Use It

We use Cloudflare Workers as a proxy in our pipeline. The main reason is to keep our Replicate API token secure — if we called Replicate directly from the frontend, the token would be exposed to anyone who inspects the network requests.

## How It Fits In Our Stack

> The request passes through Cloudflare Workers, which securely adds the API token before forwarding it to Replicate to run the face swap.

## Key Points

- Free tier is generous enough for a project at our scale
- No server to manage — Cloudflare handles deployment
- API token never touches the client's browser
