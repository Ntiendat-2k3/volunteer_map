const { DataTypes } = require("sequelize");

function defineUser(sequelize) {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: true },

      // ✅ nullable vì Google user không có password
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "password_hash",
      },

      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "VOLUNTEER",
        validate: { isIn: [["ADMIN", "VOLUNTEER"]] },
      },

      // ✅ Google fields
      provider: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "LOCAL",
      }, // LOCAL / GOOGLE / LOCAL+GOOGLE
      googleId: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
        field: "google_id",
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "avatar_url",
      },
    },
    {
      tableName: "users",
      underscored: true,
    }
  );

  return User;
}

module.exports = { defineUser };
