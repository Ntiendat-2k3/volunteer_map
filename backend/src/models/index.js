const { sequelize } = require("../config/sequelize");
const { defineUser } = require("./user.model");
const { defineRefreshToken } = require("./refreshToken.model");
const { definePost } = require("./post.model");

const User = defineUser(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const Post = definePost(sequelize);

User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Post, { foreignKey: "userId", as: "posts" });
Post.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { sequelize, User, RefreshToken, Post };
