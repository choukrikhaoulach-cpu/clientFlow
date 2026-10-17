from datetime import date, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Client, Project, Task, Invoice, Payment

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/stats")
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())

    total_clients = Client.query.filter_by(user_id=user_id).count()
    active_projects = Project.query.filter_by(user_id=user_id).filter(
        Project.status.in_(["planning", "in_progress"])
    ).count()

    invoices = Invoice.query.filter_by(user_id=user_id).all()
    pending_invoices = len([i for i in invoices if i.status in ("sent", "overdue")])

    total_invoiced = sum(i.total for i in invoices)
    paid_amount = sum(i.paid_amount() for i in invoices)
    unpaid_amount = sum(
        max(i.total - i.paid_amount(), 0) for i in invoices if i.status not in ("cancelled",)
    )
    overdue_amount = sum(
        max(i.total - i.paid_amount(), 0) for i in invoices if i.status == "overdue"
    )

    # Monthly revenue for the last 6 months, based on recorded payments.
    today = date.today()
    months = []
    for offset in range(5, -1, -1):
        month_index = today.month - offset
        year = today.year
        while month_index <= 0:
            month_index += 12
            year -= 1
        months.append((year, month_index))

    payments = Payment.query.filter_by(user_id=user_id).all()
    monthly_revenue = []
    for year, month in months:
        total = sum(
            p.amount for p in payments if p.payment_date and p.payment_date.year == year and p.payment_date.month == month
        )
        monthly_revenue.append({"year": year, "month": month, "total": round(total, 2)})

    recent_invoices = (
        Invoice.query.filter_by(user_id=user_id).order_by(Invoice.created_at.desc()).limit(5).all()
    )
    upcoming_tasks = (
        Task.query.filter_by(user_id=user_id)
        .filter(Task.status != "completed")
        .filter(Task.due_date.isnot(None))
        .order_by(Task.due_date.asc())
        .limit(5)
        .all()
    )

    recent_activity = []
    for invoice in Invoice.query.filter_by(user_id=user_id).order_by(Invoice.created_at.desc()).limit(3):
        recent_activity.append(
            {
                "type": "invoice",
                "message": f"Invoice {invoice.invoice_number} created",
                "timestamp": invoice.created_at.isoformat(),
            }
        )
    for client in Client.query.filter_by(user_id=user_id).order_by(Client.created_at.desc()).limit(3):
        recent_activity.append(
            {
                "type": "client",
                "message": f"Client {client.name} added",
                "timestamp": client.created_at.isoformat(),
            }
        )
    recent_activity.sort(key=lambda item: item["timestamp"], reverse=True)
    recent_activity = recent_activity[:5]

    return jsonify(
        {
            "total_clients": total_clients,
            "active_projects": active_projects,
            "pending_invoices": pending_invoices,
            "total_invoiced": round(total_invoiced, 2),
            "paid_amount": round(paid_amount, 2),
            "unpaid_amount": round(unpaid_amount, 2),
            "overdue_amount": round(overdue_amount, 2),
            "monthly_revenue": monthly_revenue,
            "recent_invoices": [i.to_dict(include_client=True) for i in recent_invoices],
            "upcoming_tasks": [t.to_dict(include_project=True) for t in upcoming_tasks],
            "recent_activity": recent_activity,
        }
    ), 200
