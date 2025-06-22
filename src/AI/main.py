import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import travel_plan_api

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schema for Planner
class PlanRequest(BaseModel):
    country: str
    interest: str
    days: int
    startDate: str            # YYYY-MM-DD
    regenerate: Optional[int] = None
    feedback: Optional[str] = None
    approvedCities: Optional[list[str]] = []  # include list of already approved

@app.post("/app/travel-plan")
async def travel_plan(req: PlanRequest):
    # Prepare user payload
    payload = {
        "country": req.country,
        "interest": req.interest,
        "days": req.days,
        "startDate": req.startDate,
        "Approved_Cities": req.approvedCities,
    }
    if req.regenerate is not None:
        payload["regenerate"] = req.regenerate
    if req.feedback:
        payload["feedback"] = req.feedback

    user_message = f"<CHAT>\n{json.dumps(payload)}\n</CHAT>"

    try:
        ai_response = travel_plan_api.travel_plan_api(user_message)
        return json.loads(ai_response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}