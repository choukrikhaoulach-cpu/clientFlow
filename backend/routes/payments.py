from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Payment, Invoice
from errors import ApiError
from validators import require_json, require_fields, validate_choice, parse_date, parse_number

payments_bp = Blueprint("payments", __name__)


def _get_owned_invoice(invoice_id, user_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice or invoice.user_id != user_id:
        raise ApiError("Validation failed.", 400, {"invoice_id": "Invalid invoice."})
    return invoice


def _get_owned_payment(payment_id, user_id):
    payment = Payment.query.get(payment_id)
    if not payment:
        raise ApiError("Payment not found.", 404)
    if payment.user_id != user_id:
        raise ApiError("You do not have access to this payment.", 403)
    return payment


def _sync_invoice_status(invoice):
    """Mark an invoice paid automatically once payments cover the total."""
    if invoice.status in ("cancelled",):
        return
    if invoice.paid_amount() >= invoice.total and invoice.total > 0:
        invoice.status = "paid"
    elif invoice.status == "paid":
        invoice.status = "sent"


@payments_bp.get("")
@jwt_required()
def list_payments():
    user_id = int(get_jwt_identity())
    invoice_id = request.args.get("invoice_id")

    query = Payment.query.filter_by(user_id=user_id)
    if invoice_id:
        query = query.filter_by(invoice_id=invoice_id)

    payments = query.order_by(Payment.payment_date.desc()).all()
    return jsonify({"payments": [p.to_dict(include_invoice=True) for p in payments]}), 200


@payments_bp.post("")
@jwt_required()
def create_payment():
    user_id = int(get_jwt_identity())
    data = require_json()
    require_fields(data, ["invoice_id", "amount"])

    invoice = _get_owned_invoice(data["invoice_id"], user_id)
    amount = parse_number(data["amount"], "amount", minimum=0.01)
    method = data.get("method", "bank_transfer")
    validate_choice(method, Payment.VALID_METHODS, "method")

    payment = Payment(
        user_id=user_id,
        invoice_id=invoice.id,
        amount=amount,
        payment_date=parse_date(data.get("payment_date"), "payment_date") or None,
        method=method,
        notes=data.get("notes") or None,
    )
    db.session.add(payment)
    db.session.flush()
    _sync_invoice_status(invoice)
    db.session.commit()
    return jsonify({"payment": payment.to_dict(include_invoice=True)}), 201


@payments_bp.delete("/<int:payment_id>")
@jwt_required()
def delete_payment(payment_id):
    user_id = int(get_jwt_identity())
    payment = _get_owned_payment(payment_id, user_id)
    invoice = payment.invoice
    db.session.delete(payment)
    db.session.flush()
    if invoice:
        _sync_invoice_status(invoice)
    db.session.commit()
    return jsonify({"message": "Payment deleted."}), 200
