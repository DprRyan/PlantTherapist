# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the backend for **Plant Therapist** — an AI-powered plant care application. The backend integrates:
- **Google Gemini API** — AI/LLM features (plant diagnosis, care advice)
- **ElevenLabs API** — Text-to-speech audio responses
- **MongoDB Atlas** — Data persistence (database: `PlantTherapist`)

## Environment Variables

Required variables (see `.env`):
- `GEMINI_API_KEY` — Google Gemini API key
- `ELEVENLABS_API_KEY` — ElevenLabs API key
- `MONGO_URI` — MongoDB Atlas connection string

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run dev server (auto-reload)
uvicorn main:app --reload

# Run on a specific port
uvicorn main:app --reload --port 8000
```

API docs auto-generated at `http://localhost:8000/docs`.

## Architecture

Single-file backend (`main.py`). All routes, helpers, and startup config live there.

**Request flow:**
- `/chat` and `/speak` both call `ask_fernsby()` (Gemini) then write to MongoDB
- `/speak` additionally calls ElevenLabs REST (`/v1/text-to-speech/{voice_id}`) and returns raw MP3 bytes; the text reply travels back in `X-Reply` (URL-encoded)
- Growth points are awarded by word count; `resolve_level()` maps cumulative growth to a named stage (Seedling → Ancient)

**MongoDB collections** (database: `PlantTherapist`):
- `plants` — one doc per plant name, tracks `growth`, `level`, `stage`
- `history` — one doc per exchange, with `plant_name`, messages, `growth_earned`, `timestamp`

**Key constants to tweak:**
- `ELEVENLABS_VOICE_ID` — swap to any ElevenLabs voice ID
- `GROWTH_LEVELS` — list of `(min_growth, level, stage_name)` thresholds
- `SYSTEM_PROMPT` — Fernsby's personality

The frontend lives at `../plant-therapist` (React + Vite, default port 5173).
