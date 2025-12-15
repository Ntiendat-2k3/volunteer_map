import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { postApi } from "../services/postApi";
import { FiCrosshair } from "react-icons/fi";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");

  const [near, setNear] = useState(false);
  const [pos, setPos] = useState(null); // {lat,lng}
  const [radiusKm, setRadiusKm] = useState(5);

  const [loading, setLoading] = useState(true);

  const defaultCenter = useMemo(() => [10.8231, 106.6297], []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await postApi.list({
        q: q || undefined,
        status: status || undefined,
        tag: tag || undefined,
        lat: near && pos ? pos.lat : undefined,
        lng: near && pos ? pos.lng : undefined,
        radiusKm: near && pos ? radiusKm : undefined,
        limit: 50,
      });
      setItems(res.data.data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, tag, near, pos, radiusKm]);

  const onNearMe = () => {
    if (!navigator.geolocation)
      return toast.error("Trình duyệt không hỗ trợ định vị");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setNear(true);
        toast.success("Đã bật lọc gần bạn ✅");
      },
      () => toast.error("Không lấy được vị trí. Bạn có cho phép định vị không?")
    );
  };

  const center = useMemo(() => {
    if (near && pos) return [pos.lat, pos.lng];
    if (items.length) return [Number(items[0].lat), Number(items[0].lng)];
    return defaultCenter;
  }, [near, pos, items, defaultCenter]);

  return (
    <div className="container-app py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <div className="label">Tìm kiếm</div>
                <div className="input-wrap">
                  <input
                    className="input-plain"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm theo tiêu đề/địa chỉ..."
                  />
                </div>
              </div>

              <div className="w-[160px]">
                <div className="label">Trạng thái</div>
                <div className="input-wrap">
                  <select
                    className="input-plain"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="w-[160px]">
                <div className="label">Tag</div>
                <div className="input-wrap">
                  <input
                    className="input-plain"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="VD: Sách"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onNearMe}
                >
                  <FiCrosshair /> Gần tôi
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setNear(false);
                    setPos(null);
                    toast.success("Đã tắt lọc gần tôi");
                  }}
                >
                  Tắt Near
                </button>
              </div>

              {near && pos && (
                <div className="w-[140px]">
                  <div className="label">Bán kính (km)</div>
                  <div className="input-wrap">
                    <input
                      className="input-plain"
                      type="number"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="map-box mt-5">
              <MapContainer center={center} zoom={12} className="map-inner">
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {items.map((p) => (
                  <Marker key={p.id} position={[Number(p.lat), Number(p.lng)]}>
                    <Popup>
                      <div className="text-sm font-semibold">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {p.address || "—"}
                      </div>
                      {p.distanceKm != null && (
                        <div className="mt-1 text-xs text-slate-600">
                          Cách bạn ~{" "}
                          <span className="font-semibold">
                            {p.distanceKm.toFixed(2)} km
                          </span>
                        </div>
                      )}
                      <Link
                        className="mt-2 inline-block text-sm underline"
                        to={`/posts/${p.id}`}
                      >
                        Xem chi tiết
                      </Link>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="text-sm font-semibold text-slate-700">
              Danh sách (chỉ bài đã duyệt): {items.length}
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
              </div>
            ) : items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
                Không có điểm phù hợp filter.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((p) => (
                  <Link key={p.id} to={`/posts/${p.id}`} className="post-card">
                    <div className="font-semibold text-slate-900">
                      {p.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {p.address || "—"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(p.needTags || []).slice(0, 4).map((t) => (
                        <span key={t} className="badge">
                          {t}
                        </span>
                      ))}
                      <span className="badge">{p.status}</span>
                      {p.distanceKm != null && (
                        <span className="badge">
                          {p.distanceKm.toFixed(2)} km
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
