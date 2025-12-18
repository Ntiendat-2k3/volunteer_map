const { Op } = require("sequelize");
const { ApiError } = require("../utils/apiError");
const { SupportCommit, Post, User, sequelize } = require("../models");

function toInt(v, field) {
  const n = Number(v);
  if (!Number.isInteger(n))
    throw ApiError.badRequest(`${field} must be an integer`);
  return n;
}

function sanitizeCommit(c) {
  const json = c.toJSON ? c.toJSON() : c;
  return {
    id: json.id,
    postId: json.postId,
    userId: json.userId,
    quantity: json.quantity,
    message: json.message ?? null,
    status: json.status,
    confirmedAt: json.confirmedAt ?? null,
    canceledAt: json.canceledAt ?? null,
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

function sanitizePublicCommit(c) {
  const json = c.toJSON ? c.toJSON() : c;
  return {
    id: json.id,
    user: json.user
      ? { id: json.user.id, name: json.user.name, email: json.user.email }
      : null,
    message: json.message ?? null,
    createdAt: json.createdAt,
  };
}

function assertPostAcceptsCommit(post) {
  if (!post) throw ApiError.notFound("Post not found");
  if (post.approvalStatus !== "APPROVED") {
    throw ApiError.badRequest(
      "Bài chưa được duyệt nên chưa thể đăng ký hỗ trợ"
    );
  }
  if (post.status !== "OPEN") {
    throw ApiError.badRequest("Điểm này đã đóng nhận hỗ trợ");
  }
}

async function createOrUpdateMyCommit({ postId, userId, quantity, message }) {
  const post = await Post.findByPk(postId);
  assertPostAcceptsCommit(post);

  // Không cho owner tự đăng ký cho bài mình (demo sạch hơn)
  if (Number(post.userId) === Number(userId)) {
    throw ApiError.badRequest(
      "Bạn không thể đăng ký hỗ trợ cho bài của chính bạn"
    );
  }

  const q = toInt(quantity ?? 1, "quantity");
  if (q < 1) throw ApiError.badRequest("quantity must be >= 1");
  const msg =
    message != null && String(message).trim() ? String(message).trim() : null;

  // 1 user / 1 post: unique (post_id, user_id)
  const existing = await SupportCommit.findOne({
    where: { postId, userId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });

  if (existing) {
    // Nếu đã CONFIRMED: cho update? -> mình chặn để đúng luồng "huỷ rồi đăng ký lại"
    if (existing.status === "CONFIRMED") {
      throw ApiError.badRequest(
        "Bạn đã được xác nhận. Muốn đổi, hãy huỷ rồi đăng ký lại."
      );
    }

    existing.quantity = q;
    existing.message = msg;
    existing.status = "PENDING"; // nếu trước đó CANCELED mà đăng ký lại -> quay về PENDING
    existing.confirmedAt = null;
    existing.canceledAt = null;
    await existing.save();
    return sanitizeCommit(existing);
  }

  const created = await SupportCommit.create({
    postId,
    userId,
    quantity: q,
    message: msg,
    status: "PENDING",
    confirmedAt: null,
    canceledAt: null,
  });

  const full = await SupportCommit.findByPk(created.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });

  return sanitizeCommit(full);
}

async function getMyCommitForPost({ postId, userId }) {
  const commit = await SupportCommit.findOne({
    where: { postId, userId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });
  return commit ? sanitizeCommit(commit) : null;
}

async function listCommitsForPost({ postId, status }) {
  const where = { postId };
  if (status) {
    const s = String(status).toUpperCase();
    if (!["PENDING", "CONFIRMED", "CANCELED"].includes(s)) {
      throw ApiError.badRequest("Invalid status filter");
    }
    where.status = s;
  }

  const rows = await SupportCommit.findAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 300,
  });

  return { items: rows.map(sanitizeCommit) };
}

async function getCommitOr404({ postId, commitId }) {
  const id = toInt(commitId, "commitId");
  const commit = await SupportCommit.findOne({
    where: { id, postId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });
  if (!commit) throw ApiError.notFound("Support commit not found");
  return commit;
}

async function confirmCommit({ postId, commitId }) {
  const commit = await getCommitOr404({ postId, commitId });
  if (commit.status === "CANCELED")
    throw ApiError.badRequest("Commit đã bị huỷ");
  if (commit.status === "CONFIRMED") return sanitizeCommit(commit);

  commit.status = "CONFIRMED";
  commit.confirmedAt = new Date();
  commit.canceledAt = null;
  await commit.save();

  return sanitizeCommit(commit);
}

async function cancelCommit({ postId, commitId, actorUserId, actorRole }) {
  const commit = await getCommitOr404({ postId, commitId });

  const post = await Post.findByPk(postId);
  if (!post) throw ApiError.notFound("Post not found");

  const isOwner = Number(post.userId) === Number(actorUserId);
  const isAdmin = actorRole === "ADMIN";
  const isCommitOwner = Number(commit.userId) === Number(actorUserId);

  if (!isOwner && !isAdmin && !isCommitOwner)
    throw ApiError.forbidden("Forbidden");

  if (commit.status === "CANCELED") return sanitizeCommit(commit);

  commit.status = "CANCELED";
  commit.canceledAt = new Date();
  await commit.save();

  return sanitizeCommit(commit);
}

async function getSummary({ postId }) {
  const rows = await SupportCommit.findAll({
    where: { postId },
    attributes: [
      "status",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      [
        sequelize.fn(
          "COALESCE",
          sequelize.fn("SUM", sequelize.col("quantity")),
          0
        ),
        "qty",
      ],
    ],
    group: ["status"],
    raw: true,
  });

  const map = Object.fromEntries(
    rows.map((r) => [r.status, { count: Number(r.count), qty: Number(r.qty) }])
  );

  const pending = map.PENDING || { count: 0, qty: 0 };
  const confirmed = map.CONFIRMED || { count: 0, qty: 0 };
  const canceled = map.CANCELED || { count: 0, qty: 0 };

  return {
    pendingCount: pending.count,
    pendingQty: pending.qty,
    confirmedCount: confirmed.count,
    confirmedQty: confirmed.qty,
    canceledCount: canceled.count,
    canceledQty: canceled.qty,
    activeCount: pending.count + confirmed.count,
    activeQty: pending.qty + confirmed.qty,
  };
}

async function listPublicConfirmedForPost({ postId, limit }) {
  const n = Number(limit);
  const lim = Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 6;

  const rows = await SupportCommit.findAll({
    where: { postId, status: "CONFIRMED" },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
    limit: lim,
  });
  return { items: rows.map(sanitizePublicCommit) };
}

module.exports = {
  createOrUpdateMyCommit,
  getMyCommitForPost,
  listCommitsForPost,
  confirmCommit,
  cancelCommit,
  getSummary,
  listPublicConfirmedForPost,
};
