# Phan tich Database Schema - Food Stall Presentation

> Ngay phan tich: 2026-04-14
> He quan tri: MySQL + Prisma ORM
> Tong so bang: 11 bang

---

## 1. Bang `roles` - Quan ly vai tro nguoi dung

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh vai tro |
| `name` | String (VARCHAR 50) | UNIQUE | Ten vai tro (tourist, merchant, admin) |
| `description` | String (TEXT) | Nullable | Mo ta chi tiet vai tro |

**Muc dich:** Quan ly 3 vai tro trong he thong: `tourist` (khach du lich), `merchant` (chu quan), `admin` (quan tri vien). Day la co so cua he thong RBAC (Role-Based Access Control).

**Ghi chu:** Khong co truong `permissions` hoac `scopes` - phan quyen duoc xu ly hoan toan trong code (middleware) dua tren `name` cua role.

---

## 2. Bang `users` - Thong tin nguoi dung

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh nguoi dung |
| `role_id` | String (UUID) | FK -> roles.id | Vai tro cua nguoi dung |
| `full_name` | String (VARCHAR 150) | NOT NULL | Ho ten day du |
| `email` | String (VARCHAR 255) | UNIQUE, NOT NULL | Dia chi email - dung de dang nhap |
| `password_hash` | String (VARCHAR 255) | NOT NULL | Mat khau da hash (bcrypt) |
| `phone` | String (VARCHAR 20) | Nullable | So dien thoai (da chuan hoa +84) |
| `avatar_url` | String (VARCHAR 500) | Nullable | URL anh dai dien |
| `is_active` | Boolean | Default: true | Trang thai hoat dong cua tai khoan |
| `is_deleted` | Boolean | Default: false | Danh dau xoa mem (soft delete) |
| `password_reset_token` | String (VARCHAR 255) | Nullable | Token reset mat khau (UUID) |
| `password_reset_expiry` | DateTime | Nullable | Thoi han token reset mat khau |
| `created_at` | DateTime | Default: now() | Ngay tao tai khoan |
| `updated_at` | DateTime | Auto-update | Ngay cap nhat gan nhat |
| `deleted_at` | DateTime | Nullable | Ngay xoa (cho soft delete) |

**Muc dich:** Bang chinh luu tru thong tin xac thuc va ho so nguoi dung. Ho tro ca 3 vai tro (tourist, merchant, admin).

**Ghi chu quan trong:**
- Co 2 co che reset mat khau: `password_reset_token/expiry` (cu, token-based) va `password_reset_otps` (moi, OTP-based). Ca hai deu dang duoc su dung dong thoi.
- Soft delete bang `is_deleted` + `deleted_at`.
- `phone` duoc chuan hoa qua `normalizeVietnamPhone()` truoc khi luu.
- `avatar_url` va `phone` co the null (optional).
- Index UNIQUE tren `email` - dam bao moi email chi co 1 tai khoan.

---

## 3. Bang `merchants` - Thong tin cua hang / quan

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh merchant |
| `user_id` | String (UUID) | FK -> users.id, UNIQUE | Lien ket voi tai khoan nguoi dung |
| `shop_name` | String (VARCHAR 200) | NOT NULL | Ten cua hang / quan |
| `address` | String (TEXT) | Nullable | Dia chi cua hang |
| `contact_email` | String (VARCHAR 255) | Nullable | Email lien he (khac voi email dang nhap) |
| `logo_url` | String (VARCHAR 500) | Nullable | URL logo cua hang |
| `cover_image_url` | String (VARCHAR 500) | Nullable | URL anh bia cua hang |
| `created_at` | DateTime | Default: now() | Ngay tao |

**Muc dich:** Luu tru thong tin kinh doanh cua merchant. Moi merchant la 1 nguoi dung voi role="merchant" va co them thong tin cua hang.

**Ghi chu quan trong:**
- Quan he 1-1 voi `users` (UNIQUE tren `user_id`).
- **KHONG CO** truong `status`, `is_deleted`, `updated_at` - truoc day co truong `status` nhung da bi xoa trong migration `20260317163101`.
- **THIEU** truong soft delete - khac voi User va POI. Khi xoa merchant, chi xoa tai khoan User (soft delete), merchant van con trong DB.
- **THIEU** truong `updated_at` - khong the theo doi luc cap nhat thong tin cua hang.
- `contact_email` thuong duoc gan bang email cua user khi dang ky.

---

## 4. Bang `points_of_interest` (POI) - Diem thuat quan (quan an)

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh POI |
| `merchant_id` | String (UUID) | FK -> merchants.id | Thuoc merchant nao |
| `name` | String (VARCHAR 200) | NOT NULL | Ten diem thuat quan (ten mon/ten quan) |
| `description` | String (TEXT) | Nullable | Mo ta chi tiet |
| `address` | String (TEXT) | Nullable | Dia chi (trung lap voi merchant.address?) |
| `image_url` | String (VARCHAR 500) | Nullable | URL anh dai dien POI |
| `qr_code_url` | String (VARCHAR 500) | Nullable | URL ma QR (them vao 2026-03-25) |
| `latitude` | Decimal (10,7) | NOT NULL | Vi do (GPS) |
| `longitude` | Decimal (10,7) | NOT NULL | Kinh do (GPS) |
| `radius_meters` | Int | Default: 15 | Ban kinh kich hoat audio (met) |
| `priority` | Int | Default: 1 | Do uu tien (tang khi nguoi nghe) |
| `is_active` | Boolean | Default: true | POI co dang hoat dong khong |
| `approval_status` | String (VARCHAR 20) | Default: "pending" | Trang thai phe duyet (pending/approved/rejected) |
| `review_note` | String (TEXT) | Nullable | Ghi chu cua nguoi phe duyet |
| `reviewed_by` | String (UUID) | FK -> users.id, Nullable | Ai da phe duyet |
| `reviewed_at` | DateTime | Nullable | Luc phe duyet |
| `audio_mode` | String (VARCHAR 20) | Default: "tts" | Che do audio (tts/custom) |
| `cooldown_seconds` | Int | Default: 30 | Thoi gian cho giua cac lan phat (giay) |
| `submitted_at` | DateTime | Default: now() | Luc merchant gui yeu cau |
| `is_deleted` | Boolean | Default: false | Danh dau xoa mem |
| `deleted_at` | DateTime | Nullable | Ngay xoa |
| `created_at` | DateTime | Default: now() | Ngay tao |
| `updated_at` | DateTime | Auto-update | Ngay cap nhat |

**Muc dich:** Bang chinh cua he thong - luu tru toa do GPS, thong tin va trang thai phe duyet cua moi diem thuat quan (quan an, mon an dac san).

**Ghi chu:**
- Co 3 index phuc hop toi uu cho viec filter theo merchant, trang thai phe duyet, va trang thai xoa.
- `approval_status` la string khong co enum constraint o DB level - chi kiem tra trong code.
- `priority` duoc tang moi khi tourist nghe audio (increment-priority endpoint).
- `radius_meters` va `cooldown_seconds` co gia tri default nhung la hardcoded.
- `audio_mode` xac dinh POI su dung TTS (text-to-speech) hay audio upload.

---

## 5. Bang `poi_audio` - Noi dung audio cua POI

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh ban ghi audio |
| `poi_id` | String (UUID) | FK -> points_of_interest.id | Thuoc POI nao |
| `language_code` | String (VARCHAR 10) | Default: "vi" | Ma ngon ngu (vi, en, ja...) |
| `tts_content` | String (LONGTEXT) | Nullable | Noi dung van ban de TTS |
| `audio_url` | String (VARCHAR 500) | Nullable | URL file audio (neu upload) |
| `file_size_bytes` | BigInt | Nullable | Kich thuoc file audio (bytes) |
| `status` | String (VARCHAR 20) | Default: "active" | Trang thai audio (active/inactive) |
| `created_at` | DateTime | Default: now() | Ngay tao |

**Muc dich:** Luu tru noi dung audio cho tung POI, ho tro da ngon ngu. Moi POI co the co nhieu ban ghi audio voi cac ngon ngu khac nhau.

**Ghi chu:**
- Thiết kế cho phép 1 POI có nhiều audio theo ngôn ngữ khác nhau.
- `tts_content` được đổi thành LONGTEXT (từ TEXT) trong migration `20260409094500` để hỗ trợ nội dung dài hơn.
- `file_size_bytes` **CHƯA BAO GIỜ ĐƯỢC SỬ DỤNG** trong bất kỳ service hay frontend nào.
- `status` là string không có enum constraint - chỉ kiểm tra trong code.
- KHÔNG CÓ truong `updated_at` - không thể theo dõi lúc cập nhật audio.

---

## 6. Bang `tours` - Tour du lich

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh tour |
| `created_by` | String (UUID) | FK -> users.id | Nguoi tao tour |
| `name` | String (VARCHAR 200) | NOT NULL | Ten tour |
| `description` | String (TEXT) | Nullable | Mo ta tour |
| `cover_image_url` | String (VARCHAR 500) | Nullable | URL anh bia tour |
| `status` | String (VARCHAR 20) | Default: "active" | Trang thai (active/archived) |
| `estimated_duration_minutes` | Int | Nullable | Thoi gian uoc tinh (phut) |
| `is_deleted` | Boolean | Default: false | Danh dau xoa mem |
| `deleted_at` | DateTime | Nullable | Ngay xoa |
| `created_at` | DateTime | Default: now() | Ngay tao |
| `updated_at` | DateTime | Auto-update | Ngay cap nhat |

**Muc dich:** Luu tru thong tin cac tour du lich (chuoi diem thuat quan). Tour duoc tao boi admin va bao gom nhieu POI theo thu tu.

**Ghi chu:**
- Chi co admin moi co the tao/sua/xoa tour (merchant va tourist chi xem).
- `status` co gia tri "active" hoac "archived" - la string khong co enum constraint.
- Index phuc hop cho viec filter theo creator va trang thai.

---

## 7. Bang `tour_poi` - Lien ket Tour va POI

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh |
| `tour_id` | String (UUID) | FK -> tours.id, CASCADE | Thuoc tour nao |
| `poi_id` | String (UUID) | FK -> points_of_interest.id, CASCADE | Diem thuat quan nao |
| `sequence_order` | Int | NOT NULL | Thu tu trong tour |
| `is_mandatory` | Boolean | Default: false | Co bat buoc di khong |

**Muc dich:** Bang junction (N:M) giua Tour va POI, them thu tu va tinh bat buoc.

**Ghi chu:**
- 2 UNIQUE constraint: `[tour_id, poi_id]` (khong trung POI trong 1 tour) va `[tour_id, sequence_order]` (khong trung thu tu).
- Index tren `poi_id` de truy van nhanh.
- CASCADE delete - xoa tour thi xoa lien ket, xoa POI thi xoa lien ket.

---

## 8. Bang `user_sessions` - Phien su dung cua tourist

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh phien |
| `user_id` | String (UUID) | FK -> users.id | Nguoi dung nao |
| `tour_id` | String (UUID) | FK -> tours.id, Nullable | Thuoc tour nao (null = tu do) |
| `started_at` | DateTime | Default: now() | Thoi gian bat dau |
| `ended_at` | DateTime | Nullable | Thoi gian ket thuc |
| `device_info` | String (VARCHAR 200) | Nullable | Thong tin thiet bi |
| `offline_mode` | Boolean | Default: false | Che do offline |
| `app_version` | String (VARCHAR 20) | Nullable | Phien ban app |

**Muc dich:** Theo doi phien su dung app cua tourist - moi lan mo app de khám phá POI la 1 session. Session co the lien ket voi 1 tour cu the hoac la chay tu do (free roam).

**Ghi chu:**
- `tour_id` nullable - tourist co the khong theo tour cu the.
- `offline_mode` de danh dau phien chay offline.
- `ended_at` duoc set khi goi API end session.
- KHONG CO truong `is_active` hoac trang thai phien - xac dinh phien dang chay bang `ended_at IS NULL`.

---

## 9. Bang `gps_tracks` - Du lieu GPS

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh |
| `session_id` | String (UUID) | FK -> user_sessions.id, CASCADE | Thuoc phien nao |
| `latitude` | Decimal (10,7) | NOT NULL | Vi do |
| `longitude` | Decimal (10,7) | NOT NULL | Kinh do |
| `accuracy_meters` | Decimal (6,2) | Nullable | Do chinh xac GPS (met) |
| `speed_mps` | Decimal (6,3) | Nullable | Toc do (met/giay) |
| `recorded_at` | DateTime | Default: now() | Thoi gian ghi nhan |

**Muc dich:** Luu tru toa do GPS cua tourist theo thoi gian thuc de hien thi heatmap, route tracking va phat hien POI gan.

**Ghi chu:**
- Du lieu GUI tang truong cuc nhanh - co the vuot hang tram ngan ban ghi moi ngay.
- Index phuc hop `[session_id, recorded_at]` de truy van theo phien va thoi gian.
- `accuracy_meters` va `speed_mps` la thong tin bo sung tu GPS device.
- CASCADE delete - xoa session thi xoa het GPS tracks.

---

## 10. Bang `audio_play_history` - Lich su nghe audio

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh |
| `session_id` | String (UUID) | FK -> user_sessions.id, CASCADE | Phien nao |
| `poi_id` | String (UUID) | FK -> points_of_interest.id | Nghe audio cua POI nao |
| `triggered_at` | DateTime | Default: now() | Thoi gian kich hoat |
| `trigger_type` | String (VARCHAR 20) | NOT NULL | Cach kich hoat (gps_enter/gps_proximity/qr_scan/manual) |
| `play_duration_seconds` | Int | Nullable | Thoi gian nghe thuc te (giay) |
| `total_duration_seconds` | Int | Nullable | Tong thoi luong audio (giay) |
| `completed` | Boolean | Default: false | Da nghe het chua |
| `stop_reason` | String (VARCHAR 30) | Nullable | Ly do dung (timeout/manual/error) |

**Muc dich:** Theo doi moi lan audio duoc phat tai POI - la co so du lieu cho toan bo he thong analytics cua admin va merchant.

**Ghi chu:**
- `trigger_type` la enum trong code nhung luu string trong DB.
- Du lieu nay la backbone cua analytics: top POIs, completion rate, trigger breakdown, heatmap.
- Index phuc hop cho viec truy van theo session va POI.

---

## 11. Bang `password_reset_otps` - OTP reset mat khau

| Truong | Kieu du lieu | Rang buoc | Mo ta |
|--------|-------------|-----------|-------|
| `id` | String (UUID) | PK, auto-generate | Ma dinh danh |
| `user_id` | String (UUID) | FK -> users.id | Nguoi dung nao |
| `otp_code` | String (VARCHAR 6) | NOT NULL | Ma OTP (6 so) |
| `expires_at` | DateTime | NOT NULL | Thoi han OTP |
| `is_used` | Boolean | Default: false | Da su dung chua |
| `created_at` | DateTime | Default: now() | Ngay tao |

**Muc dich:** Luu tru OTP de reset mat khau - co che moi thay the cho token-based reset cu.

**Ghi chu:**
- Khong co index tren `user_id` - co the cham khi truy van OTP gan nhat cua user.
- Khong co index tren `otp_code` - moi lan verify phai scan toan bang.
- `otp_code` la VARCHAR(6) khong co UNIQUE constraint - nhieu OTP cu co the con trong DB.

---

## Tong quan cac quan he (ER Summary)

```
Role (1) ----< (N) User
User (1) ---- (1) Merchant
User (1) ----< (N) Tour (createdBy)
User (1) ----< (N) PointOfInterest (reviewedBy) [optional]
User (1) ----< (N) UserSession
User (1) ----< (N) PasswordResetOtp

Merchant (1) ----< (N) PointOfInterest
PointOfInterest (1) ----< (N) PoiAudio
PointOfInterest (N) >< (N) Tour [qua TourPoi]

Tour (1) ----< (N) TourPoi
Tour (1) ----< (N) UserSession [optional]

UserSession (1) ----< (N) GpsTrack
UserSession (1) ----< (N) AudioPlayHistory
AudioPlayHistory (N) >---- (1) PointOfInterest
```
