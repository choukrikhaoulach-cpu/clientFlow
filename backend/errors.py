"""Shared API error handling utilities."""


class ApiError(Exception):
    """Raised to return a clean JSON error response with a specific status code."""

    def __init__(self, message, status_code=400, errors=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or {}

    def to_dict(self):
        payload = {"error": self.message}
        if self.errors:
            payload["fields"] = self.errors
        return payload


def register_error_handlers(app):
    from flask import jsonify

    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify(err.to_dict()), err.status_code

    @app.errorhandler(400)
    def handle_400(err):
        return jsonify({"error": "Bad request."}), 400

    @app.errorhandler(401)
    def handle_401(err):
        return jsonify({"error": "Authentication required."}), 401

    @app.errorhandler(403)
    def handle_403(err):
        return jsonify({"error": "You do not have access to this resource."}), 403

    @app.errorhandler(404)
    def handle_404(err):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(405)
    def handle_405(err):
        return jsonify({"error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def handle_500(err):
        from extensions import db

        db.session.rollback()
        return jsonify({"error": "An unexpected server error occurred."}), 500
