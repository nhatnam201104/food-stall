# De xuat Cai tien Database va He thong

> Ngay phan tich: 2026-04-14
> Thu tu uu tien: CAO > TRUNG BINH > THAP

---

## PHAN A: SU FIX BAT BUOC (Cao uu tien)

### A1. Merchant thieu Soft Delete

**Van de:** Bang `merchants` khong co truong `is_deleted`, `deleted_at`, `updated_at`. Khi admin "xoa" merchant, chi soft delete User nhung Merchant record van con trong database. Dieu nay gay ra:
- Merchant van hien thi trong analytics
- POI cua merchant van hien thi (do merchant_id van hop le)
- Khong theo doi duoc luc cap nhat thong tin cua hang

**File lien quan:**
- `backend/prisma/schema/merchant.prisma`
- `backend/src/services/admin/merchant.service.ts`

**De xuat:**
```prisma
model Merchant {
  // ... existing fields ...
  isActive   Boolean   @default(true) @map("is_active")
  isDeleted  Boolean   @default(false) @map("is_deleted")
  deletedAt  DateTime? @map("deleted_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  @@index([isDeleted, createdAt], map: "idx_merchant_deleted_created_at")
}
```

**Tac dong:** Can migration + cap nhat tat ca query merchant de filter `isDeleted: false`.

---

### A2. Hai co che Reset Mat Khau song song

**Van de:** User co ca 2 co che reset mat khau:
1. **Cu:** `password_reset_token` + `password_reset_expiry` tren bang `users`
2. **Moi:** `password_reset_otps` (bang rieng)

Ca hai deu dang hoat dong dong thoi, tao:
- Redundant du lieu
- Confusion ve flow nao la chinh thuc
- Hai truong token/expiry tren `users` chi phuc vu flow cu

**File lien quan:**
- `backend/prisma/schema/user.prisma`
- `backend/src/services/auth.service.ts` (forgotPassword/resetPassword)
- `backend/src/services/auth-otp.service.ts`

**De xuat (chon 1 trong 2):**

**Option 1 - Giu lai OTP (khuyen nghi):**
```prisma
model User {
  // XOA 2 truong nay:
  // passwordResetToken   String?   @map("password_reset_token")
  // passwordResetExpiry  DateTime? @map("password_reset_expiry")
}
```
- Xoa cac endpoint `forgot-password` va `reset-password` cu
- Chi giu lai OTP flow (hiern dai hon, bao mat hon)

**Option 2 - Giu lai Token:**
- Xoa bang `password_reset_otps`
- Xoa cac endpoint OTP

---

### A3. Thiếu index trên `password_reset_otps`

**Van de:** Bang `password_reset_otps` khong co index tren `user_id` va `otp_code`. Moi lan gui/verify OTP phai scan toan bang.

**De xuat:**
```prisma
model PasswordResetOtp {
  // ... existing fields ...

  @@index([userId, createdAt], map: "idx_otp_user_created")
  @@index([otpCode, isUsed, expiresAt], map: "idx_otp_code_lookup")
}
```

---

### A4. Console.log trong production code

**Van de:** `admin.analytics.service.ts` dong 359-371 co nhieu `console.log` debug khong duoc xoa.

**File lien quan:**
- `backend/src/services/admin/analytics.service.ts:359-371`

**De xuat:** Xoa toan bo console.log debug hoac thay bang logger (winston/pino).

---

## PHAN B: CAI THIEN KIEN TRUC (Trung binh uu tien)

### B1. Enum constraint cho cac truong status

**Van de:** Nhieu truong status dang luu string tho trong DB ma khong co constraint:
- `PointOfInterest.approvalStatus` ("pending" | "approved" | "rejected")
- `PointOfInterest.audioMode` ("tts" | "custom")
- `Tour.status` ("active" | "archived")
- `PoiAudio.status` ("active" | "inactive")
- `AudioPlayHistory.triggerType` ("gps_enter" | "gps_proximity" | "qr_scan" | "manual")
- `AudioPlayHistory.stopReason` ("timeout" | "manual" | "error" | ...)

Dieu nay de nhap sai du lieu va khong exploit MySQL ENUM.

**De xuat:** MySQL khong tot voi ALTER TABLE enum. Thay vao do, them CHECK constraint hoac giu validation trong code va them comment trong Prisma schema:

```prisma
// Prisma khong ho tro enum truc tiep voi MySQL mapping,
// nhung co the su dung comment de tai lieu hoa:
approvalStatus  String   @default("pending")
  /// Values: "pending" | "approved" | "rejected"
  @map("approval_status") @db.VarChar(20)
```

Hoac chuyen sang **PostgreSQL** de su dung true ENUM types. Tuy nhien day la thay doi lon.

---

### B2. PoiAudio thieu `updated_at`

**Van de:** Bang `poi_audio` chi co `created_at`, khong co `updatedAt`. Khi merchant cap nhat noi dung audio, khong theo doi duoc luc cap nhat.

**De xuat:**
```prisma
model PoiAudio {
  // ... existing fields ...
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

---

### B3. Xoa truong `file_size_bytes` khoi `poi_audio`

**Van de:** Truong `file_size_bytes` TON TAI nhung KHONG BAO GIỀ DUOC SU DUNG. Tat ca service va frontend deu khong doc hay ghi truong nay.

**De xuat:** Xoa truong khoi schema hoac bat dau su dung no (ghi file size khi upload audio).

---

### B4. Toi uu hieu suat Analytics - GPS Heatmap

**Van de:** `admin.analytics.service.ts` dong 249 doc toi da 10000 ban ghi `gps_tracks` vao memory, roi tinh toan density grid trong Node.js. Voi du lieu lon, day la bottleneck nghiem trong.

**De xuat:** 
1. Dung database-level aggregation thay vi load vao memory:
```sql
SELECT
  FLOOR(latitude / 0.0005) * 0.0005 AS lat,
  FLOOR(longitude / 0.0005) * 0.0005 AS lng,
  COUNT(*) AS density
FROM gps_tracks
WHERE recorded_at >= ?
GROUP BY lat, lng
```
2. Hoac them bang `gps_density_cache` de pre-aggregate theo tung ngay.

---

### B5. Completion Rate tinh sai

**Van de:** Trong `admin.analytics.service.ts` dong 207-218, completion rate duoc tinh nhu sau:
```typescript
completionRate = Math.round((totalPlaysForPoi / totalPlays) * 100 * 10) / 10;
```
`totalPlaysForPoi` la COUNT tat ca ban ghi cua POI, `totalPlays` cung la count tu groupBy. **Ca 2 giong nhau** (chi khac nhau la date filter). Do do completion rate luon ~100%.

**De xuat:** Completion rate phai tinh bang so lan `completed = true` chia tong so lan play:
```typescript
const completedPlays = await prisma.audioPlayHistory.count({
  where: { poiId: poi.poiId, completed: true, ...dateFilter },
});
completionRate = totalPlays > 0 ? Math.round((completedPlays / totalPlays) * 1000) / 10 : null;
```

---

### B6. Thieu bang Audit Log

**Van de:** Admin co the approve/reject POI, xoa merchant, thay doi tour... nhung khong co log nao ghi lai ai da lam gi luc nao.

**De xuat:** Them bang `audit_logs`:
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  action    String   @db.VarChar(50)  // "approve_poi", "reject_poi", "delete_merchant", ...
  entity    String   @db.VarChar(50)  // "PointOfInterest", "Merchant", ...
  entityId  String?  @map("entity_id")
  details   String?  @db.Text         // JSON string cua thay doi
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@index([entity, entityId])
  @@index([userId, createdAt])
  @@map("audit_logs")
}
```

---

## PHAN C: CAI THIEN TINH NANG (Thap uu tien)

### C1. QR Code Scan - Chuc nang chua trien khai

**Van de:** POI co truong `qr_code_url` nhung khong co API endpoint nao de tao QR code, va mobile app khong co chuc nang scan QR. Truong nay chi co gia tri khi merchant tao POI thoi.

**De xuat:**
1. Mobile app: Them camera scan QR -> tim POI theo QR code -> phat audio
2. Backend: Them endpoint `GET /tourist/pois/qr/:code` de lookup POI theo QR
3. Hoac xoa truong `qr_code_url` neu khong ke hoach su dung

---

### C2. POI Category / Tags

**Van de:** Hien tai POI khong co phan loai. Khi so luong POI tang, tourist khong the loc theo loai mon an (pho, banh mi, ca khoai...).

**De xuat:** Them bang `poi_categories` va quan he N:M:
```prisma
model PoiCategory {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(100) @unique
  iconUrl   String?  @map("icon_url") @db.VarChar(500)
  sortOrder Int      @map("sort_order") @default(0)
  
  pois PoiCategoryPoi[]
  @@map("poi_categories")
}

model PoiCategoryPoi {
  poiId      String   @map("poi_id")
  categoryId String   @map("category_id")
  
  poi       PointOfInterest @relation(fields: [poiId], references: [id], onDelete: Cascade)
  category  PoiCategory     @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@id([poiId, categoryId])
  @@map("poi_category_poi")
}
```

---

### C3. User Preferences / Language

**Van de:** He thong ho tro multi-language audio nhung khong luu ngon ngu yeu thich cua user. Tourist phai chon ngon ngu moi lan.

**De xuat:** Them bang `user_preferences`:
```prisma
model UserPreference {
  id           String   @id @default(uuid())
  userId       String   @unique @map("user_id")
  languageCode String   @default("vi") @map("language_code") @db.VarChar(10)
  // Tuong lai co the them: notificationEnabled, theme, ...
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_preferences")
}
```

---

### C4. Tourist Rating / Review cho POI

**Van de:** POI chi co `priority` (tang khi nghe) nhung khong co he thong danh gia tu tourist. `priority` la metric noi bo, khong phai la danh gia cua nguoi dung.

**De xuat:** Them bang `poi_reviews`:
```prisma
model PoiReview {
  id        String   @id @default(uuid())
  poiId     String   @map("poi_id")
  userId    String   @map("user_id")
  rating    Int      // 1-5 sao
  comment   String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  
  poi  PointOfInterest @relation(fields: [poiId], references: [id], onDelete: Cascade)
  user User           @relation(fields: [userId], references: [id])
  
  @@unique([poiId, userId]) // 1 review per user per POI
  @@map("poi_reviews")
}
```

---

### C5. Giam sat du lieu GPS (Data Retention)

**Van de:** Bang `gps_tracks` tang truong cuc nhanh (1 record moi 5-10 giay moi session). Voi 100 tourist su dung dong thoi, du lieu co the vuot hang trieu ban ghi/tuan.

**De xuat:**
1. **Partitioning:** Partition bang `gps_tracks` theo `recorded_at` (hang thang)
2. **Retention Policy:** Tu dong xoa du lieu GPS cu hon X ngay (VD: 90 ngay)
3. **Pre-aggregation:** Tang luong them mot bang `daily_gps_summary` de luu du lieu da aggergate:
```prisma
model DailyGpsSummary {
  id              String   @id @default(uuid())
  poiId           String?  @map("poi_id")
  date            DateTime @map("date")
  uniqueVisitors  Int      @map("unique_visitors") @default(0)
  totalTrackPoints Int     @map("total_track_points") @default(0)
  
  @@unique([poiId, date])
  @@map("daily_gps_summary")
}
```

---

### C6. Offline Sync cho Mobile

**Van de:** `UserSession` co truong `offlineMode` nhung khong co co che sync du lieu offline. Khi tourist mat ket noi, GPS tracks va audio play events bi mat.

**De xuat:**
1. Them bang `pending_syncs` de luu du lieu offline:
```prisma
model PendingSync {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  dataType  String   @db.VarChar(20)  // "gps_track" | "audio_play"
  payload   String   @db.Text         // JSON cua du lieu
  status    String   @default("pending") @db.VarChar(20) // "pending" | "synced" | "failed"
  createdAt DateTime @default(now()) @map("created_at")
  syncedAt  DateTime? @map("synced_at")
  
  @@index([userId, status])
  @@map("pending_syncs")
}
```
2. Hoac su dung local storage tren mobile + sync API endpoint.

---

## BANG TONG HOP UU TIEN

| Ma | De xuat | Uu tien | Do kho | Tac dong Migration |
|----|---------|---------|--------|-------------------|
| A1 | Merchant soft delete | CAO | Thap | Can migration |
| A2 | Gop 2 co che reset mat khau | CAO | Thap | Can migration + refactor API |
| A3 | Index cho password_reset_otps | CAO | Thap | Can migration |
| A4 | Xoa console.log | CAO | Rat thap | Khong can migration |
| B1 | Enum constraint (comment) | TRUNG BINH | Thap | Khong can migration |
| B2 | PoiAudio updated_at | TRUNG BINH | Thap | Can migration |
| B3 | Xoa file_size_bytes | TRUNG BINH | Thap | Can migration |
| B4 | Toi uu heatmap query | TRUNG BINH | Trung binh | Khong can migration (code only) |
| B5 | Sua completion rate | TRUNG BINH | Thap | Khong can migration (code only) |
| B6 | Them audit_logs | TRUNG BINH | Trung binh | Can migration + refactor |
| C1 | QR Code scan | THAP | Trung binh | Can migration + mobile dev |
| C2 | POI categories | THAP | Trung binh | Can migration + refactor API |
| C3 | User preferences | THAP | Thap | Can migration |
| C4 | POI reviews | THAP | Trung binh | Can migration + refactor API |
| C5 | GPS data retention | THAP | Cao | Can migration + partitioning |
| C6 | Offline sync | THAP | Cao | Can migration + mobile dev |

---

## LO TRINH DE XUAT

### Giai doan 1 (Sua loi - 1-2 ngay):
1. A4 - Xoa console.log
2. A3 - Them index cho password_reset_otps
3. B5 - Sua completion rate
4. B3 - Xoa file_size_bytes (hoac bat dau su dung)

### Giai doan 2 (Cau truc - 2-3 ngay):
1. A1 - Them soft delete cho Merchant
2. A2 - Gop 2 co che reset mat khau
3. B2 - Them updated_at cho PoiAudio
4. B1 - Them comment enum trong Prisma schema

### Giai doan 3 (Tinh nang moi - 3-5 ngay):
1. B6 - Audit log system
2. B4 - Toi uu heatmap query
3. C3 - User preferences
4. C2 - POI categories

### Giai doan 4 (Nang cap lon - 1-2 tuan):
1. C1 - QR Code scan
2. C4 - POI reviews/ratings
3. C5 - GPS data retention
4. C6 - Offline sync
