const { sequelize } = require("../config/sequelize");
const { defineUser } = require("./user.model");
const { defineRefreshToken } = require("./refreshToken.model");
const { definePost } = require("./post.model");
const { defineSupportCommit } = require("./supportCommit.model");

const User = defineUser(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const Post = definePost(sequelize);
const SupportCommit = defineSupportCommit(sequelize);

User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "user" });

// Support commits
User.hasMany(SupportCommit, { foreignKey: "userId", as: "supportCommits" });
SupportCommit.belongsTo(User, { foreignKey: "userId", as: "user" });

Post.hasMany(SupportCommit, { foreignKey: "postId", as: "supportCommits" });
SupportCommit.belongsTo(Post, { foreignKey: "postId", as: "post" });

module.exports = { sequelize, User, RefreshToken, Post, SupportCommit };
