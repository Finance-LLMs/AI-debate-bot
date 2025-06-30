# backend/server.py
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes should be defined before static file handling
@app.get("/api/signed-url")
async def get_signed_url(agent: str = None):
    # Default agent ID
    agent_id = os.getenv("AGENT_ID")
    
    # Map agent to specific agent ID
    if agent == 'michelle':
        agent_id = os.getenv("MICHELLE_AGENT_ID")
    elif agent == 'nelson':
        agent_id = os.getenv("NELSON_AGENT_ID")
    elif agent == 'taylor':
        agent_id = os.getenv("TAYLOR_AGENT_ID")
    elif agent == 'barbarella':
        agent_id = os.getenv("BARBARELLA_AGENT_ID")
    elif agent == 'singapore_uncle':
        agent_id = os.getenv("SINGAPORE_UNCLE_AGENT_ID")
    
    print(f"signed-url: Agent={agent}, Using agent_id={agent_id}")
    xi_api_key = os.getenv("XI_API_KEY")
    
    if not agent_id or not xi_api_key:
        raise HTTPException(status_code=500, detail="Missing environment variables")
    
    url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={agent_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                url,
                headers={"xi-api-key": xi_api_key}
            )
            response.raise_for_status()
            data = response.json()
            return {"signedUrl": data["signed_url"]}
            
        except httpx.HTTPError:
            raise HTTPException(status_code=500, detail="Failed to get signed URL")


#API route for getting Agent ID, used for public agents
@app.get("/api/getAgentId")
def get_agent_id(agent: str = None):
    # Default to AGENT_ID if no agent specified
    agent_id = os.getenv("AGENT_ID")
    
    # Map agent name to specific agent ID
    if agent == 'taylor':
        agent_id = os.getenv("TAYLOR_AGENT_ID")
    elif agent == 'nelson':
        agent_id = os.getenv("NELSON_AGENT_ID")
    elif agent == 'barbarella':
        agent_id = os.getenv("BARBARELLA_AGENT_ID")
    
    print(f"getAgentId: Agent={agent}, Using agent_id={agent_id}")
    return {"agentId": agent_id}

# Mount static files for specific assets (CSS, JS, etc.)
app.mount("/static", StaticFiles(directory="dist"), name="static")

# Serve index.html for root path
@app.get("/")
async def serve_root():
    return FileResponse("dist/index.html")
#     return FileResponse("dist/index.html")