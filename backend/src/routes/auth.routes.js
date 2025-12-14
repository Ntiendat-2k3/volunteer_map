const router = require("express").Router();
const passport = require("passport");
const { requireAuth } = require("../middlewares/requireAuth");
const authController = require("../controllers/auth.controller");
const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");
const { User } = require("../models");

router.post("/register", authController.register);
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Tài khoản hoặc mật khẩu không đúng",
      });
    }
    req.user = user;
    return authController.login(req, res, next);
  })(req, res, next);
});

router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

// ✅ Google start
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (err || !user) {
      return res.redirect(`${frontendUrl}/login?error=google`);
    }

    try {
      const dbUser = await User.findByPk(user.id);
      const { refreshToken } = await authService.login(dbUser);

      tokenService.setRefreshCookie(res, refreshToken);

      // ✅ an toàn: không gắn token lên URL
      return res.redirect(`${frontendUrl}/oauth/google`);
    } catch (e) {
      console.log("LOGIN AFTER GOOGLE ERROR:", e);
      return res.redirect(`${frontendUrl}/login?error=google`);
    }
  })(req, res, next);
});

module.exports = router;
