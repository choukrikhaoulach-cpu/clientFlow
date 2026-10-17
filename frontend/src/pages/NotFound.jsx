import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h2>404</h2>
        <p>This page doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Back to dashboard</Link>
      </div>
    </div>
  );
}
