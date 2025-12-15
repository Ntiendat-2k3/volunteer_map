const { DataTypes } = require("sequelize");

function definePost(sequelize) {
  const Post = sequelize.define(
    "Post",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },

      title: { type: DataTypes.STRING(180), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: true },

      lat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      lng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },

      needTags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
        field: "need_tags",
      },

      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "OPEN",
        validate: { isIn: [["OPEN", "CLOSED"]] },
      },

      approvalStatus: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "PENDING",
        field: "approval_status",
        validate: { isIn: [["PENDING", "APPROVED", "REJECTED"]] },
      },
      approvedBy: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "approved_by",
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "approved_at",
      },
      rejectedReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "rejected_reason",
      },
      contactName: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: "contact_name",
      },
      contactPhone: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: "contact_phone",
      },
    },
    {
      tableName: "posts",
      paranoid: true,
      deletedAt: "deleted_at",
      underscored: true,
    }
  );

  return Post;
}

module.exports = { definePost };
