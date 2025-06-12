from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import LeadRequest
from app.leadgen import process_leads
from pydantic import BaseModel

from typing import List, Dict

app = FastAPI(
    title="Smart Lead Generator",
    description="Scrapes websites, validates emails, and scores leads",
    version="1.0.0"
)

# CORS for frontend connection (adjust origin as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your deployed frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadRequest(BaseModel):
    domain: str
    location: str

@app.post("/scrape")
async def scrape_and_score(payload: LeadRequest):
    """
    Receives domain + location, returns list of scored leads with breakdown.
    """
    leads = process_leads(payload.domain, payload.location)
    return {"results": leads}
