import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function OAuthGoogleCallback() {
  const nav = useNavigate();
  const { refreshSession } = useAuth();

  useEffect(() => {
    (async () => {
      await refreshSession(); // lấy accessToken bằng refresh cookie
      nav("/");
    })().catch((e) => {
      console.log("OAuth Google refresh failed:", e);
      nav("/login?error=google");
    });
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
