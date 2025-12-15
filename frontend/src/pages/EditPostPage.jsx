import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { postApi } from "../services/postApi";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { geoApi } from "../services/geoApi";
import { FiPhone, FiUser } from "react-icons/fi";

const TAGS = ["Tiền", "Quần áo", "Sách", "Đồ ăn", "Nhân lực", "Y tế"];

function ClickPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

export default function EditPostPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [pos, setPos] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [needTags, setNeedTags] = useState([]);
  const [status, setStatus] = useState("OPEN");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    (async () => {
      const res = await postApi.get(id);
      const p = res.data.data.post;

      setTitle(p.title || "");
      setDescription(p.description || "");
      setAddress(p.address || "");
      setNeedTags(p.needTags || []);
      setStatus(p.status || "OPEN");

      setContactName(p.contactName || "");
      setContactPhone(p.contactPhone || "");

      setPos({ lat: Number(p.lat), lng: Number(p.lng) });
    })().catch((e) =>
      toast.error(e?.response?.data?.message || "Không tải được bài")
    );
  }, [id]);

  const center = useMemo(() => {
    if (!pos) return [10.8231, 106.6297];
    return [pos.lat, pos.lng];
  }, [pos]);

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
    } catch {}
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await postApi.update(id, {
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
      toast.success("Đã cập nhật! Bài quay về trạng thái chờ duyệt ✅");
      nav(`/posts/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update thất bại");
    }
  };

  if (!pos) return null;

  return (
    <div className="container-app py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <div className="text-xl font-extrabold tracking-tight">Sửa bài</div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <div className="label">Tiêu đề</div>
                <div className="input-wrap">
                  <input
                    className="input-plain"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="label">Tên người liên hệ</div>
                  <div className="input-wrap">
                    <FiUser className="text-slate-500" />
                    <input
                      className="input-plain"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
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

              <button className="btn btn-primary w-full" type="submit">
                Lưu (chờ duyệt)
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="text-sm font-semibold text-slate-700">
              Đổi vị trí (click map)
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
          </div>
        </div>
      </div>
    </div>
  );
}
