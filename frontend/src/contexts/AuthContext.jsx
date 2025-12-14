import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authApi } from "../services/authApi";
import PropTypes from "prop-types";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ tránh toast spam khi refreshSession / loadMe chạy nhiều lần
  const didInitLoad = useRef(false);

  async function loadMe() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
    } catch (e) {
      setUser(null);
      localStorage.removeItem("accessToken");

      // chỉ toast nếu đây không phải lần init đầu tiên (tránh mở app lên là toast)
      if (didInitLoad.current) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    } finally {
      setLoading(false);
      didInitLoad.current = true;
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(emailOrName, password) {
    try {
      const res = await authApi.login({ login: emailOrName, password });
      const { accessToken, user: u } = res.data.data;

      localStorage.setItem("accessToken", accessToken);
      setUser(u);

      toast.success(
        `Đăng nhập thành công! Xin chào ${u?.name || u?.email || "bạn"} 👋`
      );
      return u;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Đăng nhập thất bại");
      throw e;
    }
  }

  async function register(payload) {
    try {
      await authApi.register(payload);
      toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay ✅");
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Đăng ký thất bại");
      throw e;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
      toast.success("Đã đăng xuất");
    } catch (e) {
      // vẫn cho logout local để user không bị kẹt
      toast.error(
        e?.response?.data?.message || "Logout lỗi, nhưng đã xoá phiên local"
      );
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  }

  // ✅ dùng cho /oauth/google: lấy accessToken bằng refresh cookie
  async function refreshSession({ silent = false } = {}) {
    try {
      const res = await authApi.refresh();
      const { accessToken, user: u } = res.data.data;

      localStorage.setItem("accessToken", accessToken);
      setUser(u);

      if (!silent) {
        toast.success(
          `Đăng nhập thành công! Xin chào ${u?.name || u?.email || "bạn"} 👋`
        );
      }

      return { accessToken, user: u };
    } catch (e) {
      if (!silent) {
        toast.error(
          "Không thể làm mới phiên đăng nhập. Vui lòng đăng nhập lại."
        );
      }
      throw e;
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      reload: loadMe,
      refreshSession,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  return useContext(AuthContext);
}
