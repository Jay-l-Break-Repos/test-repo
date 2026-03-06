from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import documents

app = FastAPI(title="Document Management API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    documents.router,
    prefix="/api/documents",
    tags=["documents"]
)