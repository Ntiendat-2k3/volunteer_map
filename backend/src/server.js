const { app } = require("./app");
const { env } = require("./config/env");
const { sequelize } = require("./models");

async function start() {
  await sequelize.authenticate();
  console.log("✅ DB connected");

  if (env.sync.enabled) {
    await sequelize.sync({ force: env.sync.force, alter: env.sync.alter });
    console.log("✅ DB synced (sequelize.sync)");
  }

  app.listen(env.port, () =>
    console.log(`✅ API: http://localhost:${env.port}`)
  );
}

start().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
