from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    clients = db.relationship("Client", backref="user", lazy=True, cascade="all, delete-orphan")
    projects = db.relationship("Project", backref="user", lazy=True, cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")
    invoices = db.relationship("Invoice", backref="user", lazy=True, cascade="all, delete-orphan")
    payments = db.relationship("Payment", backref="user", lazy=True, cascade="all, delete-orphan")
    notes = db.relationship("Note", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(180), nullable=False)
    company = db.Column(db.String(180))
    email = db.Column(db.String(180))
    phone = db.Column(db.String(60))
    address = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = db.relationship("Project", backref="client", lazy=True, cascade="all, delete-orphan")
    invoices = db.relationship("Invoice", backref="client", lazy=True, cascade="all, delete-orphan")
    client_notes = db.relationship("Note", backref="client", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "company": self.company,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Project(db.Model):
    __tablename__ = "projects"

    VALID_STATUSES = ("planning", "in_progress", "completed", "on_hold")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False, index=True)
    name = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(30), default="planning")
    deadline = db.Column(db.Date)
    budget = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    tasks = db.relationship("Task", backref="project", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_client=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "client_id": self.client_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "budget": self.budget,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "task_count": len(self.tasks) if self.tasks is not None else 0,
            "completed_task_count": len([t for t in self.tasks if t.status == "completed"]),
        }
        if include_client:
            data["client_name"] = self.client.name if self.client else None
        return data


class Task(db.Model):
    __tablename__ = "tasks"

    VALID_STATUSES = ("todo", "in_progress", "completed")
    VALID_PRIORITIES = ("low", "medium", "high")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(30), default="todo")
    priority = db.Column(db.String(20), default="medium")
    due_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_project=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_project:
            data["project_name"] = self.project.name if self.project else None
            data["client_name"] = (
                self.project.client.name if self.project and self.project.client else None
            )
        return data


class Invoice(db.Model):
    __tablename__ = "invoices"

    VALID_STATUSES = ("draft", "sent", "paid", "overdue", "cancelled")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False, index=True)
    invoice_number = db.Column(db.String(60), nullable=False)
    issue_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    due_date = db.Column(db.Date)
    status = db.Column(db.String(30), default="draft")
    subtotal = db.Column(db.Float, default=0)
    tax = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("InvoiceItem", backref="invoice", lazy=True, cascade="all, delete-orphan")
    payments = db.relationship("Payment", backref="invoice", lazy=True, cascade="all, delete-orphan")

    def paid_amount(self):
        return round(sum(p.amount for p in self.payments), 2)

    def to_dict(self, include_items=False, include_client=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "client_id": self.client_id,
            "invoice_number": self.invoice_number,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "subtotal": self.subtotal,
            "tax": self.tax,
            "total": self.total,
            "notes": self.notes,
            "paid_amount": self.paid_amount(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_client:
            data["client_name"] = self.client.name if self.client else None
            data["client"] = self.client.to_dict() if self.client else None
        if include_items:
            data["items"] = [i.to_dict() for i in self.items]
        return data


class InvoiceItem(db.Model):
    __tablename__ = "invoice_items"

    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id"), nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Float, default=1)
    unit_price = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "invoice_id": self.invoice_id,
            "description": self.description,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "total": self.total,
        }


class Payment(db.Model):
    __tablename__ = "payments"

    VALID_METHODS = ("cash", "bank_transfer", "card", "paypal", "other")

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id"), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    method = db.Column(db.String(60), default="bank_transfer")
    notes = db.Column(db.Text)

    def to_dict(self, include_invoice=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "invoice_id": self.invoice_id,
            "amount": self.amount,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "method": self.method,
            "notes": self.notes,
        }
        if include_invoice:
            data["invoice_number"] = self.invoice.invoice_number if self.invoice else None
            data["client_name"] = (
                self.invoice.client.name if self.invoice and self.invoice.client else None
            )
        return data


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True, index=True)
    title = db.Column(db.String(180), nullable=False)
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_client=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "client_id": self.client_id,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_client:
            data["client_name"] = self.client.name if self.client_id and self.client else None
        return data
