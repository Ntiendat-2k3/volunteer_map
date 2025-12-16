const { DataTypes } = require("sequelize");

/**
 * support_commits
 *
 * Luồng:
 * - Volunteer bấm "Tôi sẽ hỗ trợ" -> tạo commit (PENDING)
 * - Chủ bài / Admin xác nhận -> CONFIRMED
 * - Volunteer hoặc Chủ bài / Admin có thể huỷ -> CANCELED
 */
function defineSupportCommit(sequelize) {
  const SupportCommit = sequelize.define(
    "SupportCommit",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      postId: { type: DataTypes.BIGINT, allowNull: false, field: "post_id" },
      userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },

      message: { type: DataTypes.TEXT, allowNull: true },

      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PENDING",
        validate: { isIn: [["PENDING", "CONFIRMED", "CANCELED"]] },
      },

      confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "confirmed_at",
      },
      canceledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "canceled_at",
      },
    },
    {
      tableName: "support_commits",
      underscored: true,
    }
  );

  return SupportCommit;
}

module.exports = { defineSupportCommit };
