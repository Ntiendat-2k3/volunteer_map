const LocalStrategy = require("passport-local").Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const { env } = require("./env");
const { User } = require("../models");

function initPassport(passport) {
  // LOCAL
  passport.use(
    "local",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password", session: false },
      async (email, password, done) => {
        try {
          const cleanEmail = String(email || "")
            .toLowerCase()
            .trim();
          const user = await User.findOne({ where: { email: cleanEmail } });
          if (!user)
            return done(null, false, {
              message: "Email hoặc mật khẩu không đúng",
            });

          // ✅ nếu user tạo từ Google -> không cho login local
          if (!user.passwordHash) {
            return done(null, false, {
              message: "Tài khoản này đăng nhập bằng Google",
            });
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok)
            return done(null, false, {
              message: "Email hoặc mật khẩu không đúng",
            });

          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // JWT
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: env.jwt.accessSecret,
      },
      async (payload, done) => {
        try {
          const userId = Number(payload.sub);
          if (!userId) return done(null, false);

          const user = await User.findByPk(userId, {
            attributes: [
              "id",
              "email",
              "name",
              "role",
              "avatarUrl",
              "provider",
            ],
          });
          if (!user) return done(null, false);

          return done(null, user.toJSON());
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // GOOGLE
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const name = profile.displayName || null;
          const avatarUrl = profile.photos?.[0]?.value || null;

          const emailVerified = profile._json?.email_verified;
          if (!email || emailVerified === false) {
            return done(null, false, {
              message: "Google email chưa được xác minh/không hợp lệ",
            });
          }

          // 1) ưu tiên googleId
          let user = await User.findOne({ where: { googleId } });

          // 2) nếu chưa có -> link theo email
          if (!user) {
            user = await User.findOne({ where: { email } });
            if (user) {
              if (!user.googleId) user.googleId = googleId;
              user.avatarUrl = user.avatarUrl || avatarUrl;
              user.provider =
                user.provider === "LOCAL"
                  ? "LOCAL+GOOGLE"
                  : user.provider || "GOOGLE";
              if (!user.name && name) user.name = name;
              await user.save();
            }
          }

          // 3) tạo mới nếu không tồn tại
          if (!user) {
            user = await User.create({
              email,
              name,
              googleId,
              avatarUrl,
              provider: "GOOGLE",
              role: "VOLUNTEER",
              passwordHash: null,
            });
          }

          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

module.exports = { initPassport };
