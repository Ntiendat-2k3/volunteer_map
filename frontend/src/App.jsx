import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OAuthGoogleCallback from "./pages/OAuthGoogleCallback";

import RequireAuth from "./components/RequireAuth";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetailPage from "./pages/PostDetailPage";
import EditPostPage from "./pages/EditPostPage";
import MyPostsPage from "./pages/MyPostsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SupportManagementPage from "./pages/SupportManagementPage";

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <div className="app-shell">
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route
              path="/posts/new"
              element={
                <RequireAuth>
                  <CreatePostPage />
                </RequireAuth>
              }
            />
            <Route
              path="/posts/mine"
              element={
                <RequireAuth>
                  <MyPostsPage />
                </RequireAuth>
              }
            />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route
              path="/posts/:id/edit"
              element={
                <RequireAuth>
                  <EditPostPage />
                </RequireAuth>
              }
            />

            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminDashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/support-management"
              element={
                <RequireAuth>
                  <SupportManagementPage />
                </RequireAuth>
              }
            />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth/google" element={<OAuthGoogleCallback />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}
