import pandas as pd
from pathlib import Path

# Detect project root automatically
BASE_DIR = Path(__file__).resolve().parents[1]

RAW_PATH = BASE_DIR / "data/raw"
CLEAN_PATH = BASE_DIR / "data/clean"
QUARANTINE_PATH = BASE_DIR / "data/quarantine"

CLEAN_PATH.mkdir(parents=True, exist_ok=True)
QUARANTINE_PATH.mkdir(parents=True, exist_ok=True)


def normalize_structure(df):
    """Standardize column names across all files."""
    rename_map = {
        "SalesPrice2": "sale_price",
        "Rate": "sale_price",
        "InwardRate": "cost_price",
        "lastInvoiceRate": "cost_price",
        "Qty": "quantity",
        "PrintName": "product_name",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    return df


def clean_product_master(filename):
    print(f"\n📌 Cleaning {filename}...")

    df = pd.read_csv(RAW_PATH / filename)
    df = normalize_structure(df)

    quarantine = []

    required_cols = ["PTC", "product_name"]

    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"❌ Missing required column '{col}' in {filename}")

    missing = df[df["PTC"].isna() | df["product_name"].isna()]
    if not missing.empty:
        missing["reason"] = "Missing PTC or product name"
        quarantine.append(missing.assign(source_file=filename))
        df = df.drop(missing.index)

    df.to_csv(CLEAN_PATH / filename, index=False)

    print(f"✔ Saved cleaned product master → {CLEAN_PATH / filename}")

    if quarantine:
        pd.concat(quarantine).to_csv(QUARANTINE_PATH / f"{filename}_quarantine.csv", index=False)
        print(f"⚠ Quarantined invalid rows.")

    return df


def clean_stock_receipts(filename, master_df):
    print(f"\n📌 Cleaning {filename}...")

    df = pd.read_csv(RAW_PATH / filename)
    df = normalize_structure(df)
    quarantine = []

    # Ensure required columns exist
    required_cols = ["PTC", "cost_price"]
    missing_cols = [c for c in required_cols if c not in df.columns]

    if missing_cols:
        raise ValueError(f"❌ Missing required field(s) in stock receipts: {missing_cols}")

    missing = df[df["PTC"].isna() | df["cost_price"].isna()]
    if not missing.empty:
        missing["reason"] = "Missing product or cost price"
        quarantine.append(missing.assign(source_file=filename))
        df = df.drop(missing.index)

    invalid_sku = df[~df["PTC"].isin(master_df["PTC"])]
    if not invalid_sku.empty:
        invalid_sku["reason"] = "Unknown product code (not in master)"
        quarantine.append(invalid_sku.assign(source_file=filename))
        df = df.drop(invalid_sku.index)

    df.to_csv(CLEAN_PATH / filename, index=False)
    print(f"✔ Stock receipts cleaned → {CLEAN_PATH / filename}")

    if quarantine:
        pd.concat(quarantine).to_csv(QUARANTINE_PATH / f"{filename}_quarantine.csv", index=False)

    return df


def clean_sales_transactions(filename, master_df):
    print(f"\n📌 Cleaning {filename}...")

    df = pd.read_csv(RAW_PATH / filename)
    df = normalize_structure(df)
    quarantine = []

    required_cols = ["PTC", "sale_price"]
    missing_cols = [c for c in required_cols if c not in df.columns]

    if missing_cols:
        raise ValueError(f"❌ Missing required field(s): {missing_cols}")

    missing = df[df["PTC"].isna() | df["sale_price"].isna()]
    if not missing.empty:
        missing["reason"] = "Missing product or sale price"
        quarantine.append(missing.assign(source_file=filename))
        df = df.drop(missing.index)

    unknown = df[~df["PTC"].isin(master_df["PTC"])]
    if not unknown.empty:
        unknown["reason"] = "Unknown PTC"
        quarantine.append(unknown.assign(source_file=filename))
        df = df.drop(unknown.index)

    # Detect variable pricing (loose items)
    variation = df.groupby("PTC")["sale_price"].nunique()
    variable_items = variation[variation > 1].index.tolist()
    df["variable_weight"] = df["PTC"].apply(lambda x: x in variable_items)

    df.to_csv(CLEAN_PATH / filename, index=False)
    print(f"✔ Sales data cleaned → {CLEAN_PATH / filename}")

    if quarantine:
        pd.concat(quarantine).to_csv(QUARANTINE_PATH / f"{filename}_quarantine.csv", index=False)

    return df


def run():
    print("\n🚀 Running full data cleaning pipeline...")

    master_df = clean_product_master("product_master.csv")
    clean_stock_receipts("stock_receipts.csv", master_df)
    clean_sales_transactions("sales_transactions.csv", master_df)

    print("\n🎉 Cleaning Complete — No fatal errors.\n")


if __name__ == "__main__":
    run()
