import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { postApi } from "../services/postApi";
import { useAuth } from "../contexts/AuthContext";
import { FiPhoneCall } from "react-icons/fi";

export default function PostDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await postApi.get(id);
      setPost(res.data.data.post);
    })().catch((e) => {
      toast.error(e?.response?.data?.message || "Không tải được bài");
      nav("/", { replace: true });
    });
  }, [id, nav]);

  const center = useMemo(() => {
    if (!post) return [10.8231, 106.6297];
    return [Number(post.lat), Number(post.lng)];
  }, [post]);

  if (!post) return null;

  const gg = `https://www.google.com/maps?q=${post.lat},${post.lng}`;

  return (
    <div className="container-app py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="card">
          <div className="card-body">
            <div className="text-2xl font-extrabold tracking-tight">
              {post.title}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {post.address || "—"}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge">{post.status}</span>
              <span className="badge">{post.approvalStatus}</span>
              {(post.needTags || []).map((t) => (
                <span key={t} className="badge">
                  {t}
                </span>
              ))}
            </div>

            {post.description && (
              <div className="mt-5 whitespace-pre-wrap text-slate-800">
                {post.description}
              </div>
            )}

            <div className="divider" />

            <div>
              <div className="text-sm font-semibold text-slate-700">
                Liên hệ
              </div>

              {post.contactPhone ? (
                user ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="badge">
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
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
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

        <div className="card">
          <div className="card-body">
            <div className="text-sm font-semibold text-slate-700">Vị trí</div>
            <div className="map-box mt-3">
              <MapContainer center={center} zoom={14} className="map-inner">
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
  );
}
