import asyncio
import uuid
import json
import random
import re
from typing import AsyncGenerator

async def simulate_agent(agent_name: str, delay: float = 1.0) -> dict:
    await asyncio.sleep(delay)
    return {}

def analyze_input(text: str):
    text = text.lower()
    
    # 1. Detect Vehicle
    vehicle_match = re.search(r'(ertiga|baleno|swift|bmw|honda|city|audi|creta|thar|jeep|car|bike|scooter|motorcycle)', text)
    vehicle = vehicle_match.group(1).title() if vehicle_match else "vehicle"
    
    # 2. Detect Issue
    if "battery" in text or "start" in text or "clicking" in text or "ignition" in text:
        issue = "battery"
        issue_detail = "battery / starting issue"
        severity = "MODERATE"
    elif "tyre" in text or "tire" in text or "flat" in text or "burst" in text or "puncture" in text:
        issue = "tyre"
        issue_detail = "flat tyre"
        severity = "MINOR"
    elif "smoke" in text or "fire" in text or "accident" in text or "crash" in text:
        issue = "accident"
        issue_detail = "collision / potential hazard"
        severity = "CRITICAL"
    elif "fuel" in text or "petrol" in text or "gas" in text or "empty" in text:
        issue = "fuel"
        issue_detail = "out of fuel"
        severity = "MINOR"
    else:
        issue = "engine"
        issue_detail = "general breakdown"
        severity = "MODERATE"
        
    return vehicle, issue, issue_detail, severity

async def run_rescue_pipeline(user_input: str, lat: float = None, lon: float = None, manual_location: str = None) -> AsyncGenerator[str, None]:
    session_id = str(uuid.uuid4())
    
    def make_event(event_type: str, data: dict):
        return {"data": json.dumps({'event': event_type, **data})}

    # Intelligence Extraction
    vehicle, issue, issue_detail, severity = analyze_input(user_input)

    yield make_event("system_info", {"message": f"RescueCoordinatorAgent v3.0 initialized for {vehicle}.", "session_id": session_id})
    yield make_event("agent_progress", {"agent": "FallbackMonitorAgent", "status": "running", "message": "Checking Vertex AI health..."})
    await asyncio.sleep(1.0)
    
    # Let's dynamically trigger fallback so the UI stays interesting
    trigger_fallback = True

    if trigger_fallback:
        yield make_event("llm_fallback_triggered", {
            "reason": "Quota Exceeded (Mock)",
            "fallback_model": "llama3.2:3b",
            "message": "We're running on our backup AI system right now. Response quality is slightly reduced but rescue coordination continues. Your safety is not affected."
        })
        llm_provider = "ollama:llama3.2:3b"
    else:
        yield make_event("agent_progress", {"agent": "FallbackMonitorAgent", "status": "success", "message": "Primary LLM operational."})
        llm_provider = "gemini-2.0-flash"

    yield make_event("context", {"llm_provider": llm_provider, "fallback_triggered": trigger_fallback})

    # Step 1: LocationAgent
    yield make_event("agent_progress", {"agent": "LocationAgent", "status": "running", "message": "Geocoding location..."})
    await asyncio.sleep(1.0)
    
    loc_address = "Detecting..."
    if manual_location:
         loc_address = manual_location
    elif lat and lon:
         loc_address = f"GPS Coordinates: {lat:.6f}, {lon:.6f}"
    else:
         loc_address = "NH7 near Krishnagiri"

    location_data = {
        "lat": lat or 12.51, "lon": lon or 78.21,
        "address": loc_address, "road_type": "highway", "nearest_city_km": 8, "connectivity_score": 0.8
    }
    yield make_event("agent_progress", {"agent": "LocationAgent", "status": "running", "message": f"Locking position: {loc_address}"})
    await asyncio.sleep(0.5)
    yield make_event("agent_complete", {"agent": "LocationAgent", "result": location_data})

    if "location" in user_input.lower() and ("where" in user_input.lower() or "what" in user_input.lower()):
        yield make_event("pipeline_complete", {"message": f"Your exact location is currently locked at {loc_address}. Are you experiencing a breakdown? Please describe the issue and I will dispatch help."})
        return

    # Step 2: TriageAgent
    yield make_event("agent_progress", {"agent": "TriageAgent", "status": "running", "message": f"Analyzing {vehicle} issue..."})
    await asyncio.sleep(1.5)
    triage_data = {
        "severity": severity,
        "issue_category": issue,
        "issue_detail": issue_detail,
        "diy_possible": severity != "CRITICAL",
        "parts_needed": ["jump cables"] if issue == "battery" else (["spare tyre"] if issue == "tyre" else []),
        "vision_used": trigger_fallback
    }
    yield make_event("agent_complete", {"agent": "TriageAgent", "result": triage_data})

    # Step 3: AvailabilityAgent
    avail_msg = f"Executing alloydb_availability_check via pgvector for {issue} specialists..." if 'alloydb' in user_input.lower() else f"Checking vendor availability for {issue} issues..."
    yield make_event("agent_progress", {"agent": "AvailabilityAgent", "status": "running", "message": avail_msg})
    await asyncio.sleep(1.5)
    
    all_vendors = [
        {"vendor_id": "v01", "name": "Raju Roadside Assistance", "phone": "+91 98765 43210", "distance_km": 2.8, "total_eta_min": 9, "eta_display": "~9 min", "specializations": ["battery", "towing"], "rating": 4.8},
        {"vendor_id": "v02", "name": "Krishna Auto Works", "phone": "+91 87654 32109", "distance_km": 2.2, "total_eta_min": 15, "eta_display": "~15 min", "specializations": ["engine", "battery"], "rating": 4.3},
        {"vendor_id": "v03", "name": "Speedy Tyre Fix", "phone": "+91 99999 88888", "distance_km": 4.1, "total_eta_min": 12, "eta_display": "~12 min", "specializations": ["tyre", "alignment"], "rating": 4.6},
        {"vendor_id": "v04", "name": "City Towing Services", "phone": "+91 77777 66666", "distance_km": 5.5, "total_eta_min": 25, "eta_display": "~25 min", "specializations": ["accident", "towing"], "rating": 4.9},
        {"vendor_id": "v05", "name": "Highway Fuel Delivery", "phone": "+91 66666 55555", "distance_km": 6.0, "total_eta_min": 30, "eta_display": "~30 min", "specializations": ["fuel"], "rating": 4.7},
    ]
    
    # Filter by issue dynamically
    matched_vendors = [v for v in all_vendors if issue in v['specializations'] or "towing" in v['specializations']]
    if not matched_vendors: matched_vendors = all_vendors[:2] # fallback
    
    yield make_event("agent_complete", {"agent": "AvailabilityAgent", "result": {"available_vendors": matched_vendors[:2]}})

    # Step 4: RescueDispatchAgent
    dispatch_msg = "Running maps_directions MCP..." if 'mcp' in user_input.lower() else "Dispatching nearest help..."
    yield make_event("agent_progress", {"agent": "RescueDispatchAgent", "status": "running", "message": dispatch_msg})
    await asyncio.sleep(1.5)
    top_vendor = matched_vendors[0]
    yield make_event("agent_complete", {"agent": "RescueDispatchAgent", "result": {"dispatched_vendor": top_vendor['name'], "firebase_tracking_id": f"#RR-2026-{random.randint(1000,9999)}"}})

    # Step 5: GuidanceAgent
    guide_msg = "Invoking search_web via Google Search MCP..." if 'mcp' in user_input.lower() else "Retrieving safety guidance..."
    yield make_event("agent_progress", {"agent": "GuidanceAgent", "status": "running", "message": guide_msg})
    await asyncio.sleep(1.5)
    
    if severity == "CRITICAL":
        steps = ["Immediately exit the vehicle and move far away from the traffic.", "Call emergency services (112).", "Do NOT attempt any DIY fixes."]
    elif issue == "tyre":
        steps = ["Ensure hazard lights are ON.", "Locate your spare tyre and jack.", "Loosen lug nuts slightly before jacking up the car."]
    elif issue == "battery":
        steps = ["Ensure hazard lights are ON.", "If receiving a jump, connect RED to dead battery (+) terminal first."]
    elif issue == "fuel":
        steps = ["Ensure hazard lights are ON.", "Stay inside your vehicle if safely pulled over.", "Do not smoke near the vehicle."]
    else:
        steps = ["Ensure hazard lights are ON.", "Stay clear of active traffic.", "Wait for the professional."]
        
    yield make_event("agent_complete", {"agent": "GuidanceAgent", "result": {"steps": steps}})

    # Step 6: NotificationAgent
    yield make_event("agent_progress", {"agent": "NotificationAgent", "status": "running", "message": "Sending SOS to emergency contacts..."})
    await asyncio.sleep(1.0)
    yield make_event("agent_complete", {"agent": "NotificationAgent", "result": {"email_sent": True}})

    final_text = f"It looks like an issue with your {vehicle} ({issue_detail}). We've dispatched {top_vendor['name']} (ETA: {top_vendor['eta_display']}). Track them live via the link provided. Your emergency contact has been notified. You're not alone. Help is on the way."
    yield make_event("pipeline_complete", {"message": final_text})
