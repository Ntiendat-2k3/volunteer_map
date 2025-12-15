const { Op } = require("sequelize");
const { ApiError } = require("../utils/apiError");
const { Post, User, sequelize } = require("../models");

const DUP_RADIUS_KM = 0.05; // 50m - đổi 0.02 = 20m nếu muốn chặt hơn

function parseTags(input) {
  if (!input) return [];
  if (Array.isArray(input))
    return input
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);

  return String(input)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNumber(v, fieldName) {
  const n = Number(v);
  if (!Number.isFinite(n))
    throw ApiError.badRequest(`${fieldName} must be a number`);
  return n;
}

function normalizePhone(v) {
  if (!v) return null;
  const s = String(v).trim().replace(/\s+/g, "");
  if (!s) return null;

  // VN basic: 0xxxxxxxxx(9-10) hoặc +84xxxxxxxxx
  const ok = /^(0\d{9,10}|\+84\d{8,10})$/.test(s);
  if (!ok) throw ApiError.badRequest("Số điện thoại không hợp lệ");
  return s;
}

function distanceExprKm(lat, lng) {
  // Haversine distance (km)
  return `
    (6371 * acos(
      cos(radians(${lat})) * cos(radians("Post"."lat"))
      * cos(radians("Post"."lng") - radians(${lng}))
      + sin(radians(${lat})) * sin(radians("Post"."lat"))
    ))
  `;
}

async function assertLocationNotExists({ lat, lng, excludeId = null }) {
  const expr = distanceExprKm(lat, lng);

  const where = {
    approvalStatus: { [Op.in]: ["PENDING", "APPROVED"] }, // ✅ chặn các bài đang sống
  };

  if (excludeId) where.id = { [Op.ne]: excludeId };

  where[Op.and] = where[Op.and] || [];
  where[Op.and].push(sequelize.literal(`${expr} <= ${DUP_RADIUS_KM}`));

  const dup = await Post.findOne({
    where,
    attributes: ["id", "title", "lat", "lng", "approvalStatus"],
  });

  if (dup) {
    throw ApiError.badRequest("Điểm thiện nguyện này đã được tạo");
  }
}

function sanitizePost(p, opts = {}) {
  const json = p.toJSON ? p.toJSON() : p;
  const distanceKmRaw = json.distanceKm ?? json?.dataValues?.distanceKm;

  const showContact = !!opts.showContact;

  return {
    id: json.id,
    userId: json.userId,

    title: json.title,
    description: json.description,
    address: json.address,

    lat: Number(json.lat),
    lng: Number(json.lng),

    needTags: json.needTags || [],
    status: json.status,
    approvalStatus: json.approvalStatus,

    // ✅ contact: chỉ show khi login
    contactName: showContact ? json.contactName ?? null : null,
    contactPhone: showContact ? json.contactPhone ?? null : null,

    distanceKm: distanceKmRaw != null ? Number(distanceKmRaw) : undefined,

    createdAt: json.createdAt,
    updatedAt: json.updatedAt,

    user: json.user
      ? {
          id: json.user.id,
          email: json.user.email,
          name: json.user.name,
          avatarUrl: json.user.avatarUrl ?? null,
        }
      : undefined,
  };
}

async function createPost(userId, payload) {
  const title = String(payload.title || "").trim();
  if (!title) throw ApiError.badRequest("title is required");

  const lat = parseNumber(payload.lat, "lat");
  const lng = parseNumber(payload.lng, "lng");

  // ✅ CHỐNG TRÙNG ĐỊA ĐIỂM
  await assertLocationNotExists({ lat, lng });

  try {
    const post = await Post.create({
      userId,
      title,
      description: payload.description ? String(payload.description) : null,
      address: payload.address ? String(payload.address) : null,

      lat,
      lng,

      needTags: parseTags(payload.needTags),
      status:
        String(payload.status).toUpperCase() === "CLOSED" ? "CLOSED" : "OPEN",

      // duyệt bài
      approvalStatus: "PENDING",

      // ✅ liên hệ
      contactName: payload.contactName
        ? String(payload.contactName).trim()
        : null,
      contactPhone: normalizePhone(payload.contactPhone),
    });

    const full = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "name", "avatarUrl"],
        },
      ],
    });

    return sanitizePost(full, { showContact: true });
  } catch (e) {
    // ✅ nếu bạn có tạo unique index ở DB, bắt lỗi trùng ở đây luôn
    if (e?.name === "SequelizeUniqueConstraintError") {
      throw ApiError.badRequest("Điểm thiện nguyện này đã được tạo");
    }
    throw e;
  }
}

async function listPublicPosts(query) {
  const q = String(query.q || "").trim();
  const status = String(query.status || "")
    .trim()
    .toUpperCase();
  const tag = String(query.tag || "").trim();

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
  const offset = (page - 1) * limit;

  const where = { approvalStatus: "APPROVED" };

  if (status === "OPEN" || status === "CLOSED") where.status = status;
  if (tag) where.needTags = { [Op.contains]: [tag] };

  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { address: { [Op.iLike]: `%${q}%` } },
      { description: { [Op.iLike]: `%${q}%` } },
    ];
  }

  // Near me (Haversine) + radius filter
  let attributes;
  const lat = query.lat != null ? Number(query.lat) : null;
  const lng = query.lng != null ? Number(query.lng) : null;
  const radiusKm = query.radiusKm != null ? Number(query.radiusKm) : 5;

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const r = Number.isFinite(radiusKm)
      ? Math.max(1, Math.min(50, radiusKm))
      : 5;
    const expr = distanceExprKm(lat, lng);

    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(sequelize.literal(`${expr} <= ${r}`));

    attributes = { include: [[sequelize.literal(expr), "distanceKm"]] };
  }

  const { rows, count } = await Post.findAndCountAll({
    where,
    attributes,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  // ✅ public list: không show phone
  return {
    items: rows.map((r) => sanitizePost(r, { showContact: false })),
    page,
    limit,
    total: count,
  };
}

async function listMyPosts(userId) {
  const rows = await Post.findAll({
    where: { userId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 100,
  });

  return { items: rows.map((r) => sanitizePost(r, { showContact: true })) };
}

async function updatePost(postInstance, payload) {
  const title =
    payload.title != null ? String(payload.title).trim() : undefined;
  if (title !== undefined && !title)
    throw ApiError.badRequest("title cannot be empty");

  // chuẩn bị lat/lng mới (nếu có update)
  const nextLat =
    payload.lat !== undefined
      ? parseNumber(payload.lat, "lat")
      : postInstance.lat;
  const nextLng =
    payload.lng !== undefined
      ? parseNumber(payload.lng, "lng")
      : postInstance.lng;

  // ✅ nếu đổi vị trí => check trùng (exclude chính nó)
  const changedPos = payload.lat !== undefined || payload.lng !== undefined;
  if (changedPos) {
    await assertLocationNotExists({
      lat: nextLat,
      lng: nextLng,
      excludeId: postInstance.id,
    });
  }

  if (title !== undefined) postInstance.title = title;

  if (payload.description !== undefined)
    postInstance.description = payload.description
      ? String(payload.description)
      : null;

  if (payload.address !== undefined)
    postInstance.address = payload.address ? String(payload.address) : null;

  if (payload.lat !== undefined) postInstance.lat = nextLat;
  if (payload.lng !== undefined) postInstance.lng = nextLng;

  if (payload.needTags !== undefined)
    postInstance.needTags = parseTags(payload.needTags);

  if (payload.status !== undefined) {
    const st = String(payload.status).toUpperCase();
    postInstance.status = st === "CLOSED" ? "CLOSED" : "OPEN";
  }

  // ✅ liên hệ
  if (payload.contactName !== undefined) {
    postInstance.contactName = payload.contactName
      ? String(payload.contactName).trim()
      : null;
  }
  if (payload.contactPhone !== undefined) {
    postInstance.contactPhone = normalizePhone(payload.contactPhone);
  }

  // sửa bài => quay về chờ duyệt
  postInstance.approvalStatus = "PENDING";

  try {
    await postInstance.save();
  } catch (e) {
    if (e?.name === "SequelizeUniqueConstraintError") {
      throw ApiError.badRequest("Điểm thiện nguyện này đã được tạo");
    }
    throw e;
  }

  return sanitizePost(postInstance, { showContact: true });
}

async function deletePost(postInstance) {
  await postInstance.destroy();
  return true;
}

module.exports = {
  createPost,
  listPublicPosts,
  listMyPosts,
  updatePost,
  deletePost,
  sanitizePost,
};
