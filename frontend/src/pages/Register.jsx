import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../api/client";
import Input from "../components/Input";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";
import AuthIllustration from "../components/AuthIllustration";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <AuthIllustration />

      <div className="auth-split-form">
        <div className="auth-card">
          <h3>Create your workspace</h3>
          <p className="mb-16">Start managing your business more efficiently.</p>
          <ErrorMessage message={error} />
          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Full name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={fieldErrors.name}
              placeholder="Jane Doe"
            />
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={fieldErrors.email}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={fieldErrors.password}
              hint="At least 8 characters."
              placeholder="••••••••"
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
