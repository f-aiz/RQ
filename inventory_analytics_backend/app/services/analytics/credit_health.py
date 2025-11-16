from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.models import StockReceipt
# from app.database.models import Supplier   # Disabled for demo
from datetime import datetime

class CreditHealthAnalyzer:
    
    @staticmethod
    def analyze_credit_health(db: Session):
        """Analyze credit payables and supplier health (demo-safe version)"""

        # suppliers = db.query(Supplier).all()
        suppliers = []  # disable supplier analytics for now

        # If no suppliers, return safe empty response
        if not suppliers:
            return {
                "total_payables": 0.0,
                "supplier_count": 0,
                "suppliers": [],
                "message": "Supplier analytics disabled for demo."
            }

        credit_analysis = []
        total_payables = 0.0
        
        for supplier in suppliers:
            supplier_purchases = db.query(
                func.sum(StockReceipt.quantity_received * StockReceipt.unit_cost).label("total_purchases"),
                func.count(StockReceipt.id).label("order_count"),
                func.max(StockReceipt.receipt_date).label("last_order")
            ).filter(StockReceipt.supplier_id == supplier.supplier_id).first()
            
            total_purchases = float(supplier_purchases.total_purchases) if supplier_purchases.total_purchases else 0.0
            last_order = supplier_purchases.last_order
            days_since_order = (datetime.now() - last_order).days if last_order else None
            
            payable_amount = total_purchases
            total_payables += payable_amount
            
            credit_analysis.append({
                "supplier_id": supplier.supplier_id,
                "supplier_name": supplier.supplier_name,
                "total_purchases": round(total_purchases, 2),
                "payable_amount": round(payable_amount, 2),
                "order_count": supplier_purchases.order_count or 0,
                "last_order_date": last_order.isoformat() if last_order else None,
                "days_since_last_order": days_since_order,
                "payment_terms_days": 30
            })
        
        return {
            "total_payables": round(total_payables, 2),
            "supplier_count": len(suppliers),
            "suppliers": sorted(credit_analysis, key=lambda x: x["payable_amount"], reverse=True)
        }
