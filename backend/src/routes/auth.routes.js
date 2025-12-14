const router = require("express").Router();
const passport = require("passport");
const { requireAuth } = require("../middlewares/requireAuth");
const authController = require("../controllers/auth.controller");
const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");
const { User } = require("../models");

router.post("/register", authController.register);
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  authController.login
);
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

// // ✅ Google callback
// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     session: false,
//     failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`,
//   }),
//   async (req, res, next) => {
//     try {
//       // tạo refresh cookie + trả access token theo cách “server-side”
//       const { refreshToken } = await authService.login(req.user);
//       tokenService.setRefreshCookie(res, refreshToken);

//       // redirect về frontend callback page
//       return res.redirect(`${process.env.FRONTEND_URL}/oauth/google`);
//     } catch (e) {
//       next(e);
//     }
//   }
// );

router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      console.log("GOOGLE CALLBACK err:", err);
      console.log("GOOGLE CALLBACK info:", info);
      console.log("GOOGLE CALLBACK user:", user);

      if (err || !user) {
        console.log("GOOGLE CALLBACK -> FAIL REDIRECT");
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login?error=google`
        );
      }

      try {
        const { User } = require("../models");
        const authService = require("../services/auth.service");
        const tokenService = require("../services/token.service");

        const dbUser = await User.findByPk(user.id);
        console.log("dbUser found:", !!dbUser);

        const { refreshToken } = await authService.login(dbUser);
        console.log("refreshToken issued:", !!refreshToken);

        tokenService.setRefreshCookie(res, refreshToken);
        console.log("refresh cookie set");

        console.log("GOOGLE CALLBACK -> SUCCESS REDIRECT");
        return res.redirect(`${process.env.FRONTEND_URL}/oauth/google`);
      } catch (e) {
        console.log("LOGIN AFTER GOOGLE ERROR:", e);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
      }
    }
  )(req, res, next);
});

module.exports = router;
