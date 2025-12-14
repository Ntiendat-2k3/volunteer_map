import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from "react-icons/fi";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const googleErr = sp.get("error") === "google";

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
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
                <FiLogIn size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  Login
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Chưa có tài khoản?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </div>

            <div className="divider" />

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label">Email or Username</label>
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
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

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
                    Logging in...
                  </>
                ) : (
                  <>
                    <FiLogIn />
                    Login
                  </>
                )}
              </button>

              <a
                className="btn btn-outline w-full"
                href="http://localhost:5000/api/auth/google"
              >
                Continue with Google
              </a>

              {googleErr && (
                <div className="alert alert-error">
                  Đăng nhập Google thất bại. Vui lòng thử lại hoặc kiểm tra cấu
                  hình OAuth.
                </div>
              )}
              <p className="text-center text-xs text-slate-500">
                Tip: thử sai password để xem alert, hoặc đăng nhập để test
                refresh token.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
