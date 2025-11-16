from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.models import ProductMaster, StockReceipt
from datetime import datetime

class ProductAgeAnalyzer:

    @staticmethod
    def calculate_average_product_age(db: Session):
        """
        Product age should be based on earliest stock receipt date,
        NOT on ProductMaster.created_at.
        """

        # Get earliest receipt date per SKU
        results = db.query(
            ProductMaster.sku_id,
            ProductMaster.product_name,
            ProductMaster.category,
            func.min(StockReceipt.receipt_date).label("first_receipt_date")
        ).join(
            StockReceipt, ProductMaster.sku_id == StockReceipt.sku_id
        ).group_by(
            ProductMaster.sku_id,
            ProductMaster.product_name,
            ProductMaster.category
        ).all()

        product_ages = []
        today = datetime.utcnow()

        for item in results:
            if item.first_receipt_date is None:
                continue

            age_days = (today - item.first_receipt_date).days

            product_ages.append({
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "category": item.category,
                "first_receipt_date": item.first_receipt_date.isoformat(),
                "age_days": age_days
            })

        if not product_ages:
            return {
                "total_products": 0,
                "average_product_age_days": 0,
                "oldest_product_age_days": 0,
                "newest_product_age_days": 0,
                "products_by_age": []
            }

        avg_age = sum(p["age_days"] for p in product_ages) / len(product_ages)

        return {
            "total_products": len(product_ages),
            "average_product_age_days": round(avg_age, 2),
            "oldest_product_age_days": max(p["age_days"] for p in product_ages),
            "newest_product_age_days": min(p["age_days"] for p in product_ages),
            "products_by_age": sorted(product_ages, key=lambda x: x["age_days"], reverse=True)
        }
