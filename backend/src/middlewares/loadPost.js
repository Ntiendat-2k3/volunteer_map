const { asyncHandler } = require("./asyncHandler");
const { ApiError } = require("../utils/apiError");
const { Post, User } = require("../models");

const loadPost = asyncHandler(async (req, _res, next) => {
  const id = Number(req.params.id);
  if (!id) throw ApiError.badRequest("Invalid post id");

  const post = await Post.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "name", "avatarUrl"],
      },
    ],
  });

  if (!post) throw ApiError.notFound("Post not found");
  req.post = post;
  next();
});

module.exports = { loadPost };
