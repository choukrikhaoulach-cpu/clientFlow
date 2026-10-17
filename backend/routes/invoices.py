from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Invoice, InvoiceItem, Client
from errors import ApiError
from validators import require_json, require_fields, validate_choice, parse_date, parse_number

invoices_bp = Blueprint("invoices", __name__)


def _get_owned_invoice(invoice_id, user_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        raise ApiError("Invoice not found.", 404)
    if invoice.user_id != user_id:
        raise ApiError("You do not have access to this invoice.", 403)
    return invoice


def _get_owned_client(client_id, user_id):
    client = Client.query.get(client_id)
    if not client or client.user_id != user_id:
        raise ApiError("Validation failed.", 400, {"client_id": "Invalid client."})
    return client


def _next_invoice_number(user_id):
    count = Invoice.query.filter_by(user_id=user_id).count()
    return f"INV-{count + 1:05d}"


def _build_items(raw_items):
    if not raw_items or not isinstance(raw_items, list):
        raise ApiError("Validation failed.", 400, {"items": "At least one invoice item is required."})

    items = []
    subtotal = 0.0
    for index, raw in enumerate(raw_items):
        description = (raw.get("description") or "").strip()
        if not description:
            raise ApiError("Validation failed.", 400, {"items": f"Item {index + 1} needs a description."})
        quantity = parse_number(raw.get("quantity", 1), "quantity", minimum=0)
        unit_price = parse_number(raw.get("unit_price", 0), "unit_price", minimum=0)
        total = round(quantity * unit_price, 2)
        subtotal += total
        items.append(InvoiceItem(description=description, quantity=quantity, unit_price=unit_price, total=total))
    return items, round(subtotal, 2)


@invoices_bp.get("")
@jwt_required()
def list_invoices():
    user_id = int(get_jwt_identity())
    status = request.args.get("status")
    client_id = request.args.get("client_id")

    query = Invoice.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status)
    if client_id:
        query = query.filter_by(client_id=client_id)

    invoices = query.order_by(Invoice.created_at.desc()).all()
    return jsonify({"invoices": [i.to_dict(include_client=True) for i in invoices]}), 200


@invoices_bp.post("")
@jwt_required()
def create_invoice():
    user_id = int(get_jwt_identity())
    data = require_json()
    require_fields(data, ["client_id"])

    _get_owned_client(data["client_id"], user_id)

    status = data.get("status", "draft")
    validate_choice(status, Invoice.VALID_STATUSES, "status")

    items, subtotal = _build_items(data.get("items"))
    tax_rate = parse_number(data.get("tax_rate", 0), "tax_rate", minimum=0)
    tax = round(subtotal * (tax_rate / 100), 2)
    total = round(subtotal + tax, 2)

    invoice = Invoice(
        user_id=user_id,
        client_id=data["client_id"],
        invoice_number=data.get("invoice_number", "").strip() or _next_invoice_number(user_id),
        issue_date=parse_date(data.get("issue_date"), "issue_date") or None,
        due_date=parse_date(data.get("due_date"), "due_date"),
        status=status,
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=data.get("notes") or None,
    )
    invoice.items = items

    db.session.add(invoice)
    db.session.commit()
    return jsonify({"invoice": invoice.to_dict(include_items=True, include_client=True)}), 201


@invoices_bp.get("/<int:invoice_id>")
@jwt_required()
def get_invoice(invoice_id):
    user_id = int(get_jwt_identity())
    invoice = _get_owned_invoice(invoice_id, user_id)
    data = invoice.to_dict(include_items=True, include_client=True)
    data["payments"] = [p.to_dict() for p in invoice.payments]
    return jsonify({"invoice": data}), 200


@invoices_bp.patch("/<int:invoice_id>")
@jwt_required()
def update_invoice(invoice_id):
    user_id = int(get_jwt_identity())
    invoice = _get_owned_invoice(invoice_id, user_id)
    data = require_json()

    if "client_id" in data:
        _get_owned_client(data["client_id"], user_id)
        invoice.client_id = data["client_id"]

    if "status" in data:
        validate_choice(data["status"], Invoice.VALID_STATUSES, "status")
        invoice.status = data["status"]

    if "invoice_number" in data and data["invoice_number"].strip():
        invoice.invoice_number = data["invoice_number"].strip()

    if "issue_date" in data:
        invoice.issue_date = parse_date(data["issue_date"], "issue_date")

    if "due_date" in data:
        invoice.due_date = parse_date(data["due_date"], "due_date")

    if "notes" in data:
        invoice.notes = data["notes"] or None

    if "items" in data:
        items, subtotal = _build_items(data.get("items"))
        # Replace items cleanly to avoid orphaned rows.
        invoice.items = items
        tax_rate = parse_number(data.get("tax_rate", (invoice.tax / invoice.subtotal * 100) if invoice.subtotal else 0), "tax_rate", minimum=0)
        tax = round(subtotal * (tax_rate / 100), 2)
        invoice.subtotal = subtotal
        invoice.tax = tax
        invoice.total = round(subtotal + tax, 2)
    elif "tax_rate" in data:
        tax_rate = parse_number(data["tax_rate"], "tax_rate", minimum=0)
        invoice.tax = round(invoice.subtotal * (tax_rate / 100), 2)
        invoice.total = round(invoice.subtotal + invoice.tax, 2)

    db.session.commit()
    return jsonify({"invoice": invoice.to_dict(include_items=True, include_client=True)}), 200


@invoices_bp.delete("/<int:invoice_id>")
@jwt_required()
def delete_invoice(invoice_id):
    user_id = int(get_jwt_identity())
    invoice = _get_owned_invoice(invoice_id, user_id)
    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "Invoice deleted."}), 200
