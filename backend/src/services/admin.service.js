const { Op } = require("sequelize");
const { ApiError } = require("../utils/apiError");
const { Post, User } = require("../models");
const { sanitizePost } = require("./post.service");

async function dashboard() {
  const [total, pending, approved, rejected, open, closed] = await Promise.all([
    Post.count(),
    Post.count({ where: { approvalStatus: "PENDING" } }),
    Post.count({ where: { approvalStatus: "APPROVED" } }),
    Post.count({ where: { approvalStatus: "REJECTED" } }),
    Post.count({ where: { status: "OPEN" } }),
    Post.count({ where: { status: "CLOSED" } }),
  ]);

  return { total, pending, approved, rejected, open, closed };
}

async function listPosts(query) {
  const approvalStatus = String(query.approvalStatus || "").toUpperCase();
  const status = String(query.status || "").toUpperCase();
  const q = String(query.q || "").trim();

  const where = {};
  if (["PENDING", "APPROVED", "REJECTED"].includes(approvalStatus))
    where.approvalStatus = approvalStatus;
  if (["OPEN", "CLOSED"].includes(status)) where.status = status;

  if (q) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${q}%` } },
      { address: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const rows = await Post.findAll({
    where,
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

  return { items: rows.map(sanitizePost) };
}

async function approvePost(postId, adminId) {
  const post = await Post.findByPk(postId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });
  if (!post) throw ApiError.notFound("Post not found");

  post.approvalStatus = "APPROVED";
  post.approvedBy = adminId;
  post.approvedAt = new Date();
  post.rejectedReason = null;

  await post.save();
  return sanitizePost(post);
}

async function rejectPost(postId, adminId, reason) {
  const post = await Post.findByPk(postId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });
  if (!post) throw ApiError.notFound("Post not found");

  post.approvalStatus = "REJECTED";
  post.approvedBy = adminId;
  post.approvedAt = null;
  post.rejectedReason = reason ? String(reason) : "Không phù hợp";

  await post.save();
  return sanitizePost(post);
}

module.exports = { dashboard, listPosts, approvePost, rejectPost };
