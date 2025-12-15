import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
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
                <Link key={p.id} to={`/posts/${p.id}`} className="post-card">
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {p.address || "—"}
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
