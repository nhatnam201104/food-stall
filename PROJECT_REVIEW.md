# 📋 Project Review – Food Stall Presentation
> Tổng hợp những gì đã làm trong dự án (BE · FE · Mobile) để phát vấn

---

## 🏗️ Tổng quan kiến trúc

| Layer | Stack |
|---|---|
| **Backend** | Node.js · Express · TypeScript · Prisma ORM · MySQL |
| **Frontend (Web)** | React · TypeScript · Vite · Ant Design · React Router v6 |
| **Mobile** | React Native · Expo Router · Zustand · Expo Location |
| **Auth** | JWT (Bearer token) · bcrypt · Rate limiting |
| **File Upload** | Multer (local `uploads/` folder) |
| **TTS** | xAI / Grok API (text-to-speech) |
| **Routing** | OSRM (Open Source Routing Machine) |

---

## 1. Đăng nhập / Đăng ký

### 1.1 Backend – `POST /auth/*`

**File:**  
- `backend/src/routes/auth.routes.ts`  
- `backend/src/controllers/auth.controller.ts`  
- `backend/src/services/auth.service.ts`

**Endpoints:**

| Method | URL | Mô tả |
|---|---|---|
| POST | `/auth/register` | Đăng ký tài khoản **Merchant** (tạo User + Merchant profile) |
| POST | `/auth/login` | Đăng nhập Merchant / Admin (trả về JWT) |
| POST | `/auth/tourist/register` | Đăng ký **Tourist** |
| POST | `/auth/tourist/login` | Đăng nhập Tourist (trả về JWT) |
| POST | `/auth/forgot-password` | Gửi email reset password (token + link) |
| POST | `/auth/reset-password` | Đặt lại mật khẩu bằng token |
| POST | `/auth/logout` | Logout (cần JWT) |
| GET | `/auth/me` | Lấy thông tin user hiện tại |
| PUT | `/auth/profile` | Cập nhật profile (fullName, phone, avatar, shopName…) |
| PUT | `/auth/change-password` | Đổi mật khẩu |

**OTP Flow (mobile)** – `backend/src/routes/auth-otp.routes.ts` / `auth-otp.service.ts`:

| Method | URL | Mô tả |
|---|---|---|
| POST | `/auth/otp/send-otp` | Gửi OTP 6 số qua email (lưu DB `password_reset_otps`) |
| POST | `/auth/otp/verify-otp` | Xác thực OTP |
| POST | `/auth/otp/reset-password` | Reset password sau khi verify OTP |

**Security:**
- Middleware `authLimiter` (rate-limit 429) trên tất cả public auth route
- Password hash bằng `bcrypt` (`hash.util.ts`)
- JWT sign/verify (`jwt.util.ts`) – payload chứa `userId`, `roleName`
- Middleware `authenticate` + `authorize(role)` bảo vệ protected routes

**Database models:** `User`, `Role`, `Merchant`, `PasswordResetOtp`

---

### 1.2 Frontend Web – Auth Pages

**Files:**

```
frontend/src/pages/auth/
├── admin-login.page.tsx          ← Form đăng nhập Admin
├── merchant-login.page.tsx       ← Form đăng nhập Merchant
├── merchant-register.page.tsx    ← Form đăng ký Merchant
├── forgot-password.page.tsx      ← Quên mật khẩu
└── reset-password.page.tsx       ← Đặt lại mật khẩu

frontend/src/components/auth/
├── login/                        ← LoginForm component
├── register/                     ← RegisterForm component
├── forgot-password/
└── reset-password/

frontend/src/services/auth.service.ts   ← Gọi API auth
frontend/src/stores/auth.store.ts       ← Zustand store (user, token, isAuthenticated)
```

**Routing/Guard:**
- `route.auth.tsx` → bọc trong `<GuestGuard />` (redirect nếu đã login)
- `route.admin.tsx` → bọc trong `<AdminProtectedRoute />` + `<RoleGuard role="admin" />`
- `route.merchant.tsx` → bọc trong `<MerchantProtectedRoute />` + `<RoleGuard role="merchant" />`

**Flow đăng nhập Web:**
1. User nhập email + password → gọi `authService.login()`
2. Nhận JWT → lưu vào `auth.store` (Zustand + persist localStorage)
3. `RoleGuard` kiểm tra `roleName` → redirect đến `/admin/*` hoặc `/merchant/*`

---

### 1.3 Mobile – Auth Screens

**Files:**

```
mobile/src/app/auth/
├── login.tsx            ← Render LoginScreen
├── register.tsx         ← Render RegisterScreen
├── forgot-password.tsx
├── verify-otp.tsx       ← Nhập OTP 6 số
└── reset-password.tsx

mobile/src/components/auth/
├── login/login.form.tsx
├── register/register.form.tsx
├── forgot-password/
├── verify-otp/
└── reset-password/

mobile/src/services/auth.service.ts       ← tourist login/register/me/profile
mobile/src/services/auth-otp.service.ts  ← sendOtp / verifyOtp / resetPassword
mobile/src/stores/auth.store.ts           ← Zustand + AsyncStorage hydration
```

**Flow đăng nhập Mobile:**
1. App khởi động → `_layout.tsx` gọi `hydrateFromStorage()` lấy token từ AsyncStorage
2. Nếu chưa đăng nhập → redirect `/auth/login`
3. Login thành công → lưu token vào AsyncStorage + Zustand store
4. Redirect về `/(tabs)` (Home Map)

**Flow đăng ký Mobile (Tourist):**
1. Register → `POST /auth/tourist/register`
2. Tự động đăng nhập sau register

**Flow forgot password Mobile (OTP):**
1. Nhập email → `POST /auth/otp/send-otp` → nhận OTP qua email
2. Nhập OTP → `POST /auth/otp/verify-otp`
3. Nhập mật khẩu mới → `POST /auth/otp/reset-password`

---

## 2. Quản lý User (Merchant) – Admin Web

### 2.1 Backend – `GET|POST|PUT|DELETE /admin/merchants`

**Files:**
- `backend/src/routes/admin/merchant.routes.ts`
- `backend/src/controllers/admin/merchant.controller.ts`
- `backend/src/services/admin/merchant.service.ts`

**Endpoints:**

| Method | URL | Mô tả |
|---|---|---|
| GET | `/admin/merchants` | Danh sách merchant (phân trang, tìm kiếm, lọc isActive) |
| GET | `/admin/merchants/:id` | Chi tiết merchant |
| POST | `/admin/merchants` | Tạo merchant mới |
| PUT | `/admin/merchants/:id` | Cập nhật merchant |
| DELETE | `/admin/merchants/:id` | Xoá mềm merchant |
| PATCH | `/admin/merchants/:id/status` | Bật/tắt tài khoản (isActive) |
| POST | `/admin/merchants/:id/upload-logo` | Upload logo shop |

**Tính năng:**
- Tìm kiếm theo `shopName`, `contactEmail`, `fullName`
- Lọc theo `isActive` (active / suspended)
- Sắp xếp theo `createdAt` hoặc `shopName`
- Soft delete (`isDeleted = true`)
- Bật/tắt tài khoản → ảnh hưởng đến quyền đăng nhập của merchant

### 2.2 Frontend Web – Users Page

**Files:**

```
frontend/src/pages/admin/users.page.tsx           ← Page wrapper
frontend/src/components/admin/merchant/
├── merchant.index.tsx         ← Component chính (bảng + filter + actions)
├── merchant.table.tsx         ← Ant Design Table
├── merchant.filter.tsx        ← Bộ lọc (search, isActive, sort)
├── merchant.create-modal.tsx  ← Modal tạo merchant
└── merchant.update-modal.tsx  ← Modal sửa merchant

frontend/src/services/admin/merchant.service.ts   ← Gọi API CRUD
```

**UI Features:**
- Bảng danh sách với Avatar, shopName, email, phone, # POIs
- Filter: search text, trạng thái (All / Active / Suspended), sort options
- Switch bật/tắt tài khoản trực tiếp trên bảng
- Modal Create: fullName, email, password, shopName, address, phone
- Modal Update: cập nhật thông tin shopName, address, contactEmail
- Popconfirm xác nhận trước khi xoá

---

## 3. POI Management

### 3.1 Database Schema

```prisma
model PointOfInterest {
  id             String   // UUID
  merchantId     String   // FK → Merchant
  name           String
  description    String?
  address        String?
  imageUrl       String?
  qrCodeUrl      String?  // QR code auto-generated khi tạo
  latitude       Decimal
  longitude      Decimal
  radiusMeters   Int      // Vùng trigger GPS (default 15m)
  isActive       Boolean  // Merchant bật/tắt
  approvalStatus String   // "pending" | "approved" | "rejected"
  reviewNote     String?  // Lý do từ chối
  reviewedBy     String?  // FK → User (Admin)
  audioMode      String   // "tts" | "file"
  ttsContent     String?  // Nội dung đọc TTS
  cooldownSeconds Int     // Thời gian chờ giữa 2 lần trigger (default 30s)
  isDeleted      Boolean
}

model PoiAudio {
  id           String
  poiId        String
  languageCode String   // "vi"
  ttsContent   String?
  audioUrl     String?
  status       String   // "active"
}
```

---

### 3.2 Merchant – CRUD đầy đủ

#### Backend – `GET|POST|PUT|DELETE /merchant/pois`

**Files:**
- `backend/src/routes/merchant/poi.routes.ts`
- `backend/src/controllers/merchant/poi.controller.ts`
- `backend/src/services/merchant/poi.service.ts`

**Endpoints:**

| Method | URL | Mô tả |
|---|---|---|
| GET | `/merchant/pois` | Danh sách POI của merchant (phân trang, lọc, tìm kiếm) |
| GET | `/merchant/pois/map` | Lấy POI để hiển thị bản đồ (lat/lng + status) |
| GET | `/merchant/pois/:id` | Chi tiết 1 POI |
| POST | `/merchant/pois` | **Tạo POI mới** → approvalStatus = `pending`, auto-gen QR code |
| PUT | `/merchant/pois/:id` | **Cập nhật POI** → reset về `pending` nếu thay đổi nội dung |
| DELETE | `/merchant/pois/:id` | **Xoá mềm** POI |

**Logic đặc biệt khi CREATE:**
- `approvalStatus` luôn bắt đầu là `"pending"`
- Tự động tạo QR code URL bằng `generatePoiQrCode()` → lưu `qrCodeUrl`
- Nếu `audioMode = "tts"` → gọi xAI TTS API async, lưu file audio vào `PoiAudio`
- Nếu `audioMode = "file"` → nhận `audioUrl` từ upload

**Logic đặc biệt khi UPDATE:**
- Merchant chỉnh sửa POI → reset `approvalStatus` về `"pending"` nếu thay đổi content fields
- Admin phải duyệt lại

#### Frontend Web – Merchant POI Pages

**Files:**

```
frontend/src/pages/merchant/
├── pois.page.tsx          ← Danh sách POI
├── pois-create.page.tsx   ← Tạo POI mới
├── pois-edit.page.tsx     ← Sửa POI
├── pois-detail.page.tsx   ← Xem chi tiết
└── pois-map.page.tsx      ← Xem trên bản đồ

frontend/src/components/merchant/poi/
├── management/
│   ├── poi.index.tsx       ← Component danh sách + filter + actions
│   ├── poi.table.tsx       ← Ant Design Table
│   └── poi.filter.tsx      ← Bộ lọc
├── create/poi.create.tsx   ← Form tạo POI (tên, mô tả, tọa độ, audio, ảnh)
├── edit/poi.edit.tsx       ← Form sửa POI
├── update/                 ← (resubmit flow)
├── map/poi.map.tsx         ← Leaflet map hiển thị POI markers
└── poi.detail.tsx          ← Chi tiết POI

frontend/src/services/merchant/poi.service.ts
```

**UI Features – Create/Edit Form:**
- Tên, mô tả, địa chỉ
- **Upload ảnh** (Ant Design Upload → uploadService → BE → Cloudinary/local)
- **Chọn vị trí trên bản đồ** (PoiMap shared component – click để pick lat/lng)
- **Audio Mode**: TTS (nhập text) hoặc Upload file MP3 (max 50MB)
- Validation đầy đủ phía client

**UI Features – Danh sách:**
- Filter: search, approvalStatus (all/pending/approved/rejected), isActive
- Badge trạng thái duyệt (Tag màu sắc)
- Nút Edit, Delete, View Detail

---

### 3.3 Admin – Phê duyệt POI

#### Backend – `GET|PATCH /admin/pois`

**Files:**
- `backend/src/routes/admin/poi.routes.ts`
- `backend/src/controllers/admin/poi.controller.ts`
- `backend/src/services/admin/poi.service.ts`

**Endpoints:**

| Method | URL | Mô tả |
|---|---|---|
| GET | `/admin/pois` | Xem tất cả POI của **mọi merchant** (filter, phân trang) |
| GET | `/admin/pois/map` | Xem tất cả POI trên bản đồ |
| GET | `/admin/pois/:id` | Chi tiết POI (kèm merchant info, reviewer info, audio) |
| PATCH | `/admin/pois/:id/approve` | **Phê duyệt** POI → `approvalStatus = "approved"` |
| PATCH | `/admin/pois/:id/reject` | **Từ chối** POI → `approvalStatus = "rejected"`, lưu `reviewNote` |
| PATCH | `/admin/pois/:id/active` | Bật/tắt POI (admin override) |

**Lưu ý:** Admin **KHÔNG** có quyền tạo / sửa / xoá POI.

#### Frontend Web – Admin POI Pages

**Files:**

```
frontend/src/pages/admin/
├── pois.page.tsx          ← Danh sách POI (tất cả merchant)
├── pois-detail.page.tsx   ← Xem chi tiết + nút Approve/Reject
└── pois-map.page.tsx      ← Bản đồ tất cả POI

frontend/src/components/admin/poi/
├── poi.index.tsx           ← Danh sách + filter + approve/reject actions
├── poi.table.tsx
├── poi.filter.tsx
├── poi.detail.tsx          ← Chi tiết POI với action buttons
└── map/poi.map.tsx         ← Admin POI map

frontend/src/services/admin/poi.service.ts
```

**UI Features:**
- Bảng POI của **tất cả merchant** – filter theo merchant, approvalStatus, isActive
- Nút **Approve** → gọi `adminPoiService.approve(id)`
- Nút **Reject** → mở Modal nhập `reviewNote` (bắt buộc) → gọi `adminPoiService.reject(id, note)`
- Switch bật/tắt POI trực tiếp

---

## 4. POI Map

### 4.1 Merchant POI Map

**Backend:** `GET /merchant/pois/map` → trả về `[{id, name, imageUrl, latitude, longitude, approvalStatus, isActive}]`

**Frontend:**  
- `frontend/src/pages/merchant/pois-map.page.tsx`  
- `frontend/src/components/merchant/poi/map/poi.map.tsx`

**Tính năng:**
- Leaflet map render markers cho tất cả POI của merchant
- Màu marker phân biệt theo `approvalStatus` (pending=vàng, approved=xanh, rejected=đỏ)
- Click marker → popup hiện tên + status
- Filter map theo trạng thái
- Khi Create/Edit POI: dùng `PoiMap` shared component để **click chọn tọa độ**

### 4.2 Admin POI Map

**Backend:** `GET /admin/pois/map` → trả về tất cả POI mọi merchant

**Frontend:**  
- `frontend/src/pages/admin/pois-map.page.tsx`  
- `frontend/src/components/admin/poi/map/poi.map.tsx`

**Tính năng:**
- Hiển thị toàn bộ POI hệ thống trên bản đồ
- Filter theo `approvalStatus`, `merchantId`
- Click marker → popup chi tiết + link đến trang detail

---

## 5. Profile User – Merchant Web

**Files:**  
- `frontend/src/pages/merchant/profile.page.tsx`  
- `frontend/src/components/merchant/profile/profile.index.tsx`  
- `frontend/src/stores/auth.store.ts` – `updateProfile()` action  
- `backend/src/routes/auth.routes.ts` – `PUT /auth/profile`

**Tính năng:**
- Hiển thị: avatar, fullName, email, phone, shopName, address, contactEmail
- **Upload avatar** mới (preview trực tiếp trước khi submit)
- Xoá avatar (set null)
- Cập nhật: fullName, phone (chuẩn hóa số VN → +84), shopName, address, contactEmail
- Phone validation + normalize (`normalizePhone`, `isValidPhone`, `formatPhoneForDisplay`)
- Submit → `PUT /auth/profile` → update Zustand store với dữ liệu mới

---

## 6. Quản lý Tour – Admin

### 6.1 Database Schema

```prisma
model Tour {
  id                       String
  createdBy                String   // FK → User (Admin)
  name                     String
  description              String?
  coverImageUrl            String?
  status                   String   // "active" | "inactive" | "draft"
  estimatedDurationMinutes Int?
  isDeleted                Boolean
  tourPois                 TourPoi[]
}

model TourPoi {
  tourId        String
  poiId         String
  sequenceOrder Int      // Thứ tự ghé thăm
  isMandatory   Boolean  // POI bắt buộc trong tour
}
```

### 6.2 Backend – `GET|POST|PUT|DELETE /admin/tours`

**Files:**
- `backend/src/routes/admin/tour.routes.ts`
- `backend/src/controllers/admin/tour.controller.ts`
- `backend/src/services/admin/tour.service.ts`

**Endpoints:**

| Method | URL | Mô tả |
|---|---|---|
| GET | `/admin/tours` | Danh sách tour (filter: search, status, phân trang) |
| GET | `/admin/tours/:id` | Chi tiết tour + danh sách POI theo thứ tự |
| POST | `/admin/tours` | **Tạo tour** (kèm danh sách POI + sequenceOrder) |
| PUT | `/admin/tours/:id` | **Sửa tour** (cập nhật thông tin cơ bản) |
| PUT | `/admin/tours/:id/pois` | **Thay thế toàn bộ POI** trong tour |
| DELETE | `/admin/tours/:id` | Xoá mềm tour |
| POST | `/admin/tours/route-preview` | **Preview tuyến đường** qua OSRM |

**Business Rules khi tạo/cập nhật POI list:**
- Tour phải có **ít nhất 2 POI**
- Không được có POI trùng
- Tất cả POI phải có `approvalStatus = "approved"` + `isActive = true`
- `sequenceOrder` tự động assign theo index

**Route Preview:**
- Input: `{ mode: "walking" | "driving", waypoints: [{lat, lng}] }`
- Gọi OSRM API: `https://router.project-osrm.org/route/v1/{foot|driving}/{coords}?overview=full&geometries=geojson`
- Trả về: `geometry` (GeoJSON LineString), `distance` (m), `duration` (s)

### 6.3 Frontend Web – Admin Tour Pages

**Files:**

```
frontend/src/pages/admin/
├── tours.page.tsx          ← Danh sách tour
├── tours-create.page.tsx   ← Tạo tour mới
└── tours-edit.page.tsx     ← Sửa tour

frontend/src/components/admin/tour/
├── tour.index.tsx          ← Bảng danh sách + filter
├── tour.table.tsx
├── tour.filter.tsx
└── tour.form.tsx           ← Form Create/Edit dùng chung

frontend/src/services/admin/tour.service.ts
```

**UI Features – Tour Form (tour.form.tsx):**
- Input: tên tour, mô tả, ảnh bìa, status, thời gian ước tính
- **Thêm POI vào tour**: tìm kiếm từ danh sách POI `approved + active`, kéo thả để sắp xếp thứ tự
- Checkbox `isMandatory` cho từng POI
- **Route Preview**: chọn mode walking/driving → gọi API preview → hiển thị tuyến đường trên `PoiMap`
- Hiển thị tổng khoảng cách + thời gian ước tính từ OSRM
- Validation: min 2 POI

---

## 🗂️ Cấu trúc file nhanh theo tính năng

### Backend entry point
```
backend/src/
├── app.ts              ← Express app setup (middleware, routes)
├── server.ts           ← HTTP server start
├── middleware/
│   ├── auth.middleware.ts      ← JWT authenticate + authorize(role)
│   ├── rate-limit.middleware.ts ← authLimiter (429 protection)
│   ├── validate.middleware.ts  ← express-validator error handler
│   ├── error.middleware.ts     ← Global error handler
│   └── upload.middleware.ts    ← Multer config
└── utils/
    ├── jwt.util.ts        ← signToken / verifyToken
    ├── hash.util.ts       ← bcrypt hashPassword / comparePassword
    ├── response.util.ts   ← sendSuccess / sendError helpers
    ├── pagination.util.ts ← parsePagination / buildPaginationMeta
    ├── qr.util.ts         ← generatePoiQrCode (QR code URL)
    ├── phone.util.ts      ← normalizeVietnamPhone (+84)
    └── mail.util.ts       ← sendPasswordResetEmail
```

### Frontend stores (Zustand)
```
frontend/src/stores/
├── auth.store.ts    ← user, token, isAuthenticated, login(), logout(), updateProfile()
└── index.ts
```

### Mobile stores (Zustand + AsyncStorage)
```
mobile/src/stores/
├── auth.store.ts       ← isAuthenticated, user, token, hydrateFromStorage()
├── tourStore.ts        ← activeTour, tourPois, startTour(), completeTour()
├── locationStore.ts    ← currentLocation (Expo Location)
├── audioStore.ts       ← audio queue, playback state
└── languageStore.ts    ← ngôn ngữ TTS (vi/en)
```

---

## 📱 Mobile – Màn hình chính (Tourist)

### Home Map Screen – `(tabs)/index.tsx`
- Render `SimulatedMap` (Leaflet WebView) hiển thị POI xung quanh
- Fetch POI gần vị trí GPS hiện tại (`poiService.inView`)
- Tích hợp `ProximityTracker` → trigger audio khi đến gần POI
- `QRScannerModal` → quét QR code → `POST /tourist/pois/qr-scan` → lấy POI detail
- `AudioBottomSheet` → phát audio TTS/file
- `TourOverlay` → hiện hướng dẫn tour đang chạy
- Session tracking: `sessionService.start()` khi vào app, `pushGps()` định kỳ

### Tours Screen – `(tabs)/tours.tsx`
- Danh sách tour từ `tourService.list()`
- Tap vào tour → `tour/[id].tsx` → xem chi tiết + nút "Start Tour"

### Tour Detail – `tour/[id].tsx`
- Danh sách POI trong tour theo thứ tự
- Nút "Start Tour" → `tourStore.startTour(tour)` → redirect về Home Map
- Map hiển thị tuyến đường tour

### Profile – `profile/index.tsx` + `profile/edit.tsx`
- Xem thông tin user (avatar, tên, email, phone)
- Sửa profile: fullName, phone, avatar
- Đổi mật khẩu: `profile/change-password.tsx`

---

## 🔐 Phân quyền tóm tắt

| Role | Quyền |
|---|---|
| **admin** | Xem + duyệt/từ chối POI · CRUD Tour · CRUD Merchant · Xem analytics |
| **merchant** | CRUD POI của mình · Xem analytics riêng · Sửa profile |
| **tourist** | Xem POI · Xem Tour · Scan QR · GPS tracking · Play audio |

---

## 🔄 Flow tóm tắt từ đầu đến cuối

```
Merchant đăng ký → Admin tạo account hoặc tự đăng ký
        ↓
Merchant tạo POI (status: pending) → Admin phê duyệt
        ↓
Admin tạo Tour (chọn POI đã approved)
        ↓
Tourist đăng nhập app → Xem tour → Start tour
        ↓
App track GPS → ProximityTracker phát hiện POI gần → Tự phát audio
Tourist cũng có thể quét QR → lấy POI info + audio
        ↓
Session được ghi lại (UserSession + AudioPlayHistory) → Analytics cho Admin/Merchant
```

---

## 📁 Index file nhanh để tra cứu

| Tính năng | BE | FE | Mobile |
|---|---|---|---|
| Auth Login/Register | `auth.routes.ts` · `auth.service.ts` | `pages/auth/*` · `auth.store.ts` | `app/auth/*` · `auth.store.ts` |
| Auth OTP (mobile) | `auth-otp.routes.ts` · `auth-otp.service.ts` | — | `auth-otp.service.ts` · `verify-otp.tsx` |
| Merchant CRUD (admin) | `admin/merchant.routes.ts` · `merchant.service.ts` | `admin/merchant/*` · `users.page.tsx` | — |
| Merchant Profile | `PUT /auth/profile` · `auth.service.ts` | `merchant/profile/*` · `profile.page.tsx` | `profile/*` |
| POI CRUD (merchant) | `merchant/poi.routes.ts` · `merchant/poi.service.ts` | `merchant/poi/*` · `pois*.page.tsx` | — |
| POI Approve (admin) | `admin/poi.routes.ts` · `admin/poi.service.ts` | `admin/poi/*` · `pois*.page.tsx` | — |
| POI Map | `*/pois/map` endpoints | `*/poi/map/poi.map.tsx` | `SimulatedMap` (tabs/index) |
| Tour CRUD (admin) | `admin/tour.routes.ts` · `admin/tour.service.ts` | `admin/tour/*` · `tours*.page.tsx` | — |
| Tour List + Start (mobile) | `tourist/tour.routes.ts` | — | `(tabs)/tours.tsx` · `tour/[id].tsx` |
| Session tracking | `tourist/session.routes.ts` · `session.service.ts` | — | `sessionService` · `ProximityTracker` |
| QR Scan | `tourist/poi.routes.ts` (qr-scan) | — | `QRScannerModal` |
| TTS Audio | `tts.routes.ts` · `tts.service.ts` | — | `audioStore` · `AudioBottomSheet` |
