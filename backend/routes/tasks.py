from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Task, Project
from errors import ApiError
from validators import require_json, require_fields, validate_choice, parse_date

tasks_bp = Blueprint("tasks", __name__)


def _get_owned_task(task_id, user_id):
    task = Task.query.get(task_id)
    if not task:
        raise ApiError("Task not found.", 404)
    if task.user_id != user_id:
        raise ApiError("You do not have access to this task.", 403)
    return task


def _get_owned_project(project_id, user_id):
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise ApiError("Validation failed.", 400, {"project_id": "Invalid project."})
    return project


@tasks_bp.get("")
@jwt_required()
def list_tasks():
    user_id = int(get_jwt_identity())
    status = request.args.get("status")
    priority = request.args.get("priority")
    project_id = request.args.get("project_id")

    query = Task.query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if project_id:
        query = query.filter_by(project_id=project_id)

    tasks = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()
    return jsonify({"tasks": [t.to_dict(include_project=True) for t in tasks]}), 200


@tasks_bp.post("")
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data = require_json()
    require_fields(data, ["title", "project_id"])

    _get_owned_project(data["project_id"], user_id)

    status = data.get("status", "todo")
    priority = data.get("priority", "medium")
    validate_choice(status, Task.VALID_STATUSES, "status")
    validate_choice(priority, Task.VALID_PRIORITIES, "priority")

    task = Task(
        user_id=user_id,
        project_id=data["project_id"],
        title=data["title"].strip(),
        description=data.get("description") or None,
        status=status,
        priority=priority,
        due_date=parse_date(data.get("due_date"), "due_date"),
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"task": task.to_dict(include_project=True)}), 201


@tasks_bp.patch("/<int:task_id>")
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = _get_owned_task(task_id, user_id)
    data = require_json()

    if "project_id" in data:
        _get_owned_project(data["project_id"], user_id)
        task.project_id = data["project_id"]

    if "status" in data:
        validate_choice(data["status"], Task.VALID_STATUSES, "status")
        task.status = data["status"]

    if "priority" in data:
        validate_choice(data["priority"], Task.VALID_PRIORITIES, "priority")
        task.priority = data["priority"]

    if "title" in data and data["title"].strip():
        task.title = data["title"].strip()

    if "description" in data:
        task.description = data["description"] or None

    if "due_date" in data:
        task.due_date = parse_date(data["due_date"], "due_date")

    db.session.commit()
    return jsonify({"task": task.to_dict(include_project=True)}), 200


@tasks_bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = _get_owned_task(task_id, user_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted."}), 200
