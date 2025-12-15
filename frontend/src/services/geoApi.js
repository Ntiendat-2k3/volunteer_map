import { http } from "./http";

export const geoApi = {
  search: (q, config = {}) =>
    http.get("/geo/search", { params: { q }, ...config }),
  reverse: (lat, lng, config = {}) =>
    http.get("/geo/reverse", { params: { lat, lng }, ...config }),
};
