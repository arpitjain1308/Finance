from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import categorize, forecast, anomaly
import nltk

# Download NLTK data on startup
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

app = FastAPI(title="Finance Dashboard ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categorize.router)
app.include_router(forecast.router)
app.include_router(anomaly.router)

@app.get("/")
def read_root():
    return {"message": "Finance Dashboard ML Service Running", "status": "OK"}

@app.get("/health")
def health():
    return {"status": "healthy"}
