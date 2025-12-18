import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { postApi } from "../services/postApi";
import { useAuth } from "../contexts/AuthContext";
import SupportCommitSection from "../components/support/SupportCommitSection";
import {
  FiEdit2,
  FiPhoneCall,
  FiXCircle,
  FiCheckCircle,
  FiMapPin,
} from "react-icons/fi";
import PostCommentsDrawer from "../components/comments/PostCommentsDrawer";

export default function PostDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const res = await postApi.get(id);
      const p = res.data.data.post;
      if (!alive) return;
      setPost(p);
    })().catch((e) => {
      toast.error(e?.response?.data?.message || "Không tải được bài");
      nav("/", { replace: true });
    });

    return () => {
      alive = false;
    };
  }, [id, nav]);

  const center = useMemo(() => {
    if (!post) return [10.8231, 106.6297];
    return [Number(post.lat), Number(post.lng)];
  }, [post]);

  if (!post) return null;

  const isOwner = !!user && Number(user.id) === Number(post.userId);
  const canToggleClosed = isOwner && post.approvalStatus === "APPROVED";
  const gg = `https://www.google.com/maps?q=${post.lat},${post.lng}`;

  const toggleClosed = async () => {
    if (!isOwner) return;

    if (post.approvalStatus !== "APPROVED") {
      toast.error("Chỉ có thể báo đã đủ khi bài đã được duyệt (APPROVED).");
      return;
    }

    const next = post.status === "OPEN" ? "CLOSED" : "OPEN";
    const okConfirm = window.confirm(
      next === "CLOSED"
        ? "Xác nhận đóng nhận hỗ trợ (CLOSED)?"
        : "Xác nhận mở lại nhận hỗ trợ (OPEN)?"
    );
    if (!okConfirm) return;

    setBusy(true);
    try {
      const res = await postApi.update(id, { status: next });
      setPost(res.data.data.post);
      toast.success(next === "CLOSED" ? "Đã báo đã đủ ✅" : "Đã mở lại ✅");
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Không cập nhật được trạng thái"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-app py-8">
      {/* ✅ Khối 2 cột (content + map) */}
      <div className="rounded-[28px_28px_0_0] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.08)] overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          {/* LEFT */}
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {post.title}
                </div>
                <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <FiMapPin className="mt-[2px] shrink-0" />
                  <div className="min-w-0">{post.address || "—"}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge badge-neutral">{post.status}</span>
                <span className="badge badge-outline">
                  {post.approvalStatus}
                </span>
                {(post.needTags || []).map((t) => (
                  <span key={t} className="badge badge-outline">
                    {t}
                  </span>
                ))}
              </div>

              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/posts/${post.id}/edit`}
                    className="btn btn-outline"
                  >
                    <FiEdit2 /> Sửa bài
                  </Link>

                  {canToggleClosed ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={toggleClosed}
                    >
                      {post.status === "OPEN" ? (
                        <>
                          <FiXCircle /> Báo đã đủ (CLOSED)
                        </>
                      ) : (
                        <>
                          <FiCheckCircle /> Mở lại (OPEN)
                        </>
                      )}
                    </button>
                  ) : post.approvalStatus !== "APPROVED" ? (
                    <div className="text-sm text-slate-600 flex items-center">
                      Bài chưa duyệt nên chưa thể “Báo đã đủ”.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {post.description && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="text-sm font-semibold text-slate-700">
                  Mô tả
                </div>
                <div className="mt-2 whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {post.description}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="text-sm font-extrabold text-slate-900">
                Đăng ký hỗ trợ
              </div>
              <div className="mt-3">
                <SupportCommitSection post={post} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="text-sm font-extrabold text-slate-900">
                Liên hệ
              </div>

              {post.contactPhone ? (
                user ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="badge badge-outline">
                      {post.contactName || "Người đăng"}
                    </span>
                    <a
                      className="btn btn-primary"
                      href={`tel:${post.contactPhone}`}
                    >
                      <FiPhoneCall /> Gọi: {post.contactPhone}
                    </a>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-600">
                    Đăng nhập để xem số liên hệ.
                  </div>
                )
              ) : (
                <div className="mt-2 text-sm text-slate-600">
                  Không có thông tin liên hệ.
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="btn btn-outline"
                  href={gg}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở Google Maps
                </a>
                <Link className="btn btn-outline" to="/">
                  Về Home
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: MAP */}
          <div className="border-t border-slate-200 lg:border-t-0 lg:border-l lg:border-slate-200 bg-slate-50">
            <div className="p-5 sm:p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-slate-900">
                  Vị trí
                </div>
                <a
                  className="btn btn-outline btn-sm"
                  href={gg}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở map
                </a>
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <MapContainer
                  center={center}
                  zoom={14}
                  className="h-[420px] w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={center} />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[0_0_28px_28px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(2,6,23,0.06)] p-5 sm:p-6">
        <div className="text-sm font-extrabold text-slate-900">
          Hỏi đáp / Bình luận
        </div>
        <div className="mt-3">
          <PostCommentsDrawer post={post} />
        </div>
      </div>
    </div>
  );
}
