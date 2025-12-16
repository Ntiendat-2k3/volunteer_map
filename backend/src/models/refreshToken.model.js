const { DataTypes } = require("sequelize");

function defineRefreshToken(sequelize) {
  const RefreshToken = sequelize.define(
    "RefreshToken",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: "token_hash",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      revokedAt: { type: DataTypes.DATE, allowNull: true, field: "revoked_at" },
    },
    {
      tableName: "refresh_tokens",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return RefreshToken;
}

module.exports = { defineRefreshToken };
