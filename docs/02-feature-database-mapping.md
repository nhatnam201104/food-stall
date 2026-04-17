# Tong hop Chuc nang va Bang Database tuong tac

> Ngay phan tich: 2026-04-14
> Phien ban: dev branch (commit 2b3dd14)

---

## 1. He thong Xac thuc (Authentication)

### 1.1 Dang ky tai khoan Merchant
- **API:** `POST /auth/register`
- **Service:** `auth.service.ts` -> `register()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `roles` | READ | `id`, `name` (tim role "merchant") |
| `users` | CREATE | `id`, `role_id`, `full_name`, `email`, `password_hash`, `phone`, `avatar_url` |
| `merchants` | CREATE | `id`, `user_id`, `shop_name`, `address`, `contact_email` |

### 1.2 Dang ky tai khoan Tourist
- **API:** `POST /auth/tourist/register`
- **Service:** `auth.service.ts` -> `registerTourist()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `roles` | READ | `id`, `name` (tim role "tourist") |
| `users` | CREATE | `id`, `role_id`, `full_name`, `email`, `password_hash`, `phone`, `avatar_url` |

### 1.3 Dang nhap
- **API:** `POST /auth/login` / `POST /auth/tourist/login`
- **Service:** `auth.service.ts` -> `login()` / `loginTourist()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `users` | READ | `id`, `email`, `password_hash`, `is_active`, `is_deleted` |
| `roles` | READ | `name` (tra ve role cho frontend) |
| `merchants` | READ (join) | `id`, `shop_name`, `address`, `contact_email` |

### 1.4 Quen mat khau (Token-based - CU)
- **API:** `POST /auth/forgot-password` + `POST /auth/reset-password`
- **Service:** `auth.service.ts` -> `forgotPassword()` / `resetPassword()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `users` | READ + UPDATE | `id`, `email`, `is_active`, `password_reset_token`, `password_reset_expiry`, `password_hash` |

### 1.5 Quen mat khau (OTP-based - MOI)
- **API:** `POST /auth/otp/send-otp` + `POST /auth/otp/verify-otp` + `POST /auth/otp/reset-password`
- **Service:** `auth-otp.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `users` | READ + UPDATE | `id`, `email`, `is_active`, `password_hash` |
| `password_reset_otps` | CREATE + READ + UPDATE | `user_id`, `otp_code`, `expires_at`, `is_used`, `created_at` |

### 1.6 Cap nhat ho so
- **API:** `PUT /auth/profile`
- **Service:** `auth.service.ts` -> `updateProfile()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `users` | READ + UPDATE | `full_name`, `phone`, `avatar_url` |
| `merchants` | READ + UPDATE (neu la merchant) | `shop_name`, `address`, `contact_email` |

### 1.7 Doi mat khau
- **API:** `PUT /auth/change-password`
- **Service:** `auth.service.ts` -> `changePassword()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `users` | READ + UPDATE | `password_hash` |

---

## 2. Quan tri He thong (Admin)

### 2.1 Dashboard Analytics
- **API:** `GET /admin/analytics/overview`
- **Service:** `admin.analytics.service.ts` -> `getOverview()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `users` | COUNT | `is_deleted`, `role.name` (count tourists) |
| `merchants` | COUNT | `user.is_deleted` |
| `points_of_interest` | COUNT | `is_deleted` |
| `tours` | COUNT | `is_deleted` |
| `audio_play_history` | COUNT + AGGREGATE | `triggered_at`, `play_duration_seconds` |
| `user_sessions` | COUNT | - |
| `users` (qua session) | READ | `full_name` |
| `points_of_interest` (qua history) | READ | `name` |

### 2.2 Top POIs Analytics
- **API:** `GET /admin/analytics/top-pois`
- **Service:** `admin.analytics.service.ts` -> `getTopPois()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `audio_play_history` | GROUP BY + COUNT + AGGREGATE | `poi_id`, `triggered_at`, `play_duration_seconds` |
| `points_of_interest` | READ | `id`, `name`, `image_url` |
| `merchants` (qua POI) | READ | `shop_name` |

### 2.3 GPS Heatmap
- **API:** `GET /admin/analytics/heatmap`
- **Service:** `admin.analytics.service.ts` -> `getHeatmapData()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `gps_tracks` | READ (limit 10000) | `latitude`, `longitude`, `recorded_at` |

### 2.4 Route Tracking
- **API:** `GET /admin/analytics/routes`
- **Service:** `admin.analytics.service.ts` -> `getRouteTracking()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `user_sessions` | READ | `id`, `started_at`, `user_id` |
| `gps_tracks` | READ | `latitude`, `longitude`, `recorded_at` |
| `users` (qua session) | READ | `full_name` |

### 2.5 Summary Analytics
- **API:** `GET /admin/analytics/summary`
- **Service:** `admin.analytics.service.ts` -> `getSummaryAnalytics()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `audio_play_history` | COUNT + GROUP BY + AGGREGATE | `triggered_at`, `play_duration_seconds`, `trigger_type` |

### 2.6 Quan ly Merchants (CRUD)
- **API:** `GET/POST/PUT/DELETE/PATCH /admin/merchants/*`
- **Service:** `admin.merchant.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `users` | CREATE + READ + UPDATE + SOFT DELETE | `id`, `role_id`, `full_name`, `email`, `password_hash`, `phone`, `avatar_url`, `is_active`, `is_deleted`, `deleted_at` |
| `roles` | READ | `id`, `name` |
| `merchants` | CREATE + READ + UPDATE | `id`, `user_id`, `shop_name`, `address`, `contact_email`, `logo_url`, `cover_image_url` |

### 2.7 Quan ly POIs (Phe duyet)
- **API:** `GET/PATCH /admin/pois/*`
- **Service:** `admin.poi.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `points_of_interest` | READ + UPDATE | `approval_status`, `review_note`, `reviewed_by`, `reviewed_at`, `is_active` |
| `users` (reviewer) | READ | `id`, `full_name`, `email` |

### 2.8 Quan ly Tours (CRUD)
- **API:** `GET/POST/PUT/DELETE /admin/tours/*`
- **Service:** `admin.tour.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `tours` | CREATE + READ + UPDATE + SOFT DELETE | Tat ca truong |
| `tour_poi` | CREATE MANY + DELETE MANY | `tour_id`, `poi_id`, `sequence_order`, `is_mandatory` |
| `points_of_interest` | READ | `id`, `name`, `is_active`, `approval_status`, `merchant` |
| `users` (creator) | READ | `id`, `full_name`, `email` |

---

## 3. Quan ly Merchant

### 3.1 Merchant Analytics
- **API:** `GET /merchant/analytics/*`
- **Service:** `merchant.analytics.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `points_of_interest` | COUNT | `merchant_id`, `is_deleted` |
| `audio_play_history` | COUNT + AGGREGATE + GROUP BY | `poi_id`, `triggered_at`, `play_duration_seconds`, `completed` |

### 3.2 Merchant POI Management
- **API:** `GET/POST/PUT/DELETE /merchant/pois/*`
- **Service:** `merchant.poi.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `points_of_interest` | CREATE + READ + UPDATE + SOFT DELETE | Tat ca truong |
| `poi_audio` | CREATE + UPDATE | `poi_id`, `language_code`, `tts_content`, `audio_url`, `file_size_bytes`, `status` |
| `merchants` | READ | `id`, `user_id` |
| `users` | READ | `id` |

---

## 4. Kham pha Tourist (Mobile)

### 4.1 Danh sach POI
- **API:** `GET /tourist/pois/all`
- **Service:** `tourist.poi.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `points_of_interest` | READ | `id`, `name`, `image_url`, `latitude`, `longitude`, `radius_meters`, `priority`, `cooldown_seconds`, `audio_mode`, `is_active`, `approval_status` |
| `merchants` | READ (join) | `id`, `shop_name`, `address` |
| `poi_audio` | READ | `id`, `language_code`, `tts_content`, `audio_url`, `status` |

### 4.2 POI trong vung nhin (Map View)
- **API:** `GET /tourist/pois/in-view`
- **Service:** `tourist.poi.service.ts`
- **Bang tuong tac:** Tuong tu 4.1, them filter theo bounding box GPS.

### 4.3 POI gan day (Nearby)
- **API:** `GET /tourist/pois/nearby`
- **Service:** `tourist.poi.service.ts`
- **Bang tuong tac:** Tuong tu 4.1, them tinh toan khoang cach.

### 4.4 Chi tiet POI
- **API:** `GET /tourist/pois/:id`
- **Service:** `tourist.poi.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `points_of_interest` | READ | Tat ca truong (tru soft delete fields) |
| `merchants` | READ (join) | `id`, `shop_name`, `address` |
| `poi_audio` | READ | `id`, `language_code`, `tts_content`, `audio_url`, `status`, `created_at` |

### 4.5 Tang uu tien POI
- **API:** `PATCH /tourist/pois/:id/increment-priority`
- **Service:** `tourist.poi.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `points_of_interest` | READ + UPDATE | `priority` |

### 4.6 Danh sach Tours
- **API:** `GET /tourist/tours`
- **Service:** `tourist.tour.service.ts`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc |
|------|-----------|------------|
| `tours` | READ | `id`, `name`, `description`, `cover_image_url`, `estimated_duration_minutes`, `status`, `is_deleted` |
| `tour_poi` | READ | `sequence_order`, `is_mandatory` |
| `points_of_interest` | READ | `id`, `name`, `description`, `image_url`, `latitude`, `longitude`, `radius_meters`, `priority`, `is_active`, `approval_status` |

### 4.7 Chi tiet Tour
- **API:** `GET /tourist/tours/:id`
- **Service:** `tourist.tour.service.ts`
- **Bang tuong tac:** Tuong tu 4.6 them `created_at`.

### 4.8 Tim duong giua cac POI
- **API:** `POST /tourist/tours/route`
- **Service:** `tourist.routing.service.ts`
- **Bang tuong tac:** KHONG TRUY CAP DATABASE (goi external routing API - OSRM).

### 4.9 Bat dau phien GPS
- **API:** `POST /tourist/sessions/start`
- **Service:** `tourist.session.service.ts` -> `start()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `tours` | READ (optional) | `id`, `is_deleted`, `status` |
| `user_sessions` | CREATE | `user_id`, `tour_id`, `device_info`, `offline_mode`, `app_version` |

### 4.10 Gui GPS coordinates
- **API:** `POST /tourist/sessions/:id/gps`
- **Service:** `tourist.session.service.ts` -> `pushGps()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `user_sessions` | READ | `id`, `user_id`, `ended_at` |
| `gps_tracks` | CREATE | `session_id`, `latitude`, `longitude`, `accuracy_meters`, `speed_mps` |

### 4.11 Gui audio play event
- **API:** `POST /tourist/sessions/:id/audio-play`
- **Service:** `tourist.session.service.ts` -> `pushAudioPlay()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `user_sessions` | READ | `id`, `user_id`, `ended_at` |
| `points_of_interest` | READ | `id`, `is_deleted`, `is_active`, `approval_status` |
| `audio_play_history` | CREATE | `session_id`, `poi_id`, `trigger_type`, `play_duration_seconds`, `total_duration_seconds`, `completed`, `stop_reason` |

### 4.12 Ket thuc phien
- **API:** `POST /tourist/sessions/:id/end`
- **Service:** `tourist.session.service.ts` -> `end()`
- **Bang tuong tac:**

| Bang | Hanh dong | Truong doc/ghi |
|------|-----------|----------------|
| `user_sessions` | READ + UPDATE | `ended_at` |

---

## 5. He thong TTS (Text-to-Speech)

### 5.1 Preview TTS
- **API:** `POST /tts/preview`
- **Service:** `tts.service.ts`
- **Bang tuong tac:** KHONG TRUY CAP DATABASE (goi Google TTS external API).

---

## 6. He thong Upload File

### 6.1 Upload hinh anh / audio
- **API:** `POST /upload/public-image`, `POST /upload/image`, `POST /upload/audio`
- **Bang tuong tac:** KHONG TRUY CAP DATABASE (luu file tren disk).

---

## 7. Tong hop muc do su dung tung bang

| Bang | So chuc nang su dung | Danh gia |
|------|---------------------|----------|
| `users` | 8/14 | CAO - Core entity |
| `roles` | 3/14 | TRUNG BINH - Chi doc |
| `merchants` | 5/14 | TRUNG BINH - CRUD + analytics |
| `points_of_interest` | 9/14 | CAO - Core entity, duoc truy cap nhieu nhat |
| `poi_audio` | 3/14 | TRUNG BINH - Chi merchant va tourist doc/ghi |
| `tours` | 4/14 | TRUNG BINH - Admin CRUD + Tourist doc |
| `tour_poi` | 3/14 | THAP - Chi admin CRUD + Tourist doc |
| `user_sessions` | 4/14 | TRUNG BINH - Tourist session tracking |
| `gps_tracks` | 3/14 | THAP - Tourist push + Admin analytics |
| `audio_play_history` | 6/14 | CAO - Backbone cua analytics |
| `password_reset_otps` | 1/14 | THAP - Chi reset mat khau |

---

## 8. Nhung truong KHONG BAO GIỜ DUOC SU DUNG

| Bang | Truong | Ghi chu |
|------|--------|---------|
| `poi_audio` | `file_size_bytes` | Khong co service hay frontend nao doc/ghi truong nay |
| `points_of_interest` | `submitted_at` | Duoc set default nhung khong bao gio doc hien thi |
| `users` | `password_reset_token` | Chi su dung trong luong cu, da co OTP thay the |
| `users` | `password_reset_expiry` | Tuong tu, chi su dung trong luong cu |

---

## 9. Danh gia Tong the

### Chuc nang KHOP voi Database:
1. **Xac thuc & Phan quyen** - Schema ho tro day du cho 3 vai tro, JWT token, OTP reset
2. **POI Management** - Schema phu hop voi lifecycle: tao -> phe duyet -> kham pha -> analytics
3. **GPS Tracking & Analytics** - gps_tracks + audio_play_history cung cap du lieu phong phu cho analytics
4. **Tour System** - tour_poi voi sequence_order va is_mandatory ho tro tot cho routing
5. **Multi-language Audio** - poi_audio voi language_code ho tro da ngon ngu

### Chuc nang KHONG HOAN TOAN KHOP:
1. **Merchant soft delete** - Merchant khong co is_deleted, deleted_at trong khi service van phai xu ly
2. **Password reset** - 2 co che song song (token va OTP) tao redundant du lieu
3. **QR Code** - Co truong qr_code_url nhung khong co chuc nang scan QR trong mobile
4. **POI Categories** - Frontend hien thi nhung database khong co truong category
5. **File size tracking** - file_size_bytes khong bao gio duoc ghi
