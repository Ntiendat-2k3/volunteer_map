import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiEdit2, FiEye, FiXCircle, FiCheckCircle } from "react-icons/fi";
import { postApi } from "../services/postApi";

export default function MyPostsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await postApi.mine();
      setItems(res.data.data.items || []);
    } catch {
      toast.error("Không tải được bài của bạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const toggleClosed = async (p) => {
    const next = p.status === "OPEN" ? "CLOSED" : "OPEN";
    const okConfirm = window.confirm(
      next === "CLOSED"
        ? "Xác nhận đóng nhận hỗ trợ (CLOSED)?"
        : "Xác nhận mở lại nhận hỗ trợ (OPEN)?"
    );
    if (!okConfirm) return;

    try {
      const res = await postApi.update(p.id, { status: next });
      const updated = res.data.data.post;
      setItems((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      toast.success(next === "CLOSED" ? "Đã báo đã đủ ✅" : "Đã mở lại ✅");
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Không cập nhật được trạng thái"
      );
    }
  };

  return (
    <div className="container-app py-8">
      <div className="card">
        <div className="card-body">
          <div className="text-xl font-extrabold tracking-tight">
            Bài của tôi
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi trạng thái duyệt (PENDING/REJECTED/APPROVED).
          </p>

          {loading ? (
            <div className="mt-4 space-y-3">
              <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
              Bạn chưa tạo bài nào.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((p) => (
                <div key={p.id} className="post-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/posts/${p.id}`}
                        className="block font-semibold text-slate-900 hover:underline"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-1 text-xs text-slate-600">
                        {p.address || "—"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to={`/posts/${p.id}`} className="btn btn-outline">
                        <FiEye />
                      </Link>
                      <Link
                        to={`/posts/${p.id}/edit`}
                        className="btn btn-outline"
                      >
                        <FiEdit2 />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => toggleClosed(p)}
                      >
                        {p.status === "OPEN" ? (
                          <>
                            <FiXCircle /> Đóng dự án
                          </>
                        ) : (
                          <>
                            <FiCheckCircle /> Mở dự án
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="badge">{p.status}</span>
                    <span className="badge">{p.approvalStatus}</span>
                    {(p.needTags || []).slice(0, 4).map((t) => (
                      <span key={t} className="badge">
                        {t}
                      </span>
                    ))}
                  </div>

                  {p.approvalStatus === "REJECTED" && (
                    <div className="mt-2 text-sm text-red-700">
                      Lý do:{" "}
                      <span className="font-semibold">
                        {p.rejectedReason || "Không rõ"}
                      </span>
                    </div>
                  )}

                  {p.approvalStatus === "PENDING" && (
                    <div className="mt-2 text-sm text-slate-600">
                      Bài đang chờ Admin duyệt.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
