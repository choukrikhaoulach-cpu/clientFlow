import os
from flask import Flask, jsonify
from config import config_by_name
from extensions import db, jwt, cors
from errors import register_error_handlers, ApiError


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}},
        supports_credentials=True,
    )

    register_error_handlers(app)

    # JWT error handlers -> clean JSON instead of default HTML pages.
    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Authentication required."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid authentication token."}), 401

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return jsonify({"error": "Session expired. Please log in again."}), 401

    from routes.auth import auth_bp
    from routes.clients import clients_bp
    from routes.projects import projects_bp
    from routes.tasks import tasks_bp
    from routes.invoices import invoices_bp
    from routes.payments import payments_bp
    from routes.notes import notes_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(clients_bp, url_prefix="/api/clients")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(invoices_bp, url_prefix="/api/invoices")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(notes_bp, url_prefix="/api/notes")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "clientflow-api"})

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=app.config["DEBUG"])
