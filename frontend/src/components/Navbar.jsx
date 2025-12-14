import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiLogIn, FiUserPlus, FiLogOut } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();

  const navClass = ({ isActive }) =>
    `navlink ${isActive ? "navlink-active" : "navlink-idle"}`;

  const providerLabel = (p) => {
    if (!p) return "LOCAL";
    if (p === "GOOGLE") return "GOOGLE";
    if (p === "LOCAL+GOOGLE") return "LOCAL+GOOGLE";
    return p;
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
            Home
          </NavLink>
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
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:flex">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="h-8 w-8 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    {(user.email || "U")[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex flex-col leading-tight">
                  <span className="font-medium text-slate-900">
                    {user.email}
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="badge">{user.role}</span>
                    <span className="badge">
                      {providerLabel(user.provider)}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={logout} className="btn btn-outline px-3 py-2">
                <FiLogOut /> Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
