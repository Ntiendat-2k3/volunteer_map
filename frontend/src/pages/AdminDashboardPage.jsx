import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../services/adminApi";
import { useAuth } from "../contexts/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("PENDING");

  const fetchAll = async () => {
    try {
      const [a, b] = await Promise.all([
        adminApi.dashboard(),
        adminApi.listPosts({ q: q || undefined, approvalStatus }),
      ]);
      setStats(a.data.data);
      setItems(b.data.data.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không tải được dashboard");
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, approvalStatus]);

  const approve = async (id) => {
    try {
      await adminApi.approve(id);
      toast.success("Đã duyệt ✅");
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Duyệt thất bại");
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Lý do từ chối:", "Không phù hợp");
    if (reason == null) return;
    try {
      await adminApi.reject(id, reason);
      toast.success("Đã từ chối ❌");
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Từ chối thất bại");
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="container-app py-10">
        <div className="card">
          <div className="card-body">Bạn không có quyền Admin.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <div className="card">
        <div className="card-body">
          <div className="text-xl font-extrabold tracking-tight">
            Admin Dashboard
          </div>

          {!stats ? (
            <div className="mt-4">Loading...</div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="post-card">
                <div className="text-sm text-slate-600">Total</div>
                <div className="text-2xl font-extrabold">{stats.total}</div>
              </div>
              <div className="post-card">
                <div className="text-sm text-slate-600">Pending</div>
                <div className="text-2xl font-extrabold">{stats.pending}</div>
              </div>
              <div className="post-card">
                <div className="text-sm text-slate-600">Approved</div>
                <div className="text-2xl font-extrabold">{stats.approved}</div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="label">Search</div>
              <div className="input-wrap">
                <input
                  className="input-plain"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="label">Approval status</div>
              <div className="input-wrap">
                <select
                  className="input-plain"
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-xs text-slate-600">
                        {p.address || "—"}
                      </div>
                      {p.approvalStatus === "REJECTED" && (
                        <div className="mt-1 text-xs text-red-700">
                          Reason: {p.rejectedReason || "—"}
                        </div>
                      )}
                    </td>
                    <td className="text-sm">
                      {p.user?.name || p.user?.email || "—"}
                    </td>
                    <td>
                      <span className="badge">{p.status}</span>
                    </td>
                    <td>
                      <span className="badge">{p.approvalStatus}</span>
                    </td>
                    <td>
                      {p.approvalStatus === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn btn-primary"
                            onClick={() => approve(p.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline"
                            onClick={() => reject(p.id)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-sm text-slate-600">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Gợi ý: bài sửa sẽ tự quay về PENDING để duyệt lại.
          </div>
        </div>
      </div>
    </div>
  );
}
