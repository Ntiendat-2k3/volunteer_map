const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const passport = require("passport");
const { initPassport } = require("./config/passport");
const { env } = require("./config/env");

const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: env.corsOrigin, credentials: true }));

app.use(passport.initialize());
initPassport(passport);

app.use("/api", routes);

app.use(errorHandler);

module.exports = { app };
