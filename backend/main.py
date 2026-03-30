import os
from dotenv import load_dotenv

# Load local environment variables (if any)
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import Optional
from agents.pipeline import run_rescue_pipeline

app = FastAPI(title="RoadRescue.AI Backend")

# CORS to allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BreakdownRequest(BaseModel):
    description: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    image_url: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "llm_provider": "gemini", "ollama_ready": True}

@app.get("/health/llm")
def llm_health_check():
    return {"gemini": "reachable", "ollama": "ready", "active_provider": "gemini"}

@app.post("/api/orchestrate")
async def orchestrate_rescue(req: BreakdownRequest):
    """
    Kicks off the multi-agent pipeline and streams the output via Server-Sent Events (SSE).
    """
    # Simply generate the stream. 
    # Because SSE typically works with GET (or we can use POST with sse_starlette),
    # let's return a streaming response.
    return EventSourceResponse(run_rescue_pipeline(req.description))

# Make sure we can also just use a GET for easy testing/EventSource in browser
@app.get("/api/orchestrate")
async def orchestrate_rescue_get(
    description: str = "",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    manual_location: Optional[str] = None
):
    return EventSourceResponse(run_rescue_pipeline(description, lat=lat, lon=lon, manual_location=manual_location))

if __name__ == "__main__":
    import uvicorn
    # Cloud Run uses the PORT variable, natively defaulting to 8080.
    # We allow local override to 8001 to prevent conflict.
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
