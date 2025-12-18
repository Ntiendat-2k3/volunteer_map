const { DataTypes } = require("sequelize");

function definePostComment(sequelize) {
  const PostComment = sequelize.define(
    "PostComment",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      postId: { type: DataTypes.BIGINT, allowNull: false, field: "post_id" },
      userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },

      parentId: { type: DataTypes.BIGINT, allowNull: true, field: "parent_id" },

      content: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "post_comments",
      paranoid: true,
      deletedAt: "deleted_at",
      underscored: true,
    }
  );

  return PostComment;
}

module.exports = { definePostComment };
