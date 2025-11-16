from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database.models import SalesTransaction


class RevenueCalculator:
    """
    Class-based implementation for total revenue.
    Router may call this version.
    """

    @staticmethod
    def calculate_total_revenue(
        db: Session,
        start_date: datetime = None,
        end_date: datetime = None
    ):
        # Default: last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        try:
            total_revenue = (
                db.query(
                    func.coalesce(
                        func.sum(
                            SalesTransaction.quantity_sold *
                            SalesTransaction.sale_price
                        ),
                        0.0
                    )
                )
                .filter(SalesTransaction.transaction_date >= start_date)
                .filter(SalesTransaction.transaction_date <= end_date)
                .scalar()
            )
        except Exception as e:
            return {
                "status": "error",
                "message": f"Revenue calculation failed: {e}"
            }

        return {
            "total_revenue": float(total_revenue),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }


# ----------------------------------------------------------------------
# MODULE-LEVEL FUNCTION (router depends on this)
# ----------------------------------------------------------------------
def calculate_total_revenue(
    db: Session,
    start_date: datetime = None,
    end_date: datetime = None
):
    """
    The router calls this function directly.
    We simply delegate to the class method for consistency.
    """
    return RevenueCalculator.calculate_total_revenue(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
