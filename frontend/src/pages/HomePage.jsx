import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="container-app py-10">
      <div className="card">
        <div className="card-body">
          <h1 className="title">VolunteerMap Auth Demo</h1>
          <p className="subtitle">
            Demo đăng ký/đăng nhập với{" "}
            <span className="font-semibold">accessToken</span> +{" "}
            <span className="font-semibold">refreshToken</span>.
          </p>

          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ) : !user ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-700">
              Bạn chưa đăng nhập. Vào{" "}
              <span className="font-semibold">Login</span> hoặc{" "}
              <span className="font-semibold">Register</span> để test.
            </div>
          ) : (
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-emerald-800">
                <span className="text-lg">✅</span>
                <span className="font-semibold">Đã đăng nhập</span>
              </div>

              <div className="codebox">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  User payload (/auth/me)
                </div>
                <pre className="overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
