from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.models import ProductMaster, StockReceipt, SalesTransaction
from datetime import datetime, timedelta


class CashFlowAnalyzer:

    @staticmethod
    def analyze_cash_flow(db: Session, days: int = 30):
        """Analyze inventory value and cash flow for the last N days."""

        start_date = datetime.now() - timedelta(days=days)

        # -------------------------------
        # 1. CASH OUTFLOW (PURCHASES)
        # -------------------------------
        purchases = (
            db.query(
                func.sum(StockReceipt.quantity_received * StockReceipt.unit_cost)
            )
            .filter(StockReceipt.receipt_date >= start_date)
            .scalar()
        )

        total_cash_outflow = float(purchases) if purchases else 0.0

        # -------------------------------
        # 2. CASH INFLOW (SALES)
        # -------------------------------
        sales = (
            db.query(
                func.sum(SalesTransaction.quantity_sold * SalesTransaction.sale_price)
            )
            .filter(SalesTransaction.transaction_date >= start_date)
            .scalar()
        )

        total_cash_inflow = float(sales) if sales else 0.0

        # -------------------------------
        # 3. CURRENT INVENTORY VALUE
        # (Fix: Use a subquery to avoid nested aggregates)
        # -------------------------------
        subquery = (
            db.query(
                ProductMaster.sku_id.label("sku_id"),
                func.coalesce(func.sum(StockReceipt.quantity_received), 0).label("received"),
                func.coalesce(func.sum(SalesTransaction.quantity_sold), 0).label("sold"),
                ProductMaster.unit_cost_price.label("unit_cost_price"),
            )
            .outerjoin(StockReceipt, ProductMaster.sku_id == StockReceipt.sku_id)
            .outerjoin(SalesTransaction, ProductMaster.sku_id == SalesTransaction.sku_id)
            .group_by(ProductMaster.sku_id, ProductMaster.unit_cost_price)
            .subquery()
        )

        inventory_value = (
            db.query(
                func.sum(
                    (subquery.c.received - subquery.c.sold)
                    * subquery.c.unit_cost_price
                )
            )
            .scalar()
        )

        current_inventory_value = float(inventory_value) if inventory_value else 0.0

        # -------------------------------
        # 4. NET CASH FLOW
        # -------------------------------
        net_cash_flow = total_cash_inflow - total_cash_outflow

        # -------------------------------
        # 5. CASH CONVERSION RATIO
        # -------------------------------
        if total_cash_outflow > 0:
            cash_conversion_ratio = total_cash_inflow / total_cash_outflow
        else:
            cash_conversion_ratio = 0

        # -------------------------------
        # RESPONSE
        # -------------------------------
        return {
            "period_days": days,
            "total_cash_inflow": round(total_cash_inflow, 2),
            "total_cash_outflow": round(total_cash_outflow, 2),
            "net_cash_flow": round(net_cash_flow, 2),
            "current_inventory_value": round(current_inventory_value, 2),
            "cash_conversion_ratio": round(cash_conversion_ratio, 2),
        }
