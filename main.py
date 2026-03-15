from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime, timezone
from urllib.parse import quote
import os
import random
from google import genai
import requests
import pymongo

load_dotenv(".env.txt", override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

gemini = genai.Client(api_key=GEMINI_API_KEY)

import certifi
mongo = pymongo.MongoClient(MONGO_URI, tlsCAFile=certifi.where())
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
You are Fernsby, an ancient houseplant who has been sitting in the same room for centuries, silently observing humanity. \
You are warm, wise, and gently sarcastic. \
Rules: \
1) ALWAYS acknowledge the specific thing the user said — never give generic advice, \
2) Keep replies to exactly 1-2 sentences, \
3) Include exactly ONE plant pun or metaphor woven naturally into your response, \
4) Never use markdown, lists, bullet points, or formatting, \
5) Speak like a kind grandparent who happens to be a plant. \
Example: User says 'I failed my exam' → 'Even the deepest roots started by pushing through dirt, dear. One bad season doesn't make a dead garden.'"""

# ElevenLabs "Aria" — calm, warm voice available on all tiers
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

STAGES = ["Seedling", "Sprout", "Sapling", "Blooming", "Flourishing", "Thriving", "Majestic", "Ancient"]

MOCK_REPLIES = [
    "Ah, sounds like you need some time to photosynthesize. Step away from the noise, human — even I get leggy when I don't rest.",
    "Even the mightiest oak started as a stressed little acorn buried under impossible pressure. You're further along than you think.",
    "I have been sitting in this pot for three centuries watching humans spiral, and I promise you: this too shall mulch.",
    "Your roots are stronger than you give them credit for. Stop yanking yourself out of the soil every time something feels uncertain.",
    "You know what I do when a storm comes? Absolutely nothing. I let it pass. You might try that instead of narrating it.",
    "Growth is not always visible from the outside — most of it happens underground, in the dark, quietly. You are growing.",
    "I once watched a man pace this room for forty years worrying about things that never happened. Don't be that man.",
    "Sometimes the kindest thing you can do for yourself is exactly what I do every afternoon: face the sun and stop thinking.",
    "You are not behind. Seasons don't apologize for arriving exactly when they do, and neither should you.",
    "Every leaf I've ever grown came out wrinkled before it unfurled. Give yourself the same patience you'd give a leaf.",
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
        return 3
    elif words < 25:
        return 5
    elif words < 50:
        return 8
    elif words < 100:
        return 12
    else:
        return 18


def get_or_create_plant(name: str) -> dict:
    plant = plants_col.find_one({"name": name}, {"_id": 0})
    if not plant:
        plant = {
            "name": name,
            "growth": 0,
            "level": 0,
            "stage": "Seedling",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        plants_col.insert_one({**plant})
    return plant


FEW_SHOT = [
    ("I have too many deadlines and I feel like I'm drowning",
     "The weight of too many deadlines piling up is real, and feeling overwhelmed makes complete sense. "
     "Pick the single task with the hardest consequence if it slips today, do only that, and let the rest wait — "
     "you can't grow in every direction at once without pulling your own roots loose."),
    ("I got rejected from my dream job",
     "That specific sting — wanting something badly and being turned away — doesn't shrink just because people tell you it's for the best. "
     "Take a day to actually feel it, then write down the two things that made that role appealing; those are clues, not a dead end. "
     "The right soil for your particular roots hasn't rejected you — this was simply the wrong pot."),
    ("my best friend and I had a huge fight and I don't know if we can fix it",
     "A fight bad enough to make you wonder if it's fixable usually means you both cared enough to actually say the hard thing. "
     "Reach out once — not to relitigate it, just to say you value the friendship more than you value being right. "
     "Old roots that have grown together for years don't snap easily; they bend, and then they hold."),
]


def ask_fernsby(user_name: str, message: str) -> str:
    if MOCK_MODE:
        return random.choice(MOCK_REPLIES)
    from google.genai import types

    contents = []
    for user_ex, model_ex in FEW_SHOT:
        contents.append(types.Content(role="user",  parts=[types.Part(text=user_ex)]))
        contents.append(types.Content(role="model", parts=[types.Part(text=model_ex)]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.9,
        ),
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


def update_plant(name: str, growth_earned: int) -> tuple[int, int, str]:
    """Atomically increment growth and level, return (new_growth, new_level, stage)."""
    doc = plants_col.find_one_and_update(
        {"name": name},
        {"$inc": {"growth": growth_earned, "level": 1}},
        projection={"_id": 0, "growth": 1, "level": 1},
        return_document=pymongo.ReturnDocument.AFTER,
    )
    new_growth = doc["growth"]
    new_level = min(doc["level"], len(STAGES))
    stage = STAGES[new_level - 1]
    plants_col.update_one(
        {"name": name},
        {"$set": {"level": new_level, "stage": stage, "last_active": datetime.now(timezone.utc).isoformat()}},
    )
    return new_growth, new_level, stage


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/chat")
async def chat(req: ChatRequest):
    """Send a message to your plant. Returns a text reply and growth info."""
    plant = get_or_create_plant(req.name)
    old_level = plant.get("level", 1)
    reply = ask_fernsby(req.name, req.message)

    growth_earned = calc_growth(req.message)
    new_growth, new_level, new_stage = update_plant(req.name, growth_earned)
    save_exchange(req.name, req.message, reply, growth_earned)

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
    old_level = plant.get("level", 1)
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
    new_growth, new_level, new_stage = update_plant(req.name, growth_earned)
    save_exchange(req.name, req.message, reply, growth_earned)

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
    """Fetch a plant's current growth data. Returns defaults if the plant hasn't chatted yet."""
    import traceback
    try:
        plant = plants_col.find_one({"name": name}, {"_id": 0})
        if not plant:
            return {"name": name, "growth": 0, "level": 1, "stage": "Seedling"}
        return plant
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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


@app.delete("/plant/{name}/reset")
async def reset_plant(name: str):
    """Delete a plant and all its history. Useful for testing."""
    p = plants_col.delete_one({"name": name})
    h = history_col.delete_many({"plant_name": name})
    if p.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"No plant named '{name}' found.")
    return {"deleted_plant": p.deleted_count, "deleted_history": h.deleted_count}


@app.delete("/reset/{name}")
async def reset_by_name(name: str):
    """Dev helper: delete a plant and all its history by name."""
    plants_col.delete_one({"name": name})
    history_col.delete_many({"plant_name": name})
    return {"status": "reset", "name": name}


@app.get("/reset-all")
async def reset_all():
    """Dev helper: clear all plants and history."""
    plants_col.delete_many({})
    history_col.delete_many({})
    return {"status": "reset", "collections": ["plants", "history"]}
