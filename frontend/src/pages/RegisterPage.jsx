import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiUserPlus,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("Test User");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    setBusy(true);
    try {
      await register({ name, email, password });
      setOk("Đăng ký thành công! Chuyển sang Login...");
      setTimeout(() => nav("/login"), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="card-body">
            <div className="auth-header">
              <div className="auth-icon">
                <FiUserPlus size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Register
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>

            <div className="divider" />

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <div className="input-wrap">
                  <FiUser className="text-slate-500" />
                  <input
                    className="input-plain"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <div className="input-wrap">
                  <FiMail className="text-slate-500" />
                  <input
                    className="input-plain"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="input-wrap">
                  <FiLock className="text-slate-500" />
                  <input
                    className="input-plain"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {ok && (
                <div className="alert alert-success flex items-start gap-2">
                  <FiCheckCircle className="mt-0.5 shrink-0" />
                  <div>{ok}</div>
                </div>
              )}
              {err && (
                <div className="alert alert-error flex items-start gap-2">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <div>{err}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary w-full gap-2"
              >
                {busy ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiUserPlus />
                    Create account
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                Tip: dùng email mới để tránh lỗi “Email đã tồn tại”.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
