import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { postApi } from "../services/postApi";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { geoApi } from "../services/geoApi";
import { FiCrosshair, FiPhone, FiUser } from "react-icons/fi";

const TAGS = ["Tiền", "Quần áo", "Sách", "Đồ ăn", "Nhân lực", "Y tế"];

function ClickPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

export default function CreatePostPage() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [needTags, setNeedTags] = useState([]);
  const [status, setStatus] = useState("OPEN");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [pos, setPos] = useState({ lat: 10.8231, lng: 106.6297 });

  const center = useMemo(() => [pos.lat, pos.lng], [pos]);

  const toggleTag = (t) => {
    setNeedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const syncAddressFromPos = async (p) => {
    try {
      const r = await geoApi.reverse(p.lat, p.lng);
      const item = r.data.data.item;
      if (item?.label) setAddress(item.label);
    } catch {
      // im lặng để tránh spam
    }
  };

  const onUseMyLocation = () => {
    if (!navigator.geolocation)
      return toast.error("Trình duyệt không hỗ trợ định vị");
    navigator.geolocation.getCurrentPosition(
      async (g) => {
        const p = { lat: g.coords.latitude, lng: g.coords.longitude };
        setPos(p);
        await syncAddressFromPos(p);
        toast.success("Đã lấy vị trí của bạn ✅");
      },
      () => toast.error("Bạn chưa cấp quyền định vị")
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await postApi.create({
        title,
        description,
        address,
        lat: pos.lat,
        lng: pos.lng,
        needTags,
        status,
        contactName,
        contactPhone,
      });
      toast.success("Đã tạo bài! Bài đang chờ Admin duyệt ✅");
      nav(`/posts/${res.data.data.post.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Tạo thất bại");
    }
  };

  return (
    <div className="container-app py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <div className="text-xl font-extrabold tracking-tight">
              Tạo điểm thiện nguyện
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Nhập địa chỉ để chọn gợi ý (ra tọa độ), hoặc click map để lấy vị
              trí.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <div className="label">Tiêu đề</div>
                <div className="input-wrap">
                  <input
                    className="input-plain"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Cần quyên góp sách cho trẻ em"
                  />
                </div>
              </div>

              <div>
                <div className="label">Mô tả</div>
                <div className="input-wrap">
                  <textarea
                    className="input-plain"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả nhu cầu, thời gian nhận, lưu ý..."
                  />
                </div>
              </div>

              <div>
                <div className="label">Địa chỉ</div>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onPick={(it) => {
                    setAddress(it.label);
                    setPos({ lat: it.lat, lng: it.lng });
                    toast.success("Đã chọn địa chỉ + tọa độ ✅");
                  }}
                />
                <div className="mt-2 text-xs text-slate-500">
                  Tip: chọn gợi ý để tọa độ chính xác nhất.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onUseMyLocation}
                >
                  <FiCrosshair /> Vị trí của tôi
                </button>
                <div className="text-sm text-slate-700">
                  lat: <b>{pos.lat.toFixed(6)}</b> — lng:{" "}
                  <b>{pos.lng.toFixed(6)}</b>
                </div>
              </div>

              <div>
                <div className="label">Nhu cầu</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`chip ${
                        needTags.includes(t) ? "chip-on" : "chip-off"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="label">Trạng thái</div>
                  <div className="input-wrap">
                    <select
                      className="input-plain"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div>
                <div className="text-sm font-semibold text-slate-700">
                  Thông tin liên hệ (tuỳ chọn)
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Để người muốn quyên góp liên hệ nhanh. Bạn có thể để trống nếu
                  muốn riêng tư.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="label">Tên người liên hệ</div>
                    <div className="input-wrap">
                      <FiUser className="text-slate-500" />
                      <input
                        className="input-plain"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="VD: Đạt"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="label">Số điện thoại</div>
                    <div className="input-wrap">
                      <FiPhone className="text-slate-500" />
                      <input
                        className="input-plain"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary w-full" type="submit">
                Tạo bài (chờ duyệt)
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="text-sm font-semibold text-slate-700">
              Chọn vị trí (click map)
            </div>

            <div className="map-box mt-3">
              <MapContainer center={center} zoom={13} className="map-inner">
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ClickPicker
                  value={pos}
                  onChange={async (p) => {
                    setPos(p);
                    await syncAddressFromPos(p);
                  }}
                />
              </MapContainer>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Click map sẽ tự reverse để ra địa chỉ gần đúng nhất.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
