import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { postApi } from "../services/postApi";
import { adminApi } from "../services/adminApi";
import { supportCommitApi } from "../services/supportCommitApi";

function fmt(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export default function SupportManagementPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [openPostId, setOpenPostId] = useState(null);
  const [commitsByPost, setCommitsByPost] = useState({});
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const loadPosts = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (isAdmin) {
        const res = await adminApi.listPosts(); // all posts (có filter nếu muốn)
        setPosts(res.data.data.items || []);
      } else {
        const res = await postApi.mine(); // chỉ bài của tôi
        setPosts(res.data.data.items || res.data.data.posts || []);
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không tải được danh sách bài");
    } finally {
      setBusy(false);
    }
  };

  const loadCommits = async (postId) => {
    setBusy(true);
    try {
      const res = await supportCommitApi.list(postId); // owner/admin mới được
      setCommitsByPost((prev) => ({
        ...prev,
        [postId]: res.data.data.items || [],
      }));
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Không tải được danh sách đăng ký"
      );
      setCommitsByPost((prev) => ({ ...prev, [postId]: [] }));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const toggleOpen = async (postId) => {
    if (openPostId === postId) {
      setOpenPostId(null);
      return;
    }
    setOpenPostId(postId);
    if (!commitsByPost[postId]) {
      await loadCommits(postId);
    }
  };

  const confirm = async (postId, commitId) => {
    const ok = window.confirm("Xác nhận người này sẽ hỗ trợ?");
    if (!ok) return;

    setBusy(true);
    try {
      await supportCommitApi.confirm(postId, commitId);
      toast.success("Đã xác nhận ✅");
      await loadCommits(postId);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không xác nhận được");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (postId, commitId) => {
    const ok = window.confirm("Huỷ đăng ký hỗ trợ này?");
    if (!ok) return;

    setBusy(true);
    try {
      await supportCommitApi.cancel(postId, commitId);
      toast.success("Đã huỷ ✅");
      await loadCommits(postId);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không huỷ được");
    } finally {
      setBusy(false);
    }
  };

  const getPending = (items) => items.filter((c) => c.status === "PENDING");
  const getConfirmed = (items) => items.filter((c) => c.status === "CONFIRMED");

  if (!user) return null;

  return (
    <div className="container-app py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-2xl font-extrabold">Quản lý hỗ trợ</div>
          <div className="text-sm text-slate-600">
            {isAdmin
              ? "ADMIN: xem tất cả bài, duyệt/hủy người đăng ký."
              : "Chỉ hiển thị các bài bạn đã đăng, bạn có thể duyệt/hủy người đăng ký."}
          </div>
        </div>

        <button className="btn btn-outline" disabled={busy} onClick={loadPosts}>
          Làm mới
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <div className="card">
            <div className="card-body text-slate-600">Không có bài nào.</div>
          </div>
        ) : (
          posts.map((p) => {
            const isOpen = openPostId === p.id;
            const items = commitsByPost[p.id] || [];
            const pending = getPending(items);
            const confirmed = getConfirmed(items);

            return (
              <div key={p.id} className="card">
                <div className="card-body">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-lg font-bold">{p.title}</div>
                      <div className="text-sm text-slate-600">
                        {p.address || "—"} • {p.status} • {p.approvalStatus}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link className="btn btn-outline" to={`/posts/${p.id}`}>
                        Mở bài
                      </Link>
                      <button
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => toggleOpen(p.id)}
                      >
                        {isOpen ? "Đóng danh sách" : "Xem đăng ký"}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {/* Pending */}
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          Chờ xác nhận ({pending.length})
                        </div>

                        {pending.length === 0 ? (
                          <div className="mt-2 text-sm text-slate-600">
                            Không có.
                          </div>
                        ) : (
                          <div className="mt-2 space-y-3">
                            {pending.map((c) => (
                              <div
                                key={c.id}
                                className="rounded-2xl border border-slate-200 bg-white p-3"
                              >
                                <div className="font-semibold text-slate-800">
                                  {c.user?.name ||
                                    c.user?.email ||
                                    `User #${c.userId}`}
                                </div>
                                <div className="mt-1 text-sm text-slate-700">
                                  Số lượng: {c.quantity}
                                </div>
                                {c.message ? (
                                  <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                                    Ghi chú: {c.message}
                                  </div>
                                ) : null}
                                <div className="mt-1 text-xs text-slate-500">
                                  Đăng ký: {fmt(c.createdAt)}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    className="btn btn-primary"
                                    disabled={busy}
                                    onClick={() => confirm(p.id, c.id)}
                                  >
                                    <FiCheckCircle /> Xác nhận
                                  </button>
                                  <button
                                    className="btn btn-outline"
                                    disabled={busy}
                                    onClick={() => cancel(p.id, c.id)}
                                  >
                                    <FiXCircle /> Huỷ
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Confirmed */}
                      <div>
                        <div className="text-sm font-semibold text-slate-700">
                          Đã xác nhận ({confirmed.length})
                        </div>

                        {confirmed.length === 0 ? (
                          <div className="mt-2 text-sm text-slate-600">
                            Chưa có.
                          </div>
                        ) : (
                          <div className="mt-2 space-y-3">
                            {confirmed.map((c) => (
                              <div
                                key={c.id}
                                className="rounded-2xl border border-slate-200 bg-white p-3"
                              >
                                <div className="font-semibold text-slate-800">
                                  {c.user?.name ||
                                    c.user?.email ||
                                    `User #${c.userId}`}
                                </div>
                                <div className="mt-1 text-sm text-slate-700">
                                  Số lượng: {c.quantity}
                                </div>
                                {c.message ? (
                                  <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                                    Ghi chú: {c.message}
                                  </div>
                                ) : null}
                                <div className="mt-1 text-xs text-slate-500">
                                  Đăng ký: {fmt(c.createdAt)}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Xác nhận: {fmt(c.confirmedAt)}
                                </div>

                                <div className="mt-3">
                                  <button
                                    className="btn btn-outline"
                                    disabled={busy}
                                    onClick={() => cancel(p.id, c.id)}
                                  >
                                    <FiXCircle /> Huỷ
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
