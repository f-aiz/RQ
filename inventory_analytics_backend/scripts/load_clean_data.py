import os
import sys
import pandas as pd
from sqlalchemy.orm import Session

# ---------------------------------------------------
# Ensure project root is in PYTHONPATH
# ---------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

# ---------------------------------------------------
# Import DB Session + Models
# ---------------------------------------------------
from app.database.connection import SessionLocal, init_db
from app.database.models import ProductMaster, StockReceipt, SalesTransaction


# ===================================================
#               PRODUCT MASTER LOADER
# ===================================================

PRODUCT_MAPPING = {
    "PTC": "sku_id",
    "product_name": "product_name",
    "Category": "category",
    "GroupName": "sub_category",
    "BrandName": "brand",
    "cost_price": "unit_cost_price",
    "sale_price": "unit_selling_price"
}

def load_product_master():
    csv_path = os.path.join(PROJECT_ROOT, "data", "clean", "product_master.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"❌ Missing cleaned file: {csv_path}")

    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()
    df = df.rename(columns=PRODUCT_MAPPING)
    df = df[list(PRODUCT_MAPPING.values())]

    df["unit_cost_price"] = pd.to_numeric(df["unit_cost_price"], errors="coerce").fillna(0)
    df["unit_selling_price"] = pd.to_numeric(df["unit_selling_price"], errors="coerce").fillna(0)

    session: Session = SessionLocal()
    inserted = 0

    for _, row in df.iterrows():
        product = ProductMaster(
            sku_id=str(row["sku_id"]).strip(),
            product_name=str(row["product_name"]).strip(),
            category=str(row["category"]).strip(),
            sub_category=str(row["sub_category"]).strip(),
            brand=str(row["brand"]).strip(),
            unit_cost_price=float(row["unit_cost_price"]),
            unit_selling_price=float(row["unit_selling_price"])
        )
        session.merge(product)  # UPSERT
        inserted += 1

    session.commit()
    session.close()
    print(f"✔️ Loaded {inserted} product records.")


# ===================================================
#               STOCK RECEIPTS LOADER
# ===================================================

STOCK_MAPPING = {
    "dot": "receipt_date",
    "PTC": "sku_id",
    "quantity": "quantity_received",
    "vendorCode_": "supplier_id",
    "cost_price": "unit_cost"
}

def load_stock_receipts():
    csv_path = os.path.join(PROJECT_ROOT, "data", "clean", "stock_receipts.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"❌ Missing cleaned file: {csv_path}")

    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()
    df = df.rename(columns=STOCK_MAPPING)
    df = df[list(STOCK_MAPPING.values())]

    df["quantity_received"] = pd.to_numeric(df["quantity_received"], errors="coerce").fillna(0)
    df["unit_cost"] = pd.to_numeric(df["unit_cost"], errors="coerce").fillna(0)

    df["receipt_date"] = pd.to_datetime(df["receipt_date"], errors="coerce")

    session: Session = SessionLocal()
    inserted = 0

    for _, row in df.iterrows():
        rec = StockReceipt(
            receipt_date=row["receipt_date"],
            sku_id=str(row["sku_id"]).strip(),
            quantity_received=int(row["quantity_received"]),
            supplier_id=str(row["supplier_id"]).strip(),
            unit_cost=float(row["unit_cost"])
        )
        session.add(rec)
        inserted += 1

    session.commit()
    session.close()
    print(f"✔️ Loaded {inserted} stock receipt rows.")


# ===================================================
#               SALES TRANSACTIONS LOADER
# ===================================================

SALES_MAPPING = {
    "dot": "transaction_date",
    "PTC": "sku_id",
    "quantity": "quantity_sold",
    "sale_price": "sale_price"
    # variable_weight ignored
}

def load_sales_transactions():
    csv_path = os.path.join(PROJECT_ROOT, "data", "clean", "sales_transactions.csv")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"❌ Missing cleaned file: {csv_path}")

    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()
    df = df.rename(columns=SALES_MAPPING)
    df = df[list(SALES_MAPPING.values())]

    df["quantity_sold"] = pd.to_numeric(df["quantity_sold"], errors="coerce").fillna(0)
    df["sale_price"] = pd.to_numeric(df["sale_price"], errors="coerce").fillna(0)

    df["transaction_date"] = pd.to_datetime(df["transaction_date"], errors="coerce")

    session: Session = SessionLocal()
    inserted = 0

    for _, row in df.iterrows():
        sale = SalesTransaction(
            transaction_date=row["transaction_date"],
            sku_id=str(row["sku_id"]).strip(),
            quantity_sold=int(row["quantity_sold"]),
            sale_price=float(row["sale_price"])
        )
        session.add(sale)
        inserted += 1

    session.commit()
    session.close()
    print(f"✔️ Loaded {inserted} sales transaction rows.")


# ===================================================
#               MAIN EXECUTION
# ===================================================

if __name__ == "__main__":
    print("🚀 Initializing database...")
    init_db()

    print("📦 Loading product master...")
    load_product_master()

    print("📦 Loading stock receipts...")
    load_stock_receipts()

    print("📦 Loading sales transactions...")
    load_sales_transactions()

    print("🎉 All data successfully imported!")
