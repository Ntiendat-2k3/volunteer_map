import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiUserCheck, FiXCircle } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { supportCommitApi } from "../../services/supportCommitApi";

function fmt(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function statusText(st) {
  if (st === "PENDING") return "Đang chờ xác nhận";
  if (st === "CONFIRMED") return "Đã được xác nhận";
  if (st === "CANCELED") return "Đã huỷ";
  return st || "—";
}

export default function SupportCommitSection({ post }) {
  const { user } = useAuth();
  const nav = useNavigate();

  const [summary, setSummary] = useState(null);
  const [myCommit, setMyCommit] = useState(null);

  // danh sách để hiển thị ở Post Detail: chỉ tên + ngày
  const [commits, setCommits] = useState([]);
  const [busy, setBusy] = useState(false);

  // modal đơn giản inline
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const isOwner = !!user && Number(user.id) === Number(post.userId);
  const isOwnerOrAdmin = isOwner || user?.role === "ADMIN";
  const canCommit =
    post.approvalStatus === "APPROVED" && post.status === "OPEN";

  const refresh = async () => {
    try {
      const s = await supportCommitApi.summary(post.id);
      setSummary(s.data.data.summary);
    } catch {}

    if (user) {
      try {
        const mine = await supportCommitApi.my(post.id);
        setMyCommit(mine.data.data.commit);
      } catch {
        setMyCommit(null);
      }
    } else {
      setMyCommit(null);
    }

    // ✅ chỉ owner/admin mới load danh sách (để show tên + ngày)
    if (isOwnerOrAdmin) {
      try {
        const ls = await supportCommitApi.list(post.id);
        setCommits(ls.data.data.items || []);
      } catch {
        setCommits([]);
      }
    } else {
      setCommits([]);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, user?.id, user?.role]);

  const s = summary || { pendingCount: 0, confirmedCount: 0, activeCount: 0 };

  const openModal = () => {
    if (!user) {
      toast.error("Hãy đăng nhập để đăng ký hỗ trợ");
      nav("/login");
      return;
    }
    if (!canCommit) {
      toast.error(
        post.approvalStatus !== "APPROVED"
          ? "Bài chưa được duyệt"
          : "Điểm này đang đóng nhận hỗ trợ"
      );
      return;
    }
    if (isOwner) {
      toast.error("Bạn không thể đăng ký hỗ trợ cho bài của chính bạn");
      return;
    }

    setQty(myCommit?.status === "PENDING" ? myCommit.quantity : 1);
    setMsg(myCommit?.status === "PENDING" ? myCommit.message || "" : "");
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user || !canCommit) return;

    setBusy(true);
    try {
      const payload = { quantity: Number(qty || 1), message: msg };
      const res = await supportCommitApi.createOrUpdate(post.id, payload);
      setMyCommit(res.data.data.commit);
      setOpen(false);
      toast.success("Đã đăng ký hỗ trợ ✅");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không đăng ký được");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (commitId) => {
    const ok = window.confirm("Xác nhận huỷ đăng ký hỗ trợ?");
    if (!ok) return;

    setBusy(true);
    try {
      await supportCommitApi.cancel(post.id, commitId);
      toast.success("Đã huỷ ✅");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không huỷ được");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Post detail chỉ show TÊN + NGÀY ĐĂNG KÝ (createdAt)
  const compactList = useMemo(() => {
    return commits.filter((c) => c.status !== "CONFIRMED");
  }, [commits]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-700">Hỗ trợ</div>
        <span className="badge">
          <FiUserCheck /> Đăng ký hỗ trợ: {s.activeCount ?? 0}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="badge">Chờ: {s.pendingCount ?? 0}</span>
        <span className="badge">Đã xác nhận: {s.confirmedCount ?? 0}</span>
        <span className="badge">Tổng: {s.activeCount ?? 0}</span>
      </div>

      {!canCommit && (
        <div className="mt-3 text-sm text-slate-600">
          {post.approvalStatus !== "APPROVED"
            ? "Bài chưa được duyệt nên chưa thể đăng ký hỗ trợ."
            : "Điểm này đang đóng nhận hỗ trợ."}
        </div>
      )}

      {/* My commit */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-slate-800">Đăng ký của tôi</div>
          <span className="badge">{statusText(myCommit?.status)}</span>
        </div>

        {user ? (
          myCommit ? (
            <div className="mt-3 text-sm text-slate-700">
              <div>
                <span className="font-semibold">Số lượng:</span>{" "}
                {myCommit.quantity}
              </div>
              {myCommit.message ? (
                <div className="mt-1 whitespace-pre-wrap">
                  <span className="font-semibold">Ghi chú:</span>{" "}
                  {myCommit.message}
                </div>
              ) : (
                <div className="mt-1 text-slate-500">(Không có ghi chú)</div>
              )}
              <div className="mt-1 text-slate-500">
                Cập nhật: {fmt(myCommit.updatedAt)}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!isOwner && canCommit && myCommit.status !== "CONFIRMED" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={openModal}
                  >
                    <FiHeart /> Chỉnh sửa đăng ký
                  </button>
                )}

                {myCommit.status !== "CANCELED" && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => cancel(myCommit.id)}
                  >
                    <FiXCircle /> Huỷ
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-600">
              Bạn chưa đăng ký hỗ trợ cho điểm này.
              <div className="mt-3">
                {!isOwner && canCommit && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={openModal}
                  >
                    <FiHeart /> Tôi sẽ hỗ trợ
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="mt-3 text-sm text-slate-600">
            Đăng nhập để đăng ký hỗ trợ.
          </div>
        )}
      </div>

      {/* ✅ Owner/Admin: chỉ show danh sách tên + ngày (không duyệt ở đây) */}
      {isOwnerOrAdmin && (
        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold text-slate-800">
              Danh sách đăng ký (tên + ngày)
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-outline"
                disabled={busy}
                onClick={refresh}
              >
                Làm mới
              </button>
              <Link className="btn btn-primary" to="/support-management">
                Xem chi tiết
              </Link>
            </div>
          </div>

          {compactList.length === 0 ? (
            <div className="mt-3 text-sm text-slate-600">
              Chưa có ai đăng ký.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {compactList.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="font-semibold text-slate-800">
                    {c.user?.name || c.user?.email || `User #${c.userId}`}
                  </div>
                  <div className="text-sm text-slate-500">
                    {fmt(c.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg">
            <div className="card-body">
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg font-extrabold">Đăng ký hỗ trợ</div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                  <div className="label">Số lượng</div>
                  <div className="input-wrap">
                    <input
                      className="input-plain"
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="Ví dụ: 1"
                    />
                  </div>
                </div>

                <div>
                  <div className="label">Ghi chú (tuỳ chọn)</div>
                  <div className="mt-2">
                    <textarea
                      className="w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none"
                      rows={4}
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      placeholder="Ví dụ: Mình sẽ mang 3 thùng mì vào chiều thứ 7"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                  >
                    <FiHeart /> Gửi đăng ký
                  </button>
                </div>
              </form>

              {myCommit?.status === "CONFIRMED" && (
                <div className="mt-3 text-sm text-slate-600">
                  Lưu ý: bạn đang CONFIRMED. Nếu muốn đổi đăng ký, hãy huỷ rồi
                  đăng ký lại.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
