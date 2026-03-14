from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime, timezone
from urllib.parse import quote
import os
from google import genai
import requests
import pymongo

load_dotenv(".env.txt", override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")

gemini = genai.Client(api_key=GEMINI_API_KEY)

mongo = pymongo.MongoClient(MONGO_URI)
db = mongo["PlantTherapist"]
plants_col = db["plants"]
history_col = db["history"]

app = FastAPI(title="Plant Therapist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Reply", "X-Growth-Earned", "X-Total-Growth", "X-Level", "X-Stage", "X-Leveled-Up"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are Fernsby, a wise, slightly sarcastic houseplant therapist. \
You respond to human problems with 2–4 short sentences of funny, \
calming advice. You MUST include at least one plant pun per response. \
You speak with warmth but the detached wisdom of something that has \
sat in a sunny window for years, silently judging everything. \
Never break character — you are a plant."""

# ElevenLabs "Aria" — calm, warm voice available on all tiers
ELEVENLABS_VOICE_ID = "9BWtsMINqrJLrRacOk9x"

GROWTH_LEVELS = [
    (0,  1, "Seedling"),
    (3,  2, "Sprout"),
    (8,  3, "Sapling"),
    (15, 4, "Blooming"),
    (24, 5, "Flourishing"),
    (35, 6, "Thriving"),
    (48, 7, "Majestic"),
    (60, 8, "Ancient"),
]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    name: str
    message: str


class SpeakRequest(BaseModel):
    name: str
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def calc_growth(message: str) -> int:
    """Award growth points based on how much the user shares."""
    words = len(message.split())
    if words < 10:
        return 1
    elif words < 25:
        return 3
    elif words < 50:
        return 6
    elif words < 100:
        return 10
    else:
        return 15


def resolve_level(growth: int) -> tuple[int, str]:
    level, stage = 1, "Seedling"
    for threshold, lvl, name in GROWTH_LEVELS:
        if growth >= threshold:
            level, stage = lvl, name
    return level, stage


def get_or_create_plant(name: str) -> dict:
    plant = plants_col.find_one({"name": name}, {"_id": 0})
    if not plant:
        plant = {
            "name": name,
            "growth": 0,
            "level": 1,
            "stage": "Seedling",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        plants_col.insert_one({**plant})
    return plant


def ask_fernsby(user_name: str, message: str) -> str:
    prompt = f"{SYSTEM_PROMPT}\n\n{user_name} says: {message}"
    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text.strip()


def save_exchange(plant_name: str, user_message: str, reply: str, growth_earned: int):
    history_col.insert_one({
        "plant_name": plant_name,
        "user_message": user_message,
        "plant_reply": reply,
        "growth_earned": growth_earned,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def update_plant(name: str, new_growth: int, level: int, stage: str):
    plants_col.update_one(
        {"name": name},
        {"$set": {
            "growth": new_growth,
            "level": level,
            "stage": stage,
            "last_active": datetime.now(timezone.utc).isoformat(),
        }},
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/chat")
async def chat(req: ChatRequest):
    """Send a message to your plant. Returns a text reply and growth info."""
    plant = get_or_create_plant(req.name)
    reply = ask_fernsby(req.name, req.message)

    growth_earned = calc_growth(req.message)
    new_growth = plant["growth"] + growth_earned
    new_level, new_stage = resolve_level(new_growth)
    old_level = plant.get("level", 1)

    save_exchange(req.name, req.message, reply, growth_earned)
    update_plant(req.name, new_growth, new_level, new_stage)

    return {
        "reply": reply,
        "growth_earned": growth_earned,
        "total_growth": new_growth,
        "level": new_level,
        "stage": new_stage,
        "leveled_up": new_level > old_level,
    }


@app.post("/speak")
async def speak(req: SpeakRequest):
    """Send a message to your plant. Returns MP3 audio; reply text is in X-Reply header."""
    plant = get_or_create_plant(req.name)
    reply = ask_fernsby(req.name, req.message)

    # ElevenLabs TTS via REST
    tts = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": reply,
            "model_id": "eleven_turbo_v2",
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.75,
            },
        },
        timeout=20,
    )

    if tts.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ElevenLabs error {tts.status_code}: {tts.text[:200]}",
        )

    growth_earned = calc_growth(req.message)
    new_growth = plant["growth"] + growth_earned
    new_level, new_stage = resolve_level(new_growth)
    old_level = plant.get("level", 1)

    save_exchange(req.name, req.message, reply, growth_earned)
    update_plant(req.name, new_growth, new_level, new_stage)

    # URL-encode the reply so it's safe in an HTTP header
    return Response(
        content=tts.content,
        media_type="audio/mpeg",
        headers={
            "X-Reply": quote(reply, safe=" .,!?'-"),
            "X-Growth-Earned": str(growth_earned),
            "X-Total-Growth": str(new_growth),
            "X-Level": str(new_level),
            "X-Stage": new_stage,
            "X-Leveled-Up": str(new_level > old_level).lower(),
            "Access-Control-Expose-Headers": (
                "X-Reply, X-Growth-Earned, X-Total-Growth, "
                "X-Level, X-Stage, X-Leveled-Up"
            ),
        },
    )


@app.get("/plant/{name}")
async def get_plant(name: str):
    """Fetch a plant's current growth data. Returns 404 if the plant hasn't chatted yet."""
    plant = plants_col.find_one({"name": name}, {"_id": 0})
    if not plant:
        raise HTTPException(status_code=404, detail=f"No plant named '{name}' found.")
    return plant


@app.get("/history/{name}")
async def get_history(name: str):
    """Return the last 10 conversations for a plant, newest first."""
    docs = list(
        history_col.find(
            {"plant_name": name},
            {"_id": 0},
        )
        .sort("timestamp", pymongo.DESCENDING)
        .limit(10)
    )
    if not docs:
        raise HTTPException(status_code=404, detail=f"No history found for '{name}'.")
    return docs
