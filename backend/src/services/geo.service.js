const axios = require("axios");
const { env } = require("../config/env");

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// cache đơn giản (10 phút)
const cache = new Map();
const TTL_MS = 10 * 60 * 1000;

// rate-limit ~ 1req/s theo policy public nominatim :contentReference[oaicite:1]{index=1}
let chain = Promise.resolve();
let lastAt = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function schedule(fn) {
  chain = chain.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, 1100 - (now - lastAt));
    if (wait) await sleep(wait);
    lastAt = Date.now();
    return fn();
  });
  return chain;
}

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    cache.delete(key);
    return null;
  }
  return hit.val;
}

function setCache(key, val) {
  cache.set(key, { val, exp: Date.now() + TTL_MS });
}

const http = axios.create({
  baseURL: NOMINATIM_BASE,
  timeout: 12000,
  headers: {
    // policy yêu cầu User-Agent/Referer rõ ràng :contentReference[oaicite:2]{index=2}
    "User-Agent":
      env.geo?.userAgent || "VolunteerMap/1.0 (contact: example@email.com)",
    Referer: env.frontendUrl || "http://localhost:5173",
  },
});

async function searchAddress(q) {
  const query = String(q || "").trim();
  if (query.length < 3) return [];

  const key = `s:${query.toLowerCase()}`;
  const cached = getCache(key);
  if (cached) return cached;

  const res = await schedule(() =>
    http.get("/search", {
      params: {
        q: query,
        format: "jsonv2",
        addressdetails: 1,
        limit: 6,
        countrycodes: "vn",
      },
    })
  );

  const items = (res.data || []).map((x) => ({
    label: x.display_name,
    lat: Number(x.lat),
    lng: Number(x.lon),
    raw: x,
  }));

  setCache(key, items);
  return items;
}

async function reverseGeocode(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;

  const key = `r:${la.toFixed(6)}:${lo.toFixed(6)}`;
  const cached = getCache(key);
  if (cached) return cached;

  const res = await schedule(() =>
    http.get("/reverse", {
      params: {
        lat: la,
        lon: lo,
        format: "jsonv2",
        zoom: 18,
        addressdetails: 1,
      },
    })
  );

  const out = res.data
    ? { label: res.data.display_name, lat: la, lng: lo, raw: res.data }
    : null;

  setCache(key, out);
  return out;
}

module.exports = { searchAddress, reverseGeocode };
