"""
RoadRunner — Trip Delay Prediction FastAPI Service
Person 3: AI/ML API

Endpoints:
  GET  /           - health check
  POST /predict    - predict delay in minutes
  GET  /model-info - model metadata and performance metrics

Start:
  uvicorn app:app --reload --port 8000
"""

import json
import os
from pathlib import Path
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Load model ──────────────────────────────────────────────────
MODEL_PATH    = Path(__file__).parent / 'model.pkl'
METADATA_PATH = Path(__file__).parent / 'model_metadata.json'

app = FastAPI(
    title='RoadRunner Prediction Service',
    description='Trip Delay Prediction using Random Forest Regressor',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

_model = None
_metadata = {}

def get_model():
    global _model, _metadata
    if _model is None:
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail='Model not trained yet. Run: python train.py',
            )
        _model = joblib.load(MODEL_PATH)
        if METADATA_PATH.exists():
            with open(METADATA_PATH) as f:
                _metadata = json.load(f)
    return _model


# ─── Schemas ──────────────────────────────────────────────────────
class PredictionInput(BaseModel):
    route_distance:       float = Field(..., ge=0, description='Route distance in km')
    departure_hour:       int   = Field(..., ge=0, le=23, description='Departure hour (0-23)')
    day_of_week:          int   = Field(..., ge=0, le=6, description='Day of week (0=Mon, 6=Sun)')
    historical_avg_delay: float = Field(..., ge=0, description='Historical average delay in minutes')
    active_incidents:     int   = Field(..., ge=0, description='Number of active incidents on route')


class PredictionOutput(BaseModel):
    predicted_delay:  float
    model_version:    str
    confidence:       float | None
    features_used:    dict


# ─── Feature Engineering ──────────────────────────────────────────
def engineer_features(inp: PredictionInput) -> np.ndarray:
    h = inp.departure_hour
    d = inp.day_of_week
    is_peak_hour = 1 if (7 <= h <= 10 or 17 <= h <= 20) else 0
    is_weekend   = 1 if d >= 5 else 0
    return np.array([[
        inp.route_distance,
        inp.departure_hour,
        inp.day_of_week,
        inp.historical_avg_delay,
        inp.active_incidents,
        is_peak_hour,
        is_weekend,
    ]])


# ─── Endpoints ────────────────────────────────────────────────────
@app.get('/')
def health():
    model_loaded = MODEL_PATH.exists()
    return {
        'status':       'ok',
        'service':      'RoadRunner Prediction Service',
        'model_loaded': model_loaded,
        'version':      _metadata.get('version', 'unknown'),
    }


@app.post('/predict', response_model=PredictionOutput)
def predict(data: PredictionInput):
    model = get_model()
    X = engineer_features(data)
    raw_pred = float(model.predict(X)[0])
    predicted_delay = max(0.0, round(raw_pred, 2))

    # Confidence: use prediction variance across trees (RF only)
    try:
        tree_preds = np.array([tree.predict(X)[0] for tree in model.estimators_])
        std_dev   = float(tree_preds.std())
        # Normalise: conf = 1 - (std / max_expected_std)
        confidence = round(float(max(0, 1 - std_dev / 30)), 3)
    except Exception:
        confidence = None

    version = _metadata.get('version', 'v1')
    features = {
        'route_distance':       data.route_distance,
        'departure_hour':       data.departure_hour,
        'day_of_week':          data.day_of_week,
        'historical_avg_delay': data.historical_avg_delay,
        'active_incidents':     data.active_incidents,
        'is_peak_hour':         1 if (7 <= data.departure_hour <= 10 or 17 <= data.departure_hour <= 20) else 0,
        'is_weekend':           1 if data.day_of_week >= 5 else 0,
    }

    return PredictionOutput(
        predicted_delay=predicted_delay,
        model_version=version,
        confidence=confidence,
        features_used=features,
    )


@app.get('/model-info')
def model_info():
    if not METADATA_PATH.exists():
        raise HTTPException(status_code=404, detail='Model metadata not found. Run train.py first.')
    with open(METADATA_PATH) as f:
        return json.load(f)
