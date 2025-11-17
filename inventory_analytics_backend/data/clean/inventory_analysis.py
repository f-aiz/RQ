import pandas as pd

def analyze_business_data(product_file, sales_file, receipts_file):
    """
    Performs a comprehensive financial and inventory analysis from three CSV files.

    Args:
        product_file (str): Filepath to product_master.csv
        sales_file (str): Filepath to sales_transactions.csv
        receipts_file (str): Filepath to stock_receipts.csv
    """
    try:
        # --- 1. Load and Prepare Data ---
        print("Loading data...")
        
        # Load Product Master
        # We use low_memory=False to avoid DtypeWarning for potentially mixed-type columns
        pm_df = pd.read_csv(product_file, low_memory=False)
        # Set PTC as index for easy lookup
        pm_df = pm_df.set_index('PTC')
        
        # Load Sales Transactions
        sales_df = pd.read_csv(sales_file, low_memory=False)
        sales_df['dot'] = pd.to_datetime(sales_df['dot'])
        
        # Load Stock Receipts
        receipts_df = pd.read_csv(receipts_file, low_memory=False)
        receipts_df['dot'] = pd.to_datetime(receipts_df['dot'])

        print("Data loaded successfully.\n")
        print("---" * 10)
        print("PERFORMANCE METRICS")
        print("---" * 10)

        # --- 2. Calculate Total Revenue and Profit ---
        
        # Calculate revenue for each sale
        sales_df['revenue'] = sales_df['quantity'] * sales_df['sale_price']
        total_revenue = sales_df['revenue'].sum()
        print(f"Total Revenue: {total_revenue:,.2f}")

        # Join sales with product master to get cost_price for COGS
        sales_with_cost = sales_df.join(pm_df['cost_price'], on='PTC')
        
        # Handle cases where a sold item might be missing from product_master
        sales_with_cost['cost_price'] = sales_with_cost['cost_price'].fillna(0)
        
        # Calculate Cost of Goods Sold (COGS) for each sale
        sales_with_cost['cogs'] = sales_with_cost['quantity'] * sales_with_cost['cost_price']
        total_cogs = sales_with_cost['cogs'].sum()
        
        total_profit = total_revenue - total_cogs
        print(f"Total Profit (Revenue - COGS): {total_profit:,.2f}")

        # --- 3. Calculate Purchase Price Variance (PPV) ---
        
        # Join receipts with product master to get 'standard' cost
        receipts_with_standard_cost = receipts_df.join(pm_df['cost_price'], on='PTC', rsuffix='_standard')
        
        # Rename columns for clarity
        receipts_with_standard_cost.rename(columns={
            'cost_price': 'actual_cost',
            'cost_price_standard': 'standard_cost'
        }, inplace=True)
        
        # Handle missing standard costs
        receipts_with_standard_cost['standard_cost'] = receipts_with_standard_cost['standard_cost'].fillna(
            receipts_with_standard_cost['actual_cost'] # If no standard, variance is 0
        )
        
        # Calculate PPV for each receipt
        receipts_with_standard_cost['ppv'] = (
            receipts_with_standard_cost['standard_cost'] - receipts_with_standard_cost['actual_cost']
        ) * receipts_with_standard_cost['quantity']
        
        total_ppv = receipts_with_standard_cost['ppv'].sum()
        print(f"Purchase Price Variance (PPV): {total_ppv:,.2f}")

        # --- 4. Calculate Current Inventory Levels and Value ---

        # Get total quantity received for each product
        total_in = receipts_df.groupby('PTC')['quantity'].sum()
        
        # Get total quantity sold for each product
        total_out = sales_df.groupby('PTC')['quantity'].sum()
        
        # Calculate current stock (In - Out)
        current_stock = total_in.sub(total_out, fill_value=0)
        
        # Filter for items actually in stock
        current_stock = current_stock[current_stock > 0]
        
        # Get the product master data for items in stock
        current_inventory_df = pm_df.loc[current_stock.index].copy()
        current_inventory_df['current_quantity'] = current_stock
        
        # Calculate the value of each item in stock (using standard cost_price)
        current_inventory_df['inventory_value'] = current_inventory_df['current_quantity'] * current_inventory_df['cost_price']
        
        total_inventory_value = current_inventory_df['inventory_value'].sum()
        print(f"Current Inventory Value: {total_inventory_value:,.2f}")

        # --- 5. Calculate Inventory Value vs. Cash Outflow ---
        
        # Cash outflow is the actual amount spent on receipts
        receipts_df['cash_outflow'] = receipts_df['quantity'] * receipts_df['cost_price']
        total_cash_outflow = receipts_df['cash_outflow'].sum()
        
        print(f"Total Cash Outflow (on Stock): {total_cash_outflow:,.2f}")
        print(f"  (Inventory Value vs Cash Outflow Ratio: {total_inventory_value / total_cash_outflow:.2%})")

        # --- 6. Calculate Average Stock Age (FIFO) ---
        print("\nCalculating Average Stock Age (this may take a moment)...")
        
        # Find the "current date" for age calculation
        today = max(sales_df['dot'].max(), receipts_df['dot'].max())
        
        total_weighted_age = 0
        total_items_in_stock = current_stock.sum()
        
        # Sort receipts by date (newest first) for FIFO logic
        receipts_sorted = receipts_df.sort_values(by='dot', ascending=False)
        
        for ptc, quantity_needed in current_stock.items():
            # Get all receipts for this one item
            item_receipts = receipts_sorted[receipts_sorted['PTC'] == ptc]
            
            for _, receipt in item_receipts.iterrows():
                if quantity_needed == 0:
                    break
                
                # Calculate age of this specific receipt
                age_in_days = (today - receipt['dot']).days
                
                if receipt['quantity'] <= quantity_needed:
                    # This entire receipt is still in stock
                    total_weighted_age += age_in_days * receipt['quantity']
                    quantity_needed -= receipt['quantity']
                else:
                    # A portion of this receipt is in stock
                    total_weighted_age += age_in_days * quantity_needed
                    quantity_needed = 0
        
        if total_items_in_stock > 0:
            avg_stock_age = total_weighted_age / total_items_in_stock
            print(f"Average Stock Age (FIFO): {avg_stock_age:.1f} days")
        else:
            print("Average Stock Age (FIFO): 0 days (No stock)")

        # --- 7. Metric Not Calculable ---
        print("\nNote on 'Net Credit Position':")
        print("  This metric cannot be calculated from the provided CSVs. It requires data on accounts receivable (money owed by customers) and accounts payable (money owed to suppliers), which is not present.")

        # --- 8. Generate Trend Data for Graphs ---
        print("\n" + "---" * 10)
        print("TREND ANALYSIS (DATA EXPORT)")
        print("---" * 10)
        
        # --- Revenue Trend Overview ---
        print("Calculating Revenue Trend Overview (30D, 3M, 6M, 1Y, 2Y)...")
        
        def get_revenue_for_period(df, end_date, days):
            start_date = end_date - pd.Timedelta(days=days)
            period_revenue = df[(df['dot'] >= start_date) & (df['dot'] <= end_date)]['revenue'].sum()
            return period_revenue

        end_date = sales_df['dot'].max()
        print(f"  Revenue Last 30 Days: {get_revenue_for_period(sales_df, end_date, 30):,.2f}")
        print(f"  Revenue Last 3 Months (90d): {get_revenue_for_period(sales_df, end_date, 90):,.2f}")
        print(f"  Revenue Last 6 Months (180d): {get_revenue_for_period(sales_df, end_date, 180):,.2f}")
        print(f"  Revenue Last 1 Year (365d): {get_revenue_for_period(sales_df, end_date, 365):,.2f}")
        print(f"  Revenue Last 2 Years (730d): {get_revenue_for_period(sales_df, end_date, 730):,.2f}")
        
        # Generate monthly revenue data for graphing
        monthly_revenue = sales_df.set_index('dot')['revenue'].resample('ME').sum()
        monthly_revenue.name = "total_revenue"
        monthly_revenue.to_csv("monthly_revenue_trend.csv")
        print("\nSaved 'monthly_revenue_trend.csv' for graphing.")

        # --- Cash Outflow Trend ---
        
        # Generate monthly cash outflow data for graphing
        monthly_outflow = receipts_df.set_index('dot')['cash_outflow'].resample('ME').sum()
        monthly_outflow.name = "total_cash_outflow"
        monthly_outflow.to_csv("monthly_cash_outflow_trend.csv")
        print("Saved 'monthly_cash_outflow_trend.csv' for graphing.")
        
        print("\nAnalysis complete.")

    except FileNotFoundError as e:
        print(f"Error: File not found.")
        print(f"Please make sure the file '{e.filename}' is in the same directory as the script.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback
        traceback.print_exc()

# --- Main execution ---
if __name__ == "__main__":
    # Define your filenames here
    PRODUCT_MASTER_FILE = "product_master.csv"
    SALES_TRANSACTIONS_FILE = "sales_transactions.csv"
    STOCK_RECEIPTS_FILE = "stock_receipts.csv"
    
    analyze_business_data(PRODUCT_MASTER_FILE, SALES_TRANSACTIONS_FILE, STOCK_RECEIPTS_FILE)