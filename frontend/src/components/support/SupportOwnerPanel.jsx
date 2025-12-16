import React from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const fmt = (v) => (v ? new Date(v).toLocaleString() : "—");
const stText = (st) =>
  st === "PENDING"
    ? "Chờ"
    : st === "CONFIRMED"
    ? "Đã xác nhận"
    : st === "CANCELED"
    ? "Đã huỷ"
    : st;

export default function SupportOwnerPanel({
  commits = [],
  busy,
  onRefresh,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold text-slate-800">
          Quản lý đăng ký hỗ trợ ({commits.length})
        </div>
        <button className="btn btn-outline" onClick={onRefresh} disabled={busy}>
          Làm mới
        </button>
      </div>

      {commits.length === 0 ? (
        <div className="mt-3 text-sm text-slate-600">Chưa có ai đăng ký.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {commits.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-800">
                  {c.user?.name || c.user?.email || `User #${c.userId}`}
                </div>
                <span className="badge">{stText(c.status)}</span>
              </div>

              <div className="mt-2 text-sm text-slate-700">
                <div>
                  <span className="font-semibold">Số lượng:</span> {c.quantity}
                </div>
                <div className="mt-1">
                  <span className="font-semibold">Ghi chú:</span>{" "}
                  {c.message ? (
                    <span className="whitespace-pre-wrap">{c.message}</span>
                  ) : (
                    <span className="text-slate-500">(Không có)</span>
                  )}
                </div>
                <div className="mt-1 text-slate-500">
                  Tạo: {fmt(c.createdAt)}
                </div>
                {c.confirmedAt && (
                  <div className="mt-1 text-slate-500">
                    Xác nhận: {fmt(c.confirmedAt)}
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {c.status === "PENDING" && (
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => onConfirm(c.id)}
                  >
                    <FiCheckCircle /> Xác nhận
                  </button>
                )}
                {c.status !== "CANCELED" && (
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() => onCancel(c.id)}
                  >
                    <FiXCircle /> Huỷ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
