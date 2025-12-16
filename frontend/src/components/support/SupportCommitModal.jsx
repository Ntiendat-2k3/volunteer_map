import React from "react";
import { FiHeart } from "react-icons/fi";

export default function SupportCommitModal({
  open,
  onClose,
  onSubmit,
  busy,
  qty,
  setQty,
  msg,
  setMsg,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-lg">
        <div className="card-body">
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-extrabold">Đăng ký hỗ trợ</div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={busy}
            >
              Đóng
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
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
                onClick={onClose}
                disabled={busy}
              >
                Huỷ
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                <FiHeart /> Gửi đăng ký
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
