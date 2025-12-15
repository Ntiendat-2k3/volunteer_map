import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiLogIn,
  FiUserPlus,
  FiLogOut,
  FiPlus,
  FiMapPin,
  FiGrid,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const navClass = ({ isActive }) =>
    `navlink ${isActive ? "navlink-active" : "navlink-idle"}`;

  const displayName = user?.name?.trim() || user?.email || "Bạn";

  const onLogout = async () => {
    try {
      await logout();
      nav("/login");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Logout failed");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white">
            V
          </span>
          VolunteerMap
        </Link>

        <nav className="ml-4 hidden items-center gap-2 sm:flex">
          <NavLink to="/" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <FiMapPin /> Bản đồ
            </span>
          </NavLink>

          {user && (
            <>
              <NavLink to="/posts/new" className={navClass}>
                <span className="inline-flex items-center gap-2">
                  <FiPlus /> Tạo điểm
                </span>
              </NavLink>

              <NavLink to="/posts/mine" className={navClass}>
                <span className="inline-flex items-center gap-2">
                  <FiGrid /> Bài của tôi
                </span>
              </NavLink>

              {user.role === "ADMIN" && (
                <NavLink to="/admin" className={navClass}>
                  <span className="inline-flex items-center gap-2">
                    <FiGrid /> Dashboard
                  </span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!user ? (
            <>
              <NavLink to="/login" className={navClass}>
                <span className="inline-flex items-center gap-2">
                  <FiLogIn /> Login
                </span>
              </NavLink>

              <NavLink to="/register" className="btn btn-primary px-3 py-2">
                <FiUserPlus /> Register
              </NavLink>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:flex">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="h-9 w-9 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}

                <div className="leading-tight">
                  <div className="text-xs text-slate-500">Xin chào,</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </div>
                </div>
              </div>

              <button onClick={onLogout} className="btn btn-outline px-3 py-2">
                <FiLogOut /> Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
