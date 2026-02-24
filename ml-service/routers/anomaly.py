from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

router = APIRouter()

class TransactionItem(BaseModel):
    id: str
    description: str
    amount: float
    category: Optional[str] = 'Other'
    date: str

class AnomalyRequest(BaseModel):
    transactions: List[TransactionItem]

@router.post("/anomalies")
def detect_anomalies(request: AnomalyRequest):
    if len(request.transactions) < 5:
        return {"anomalies": [], "message": "Not enough data for anomaly detection"}

    try:
        amounts = np.array([t.amount for t in request.transactions])
        mean = np.mean(amounts)
        std = np.std(amounts)

        # Category-level anomaly detection
        categories = {}
        for t in request.transactions:
            if t.category not in categories:
                categories[t.category] = []
            categories[t.category].append(t.amount)

        anomalies = []
        for t in request.transactions:
            reasons = []
            score = 0

            # Global anomaly check (Z-score > 2)
            if std > 0:
                z_score = abs(t.amount - mean) / std
                if z_score > 2:
                    reasons.append(f"Amount is {z_score:.1f}x standard deviations above average")
                    score += z_score

            # Category-level anomaly
            cat_amounts = categories.get(t.category, [t.amount])
            if len(cat_amounts) >= 3:
                cat_mean = np.mean(cat_amounts)
                cat_std = np.std(cat_amounts)
                if cat_std > 0:
                    cat_z = abs(t.amount - cat_mean) / cat_std
                    if cat_z > 2:
                        reasons.append(f"Unusual for {t.category} category (avg: ₹{cat_mean:.0f})")
                        score += cat_z

            if reasons:
                anomalies.append({
                    "id": t.id,
                    "description": t.description,
                    "amount": t.amount,
                    "category": t.category,
                    "date": t.date,
                    "score": round(score, 2),
                    "reasons": reasons
                })

        # Sort by score
        anomalies.sort(key=lambda x: x['score'], reverse=True)

        return {
            "anomalies": anomalies[:10],  # Return top 10
            "totalChecked": len(request.transactions),
            "anomalyCount": len(anomalies),
            "averageAmount": round(float(mean), 2),
            "message": f"Found {len(anomalies)} unusual transactions"
        }

    except Exception as e:
        return {"anomalies": [], "error": str(e)}
