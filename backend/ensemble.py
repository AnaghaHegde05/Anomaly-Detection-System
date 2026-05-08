import os
import pickle
import pandas as pd

models_dir = os.path.join(os.path.dirname(__file__), 'models')

# Load RF
rf_path = os.path.join(models_dir, 'rf_pipeline_final.pkl')
with open(rf_path, 'rb') as f:
    rf_model = pickle.load(f)

# Load XGB
xgb_path = os.path.join(models_dir, 'xgb_pipeline_final.pkl')
with open(xgb_path, 'rb') as f:
    xgb_model = pickle.load(f)

# Load Meta
meta_path = os.path.join(models_dir, 'meta_learner_model.pkl')
with open(meta_path, 'rb') as f:
    meta_model = pickle.load(f)

FEATURE_NAMES = [
    'gas_used', 'transaction_count', 'log_difficulty', 'block_score',
    'gas_transaction_ratio', 'log_total_difficulty', 'difficulty_gas_interaction'
]

def run_prediction(features_dict):
    """
    Runs the ensemble models on the given features.
    features_dict should have the 7 required keys.
    """
    df = pd.DataFrame([features_dict], columns=FEATURE_NAMES)
    
    # Base predictions
    rf_pred = rf_model.predict(df)[0]
    xgb_pred = xgb_model.predict(df)[0]
    
    # Meta learner
    # Meta learner takes RF and XGB predictions as inputs
    # Let's ensure it's a 2D array: [[rf_pred, xgb_pred]]
    meta_input = [[rf_pred, xgb_pred]]
    meta_pred_raw = meta_model.predict(meta_input)[0]
    
    # Since meta is LinearRegression, we threshold at 0.5
    # 1 represents Anomaly, 0 represents Normal
    rf_class = 1 if rf_pred > 0.5 else 0
    xgb_class = 1 if xgb_pred > 0.5 else 0
    meta_class = 1 if meta_pred_raw > 0.5 else 0
    
    # Consensus: At least 2 out of 3 agree
    votes = [rf_class, xgb_class, meta_class]
    anomaly_votes = sum(votes)
    
    is_anomaly = anomaly_votes >= 2
    
    return {
        "rf_prediction": rf_class,
        "rf_raw": float(rf_pred),
        "xgb_prediction": xgb_class,
        "xgb_raw": float(xgb_pred),
        "meta_prediction": meta_class,
        "meta_raw": float(meta_pred_raw),
        "consensus_anomaly": is_anomaly,
        "anomaly_votes": anomaly_votes
    }
