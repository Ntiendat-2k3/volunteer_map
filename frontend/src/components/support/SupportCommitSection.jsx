import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiUserCheck,
  FiXCircle,
  FiDownload,
  FiExternalLink,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { supportCommitApi } from "../../services/supportCommitApi";
import { downloadCsv } from "../../utils/exportCsv";

function fmtDate(v) {
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

function statusBadgeClass(st) {
  if (st === "CONFIRMED") return "badge badge-neutral";
  if (st === "PENDING") return "badge badge-outline";
  if (st === "CANCELED") return "badge badge-outline opacity-70";
  return "badge badge-outline";
}

export default function SupportCommitSection({ post }) {
  const { user } = useAuth();
  const nav = useNavigate();

  const [summary, setSummary] = useState(null);
  const [myCommit, setMyCommit] = useState(null);

  // public list confirmed (ai cũng xem)
  const [publicItems, setPublicItems] = useState([]);
  const [busy, setBusy] = useState(false);

  // modal
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const isOwner = !!user && Number(user.id) === Number(post.userId);
  const canCommit =
    post.approvalStatus === "APPROVED" && post.status === "OPEN";

  const refresh = async () => {
    try {
      const s = await supportCommitApi.summary(post.id);
      setSummary(s.data.data.summary);
    } catch {}

    try {
      const ls = await supportCommitApi.publicList(post.id, 6);
      setPublicItems(ls.data.data.items || []);
    } catch {
      setPublicItems([]);
    }

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
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, user?.id]);

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

  const cancelMine = async () => {
    if (!myCommit?.id) return;
    const ok = window.confirm("Xác nhận huỷ đăng ký hỗ trợ?");
    if (!ok) return;

    setBusy(true);
    try {
      await supportCommitApi.cancel(post.id, myCommit.id);
      toast.success("Đã huỷ ✅");
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không huỷ được");
    } finally {
      setBusy(false);
    }
  };

  // 5 dòng + nếu có dòng 6 => show "..."
  const display5 = useMemo(() => publicItems.slice(0, 5), [publicItems]);
  const hasMore = publicItems.length > 5;

  const exportPublicCsv = async () => {
    setBusy(true);
    try {
      const res = await supportCommitApi.publicList(post.id, 500);
      const items = res.data.data.items || [];

      const rows = items.map((x) => [
        x.user?.name || x.user?.email || `User #${x.user?.id ?? ""}`,
        x.message || "",
        fmtDate(x.createdAt),
      ]);

      downloadCsv(
        `supporters_post_${post.id}`,
        ["Tên người đăng ký", "Ghi chú", "Ngày đăng ký"],
        rows
      );
      toast.success("Đã xuất file CSV (Excel mở được) ✅");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Xuất file thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.06)]">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold text-slate-900">
              Hỗ trợ
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Theo dõi đăng ký và danh sách người hỗ trợ
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-outline">
              <FiUserCheck className="mr-1" />
              Tổng đăng ký: {s.activeCount ?? 0}
            </span>

            <button
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={exportPublicCsv}
              title="Xuất Excel"
            >
              <FiDownload />
            </button>

            <Link
              className="btn btn-primary btn-sm"
              to="/support-management"
              title="Xem chi tiết"
            >
              <FiExternalLink />
            </Link>
          </div>
        </div>

        {/* Stats (liền mạch, không box riêng) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge">Chờ: {s.pendingCount ?? 0}</span>
          <span className="badge">Đã xác nhận: {s.confirmedCount ?? 0}</span>
          <span className="badge">Tổng: {s.activeCount ?? 0}</span>
        </div>

        {/* line */}
        <div className="mt-5 border-t border-slate-200" />

        {/* My commit */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-slate-900">
              Đăng ký của tôi
            </div>
            <span className={statusBadgeClass(myCommit?.status)}>
              {statusText(myCommit?.status)}
            </span>
          </div>

          {user ? (
            myCommit ? (
              <div className="mt-3 text-sm text-slate-700">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <span className="text-slate-500">Số lượng:</span>{" "}
                    <span className="font-semibold">{myCommit.quantity}</span>
                  </div>
                  <div className="text-slate-500">
                    Cập nhật: {fmtDate(myCommit.updatedAt)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!isOwner && canCommit && myCommit.status !== "CONFIRMED" && (
                    <button
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={openModal}
                    >
                      <FiHeart /> Chỉnh sửa đăng ký
                    </button>
                  )}
                  {myCommit.status !== "CANCELED" && (
                    <button
                      className="btn btn-outline"
                      disabled={busy}
                      onClick={cancelMine}
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
              (Bạn đang xem ở chế độ khách. Đăng nhập để đăng ký hỗ trợ.)
            </div>
          )}
        </div>

        {/* line */}
        <div className="mt-6 border-t border-slate-200" />

        {/* Public list */}
        <div className="mt-5">
          <div className="text-sm font-extrabold text-slate-900">
            Danh sách đăng ký (mới nhất)
          </div>

          {display5.length === 0 ? (
            <div className="mt-3 text-sm text-slate-600">
              Chưa có ai đăng ký.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {display5.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-1 rounded-2xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm text-slate-800">
                    <span className="font-semibold">
                      {c.user?.name ||
                        c.user?.email ||
                        `User #${c.user?.id ?? ""}`}
                    </span>
                    <span className="text-slate-500"> — </span>
                    <span className="text-slate-700">
                      {c.message ? c.message : "(Không ghi chú)"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {fmtDate(c.createdAt)}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="pt-1 text-center text-slate-400 text-lg select-none">
                  …
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[22px] border border-slate-200 bg-white shadow-xl">
            <div className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-lg font-extrabold">Đăng ký hỗ trợ</div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    Số lượng
                  </div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    Ghi chú (tuỳ chọn)
                  </div>
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 outline-none"
                    rows={4}
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Ví dụ: Mình góp 2 thùng mì"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                  >
                    Huỷ
                  </button>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={busy}
                  >
                    <FiHeart /> Gửi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
