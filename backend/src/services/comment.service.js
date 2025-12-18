const { ApiError } = require("../utils/apiError");
const { PostComment, User } = require("../models");

function sanitizeUser(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl };
}

function toNode(c) {
  const json = c.toJSON ? c.toJSON() : c;
  const deleted = !!json.deletedAt;
  return {
    id: json.id,
    postId: json.postId,
    userId: json.userId,
    parentId: json.parentId,
    content: deleted ? null : json.content,
    isDeleted: deleted,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    user: sanitizeUser(json.user),
    replies: [],
  };
}

function buildTree(flat) {
  const map = new Map();
  const roots = [];

  for (const item of flat) {
    const node = toNode(item);
    map.set(node.id, node);
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (arr) => {
    arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // oldest -> newest trong thread
    for (const x of arr) sortRec(x.replies);
  };
  sortRec(roots);

  // Root newest first giống TikTok
  roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return roots;
}

async function listByPost(postId, { limit = 200 }) {
  const lim = Math.min(Math.max(Number(limit) || 200, 1), 500);

  const rows = await PostComment.findAll({
    where: { postId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "avatarUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: lim,
  });

  // rows đang DESC theo createdAt; buildTree sẽ tự sort lại replies
  return { items: buildTree(rows), total: rows.length };
}

async function create({ postId, userId, content, parentId }) {
  const text = String(content || "").trim();
  if (!text) throw ApiError.badRequest("Nội dung bình luận không được trống");
  if (text.length > 2000)
    throw ApiError.badRequest("Bình luận quá dài (tối đa 2000 ký tự)");

  let parent = null;
  if (parentId) {
    parent = await PostComment.findOne({
      where: { id: Number(parentId), postId },
    });
    if (!parent) throw ApiError.badRequest("Parent comment không hợp lệ");
  }

  const c = await PostComment.create({
    postId,
    userId,
    parentId: parent ? parent.id : null,
    content: text,
  });

  const full = await PostComment.findByPk(c.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "avatarUrl"],
      },
    ],
  });

  return toNode(full);
}

async function update({ postId, commentId, user, content }) {
  const c = await PostComment.findOne({
    where: { id: Number(commentId), postId },
  });
  if (!c) throw ApiError.notFound("Không tìm thấy bình luận");

  const isAdmin = user.role === "ADMIN";
  const isMine = Number(c.userId) === Number(user.id);
  if (!isAdmin && !isMine) throw ApiError.forbidden("Forbidden");
  if (c.deletedAt) throw ApiError.badRequest("Bình luận đã bị xoá");

  const text = String(content || "").trim();
  if (!text) throw ApiError.badRequest("Nội dung không được trống");
  if (text.length > 2000)
    throw ApiError.badRequest("Bình luận quá dài (tối đa 2000 ký tự)");

  c.content = text;
  await c.save();

  const full = await PostComment.findByPk(c.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "avatarUrl"],
      },
    ],
  });
  return toNode(full);
}

/**
 * Soft delete: giữ thread, không xoá record khỏi DB
 * - set deleted_at (paranoid destroy)
 * - content không trả về nữa (ở sanitize)
 */
async function softDelete({ postId, commentId, user }) {
  const c = await PostComment.findOne({
    where: { id: Number(commentId), postId },
  });
  if (!c) throw ApiError.notFound("Không tìm thấy bình luận");

  const isAdmin = user.role === "ADMIN";
  const isMine = Number(c.userId) === Number(user.id);
  if (!isAdmin && !isMine) throw ApiError.forbidden("Forbidden");

  await c.destroy(); // paranoid -> sets deleted_at
  return { message: "Deleted" };
}

module.exports = { listByPost, create, update, softDelete };
