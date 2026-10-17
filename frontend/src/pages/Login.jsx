import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage, getFieldErrors } from "../api/client";
import Input from "../components/Input";
import Button from "../components/Button";
import ErrorMessage from "../components/ErrorMessage";
import AuthIllustration from "../components/AuthIllustration";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await login(form);
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
          <h3>Welcome back</h3>
          <p className="mb-16">Sign in to continue managing your business.</p>
          <ErrorMessage message={error} />
          <form onSubmit={handleSubmit} noValidate>
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
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={fieldErrors.password}
              placeholder="••••••••"
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
