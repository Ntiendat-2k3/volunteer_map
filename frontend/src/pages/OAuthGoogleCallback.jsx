import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function OAuthGoogleCallback() {
  const nav = useNavigate();
  const { refreshSession } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      await refreshSession({ silent: false });
      nav("/", { replace: true });
    })().catch(() => nav("/login?error=google", { replace: true }));
  }, [nav, refreshSession]);

  return (
    <div className="auth-shell">
      <div className="auth-wrap">
        <div className="auth-card card">
          <div className="card-body">
            <div className="title">Signing you in…</div>
            <p className="subtitle">Đang hoàn tất đăng nhập Google</p>
          </div>
        </div>
      </div>
    </div>
  );
}
