import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OAuthGoogleCallback from "./pages/OAuthGoogleCallback";

export default function App() {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/google" element={<OAuthGoogleCallback />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
