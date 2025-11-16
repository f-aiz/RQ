from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.database.models import ProductMaster, StockReceipt, SalesTransaction


class InventoryValueCalculator:

    @staticmethod
    def calculate_current_inventory_value(db: Session):

        # 1️⃣ Fetch earliest receipt date
        first_receipt_date = db.query(
            func.min(StockReceipt.receipt_date)
        ).scalar()

        if not first_receipt_date:
            return {
                "inventory_start_date": None,
                "total_inventory_value": 0,
                "total_quantity": 0,
                "by_category": []
            }

        # 2️⃣ Query inventory using CASE (correct usage)
        inventory_data = db.query(
            ProductMaster.sku_id,
            ProductMaster.product_name,
            ProductMaster.category,
            ProductMaster.unit_cost_price,
            ProductMaster.unit_selling_price,

            # receipts after cutoff
            func.coalesce(
                func.sum(
                    case(
                        (StockReceipt.receipt_date >= first_receipt_date,
                         StockReceipt.quantity_received),
                        else_=0
                    )
                ), 0
            ).label("total_received"),

            # sales after cutoff
            func.coalesce(
                func.sum(
                    case(
                        (SalesTransaction.transaction_date >= first_receipt_date,
                         SalesTransaction.quantity_sold),
                        else_=0
                    )
                ), 0
            ).label("total_sold")

        ).outerjoin(StockReceipt, ProductMaster.sku_id == StockReceipt.sku_id) \
         .outerjoin(SalesTransaction, ProductMaster.sku_id == SalesTransaction.sku_id) \
         .group_by(
            ProductMaster.sku_id,
            ProductMaster.product_name,
            ProductMaster.category,
            ProductMaster.unit_cost_price,
            ProductMaster.unit_selling_price
        ).all()

        # 3️⃣ Build valuation results
        total_inventory_value = 0.0
        total_quantity = 0
        by_category = {}

        for item in inventory_data:
            current_qty = max(item.total_received - item.total_sold, 0)
            if current_qty <= 0:
                continue

            inventory_value = current_qty * item.unit_cost_price

            total_quantity += current_qty
            total_inventory_value += inventory_value

            if item.category not in by_category:
                by_category[item.category] = {
                    "category": item.category,
                    "total_value": 0.0,
                    "total_quantity": 0,
                    "products": []
                }

            by_category[item.category]["total_value"] += inventory_value
            by_category[item.category]["total_quantity"] += current_qty
            by_category[item.category]["products"].append({
                "sku_id": item.sku_id,
                "product_name": item.product_name,
                "quantity": current_qty,
                "unit_cost": float(item.unit_cost_price),
                "value": inventory_value
            })

        return {
            "inventory_start_date": first_receipt_date.isoformat(),
            "total_inventory_value": round(total_inventory_value, 2),
            "total_quantity": total_quantity,
            "by_category": list(by_category.values())
        }
