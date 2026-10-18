"""
RoadRunner — AI/ML Trip Delay Prediction
Person 3: Data Generation + Model Training + Evaluation

Features:
  - route_distance     : float  (km)
  - departure_hour     : int    (0-23)
  - day_of_week        : int    (0=Mon, 6=Sun)
  - historical_avg_delay: float (minutes)
  - active_incidents   : int    (count)

Target:
  - delay_minutes      : float  (actual delay in minutes)

Models:
  1. Linear Regression (baseline)
  2. Random Forest Regressor (main model)

Evaluation:
  - MAE (Mean Absolute Error)
  - RMSE (Root Mean Squared Error)
  - R² Score
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import numpy as np
import pandas as pd
import joblib
import json
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# ─── 1. Generate Synthetic Training Data ────────────────────────
def generate_synthetic_data(n_samples: int = 2000) -> pd.DataFrame:
    """
    Generate synthetic trip data with realistic delay patterns.
    
    Delay model:
      base = historical_avg_delay
      + distance effect (longer = more variance)
      + peak-hour effect (7-10am, 5-8pm adds delay)
      + weekend effect (Sat/Sun reduces delay)
      + incident penalty (each active incident adds ~5 min)
      + noise
    """
    route_distance      = np.random.uniform(20, 300, n_samples)
    departure_hour      = np.random.randint(0, 24, n_samples)
    day_of_week         = np.random.randint(0, 7, n_samples)
    historical_avg_delay = np.random.uniform(0, 40, n_samples)
    active_incidents    = np.random.randint(0, 6, n_samples)

    # Deterministic delay components
    peak_hours  = np.isin(departure_hour, list(range(7, 11)) + list(range(17, 21)))
    weekend     = np.isin(day_of_week, [5, 6])
    
    delay = (
        0.3 * historical_avg_delay            # past performance
        + 0.05 * route_distance               # distance adds variance
        + 8 * peak_hours.astype(float)        # peak-hour penalty
        - 3 * weekend.astype(float)           # weekend relief
        + 5 * active_incidents                # incident penalty
        + np.random.normal(0, 4, n_samples)   # noise
    ).clip(0, 120)  # clip between 0 and 120 minutes

    return pd.DataFrame({
        'route_distance':       route_distance,
        'departure_hour':       departure_hour,
        'day_of_week':          day_of_week,
        'historical_avg_delay': historical_avg_delay,
        'active_incidents':     active_incidents,
        'delay_minutes':        delay,
    })


# ─── 2. Preprocessing ────────────────────────────────────────────
def preprocess(df: pd.DataFrame):
    """
    Preprocessing:
      - Feature engineering: is_peak_hour, is_weekend binary flags
      - Drop rows with missing target
      - Scale features
    """
    df = df.copy()
    df['is_peak_hour'] = df['departure_hour'].apply(
        lambda h: 1 if (7 <= h <= 10 or 17 <= h <= 20) else 0
    )
    df['is_weekend'] = df['day_of_week'].apply(lambda d: 1 if d >= 5 else 0)
    df.dropna(subset=['delay_minutes'], inplace=True)
    return df


FEATURE_COLS = [
    'route_distance', 'departure_hour', 'day_of_week',
    'historical_avg_delay', 'active_incidents',
    'is_peak_hour', 'is_weekend',
]
TARGET_COL = 'delay_minutes'


# ─── 3. Train & Evaluate ────────────────────────────────────────
def train_and_evaluate():
    print("=" * 60)
    print("  RoadRunner — Trip Delay Prediction Model Training")
    print("=" * 60)

    # Data
    df_raw = generate_synthetic_data(2000)
    df     = preprocess(df_raw)
    print(f"\n[Dataset] {len(df)} samples | Features: {FEATURE_COLS}")
    print(df[FEATURE_COLS + [TARGET_COL]].describe().round(2))

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )
    print(f"\n[Split] Train: {len(X_train)} | Test: {len(X_test)}")

    results = {}

    # -- Model 1: Linear Regression (baseline) ------------------
    print("\n-- Linear Regression (Baseline) --")
    lr_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('model', LinearRegression()),
    ])
    lr_pipe.fit(X_train, y_train)
    y_pred_lr = lr_pipe.predict(X_test).clip(0)

    lr_mae  = mean_absolute_error(y_test, y_pred_lr)
    lr_rmse = np.sqrt(mean_squared_error(y_test, y_pred_lr))
    lr_r2   = r2_score(y_test, y_pred_lr)
    print(f"  MAE  : {lr_mae:.2f} min")
    print(f"  RMSE : {lr_rmse:.2f} min")
    print(f"  R2   : {lr_r2:.4f}")
    results['linear_regression'] = {'mae': lr_mae, 'rmse': lr_rmse, 'r2': lr_r2}

    # -- Model 2: Random Forest ----------------------------------
    print("\n-- Random Forest Regressor --")
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=5,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test).clip(0)

    rf_mae  = mean_absolute_error(y_test, y_pred_rf)
    rf_rmse = np.sqrt(mean_squared_error(y_test, y_pred_rf))
    rf_r2   = r2_score(y_test, y_pred_rf)
    print(f"  MAE  : {rf_mae:.2f} min")
    print(f"  RMSE : {rf_rmse:.2f} min")
    print(f"  R2   : {rf_r2:.4f}")
    results['random_forest'] = {'mae': rf_mae, 'rmse': rf_rmse, 'r2': rf_r2}

    # Feature importances
    importances = dict(zip(FEATURE_COLS, rf.feature_importances_.round(4)))
    print(f"\n  Feature importances: {importances}")

    # -- Comparison ---------------------------------------------
    print("\n-- Model Comparison --")
    print(f"  {'Model':<25} {'MAE':>8} {'RMSE':>8} {'R2':>8}")
    print(f"  {'-'*25} {'-'*8} {'-'*8} {'-'*8}")
    print(f"  {'Linear Regression':<25} {lr_mae:>8.2f} {lr_rmse:>8.2f} {lr_r2:>8.4f}")
    print(f"  {'Random Forest':<25} {rf_mae:>8.2f} {rf_rmse:>8.2f} {rf_r2:>8.4f}")

    winner = 'random_forest' if rf_r2 > lr_r2 else 'linear_regression'
    print(f"\n  [Selected] Best model: {winner}")

    # -- Save model ---------------------------------------------
    joblib.dump(rf, 'model.pkl')
    joblib.dump(StandardScaler(), 'scaler.pkl')  # scaler not needed for RF but saved for LR parity

    # Save metadata
    metadata = {
        'model': 'RandomForestRegressor',
        'version': 'v1',
        'features': FEATURE_COLS,
        'target': TARGET_COL,
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'metrics': results,
        'feature_importances': importances,
        'note': (
            'Trained on 2000 synthetic samples. '
            'Real deployment should use historical trip + incident data from MySQL.'
        ),
    }
    with open('model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\n[Saved] model.pkl and model_metadata.json saved successfully!")
    print("=" * 60)
    return metadata


if __name__ == '__main__':
    train_and_evaluate()
