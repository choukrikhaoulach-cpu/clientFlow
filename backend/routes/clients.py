from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Client
from errors import ApiError
from validators import require_json, require_fields, validate_email

clients_bp = Blueprint("clients", __name__)


def _get_owned_client(client_id, user_id):
    client = Client.query.get(client_id)
    if not client:
        raise ApiError("Client not found.", 404)
    if client.user_id != user_id:
        raise ApiError("You do not have access to this client.", 403)
    return client


@clients_bp.get("")
@jwt_required()
def list_clients():
    user_id = int(get_jwt_identity())
    search = request.args.get("search", "").strip()

    query = Client.query.filter_by(user_id=user_id)
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Client.name.ilike(like), Client.company.ilike(like), Client.email.ilike(like))
        )

    clients = query.order_by(Client.created_at.desc()).all()
    return jsonify({"clients": [c.to_dict() for c in clients]}), 200


@clients_bp.post("")
@jwt_required()
def create_client():
    user_id = int(get_jwt_identity())
    data = require_json()
    require_fields(data, ["name"])

    if data.get("email"):
        validate_email(data["email"])

    client = Client(
        user_id=user_id,
        name=data["name"].strip(),
        company=data.get("company", "").strip() or None,
        email=data.get("email", "").strip() or None,
        phone=data.get("phone", "").strip() or None,
        address=data.get("address", "").strip() or None,
        notes=data.get("notes") or None,
    )
    db.session.add(client)
    db.session.commit()
    return jsonify({"client": client.to_dict()}), 201


@clients_bp.get("/<int:client_id>")
@jwt_required()
def get_client(client_id):
    user_id = int(get_jwt_identity())
    client = _get_owned_client(client_id, user_id)

    data = client.to_dict()
    data["projects"] = [p.to_dict() for p in client.projects]
    data["invoices"] = [i.to_dict() for i in client.invoices]
    data["notes_list"] = [n.to_dict() for n in client.client_notes]
    data["total_revenue"] = sum(
        payment.amount for invoice in client.invoices for payment in invoice.payments
    )
    return jsonify({"client": data}), 200


@clients_bp.patch("/<int:client_id>")
@jwt_required()
def update_client(client_id):
    user_id = int(get_jwt_identity())
    client = _get_owned_client(client_id, user_id)
    data = require_json()

    if data.get("email"):
        validate_email(data["email"])

    for field in ["name", "company", "email", "phone", "address", "notes"]:
        if field in data:
            value = data[field]
            setattr(client, field, value.strip() if isinstance(value, str) and value.strip() else (value or None))

    db.session.commit()
    return jsonify({"client": client.to_dict()}), 200


@clients_bp.delete("/<int:client_id>")
@jwt_required()
def delete_client(client_id):
    user_id = int(get_jwt_identity())
    client = _get_owned_client(client_id, user_id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({"message": "Client deleted."}), 200
