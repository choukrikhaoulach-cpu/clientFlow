from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Project, Client
from errors import ApiError
from validators import require_json, require_fields, validate_choice, parse_date, parse_number

projects_bp = Blueprint("projects", __name__)


def _get_owned_project(project_id, user_id):
    project = Project.query.get(project_id)
    if not project:
        raise ApiError("Project not found.", 404)
    if project.user_id != user_id:
        raise ApiError("You do not have access to this project.", 403)
    return project


def _get_owned_client(client_id, user_id):
    client = Client.query.get(client_id)
    if not client or client.user_id != user_id:
        raise ApiError("Validation failed.", 400, {"client_id": "Invalid client."})
    return client


@projects_bp.get("")
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    status = request.args.get("status")
    client_id = request.args.get("client_id")

    query = Project.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status)
    if client_id:
        query = query.filter_by(client_id=client_id)

    projects = query.order_by(Project.created_at.desc()).all()
    return jsonify({"projects": [p.to_dict(include_client=True) for p in projects]}), 200


@projects_bp.post("")
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = require_json()
    require_fields(data, ["name", "client_id"])

    _get_owned_client(data["client_id"], user_id)

    status = data.get("status", "planning")
    validate_choice(status, Project.VALID_STATUSES, "status")

    project = Project(
        user_id=user_id,
        client_id=data["client_id"],
        name=data["name"].strip(),
        description=data.get("description") or None,
        status=status,
        deadline=parse_date(data.get("deadline"), "deadline"),
        budget=parse_number(data.get("budget"), "budget", minimum=0),
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({"project": project.to_dict(include_client=True)}), 201


@projects_bp.get("/<int:project_id>")
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    project = _get_owned_project(project_id, user_id)
    data = project.to_dict(include_client=True)
    data["tasks"] = [t.to_dict() for t in project.tasks]
    return jsonify({"project": data}), 200


@projects_bp.patch("/<int:project_id>")
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    project = _get_owned_project(project_id, user_id)
    data = require_json()

    if "client_id" in data:
        _get_owned_client(data["client_id"], user_id)
        project.client_id = data["client_id"]

    if "status" in data:
        validate_choice(data["status"], Project.VALID_STATUSES, "status")
        project.status = data["status"]

    if "name" in data and data["name"].strip():
        project.name = data["name"].strip()

    if "description" in data:
        project.description = data["description"] or None

    if "deadline" in data:
        project.deadline = parse_date(data["deadline"], "deadline")

    if "budget" in data:
        project.budget = parse_number(data["budget"], "budget", minimum=0)

    db.session.commit()
    return jsonify({"project": project.to_dict(include_client=True)}), 200


@projects_bp.delete("/<int:project_id>")
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    project = _get_owned_project(project_id, user_id)
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted."}), 200
