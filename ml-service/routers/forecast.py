from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

router = APIRouter()

class TransactionItem(BaseModel):
    date: str
    amount: float
    category: Optional[str] = 'Other'

class ForecastRequest(BaseModel):
    transactions: List[TransactionItem]

@router.post("/forecast")
def get_forecast(request: ForecastRequest):
    if len(request.transactions) < 7:
        return {
            "nextMonthEstimate": 0,
            "dailyAverage": 0,
            "weeklyAverage": 0,
            "trend": "insufficient_data",
            "message": "Need at least 7 transactions for forecasting",
            "categoryForecasts": {},
            "chartData": []
        }

    try:
        df = pd.DataFrame([t.dict() for t in request.transactions])
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Daily aggregation
        daily = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
        daily.columns = ['date', 'amount']

        # Calculate stats
        daily_avg = float(daily['amount'].mean())
        weekly_avg = daily_avg * 7
        monthly_estimate = daily_avg * 30

        # Trend: compare last 15 days vs previous 15 days
        if len(daily) >= 30:
            recent = daily.tail(15)['amount'].mean()
            previous = daily.iloc[-30:-15]['amount'].mean()
            trend_pct = ((recent - previous) / previous * 100) if previous > 0 else 0
            if trend_pct > 10: trend = "increasing"
            elif trend_pct < -10: trend = "decreasing"
            else: trend = "stable"
        else:
            trend = "stable"
            trend_pct = 0

        # Category breakdown forecast
        category_totals = df.groupby('category')['amount'].sum()
        category_pct = (category_totals / category_totals.sum() * 100).round(1).to_dict()
        category_forecasts = {cat: round(monthly_estimate * pct / 100, 2) for cat, pct in category_pct.items()}

        # Chart data: last 6 months actual + next month forecast
        df['month'] = df['date'].dt.to_period('M')
        monthly_actual = df.groupby('month')['amount'].sum().tail(6)
        chart_data = [{"month": str(period), "actual": round(float(amount), 2), "type": "actual"}
                      for period, amount in monthly_actual.items()]

        # Next month forecast
        next_month = (datetime.now().replace(day=1) + timedelta(days=32)).replace(day=1)
        chart_data.append({"month": next_month.strftime('%Y-%m'), "actual": round(monthly_estimate, 2), "type": "forecast"})

        return {
            "nextMonthEstimate": round(monthly_estimate, 2),
            "dailyAverage": round(daily_avg, 2),
            "weeklyAverage": round(weekly_avg, 2),
            "trend": trend,
            "trendPercentage": round(trend_pct, 1),
            "message": f"Based on your spending patterns, you may spend ₹{monthly_estimate:,.0f} next month.",
            "categoryForecasts": category_forecasts,
            "chartData": chart_data
        }

    except Exception as e:
        return {"error": str(e), "nextMonthEstimate": 0, "trend": "error"}
