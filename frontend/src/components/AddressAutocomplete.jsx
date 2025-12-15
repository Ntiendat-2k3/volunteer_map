import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiMapPin, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";
import { debounce } from "../utils/debounce";
import { geoApi } from "../services/geoApi";

export default function AddressAutocomplete({
  value,
  onChange,
  onPick,
  placeholder = "Nhập địa chỉ (gợi ý như Shopee)…",
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);

  const wrapRef = useRef(null);
  const abortRef = useRef(null);

  const doSearch = useMemo(
    () =>
      debounce(async (q) => {
        const query = String(q || "").trim();
        if (query.length < 3) {
          setItems([]);
          setBusy(false);
          return;
        }

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setBusy(true);
        try {
          const res = await geoApi.search(query, { signal: controller.signal });
          setItems(res.data.data.items || []);
        } catch (e) {
          if (e?.name !== "CanceledError" && e?.code !== "ERR_CANCELED") {
            toast.error("Không tìm được gợi ý địa chỉ");
          }
        } finally {
          setBusy(false);
        }
      }, 350),
    []
  );

  useEffect(() => {
    doSearch(value);
  }, [value, doSearch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (it) => {
    onChange(it.label);
    setOpen(false);
    setItems([]);
    setActive(-1);
    onPick(it);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="input-wrap">
        <FiMapPin className="text-slate-500" />
        <input
          className="input-plain"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (!open) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, items.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter") {
              if (active >= 0 && items[active]) {
                e.preventDefault();
                pick(items[active]);
              }
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {busy && <FiLoader className="animate-spin text-slate-500" />}
      </div>

      {open && items.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {items.map((it, idx) => (
            <button
              type="button"
              key={`${it.lat}-${it.lng}-${idx}`}
              onClick={() => pick(it)}
              className={`w-full px-4 py-3 text-left text-sm transition ${
                idx === active ? "bg-slate-50" : "bg-white"
              } hover:bg-slate-50`}
            >
              <div className="font-semibold text-slate-900 line-clamp-1">
                {it.label}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {it.lat.toFixed(6)}, {it.lng.toFixed(6)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

AddressAutocomplete.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
