from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User
from errors import ApiError
from validators import require_json, require_fields, validate_email

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = require_json()
    require_fields(data, ["name", "email", "password"])

    name = data["name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]

    validate_email(email)

    if len(password) < 8:
        raise ApiError("Validation failed.", 400, {"password": "Must be at least 8 characters."})

    if User.query.filter_by(email=email).first():
        raise ApiError("An account with this email already exists.", 409, {"email": "Already in use."})

    user = User(name=name, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = require_json()
    require_fields(data, ["email", "password"])

    email = data["email"].strip().lower()
    password = data["password"]

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        raise ApiError("Invalid email or password.", 401)

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        raise ApiError("User not found.", 404)
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.patch("/me")
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        raise ApiError("User not found.", 404)

    data = require_json()

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()

    if "email" in data and data["email"].strip():
        email = data["email"].strip().lower()
        validate_email(email)
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != user.id:
            raise ApiError("Email already in use.", 409, {"email": "Already in use."})
        user.email = email

    if "new_password" in data and data["new_password"]:
        current_password = data.get("current_password", "")
        if not user.check_password(current_password):
            raise ApiError("Validation failed.", 400, {"current_password": "Incorrect current password."})
        if len(data["new_password"]) < 8:
            raise ApiError("Validation failed.", 400, {"new_password": "Must be at least 8 characters."})
        user.set_password(data["new_password"])

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200
