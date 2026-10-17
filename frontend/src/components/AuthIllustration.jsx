import { CheckCircle2, TrendingUp } from "lucide-react";

/**
 * Left-hand panel for the auth split-screen.
 * Pure SVG/CSS composition — no external image assets — built from the
 * existing ClientFlow design tokens (see styles/variables.css).
 */
export default function AuthIllustration() {
  return (
    <div className="auth-illustration">
      <div className="auth-illustration-copy">
        <div className="auth-brand">
          <span className="mark">CF</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>
            ClientFlow
          </span>
        </div>
        <h1 className="auth-illustration-headline">Everything you need to run your business.</h1>
        <p className="auth-illustration-subhead">
          Manage clients, projects, tasks and invoices — all in one simple workspace.
        </p>

        <ul className="auth-illustration-trust">
          <li>
            <CheckCircle2 size={18} /> Manage your clients
          </li>
          <li>
            <CheckCircle2 size={18} /> Track your projects
          </li>
          <li>
            <CheckCircle2 size={18} /> Get paid faster
          </li>
        </ul>
      </div>

      <div className="auth-illustration-stage" aria-hidden="true">
        <svg
          className="auth-illustration-bg"
          viewBox="0 0 560 520"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="stageGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-primary-dark)" />
              <stop offset="100%" stopColor="var(--color-primary)" />
            </linearGradient>
            <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="560" height="520" rx="28" fill="url(#stageGradient)" />

          {/* decorative shapes */}
          <circle cx="470" cy="70" r="120" fill="url(#ringGradient)" />
          <circle cx="60" cy="460" r="90" fill="rgba(255,255,255,0.06)" />
          <circle cx="500" cy="440" r="10" fill="var(--color-accent)" opacity="0.7" />
          <circle cx="40" cy="90" r="6" fill="#fff" opacity="0.35" />
          <circle cx="90" cy="60" r="3" fill="#fff" opacity="0.35" />
          <path
            d="M20 300 C 140 260, 180 340, 300 300 S 460 250, 540 300"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Client card */}
        <div className="float-card card-client">
          <div className="float-card-row">
            <span className="float-avatar">AM</span>
            <div>
              <div className="float-title">Amina M.</div>
              <div className="float-subtitle">Acme Studio</div>
            </div>
          </div>
          <span className="badge badge-accent" style={{ marginTop: 10 }}>
            <span className="badge-dot" /> Active client
          </span>
        </div>

        {/* Project progress card */}
        <div className="float-card card-project">
          <div className="float-title">Website Revamp</div>
          <div className="float-subtitle" style={{ marginBottom: 10 }}>
            Project progress
          </div>
          <div className="float-progress-track">
            <div className="float-progress-fill" style={{ width: "72%" }} />
          </div>
          <div className="float-subtitle" style={{ marginTop: 6, textAlign: "right" }}>
            72%
          </div>
        </div>

        {/* Invoice / payment card */}
        <div className="float-card card-invoice">
          <div className="flex justify-between items-center">
            <span className="float-title num">INV-0842</span>
            <span className="badge badge-accent">
              <span className="badge-dot" /> Paid
            </span>
          </div>
          <div className="float-amount num">$2,450.00</div>
          <div className="float-subtitle">Paid by bank transfer</div>
        </div>

        {/* Growth indicator */}
        <div className="float-card card-growth">
          <div className="float-subtitle">Monthly revenue</div>
          <div className="flex items-center gap-8" style={{ marginTop: 4 }}>
            <TrendingUp size={16} color="var(--color-accent)" />
            <span className="float-title" style={{ color: "var(--color-accent)" }}>
              +18.4%
            </span>
          </div>
          <svg viewBox="0 0 96 28" className="float-sparkline">
            <polyline
              points="0,24 16,20 32,22 48,12 64,14 80,4 96,6"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
