"""
RoadRunner — Trip Delay Prediction Service
Person 3: AI/ML Module

Stack: Python + FastAPI + scikit-learn
Model: RandomForestRegressor (with LinearRegression baseline)

Usage:
  pip install -r requirements.txt
  python train.py          # train and save the model
  uvicorn app:app --reload --port 8000  # serve predictions
"""
