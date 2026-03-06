from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .api import documents
from .database import init_db

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Include routers
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

# Serve frontend static files
@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")

# Serve static files
app.mount("/", StaticFiles(directory="frontend"), name="static")

# Optional: Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}