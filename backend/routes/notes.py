from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Note, Client
from errors import ApiError
from validators import require_json, require_fields

notes_bp = Blueprint("notes", __name__)


def _get_owned_note(note_id, user_id):
    note = Note.query.get(note_id)
    if not note:
        raise ApiError("Note not found.", 404)
    if note.user_id != user_id:
        raise ApiError("You do not have access to this note.", 403)
    return note


@notes_bp.get("")
@jwt_required()
def list_notes():
    user_id = int(get_jwt_identity())
    search = request.args.get("search", "").strip()
    client_id = request.args.get("client_id")

    query = Note.query.filter_by(user_id=user_id)
    if client_id:
        query = query.filter_by(client_id=client_id)
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Note.title.ilike(like), Note.content.ilike(like)))

    notes = query.order_by(Note.updated_at.desc()).all()
    return jsonify({"notes": [n.to_dict(include_client=True) for n in notes]}), 200


@notes_bp.post("")
@jwt_required()
def create_note():
    user_id = int(get_jwt_identity())
    data = require_json()
    require_fields(data, ["title"])

    client_id = data.get("client_id")
    if client_id:
        client = Client.query.get(client_id)
        if not client or client.user_id != user_id:
            raise ApiError("Validation failed.", 400, {"client_id": "Invalid client."})

    note = Note(
        user_id=user_id,
        client_id=client_id or None,
        title=data["title"].strip(),
        content=data.get("content") or None,
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({"note": note.to_dict(include_client=True)}), 201


@notes_bp.patch("/<int:note_id>")
@jwt_required()
def update_note(note_id):
    user_id = int(get_jwt_identity())
    note = _get_owned_note(note_id, user_id)
    data = require_json()

    if "title" in data and data["title"].strip():
        note.title = data["title"].strip()

    if "content" in data:
        note.content = data["content"] or None

    if "client_id" in data:
        client_id = data["client_id"]
        if client_id:
            client = Client.query.get(client_id)
            if not client or client.user_id != user_id:
                raise ApiError("Validation failed.", 400, {"client_id": "Invalid client."})
        note.client_id = client_id or None

    db.session.commit()
    return jsonify({"note": note.to_dict(include_client=True)}), 200


@notes_bp.delete("/<int:note_id>")
@jwt_required()
def delete_note(note_id):
    user_id = int(get_jwt_identity())
    note = _get_owned_note(note_id, user_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note deleted."}), 200
