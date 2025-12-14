Logic token trong hệ thonng (Passport + accessToken/refreshToken) chạy theo flow này:

# 1) Khi Register
- Client gửi email/password/name lên /api/auth/register
- Server:
    hash password → lưu vào bảng users
- Không trả accessToken (đúng chuẩn), chỉ trả user.

# 2) Khi Login
- Client gọi /api/auth/login (passport-local xác thực email/password)
- Server làm 3 việc:
(a) Tạo Access Token
- JWT ký bằng JWT_ACCESS_SECRET
- Payload chứa thông tin tối thiểu (email/role/name), sub = userId
- Expire ngắn (ví dụ 15 phút)

➡️ Trả về cho client trong JSON: { "accessToken": "..." }

(b) Tạo Refresh Token
- JWT ký bằng JWT_REFRESH_SECRET
- Chỉ để “xin access token mới”
- Expire dài (ví dụ 7 ngày)

(c) Lưu refresh token vào DB (an toàn)
- Không lưu raw token
- Lưu hash(token) vào bảng refresh_tokens + expires_at
- Set refresh token vào HttpOnly cookie (JS không đọc được)

➡️ Vậy client nhận:
- accessToken trong body
- refreshToken nằm trong cookie (tự gửi kèm request sau này)

# 3) Khi gọi API cần đăng nhập (VD: /api/auth/me)
- Client gửi:
    Header: Authorization: Bearer <accessToken>
- Server:
  Passport JWT verify access token
  Nếu hợp lệ → trả user
  Nếu hết hạn / sai → trả 401

# 4) Khi Access Token hết hạn → dùng Refresh Token để xin mới
- Client gọi:
    POST /api/auth/refresh
    không cần Authorization
    Browser/Postman sẽ tự gửi cookie refresh token
- Server xử lý:
1.Verify refresh token bằng JWT_REFRESH_SECRET
2.Hash refresh token → tìm trong DB:
  token còn hạn
  chưa bị revoke
3.Nếu OK → rotate token:
  revoke token cũ (revoked_at = now)
  tạo refresh token mới → lưu hash mới vào DB
4.tạo access token mới
5.set cookie refresh token mới
6.trả access token mới trong JSON

➡️ Đây gọi là Refresh Token Rotation: mỗi lần refresh sẽ đổi refresh token để tránh bị đánh cắp dùng mãi.

# 5) Logout
Client gọi POST /api/auth/logout
Server:
  - lấy refresh token từ cookie
  - hash token → tìm trong DB → set revoked_at = now
  - clear cookie

➡️ Sau logout:
  access token cũ vẫn có thể sống tới khi hết hạn (vì JWT stateless)
  nhưng refresh token đã revoke nên không thể xin token mới nữa.

# Tóm tắt cực ngắn (để bạn thuyết trình demo)

AccessToken: sống ngắn, gửi qua Authorization, dùng để gọi API.

RefreshToken: sống dài, lưu HttpOnly cookie, dùng để xin accessToken mới khi accessToken hết hạn.

Refresh token được lưu hash trong DB và rotate mỗi lần refresh để tăng bảo mật.
