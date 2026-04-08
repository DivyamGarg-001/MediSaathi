from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi_backend.config import ALLOWED_ORIGINS
from fastapi_backend.routers import patient_insights, doctor_insights, hospital_insights

app = FastAPI(
    title="MediSaathi AI Backend",
    version="1.0.0",
    description="AI-powered health insights for MediSaathi",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(patient_insights.router)
app.include_router(doctor_insights.router)
app.include_router(hospital_insights.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "medisaathi-ai"}


if __name__ == "__main__":
    import uvicorn
    from fastapi_backend.config import FASTAPI_PORT

    uvicorn.run("fastapi_backend.main:app", host="0.0.0.0", port=FASTAPI_PORT, reload=True)
