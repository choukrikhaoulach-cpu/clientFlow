"""Small dependency-free validation helpers shared across routes."""
import re
from datetime import datetime
from errors import ApiError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def require_json():
    from flask import request

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        raise ApiError("Request body must be valid JSON.", 400)
    return data


def require_fields(data, fields):
    errors = {}
    for field in fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and value.strip() == ""):
            errors[field] = "This field is required."
    if errors:
        raise ApiError("Validation failed.", 400, errors)


def validate_email(value, field="email"):
    if value and not EMAIL_RE.match(value):
        raise ApiError("Validation failed.", 400, {field: "Enter a valid email address."})


def validate_choice(value, choices, field):
    if value is not None and value not in choices:
        raise ApiError(
            "Validation failed.",
            400,
            {field: f"Must be one of: {', '.join(choices)}."},
        )


def parse_date(value, field="date"):
    """Parse an ISO date string (YYYY-MM-DD) into a date object, or None."""
    if value in (None, ""):
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ApiError("Validation failed.", 400, {field: "Use date format YYYY-MM-DD."})


def parse_number(value, field, minimum=None):
    if value is None:
        return 0
    try:
        number = float(value)
    except (ValueError, TypeError):
        raise ApiError("Validation failed.", 400, {field: "Must be a number."})
    if minimum is not None and number < minimum:
        raise ApiError("Validation failed.", 400, {field: f"Must be at least {minimum}."})
    return number
