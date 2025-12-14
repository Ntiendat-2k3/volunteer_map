require("dotenv").config();

function parseDurationMs(input, fallbackMs) {
  if (!input) return fallbackMs;
  const m = String(input)
    .trim()
    .match(/^(\d+)\s*([smhd])$/i);
  if (!m) return fallbackMs;
  const v = Number(m[1]);
  const u = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[u];
  return v * mult;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || "volunteer_map",
    user: process.env.DB_USER || "postgres",
    pass: process.env.DB_PASS || "852003",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
    accessExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
    refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    refreshCookieName: process.env.REFRESH_COOKIE_NAME || "refresh_token",
  },

  sync: {
    enabled: String(process.env.DB_SYNC || "true") === "true",
    force: String(process.env.DB_SYNC_FORCE || "false") === "true",
    alter: String(process.env.DB_SYNC_ALTER || "true") === "true",
  },
};

env.jwt.refreshCookieMaxAgeMs = parseDurationMs(
  env.jwt.refreshExpires,
  7 * 86400000
);

module.exports = { env };
