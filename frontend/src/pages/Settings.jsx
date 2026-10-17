import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../api/client";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileErrors({});
    try {
      await updateProfile(profileForm);
      showToast("Profile updated.");
    } catch (err) {
      setProfileErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: "Passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    setPasswordErrors({});
    try {
      await updateProfile({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      showToast("Password changed.");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordErrors(getFieldErrors(err));
      showToast(getErrorMessage(err), "error");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Account settings</h1>
          <p>Manage your profile and security preferences.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card mb-16">
          <div className="card-header"><h3>Profile information</h3></div>
          <form onSubmit={handleProfileSave}>
            <Input label="Full name" required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} error={profileErrors.name} />
            <Input label="Email address" type="email" required value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} error={profileErrors.email} />
            <Button type="submit" variant="primary" loading={profileSaving}>Save profile</Button>
          </form>
        </div>

        <div className="card mb-16">
          <div className="card-header"><h3>Change password</h3></div>
          <form onSubmit={handlePasswordSave}>
            <Input
              label="Current password"
              type="password"
              required
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              error={passwordErrors.current_password}
            />
            <Input
              label="New password"
              type="password"
              required
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              error={passwordErrors.new_password}
              hint="At least 8 characters."
            />
            <Input
              label="Confirm new password"
              type="password"
              required
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              error={passwordErrors.confirm_password}
            />
            <Button type="submit" variant="primary" loading={passwordSaving}>Update password</Button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Application preferences</h3></div>
        <div className="flex justify-between items-center mb-16">
          <div>
            <div style={{ fontWeight: 600 }}>Currency</div>
            <div className="text-sm text-muted">All amounts are displayed in USD.</div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div style={{ fontWeight: 600 }}>Log out</div>
            <div className="text-sm text-muted">Sign out of ClientFlow on this device.</div>
          </div>
          <Button variant="danger" onClick={logout}>Log out</Button>
        </div>
      </div>
    </div>
  );
}
