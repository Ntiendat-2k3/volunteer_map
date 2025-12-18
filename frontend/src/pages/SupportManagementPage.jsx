import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { postApi } from "../services/postApi";
import { adminApi } from "../services/adminApi";
import { supportCommitApi } from "../services/supportCommitApi";
import { downloadCsv } from "../utils/exportCsv";

import { FaEye, FaFileExcel } from "react-icons/fa";

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function fmtDateShort(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString();
  } catch {
    return String(v);
  }
}

export default function SupportManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [loading, setLoading] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  const [posts, setPosts] = useState([]);
  const [summaryByPost, setSummaryByPost] = useState({}); // postId -> summary
  const [q, setQ] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1) load posts theo quyền
      let items = [];
      if (isAdmin) {
        const res = await adminApi.listPosts();
        items = res.data.data.items || [];
      } else {
        const res = await postApi.mine();
        items = res.data.data.items || res.data.data.posts || [];
      }
      setPosts(items);

      // 2) load summary mỗi post để lấy confirmedCount
      const pairs = await Promise.all(
        items.map(async (p) => {
          try {
            const s = await supportCommitApi.summary(p.id);
            return [p.id, s.data.data.summary];
          } catch {
            return [p.id, null];
          }
        })
      );

      const obj = {};
      for (const [postId, s] of pairs) obj[postId] = s;
      setSummaryByPost(obj);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Không tải được trang quản lý hỗ trợ"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const exportByPost = async (postId, title) => {
    setExportingId(postId);
    try {
      const res = await supportCommitApi.list(postId);
      const items = (res.data.data.items || []).filter(
        (c) => c.status !== "CANCELED"
      );

      const rows = items.map((c) => [
        c.user?.name || c.user?.email || `User #${c.userId}`,
        c.quantity ?? "",
        c.message ?? "",
        fmtDate(c.createdAt),
      ]);

      downloadCsv(
        `supporters_${postId}_${(title || "")
          .slice(0, 30)
          .replace(/\s+/g, "_")}`,
        ["Tên người đăng ký", "Số lượng", "Ghi chú", "Ngày đăng ký"],
        rows
      );

      toast.success("Đã xuất file CSV (Excel mở được) ✅");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Xuất file thất bại");
    } finally {
      setExportingId(null);
    }
  };

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return posts;

    return posts.filter((p) => {
      const t = (p.title || "").toLowerCase();
      const addr = (p.address || "").toLowerCase();
      const st = (p.status || "").toLowerCase();
      const ap = (p.approvalStatus || "").toLowerCase();
      return (
        t.includes(keyword) ||
        addr.includes(keyword) ||
        st.includes(keyword) ||
        ap.includes(keyword)
      );
    });
  }, [posts, q]);

  if (!user) return null;

  return (
    <div className="container-app py-8">
      {/* Header (gọn + sạch) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-extrabold text-slate-900">
            Quản lý hỗ trợ
          </div>
          <div className="text-sm text-slate-600">
            {isAdmin
              ? "ADMIN: xem tất cả bài và xuất danh sách người đăng ký."
              : "Chỉ hiển thị bài của bạn và xuất danh sách người đăng ký."}
          </div>
        </div>

        {/* Search (thay cho nút làm mới) */}
        <div className="w-full sm:w-[360px]">
          <div className="relative">
            <input
              className="input input-bordered w-full pr-20"
              placeholder="Tìm theo tên, địa chỉ, trạng thái..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {filtered.length}/{posts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="card">
            <div className="card-body">
              <div className="h-5 w-40 rounded bg-slate-100" />
              <div className="mt-4 space-y-3">
                <div className="h-20 rounded-2xl bg-slate-100" />
                <div className="h-20 rounded-2xl bg-slate-100" />
                <div className="h-20 rounded-2xl bg-slate-100" />
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="text-slate-600">Không có bài nào.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const sum = summaryByPost[p.id];
              const supporterCount = sum?.confirmedCount ?? 0;
              const createdAt = p.createdAt || p.created_at;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                    {/* Left: title + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900">
                            {p.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="truncate">{p.address || "—"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="badge badge-outline">{p.status}</span>
                        <span className="badge badge-outline">
                          {p.approvalStatus}
                        </span>
                      </div>
                    </div>

                    {/* Right: stats + actions */}
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          Người hỗ trợ
                        </div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <span className="badge badge-neutral">
                            {supporterCount}
                          </span>
                          <span className="text-xs text-slate-500">
                            • {fmtDateShort(createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Icon mắt */}
                        <Link
                          to={`/posts/${p.id}`}
                          className="btn btn-outline btn-square rounded-xl"
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết"
                        >
                          <FaEye size={18} />
                        </Link>

                        {/* Icon Excel */}
                        <button
                          type="button"
                          className="btn btn-primary btn-square rounded-xl"
                          disabled={exportingId === p.id}
                          onClick={() => exportByPost(p.id, p.title)}
                          title="Xuất Excel"
                          aria-label="Xuất Excel"
                        >
                          <FaFileExcel size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
