## Quick Map

- [Tech Overview](#tech-overview)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Run (Dev)](#run-dev)
- [Build & Run (Node)](#build--run-node)
- [Docker](#docker)
- [Docker Compose](#docker-compose)

## Tech Overview

- **Framework**: Next.js 14 (App Router, `output: 'standalone'`)
- **Runtime/PM**: Bun 1.x (dev/build), Node 20 (runtime in Docker)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Audio**: `fluent-ffmpeg` for conversion, ElevenLabs for TTS
- **AI**: Azure OpenAI Chat Completions
- **Speech-to-Text**: Azure Cognitive Services Speech SDK
- **Lint/Format**: ESLint, Prettier

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
- `bun run typecheck` - Run TypeScript type checking
- `bun run clean` - Clean build artifacts

## Environment Variables

Create a `.env` file at the project root (`voice-game/.env`).

```bash
cp .env.example .env    # if .env.example exists
```

Required keys:

- **Azure Speech**
  - `AZURE_SPEECH_KEY`
  - `AZURE_SPEECH_REGION`
- **Azure OpenAI**
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_KEY`
  - `AZURE_OPENAI_DEPLOYMENT_NAME`
- **ElevenLabs**
  - `ELEVENLABS_API_KEY`
- **App**
  - `APPLICATION_PORT` (optional, defaults to `3000`)

## Local Setup

### Prerequisites

- Bun 1.x

```bash
curl -fsSL https://bun.sh/install | bash
```

- ffmpeg (required for audio conversion)

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y ffmpeg
# macOS (Homebrew)
brew install ffmpeg
```

- Node.js is not required for dev; the app uses Bun in development.

### Install dependencies

```bash
bun install
```

### Configure environment

- Create and fill `.env` (see [Environment Variables](#environment-variables)). This is required for dev, Node, Docker, and Compose.

## Run (Dev)

Start the dev server on `http://localhost:3000` (or `APPLICATION_PORT`).

```bash
bun run dev
```

## Build & Run (Node)

You can build with Bun and run the Next.js standalone server on Node 20 (outside Docker) if desired.

```bash
bun run build
bun run start
```

Ensure `.env` is present; Next.js will read env at runtime for API routes.

## Docker

This project includes a lightweight multi-stage Dockerfile that builds with Bun

### Build

```bash
docker build -t voice-game .
```

### Run

Always provide environment variables.

```bash
  docker run --rm -p 3000:3000 \
    -e AZURE_SPEECH_KEY=... \
    -e AZURE_SPEECH_REGION=... \
    -e AZURE_OPENAI_ENDPOINT=... \
    -e AZURE_OPENAI_KEY=... \
    -e AZURE_OPENAI_DEPLOYMENT_NAME=... \
    -e ELEVENLABS_API_KEY=... \
    voice-game
```

## Docker Compose

A simple Compose service is provided. Ensure `.env` exists in `voice-game/`.

```bash
docker compose up --build
```

- The service maps `${APPLICATION_PORT:-3000}` so you can override port via your `.env` (e.g., `APPLICATION_PORT=4000`).
- To run detached: `docker compose up -d --build`
- To stop: `docker compose down`
