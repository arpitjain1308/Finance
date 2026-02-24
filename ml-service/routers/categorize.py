from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import re

router = APIRouter()

class CategorizeRequest(BaseModel):
    descriptions: List[str]

CATEGORY_RULES = {
    'Food': ['food', 'restaurant', 'cafe', 'zomato', 'swiggy', 'eat', 'pizza', 'burger', 
             'lunch', 'dinner', 'breakfast', 'kitchen', 'dabba', 'tiffin', 'snack', 'grocery', 'bigbasket', 'blinkit'],
    'Transport': ['uber', 'ola', 'taxi', 'bus', 'metro', 'fuel', 'petrol', 'diesel', 
                  'transport', 'auto', 'rapido', 'cab', 'toll', 'parking'],
    'Shopping': ['amazon', 'flipkart', 'shopping', 'mall', 'store', 'mart', 'myntra', 
                 'ajio', 'meesho', 'nykaa', 'purchase', 'buy'],
    'Entertainment': ['netflix', 'movie', 'game', 'spotify', 'prime', 'hotstar', 
                      'entertainment', 'theatre', 'concert', 'youtube', 'gaming'],
    'Health': ['hospital', 'doctor', 'medicine', 'pharmacy', 'health', 'medical', 
               'clinic', 'chemist', 'apollo', 'diagnostic', 'wellness'],
    'Rent': ['rent', 'landlord', 'pg', 'hostel', 'accommodation', 'house', 'flat'],
    'Utilities': ['electricity', 'water', 'internet', 'phone', 'bill', 'utility', 
                  'broadband', 'recharge', 'postpaid', 'jio', 'airtel', 'bsnl'],
    'Education': ['school', 'college', 'course', 'tuition', 'education', 'udemy', 
                  'coursera', 'fees', 'book', 'stationery'],
    'Travel': ['hotel', 'flight', 'travel', 'trip', 'holiday', 'irctc', 'makemytrip', 
               'goibibo', 'airbnb', 'booking'],
    'Salary': ['salary', 'stipend', 'wage', 'payroll', 'income', 'credit', 'deposit'],
    'Investment': ['mutual fund', 'sip', 'stock', 'investment', 'zerodha', 'groww', 
                   'nifty', 'sensex', 'crypto', 'bitcoin']
}

def categorize_description(description: str) -> str:
    desc_lower = description.lower()
    desc_lower = re.sub(r'[^a-z0-9 ]', ' ', desc_lower)
    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return category
    return 'Other'

@router.post("/categorize")
def categorize_transactions(request: CategorizeRequest):
    categories = [categorize_description(desc) for desc in request.descriptions]
    return {"categories": categories, "count": len(categories)}
