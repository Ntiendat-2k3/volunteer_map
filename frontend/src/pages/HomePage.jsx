import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { postApi } from "../services/postApi";
import {
  FiCrosshair,
  FiSearch,
  FiTag,
  FiFilter,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

function ZoomDock() {
  const map = useMap();

  return (
    <div className="absolute bottom-4 left-4 z-[700]">
      <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-lg backdrop-blur-xl">
        <button
          type="button"
          className="px-3 py-2 text-slate-900 hover:bg-slate-50"
          onClick={() => map.zoomIn()}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <FiPlus />
        </button>
        <div className="h-8 w-px bg-slate-200" />
        <button
          type="button"
          className="px-3 py-2 text-slate-900 hover:bg-slate-50"
          onClick={() => map.zoomOut()}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <FiMinus />
        </button>
      </div>
    </div>
  );
}

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

  // debounce nhẹ
  useEffect(() => {
    const t = setTimeout(fetchList, 250);
    return () => clearTimeout(t);
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
      {/* 1 khối chung: map + list */}
      <div className="rounded-[18px] border border-slate-200 bg-white/60 shadow-[0_10px_40px_rgba(2,6,23,0.08)] backdrop-blur-xl overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_420px] gap-0">
          {/* MAP SIDE */}
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Khám phá điểm quyên góp
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur">
                  {near && pos ? `Near • ${radiusKm}km` : "All area"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur">
                  {loading ? "Loading…" : `${items.length} điểm`}
                </span>
              </div>
            </div>

            <div className="mt-4 relative overflow-hidden rounded-[24px] border border-slate-200 bg-white">
              {/* MAP */}
              <MapContainer
                center={center}
                zoom={12}
                zoomControl={false}
                className="h-[560px] w-full"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* ✅ zoom chuyển xuống góc dưới trái */}
                <ZoomDock />

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

              {/* FLOATING FILTER TOOLBAR */}
              <div className="absolute left-4 right-4 top-4 z-[600]">
                <div className="rounded-[22px] border border-slate-200 bg-white/70 p-3 shadow-lg backdrop-blur-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <FiSearch className="text-slate-500" />
                      <input
                        className="w-full bg-transparent text-sm outline-none"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Tìm theo tiêu đề / địa chỉ…"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <FiFilter className="text-slate-500" />
                      <select
                        className="bg-transparent text-sm outline-none"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    {/* Tag */}
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <FiTag className="text-slate-500" />
                      <input
                        className="w-[160px] bg-transparent text-sm outline-none"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="Tag (vd: Sách)"
                      />
                    </div>

                    {/* Near buttons */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                      onClick={onNearMe}
                    >
                      <FiCrosshair /> Gần tôi
                    </button>

                    <button
                      type="button"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      onClick={() => {
                        setNear(false);
                        setPos(null);
                        toast.success("Đã tắt lọc gần tôi");
                      }}
                    >
                      Tắt Near
                    </button>

                    {/* Radius */}
                    {near && pos && (
                      <div className="ml-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2">
                        <span className="text-xs font-semibold text-slate-700">
                          Bán kính
                        </span>
                        <input
                          type="range"
                          min={1}
                          max={50}
                          value={radiusKm}
                          onChange={(e) => setRadiusKm(Number(e.target.value))}
                          className="w-[140px]"
                        />
                        <span className="text-xs font-bold text-slate-900">
                          {radiusKm}km
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LIST SIDE (dính liền, chỉ kẻ nhẹ) */}
          <div className="p-5 lg:border-l lg:border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  Danh sách (chỉ bài đã duyệt)
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Chọn 1 mục để xem chi tiết post
                </div>
              </div>

              <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-800">
                {items.length}
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
                  <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
                  <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-700">
                  Không có điểm phù hợp filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      to={`/posts/${p.id}`}
                      className="group block rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-slate-900">
                            {p.title}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {p.address || "—"}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                          {p.status}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(p.needTags || []).slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800"
                          >
                            {t}
                          </span>
                        ))}

                        {p.distanceKm != null && (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                            {p.distanceKm.toFixed(2)} km
                          </span>
                        )}
                      </div>

                      <div className="mt-3 text-xs font-semibold text-slate-700 opacity-0 transition group-hover:opacity-100">
                        Mở chi tiết →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
