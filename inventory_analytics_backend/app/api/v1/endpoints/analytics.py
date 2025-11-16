from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database.connection import get_db

# Import actual classes (NOT modules)
from app.services.analytics.revenue_calculator import RevenueCalculator
from app.services.analytics.profit_calculator import ProfitCalculator
from app.services.analytics.inventory_value import InventoryValueCalculator
from app.services.analytics.sales_trend import SalesTrendAnalyzer
from app.services.analytics.category_revenue import CategoryRevenueAnalyzer  
from app.services.analytics.best_worst_performer import PerformanceAnalyzer 
from app.services.analytics.stock_alerts import StockAlertSystem
from app.services.analytics.avg_product_age import ProductAgeAnalyzer
from app.services.analytics.inventory_vs_cashflow import CashFlowAnalyzer
from app.services.analytics.purchase_price_variance import PriceVarianceAnalyzer
from app.services.analytics.credit_health import CreditHealthAnalyzer
from app.services.analytics.forecasting import ForecastingEngine
from app.services.analytics.actionable_recommendations import SuggestionEngine


router = APIRouter(prefix="/analytics", tags=["Analytics"])


# -----------------------------------------------------------
# 1. TOTAL REVENUE
# -----------------------------------------------------------
@router.get("/revenue")
async def get_total_revenue(
    db: Session = Depends(get_db),
    start_date: datetime = None,
    end_date: datetime = None
):
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()

    result = RevenueCalculator.calculate_total_revenue(db, start_date, end_date)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 2. PROFIT & PROFIT MARGIN
# -----------------------------------------------------------
@router.get("/profit")
async def get_profit_margin(
    db: Session = Depends(get_db),
    start_date: datetime = None,
    end_date: datetime = None
):
    result = ProfitCalculator.calculate_profit_metrics(db, start_date, end_date)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 3. CURRENT INVENTORY VALUE
# -----------------------------------------------------------
@router.get("/inventory-value")
async def get_inventory_value(db: Session = Depends(get_db)):
    result = InventoryValueCalculator.calculate_current_inventory_value(db)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 4. SALES TREND
# -----------------------------------------------------------
@router.get("/sales-trend")
async def get_sales_trend(db: Session = Depends(get_db), days: int = 30):
    result = SalesTrendAnalyzer.calculate_sales_trend(db, days)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 5. CATEGORY-WISE REVENUE
# -----------------------------------------------------------
@router.get("/category-revenue")
async def get_category_revenue(
    db: Session = Depends(get_db),
    start_date: datetime = None,
    end_date: datetime = None
):
    result = CategoryRevenueAnalyzer.calculate_category_revenue(db, start_date, end_date)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 6. TOP & BOTTOM PERFORMERS
# -----------------------------------------------------------
@router.get("/performers")
async def get_performers(db: Session = Depends(get_db), limit: int = 10):
    best = PerformanceAnalyzer.get_best_performers(db, limit)
    worst = PerformanceAnalyzer.get_worst_performers(db, limit)
    return {
        "status": "success",
        "data": {
            "best_performers": best,
            "worst_performers": worst
        }
    }


# -----------------------------------------------------------
# 7. STOCK OUT ALERTS
# -----------------------------------------------------------
@router.get("/stock-alerts")
async def get_stock_alerts(db: Session = Depends(get_db)):
    alerts = StockAlertSystem.get_stockout_alerts(db)
    return {"status": "success", "data": alerts}


# -----------------------------------------------------------
# 8. AVERAGE PRODUCT AGE
# -----------------------------------------------------------
@router.get("/product-age")
async def get_product_age(db: Session = Depends(get_db)):
    result = ProductAgeAnalyzer.calculate_average_product_age(db)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 9. INVENTORY VALUE VS CASH OUTFLOW
# -----------------------------------------------------------
@router.get("/cash-flow")
async def get_cash_flow(db: Session = Depends(get_db), days: int = 30):
    result = CashFlowAnalyzer.analyze_cash_flow(db, days)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 10. PURCHASE PRICE VARIANCE
# -----------------------------------------------------------
@router.get("/price-variance")
async def get_price_variance(db: Session = Depends(get_db)):
    result = PriceVarianceAnalyzer.calculate_price_variance(db)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 11. CREDIT HEALTH
# -----------------------------------------------------------
@router.get("/credit-health")
async def get_credit_health(db: Session = Depends(get_db)):
    # This works because we stub suppliers as demo data when empty
    result = CreditHealthAnalyzer.analyze_credit_health(db)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 12. FORECASTING
# -----------------------------------------------------------
@router.get("/forecast")
async def get_forecast(
    db: Session = Depends(get_db),
    days: int = 30,
    sku_id: str = None
):
    if sku_id:
        result = ForecastingEngine.forecast_sku(db, sku_id, days)
    else:
        result = ForecastingEngine.forecast_all_products(db, days)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 13. ACTIONABLE SUGGESTIONS
# -----------------------------------------------------------
@router.get("/suggestions")
async def get_suggestions(db: Session = Depends(get_db)):
    result = SuggestionEngine.generate_suggestions(db)
    return {"status": "success", "data": result}


# -----------------------------------------------------------
# 🧨 UNIFIED DASHBOARD ENDPOINT
# -----------------------------------------------------------
@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    return {
        "status": "success",
        "data": {
            "revenue": RevenueCalculator.calculate_total_revenue(
                db,
                datetime.now() - timedelta(days=30),
                datetime.now()
            ),
            "profit": ProfitCalculator.calculate_profit_metrics(
                db,
                datetime.now() - timedelta(days=30),
                datetime.now()
            ),
            "inventory_value": InventoryValueCalculator.calculate_current_inventory_value(db),
            "alerts": StockAlertSystem.get_stockout_alerts(db),
            "suggestions": SuggestionEngine.generate_suggestions(db)
        }
    }
