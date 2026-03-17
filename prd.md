**🎧 AUDIO TOUR GUIDE SYSTEM**

_Product Requirements Document (PRD) v1.0_

**PHẦN 1: TỔNG QUAN · PHẠM VI · USER STORIES · FUNCTIONAL REQUIREMENTS**

**Field**

**Value**

**Product Name**

Audio Tour Guide – GPS-Proximity Auto-Narration System

**Version**

1.0 (MVP Consolidated)

**Document Date**

March 13, 2026

**Status**

Draft for Development

**Owner**

Business Analyst / Product Owner

**Scope**

Visitor App · Merchant Portal · Admin Dashboard

**File**

PRD\_Part1 – Overview, Scope, Personas, User Stories, FR

# 1\. Product Overview & Goals

## 1.1 Overview

Audio Tour Guide là hệ thống thuyết minh tự động theo vị trí GPS (Location-Based Audio Experience) dành cho triển lãm, hội chợ, và khu du lịch. Hệ thống gồm ba thành phần chính:

*   Visitor App (Web Mobile): Ứng dụng web chạy trên thiết bị di động của khách tham quan — tích hợp GPS tracking, proximity detection, Text-to-Speech (TTS) qua Google Gemini API, và QR scan.
*   Merchant Portal (Web Desktop): Giao diện web dành cho chủ quán/gian hàng — quản lý POI, cấu hình audio, theo dõi analytics nội bộ.
*   Admin Dashboard (Web Desktop): Trung tâm điều hành — quản lý tất cả người dùng, POI hệ thống, thiết kế Tour, và phân tích dữ liệu toàn cục.

## 1.2 Problem Statement

*   Khách tham quan đi qua gian hàng nhưng không biết thông tin do thiếu hướng dẫn viên hoặc tài liệu rời rạc.
*   Hướng dẫn viên con người chi phí cao, không phục vụ đồng thời nhiều khách.
*   Audio guide truyền thống yêu cầu thiết bị riêng (thuê máy) gây bất tiện.
*   QR code tĩnh yêu cầu khách chủ động, tỷ lệ tương tác thấp.

## 1.3 Goals

**#**

**Mục tiêu**

**Đo lường**

**Scope**

G1

Visitor nghe audio TTS tự động khi vào bán kính ≤ 15m POI

Proximity trigger end-to-end < 3 giây

MVP

G2

QR scan kích hoạt audio tức thì

QR → audio phát < 5 giây

MVP

G3

Cooldown 5 phút chống spam audio

0 lần phát lại trong cửa sổ cooldown

MVP

G4

Queue FIFO quản lý nhiều POI đồng thời

Auto-advance đúng thứ tự sau onended

MVP

G5

Merchant quản lý POI và xem analytics nội bộ

CRUD < 2s; Dashboard load < 3s

MVP

G6

Admin kiểm soát toàn hệ thống, thiết kế Tour

Tất cả P0 stories pass

MVP

G7

Session & GPS tracking lưu để analytics

100% session có GPS track records

Production

# 2\. Scope Definition

## 2.1 In-Scope (MVP v1.0)

### Module V: Visitor App

*   V-1 GPS Tracking: watchPosition real-time (enableHighAccuracy: true)
*   V-2 Proximity Detection: Haversine distance, trigger khi d ≤ poi.radius
*   V-3 Auto-TTS: Gemini 2.5 Flash Preview TTS, voice 'Kore', mp3 base64
*   V-4 Audio Player bottom sheet: ảnh, tên, mô tả, progress bar, Play/Pause, đóng
*   V-5 Audio Queue FIFO: thumbnail, Play ngay / xoá, empty state, auto-advance
*   V-6 AutoPlay Toggle: bật/tắt proximity trigger từ header
*   V-7 QR Scanner modal: animated scan-line, MVP giả lập quét thành công
*   V-8 Manual trigger: nhấn marker POI trên bản đồ
*   V-9 Simulated map (dot-grid canvas) với marker POI và GPS user marker animated

### Module M: Merchant Portal

*   M-1 Authentication: Đăng ký, đăng nhập, đăng xuất Merchant
*   M-2 Merchant Profile: Xem và cập nhật thông tin gian hàng
*   M-3 POI Management: CRUD POI (tạo qua click map / nhập tọa độ / form), toggle active
*   M-4 Usage History: Xem lịch sử tương tác khách với POI, filter theo POI/ngày
*   M-5 Analytics Dashboard: Top POI, tổng lượt nghe, avg dwell time, filter thời gian

### Module A: Admin Dashboard

*   A-1 Authentication: Đăng nhập / đăng xuất Admin, session 24h auto-logout
*   A-2 User Management: CRUD Merchant & Tourist — tạo, sửa, khóa, xóa
*   A-3 POI Management (System-wide): CRUD tất cả POI, click map để tạo, drag marker
*   A-4 Tour Builder: Tạo Tour, thêm POI, drag-and-drop reorder sequence
*   A-5 Analytics: Heatmap toàn cục, Route Tracking, Top 10 POI ranking

## 2.2 Out-of-Scope (MVP — đặt vào Future Enhancements)

*   Thanh toán / Subscription
*   Livestream hoặc video narration
*   AR overlay
*   Social features (chia sẻ, rating, comment)
*   Real map integration (Google Maps / Mapbox) — MVP dùng dot-grid canvas
*   Offline mode (Service Worker + IndexedDB)
*   Server-side TTS proxy (MVP expose client-side key)
*   Multi-language TTS (MVP chỉ tiếng Việt)
*   QR decode thật (BarcodeDetector API) — MVP giả lập
*   Image upload lên cloud storage (MVP dùng URL placeholder)
*   Drag-and-drop reorder POI trong Tour (nếu timeline không cho phép → defer)
*   Quản lý nhân viên Merchant đa vai trò
*   Audit logging
*   Multi-tenant (nhiều sự kiện/địa điểm)

# 3\. Personas & Roles

**Role**

**Mô tả**

**Hành vi chính**

**Kênh truy cập**

**Scope**

**Visitor (Khách tham quan)**

Khách đến triển lãm / tour du lịch, dùng smartphone

Mở app → cấp quyền GPS → đi lại → nghe auto TTS → quét QR → điều khiển queue

Web Mobile (PWA)

MVP

**Merchant (Chủ quán)**

Chủ gian hàng / đơn vị kinh doanh sở hữu POI, độ tuổi 27–45

Đăng nhập 2–4 lần/tuần → CRUD 1–3 POI/phiên → kiểm tra lịch sử → xem analytics

Web Desktop Portal

MVP

**Admin (Quản trị viên)**

Ban tổ chức sự kiện / IT Administrator kiểm soát toàn hệ thống

Quản lý User → CRUD POI system → thiết kế Tour → xem analytics & heatmap

Web Desktop Dashboard

MVP

**Developer**

Người deploy và maintain hệ thống

Seed data, set env vars, monitor logs, deploy

CLI / Server

MVP+

_Lưu ý: MVP không có màn hình Admin/Merchant trong Visitor App. Cấu hình thực hiện qua constants.ts hoặc seed script. Mã QR in tĩnh gắn tại gian hàng._

# 4\. User Stories

## 4.1 Module V — Visitor App

**ID**

**Module**

**User Story**

**Priority**

**AC ID**

US-V01

GPS

Là Visitor, tôi muốn cấp quyền vị trí để app theo dõi GPS thời gian thực.

P0

AC-V01

US-V02

Proximity

Là Visitor, tôi muốn audio tự động phát khi tôi bước vào vùng bán kính POI (≤ 15m) mà không cần thao tác thủ công.

P0

AC-V02

US-V03

Audio Player

Là Visitor, tôi muốn thấy bottom sheet với thông tin POI, progress bar và nút Play/Pause/Đóng khi audio đang phát.

P0

AC-V03

US-V04

Audio Queue

Là Visitor, tôi muốn các POI trigger khi đang nghe được xếp vào hàng đợi và tự động phát sau khi audio hiện tại kết thúc.

P0

AC-V04

US-V05

Cooldown

Là Visitor, tôi muốn hệ thống không phát lại cùng một POI trong vòng 5 phút để tránh lặp audio spam.

P0

AC-V05

US-V06

AutoPlay Toggle

Là Visitor, tôi muốn bật/tắt chế độ tự động phát để kiểm soát trải nghiệm nghe.

P1

AC-V06

US-V07

QR Scan

Là Visitor, tôi muốn quét mã QR tại gian hàng để nghe thuyết minh ngay lập tức.

P0

AC-V07

US-V08

Manual Trigger

Là Visitor, tôi muốn nhấn marker POI trên bản đồ để nghe thuyết minh theo ý muốn.

P1

AC-V08

US-V09

Map View

Là Visitor, tôi muốn thấy bản đồ với vị trí của tôi và các POI xung quanh để định hướng tham quan.

P0

AC-V09

## 4.2 Module M — Merchant Portal

**ID**

**Module**

**User Story**

**Priority**

**AC ID**

US-M01

Auth

Là Merchant, tôi muốn đăng ký tài khoản để truy cập Merchant Portal.

P0

AC-M01

US-M02

Auth

Là Merchant, tôi muốn đăng nhập bằng email/password để truy cập dashboard gian hàng.

P0

AC-M02

US-M03

Auth

Là Merchant, tôi muốn đăng xuất để kết thúc phiên làm việc an toàn.

P0

AC-M03

US-M04

Profile

Là Merchant, tôi muốn xem hồ sơ gian hàng của mình để xác minh thông tin tài khoản.

P1

AC-M04

US-M05

Profile

Là Merchant, tôi muốn cập nhật thông tin gian hàng (tên, SĐT, địa chỉ).

P1

AC-M05

US-M06

POI

Là Merchant, tôi muốn tạo POI mới bằng form hoặc click trên bản đồ để định nghĩa điểm kích hoạt audio.

P0

AC-M06

US-M07

POI

Là Merchant, tôi muốn nhập tọa độ Lat/Lng thủ công để cấu hình vị trí POI chính xác.

P0

AC-M07

US-M08

POI

Là Merchant, tôi muốn chỉnh sửa thông tin POI (tên, mô tả, radius, priority, audio) để cập nhật dữ liệu gian hàng.

P0

AC-M08

US-M09

POI

Là Merchant, tôi muốn bật/tắt trạng thái POI (Active/Inactive) để kiểm soát kích hoạt audio.

P1

AC-M09

US-M10

POI

Là Merchant, tôi muốn xóa POI lỗi thời của mình.

P0

AC-M10

US-M11

POI

Là Merchant, tôi muốn xem tất cả POI của mình trên bản đồ để hình dung phân bổ không gian.

P1

AC-M11

US-M12

POI

Là Merchant, tôi muốn xem danh sách POI dạng bảng để duyệt và quản lý nhanh.

P0

AC-M12

US-M13

History

Là Merchant, tôi muốn xem lịch sử tương tác của khách với POI của mình.

P0

AC-M13

US-M14

History

Là Merchant, tôi muốn lọc lịch sử theo POI và khoảng ngày để phân tích từng giai đoạn.

P1

AC-M14

US-M15

Analytics

Là Merchant, tôi muốn xem Top POI được nghe nhiều nhất trong gian hàng của mình.

P1

AC-M15

US-M16

Analytics

Là Merchant, tôi muốn lọc analytics theo khoảng thời gian để so sánh hiệu suất qua các giai đoạn.

P1

AC-M16

## 4.3 Module A — Admin Dashboard

**ID**

**Module**

**User Story**

**Priority**

**AC ID**

US-A01

Auth

Là Admin, tôi muốn đăng nhập bằng email/password để truy cập hệ thống quản trị.

P0

AC-A01

US-A02

Auth

Là Admin, tôi muốn đăng xuất để đảm bảo an toàn khi không sử dụng.

P0

AC-A02

US-A03

User Mgmt

Là Admin, tôi muốn xem danh sách toàn bộ người dùng (Merchant & Tourist) để kiểm soát hệ thống.

P0

AC-A03

US-A04

User Mgmt

Là Admin, tôi muốn tạo tài khoản Merchant mới và gửi mật khẩu tạm thời qua email.

P0

AC-A04

US-A05

User Mgmt

Là Admin, tôi muốn sửa thông tin người dùng (email, tên, loại tài khoản) khi có sai sót.

P1

AC-A05

US-A06

User Mgmt

Là Admin, tôi muốn khóa (Ban) hoặc xóa tài khoản vi phạm chính sách.

P0

AC-A06

US-A07

POI Mgmt

Là Admin, tôi muốn thêm POI bằng cách click trên bản đồ để làm phong phú dữ liệu du lịch.

P0

AC-A07

US-A08

POI Mgmt

Là Admin, tôi muốn sửa tọa độ, bán kính, nội dung thuyết minh của bất kỳ POI nào.

P0

AC-A08

US-A09

POI Mgmt

Là Admin, tôi muốn xóa POI không còn tồn tại và tự động gỡ khỏi tất cả Tour liên quan.

P0

AC-A09

US-A10

Tour

Là Admin, tôi muốn tạo Tour mới với tên, mô tả và ảnh bìa.

P0

AC-A10

US-A11

Tour

Là Admin, tôi muốn thêm POI có sẵn vào Tour để tạo hành trình.

P0

AC-A11

US-A12

Tour

Là Admin, tôi muốn thay đổi thứ tự POI (reorder) trong Tour để tối ưu đường đi.

P0

AC-A12

US-A13

Tour

Là Admin, tôi muốn xóa Tour không còn phù hợp.

P1

AC-A13

US-A14

Analytics

Là Admin, tôi muốn xem Heatmap toàn cục để biết khu vực nào có mật độ khách cao.

P1

AC-A14

US-A15

Analytics

Là Admin, tôi muốn theo dõi tuyến di chuyển thực tế của khách để cải tiến lộ trình Tour.

P1

AC-A15

# 5\. Functional Requirements (FR)

## 5.1 Module V — Visitor App

### FR-V-001: GPS Permission & Tracking

Khi app khởi động, hiển thị dialog xin quyền vị trí với giải thích: "Để tự động phát audio khi bạn đến gần gian hàng". Sau khi cấp quyền, bắt đầu watchPosition (enableHighAccuracy: true, maximumAge: 0, timeout: 5000). Toast hiển thị: "Đang theo dõi vị trí thực" + chấm xanh. Nếu từ chối: app vẫn cho phép QR scan và manual trigger.

### FR-V-002: Proximity Detection & Auto-TTS Trigger

Mỗi GPS tick tính Haversine distance từ user đến tất cả POI đang active. Nếu d ≤ poi.radius\_meters AND poi không trong cooldown AND autoPlay = true → gọi handleTriggerBooth(poi). Nếu audio đang phát → enqueue POI vào FIFO queue. isGenerating = true → spinner; bottom sheet slide-up "Đang khởi tạo...".

### FR-V-003: Audio Player Bottom Sheet

Hiển thị: ảnh POI, tên, mô tả, progress bar (animated ~30s hoặc sync audio.duration), icon Volume2 pulse khi đang phát. Controls: Play/Pause (toggle), nút X để stop và đóng sheet. onended → auto-advance queue.

### FR-V-004: Audio Queue FIFO

Queue hiển thị dưới bottom sheet: thumbnail, tên POI, nút Play ngay (skip current) và nút xóa (×). Empty state: "Hàng đợi trống". Auto-advance: khi audio A ended → dequeue B → trigger B. Cap queue tối đa 10 items (production).

### FR-V-005: Cooldown Guard

Sau khi POI phát audio, set cooldown\[poi.id\] = Date.now() + 300\_000ms (global MVP). Proximity check skip trigger nếu Date.now() < cooldown\[poi.id\]. Icon đồng hồ trên marker khi trong cooldown.

### FR-V-006: QR Scanner Modal

Nút "QUÉT MÃ QR" mở fullscreen modal với animated scan-line. MVP: nút giả lập "Quét thành công" → chọn POI từ danh sách. Production: BarcodeDetector API / jsQR decode boothId → GET /api/pois/:id → handleTriggerBooth(poi). Modal fade-out; bottom sheet slide-up.

### FR-V-007: Manual Trigger via Map Marker

Click marker POI trên bản đồ → handleTriggerBooth(poi) trực tiếp. Trigger type = 'manual'. Không bị chặn bởi cooldown khi trigger manual (hoặc reset cooldown — cần xác nhận OQ-02).

### FR-V-008: AutoPlay Toggle

Header có toggle icon. autoPlay = true: proximity trigger bật. autoPlay = false: chỉ QR scan và manual trigger. State persist trong session.

### FR-V-009: Simulated Map Display

Dot-grid canvas hiển thị POI markers (màu theo loại) và marker GPS user animated. Marker user di chuyển khi GPS tick. Click marker → tooltip với tên POI + nút Play.

## 5.2 Module M — Merchant Portal

### FR-M-001: Authentication (Login/Register/Logout)

Login: email input + password input (masked, toggle show/hide) + "Đăng nhập" button. Error: "Thông tin đăng nhập không chính xác". Success: redirect Merchant Dashboard. Register: tên chủ quán, tên gian hàng, email, SĐT, password, confirm password. Validation: email format, password ≥ 8 ký tự, password = confirm. Success: toast + redirect login. Logout: xóa auth token → redirect login.

### FR-M-002: Merchant Profile (View & Update)

View: card hiển thị tên gian hàng, tên chủ quán, email, SĐT, ngày tạo. Merchant chỉ xem profile của mình. Update: form chỉnh sửa tên gian hàng, mô tả, SĐT. Success: "Cập nhật thông tin thành công".

### FR-M-003: POI List View

Table/Card list: POI name, Latitude, Longitude, Radius, Priority, Status, Actions (Edit/Delete). Merchant chỉ thấy POI của mình (merchantId filter). Hỗ trợ pagination, sorting. Empty state: icon + "Chưa có POI nào" + button "Tạo POI đầu tiên".

### FR-M-004: Create POI

Form fields: Tên điểm (required), Mô tả (optional), Latitude (required), Longitude (required), Radius (required, 10–500m), Priority (required, ≥1), Image URL (optional), TTS Content / Audio URL. Click on map → auto-fill Lat/Lng. Validation: Lat -90 to 90, Lng -180 to 180. Success: "Tạo POI thành công"; POI xuất hiện danh sách.

### FR-M-005: Edit & Delete POI

Edit: load full data POI vào form; sau save → cập nhật danh sách. Delete: confirmation dialog "Bạn có chắc muốn xóa POI này?" → confirm → POI bị xóa. Merchant chỉ được xóa POI thuộc ownership của mình (BR-002).

### FR-M-006: Activate/Deactivate POI

Toggle Active/Inactive. Active: POI kích hoạt audio khi khách vào vùng. Inactive: POI không trigger audio, marker màu xám trên map. Status persist trong DB.

### FR-M-007: Map View for POIs

Canvas map hiển thị tất cả POI của Merchant. Marker xanh = Active; xám = Inactive. Click marker → mở POI detail/edit panel.

### FR-M-008: Usage History

Table: Timestamp, POI Name, Interaction Type (gps\_enter / qr\_scan / manual), Listening Duration (giây). Filter: by POI dropdown, date range picker. Data chỉ thuộc POI của Merchant hiện tại.

### FR-M-009: Analytics Dashboard

Overview KPI cards: Tổng lượt nghe, Avg listen duration, Completion rate. Top Performing POIs table: POI name, Total listens, Avg dwell time. Time filter: Hôm nay, 7 ngày, 30 ngày, Custom range. Analytics scoped chỉ trong POI của Merchant. Loading: skeleton cards; Empty state: "Chưa có dữ liệu analytics".

## 5.3 Module A — Admin Dashboard

### FR-A-001: Admin Authentication

Login: username/email + password (masked, toggle). Success → redirect Global Overview Dashboard + sidebar navigation. Failure → "Tên đăng nhập hoặc mật khẩu không đúng". Session 24h auto-logout. Logout → xóa auth state → redirect login. Back button sau logout → yêu cầu đăng nhập lại.

### FR-A-002: User Management Screen

Search input: "Tìm kiếm người dùng (Tên/Email)". Filter dropdown: Tất cả / Merchant / Tourist. Table: ID, Name, Email, Role, Status, Actions (Edit/Ban/Delete). Create Merchant: form nhập thông tin + gán merchant ID → gửi mật khẩu tạm thời qua email. Update: thay đổi trạng thái Active/Banned. Banned → không thể đăng nhập, disconnect ngay nếu đang online. Delete: confirmation "Xóa người dùng này?" → xóa vĩnh viễn.

### FR-A-003: POI Management (System-wide)

Map canvas hiển thị TẤT CẢ POI hệ thống. Color-coded markers: xanh = selected POI, xanh dương = System POI, cam = Merchant POI. Crosshair cursor → click map → auto-fill Lat/Lng vào form. Drag-and-drop marker → cập nhật tọa độ. Sidebar form: Location (Lat, Lng, Radius 10–500m, Priority 1–10), Info (Name, Description, TTS Content / Audio File), Status toggle. Actions: "Cập nhật điểm", "Đặt lại", "Xóa điểm". Xóa POI → cascade: gỡ khỏi tất cả Tour liên quan (BR-008).

### FR-A-004: Tour Builder

Split-screen layout. Left sidebar: danh sách TẤT CẢ POI có Search & Filter. Right main: Tour metadata (Name, Description, Cover Image URL, Duration minutes) + Route Section (POI list theo thứ tự). Add POI: click POI ở sidebar trái → thêm vào cuối lộ trình. Drag-and-drop reorder trong Route Section → update sequence\_order. Auto-calculation: đếm tổng số điểm, ước lượng thời gian Tour. Validation: tên Tour bắt buộc, tối thiểu 1 POI (warning khi < 2).

### FR-A-005: Advanced Analytics

Top Points: bảng 10 POI có lượt trigger cao nhất. Route Tracking: overlay polyline trên bản đồ hiển thị vector di chuyển, filter: "24h qua" / "7 ngày qua". Global Heatmap: gradient Xanh→Đỏ theo mật độ GPS\_TRACKS, tổng hợp từ tọa độ Tourist. Load ≤ 3 giây sau chọn filter.

# 6\. Acceptance Criteria (Given-When-Then)

## 6.1 Module V — Visitor App

**AC ID**

**Acceptance Criteria (Given-When-Then)**

**AC-V01**

GIVEN Visitor mở Visitor App lần đầu

WHEN browser hiển thị dialog xin quyền vị trí

AND Visitor nhấn 'Cho phép'

THEN GPS watchPosition bắt đầu, toast 'Đang theo dõi vị trí thực' xuất hiện với chấm xanh

AND marker Visitor di chuyển animated trên bản đồ khi GPS tick

**AC-V02**

GIVEN Visitor đang ở trong khu vực, autoPlay = ON, POI A cách 10m (≤ 15m radius), cooldown chưa set

WHEN GPS tick tính Haversine distance ≤ poi.radius\_meters

THEN handleTriggerBooth(A) được gọi

AND isGenerating = true, spinner và bottom sheet 'Đang khởi tạo...' slide-up xuất hiện

AND Gemini TTS sinh audio và bắt đầu phát trong ≤ 3 giây (G1)

AND cooldown\[A.id\] được set = Date.now() + 300\_000ms

**AC-V03**

GIVEN audio đang phát cho POI A

WHEN bottom sheet hiển thị

THEN ảnh POI A, tên, mô tả hiển thị đúng

AND progress bar chạy animated, icon Volume2 pulse

WHEN Visitor nhấn Pause → audio.pause(), isPlaying = false, icon chuyển Play

WHEN Visitor nhấn Play → audio.play(), isPlaying = true, icon chuyển Pause

WHEN Visitor nhấn X → stopAudio(), activeBooth = null, bottom sheet slide-down

**AC-V04**

GIVEN audio A đang phát

WHEN Visitor bước vào bán kính POI B (B chưa trong cooldown)

THEN POI B được enqueue vào FIFO queue, badge queue +1

AND queue item B hiển thị thumbnail, tên, nút Play ngay và nút ×

WHEN audio A kết thúc (onended)

THEN handleTriggerBooth(B) tự động gọi, bottom sheet cập nhật info POI B

**AC-V05**

GIVEN Visitor vừa nghe POI A (cooldown set = Date.now() + 300\_000ms)

WHEN Visitor rời xa rồi quay lại POI A trong vòng 5 phút

AND GPS tick trigger proximity detection

THEN hệ thống skip trigger, KHÔNG gọi handleTriggerBooth(A)

AND không có audio mới phát, không có UI change

**AC-V07**

GIVEN Visitor nhấn nút 'QUÉT MÃ QR'

WHEN modal QR fullscreen mở với animated scan-line

AND QR decode thành công (MVP: nút giả lập) → trả về boothId

THEN modal fade-out

AND bottom sheet slide-up với thông tin POI tương ứng

AND audio phát trong ≤ 5 giây (G2)

AND trigger\_type = 'qr\_scan' được log

**AC-V08**

GIVEN Visitor đang xem bản đồ

WHEN Visitor nhấn marker POI B trực tiếp

THEN handleTriggerBooth(B) gọi ngay lập tức

AND bottom sheet slide-up, TTS bắt đầu

AND trigger\_type = 'manual' được log

## 6.2 Module M — Merchant Portal

**AC ID**

**Acceptance Criteria (Given-When-Then)**

**AC-M01**

GIVEN tôi ở trang đăng ký Merchant

WHEN tôi nhập tên chủ quán, tên gian hàng, email hợp lệ, SĐT, password ≥ 8 ký tự, confirm password khớp

AND nhấn 'Tạo tài khoản'

THEN hệ thống tạo tài khoản Merchant mới với status = pending/active

AND hiển thị toast 'Tài khoản đã được tạo thành công'

AND redirect về trang đăng nhập

**AC-M02**

GIVEN tôi ở trang đăng nhập Merchant

WHEN tôi nhập email và password hợp lệ, nhấn 'Đăng nhập'

THEN redirect đến Merchant Dashboard

AND sidebar điều hướng Merchant Portal hiển thị

WHEN tôi nhập sai → THEN hiển thị 'Thông tin đăng nhập không chính xác', password field xóa trắng

**AC-M06**

GIVEN tôi ở trang POI Management

WHEN tôi nhập tên 'Quầy đặc sản', Lat 15.878000, Lng 108.330000, Radius 50, Priority 1

AND nhấn 'Tạo POI'

THEN POI mới được tạo với merchantId = merchant hiện tại

AND POI xuất hiện trong danh sách và trên bản đồ với marker xanh

AND toast 'Tạo POI thành công' hiển thị

**AC-M09**

GIVEN POI 'Test POI' đang Active

WHEN tôi tắt toggle Active → status = Inactive

THEN POI không kích hoạt audio cho Visitor khi proximity detect

AND marker trên bản đồ đổi sang màu xám

WHEN tôi bật lại Active → POI kích hoạt audio bình thường trở lại

**AC-M10**

GIVEN tôi ở POI Management và có POI 'Test POI'

WHEN tôi nhấn Delete → confirmation dialog 'Bạn có chắc muốn xóa POI này?' xuất hiện

AND tôi xác nhận

THEN POI bị xóa khỏi hệ thống

AND POI không còn trong danh sách và bản đồ

AND Merchant không thể xóa POI của Merchant khác (403 Forbidden)

**AC-M13**

GIVEN tôi ở trang Usage History

WHEN trang load

THEN danh sách lịch sử tương tác hiển thị với: Timestamp, POI Name, Interaction Type, Listening Duration

AND dữ liệu chỉ thuộc POI của Merchant hiện tại

AND KHÔNG hiển thị dữ liệu của Merchant khác

**AC-M15**

GIVEN tôi ở Analytics Dashboard

WHEN dashboard load

THEN Top POI table hiển thị POI name, tổng lượt nghe, avg dwell time

AND filter thời gian hoạt động: Hôm nay / 7 ngày / 30 ngày / Custom

WHEN chọn filter → danh sách cập nhật trong ≤ 2 giây

## 6.3 Module A — Admin Dashboard

**AC ID**

**Acceptance Criteria (Given-When-Then)**

**AC-A01**

GIVEN tôi ở trang đăng nhập Admin

WHEN tôi nhập username và password hợp lệ, nhấn 'Đăng nhập'

THEN redirect đến Global Overview Dashboard

AND toast chào mừng và sidebar điều hướng hiển thị

WHEN sai thông tin → 'Tên đăng nhập hoặc mật khẩu không đúng', password field xóa

**AC-A02**

GIVEN tôi đang đăng nhập Admin

WHEN tôi nhấn 'Đăng xuất' tại Sidebar

THEN session hủy, redirect về login

AND nhấn Back → yêu cầu đăng nhập lại (không vào được trang quản trị)

**AC-A04**

GIVEN tôi ở User Management

WHEN tôi nhập email chưa tồn tại, chọn loại 'Merchant', nhấn 'Lưu'

THEN tài khoản mới tạo với status = Active

AND hệ thống gửi mật khẩu tạm thời đến email của Merchant

**AC-A06**

GIVEN tôi xem danh sách người dùng

WHEN tôi nhấn icon 'Khóa' trên tài khoản đang Active

THEN status chuyển sang 'Bị khóa'

AND Merchant đó bị disconnect ngay nếu đang đăng nhập

AND không thể đăng nhập lại cho đến khi Admin mở khóa

**AC-A07**

GIVEN tôi ở trang POI và click tọa độ (15.8, 108.3) trên bản đồ

WHEN Lat/Lng auto-fill vào form, tôi nhập tên 'Gian hàng A', radius 20m, nhấn 'Lưu'

THEN marker màu cam xuất hiện đúng vị trí vừa click

AND toast 'Tạo POI thành công' hiển thị

WHEN Lat/Lng nằm ngoài vùng cho phép → 'Vị trí nằm ngoài phạm vi hoạt động của ứng dụng', POI không lưu

**AC-A09**

GIVEN POI 'Điểm X' đang thuộc 'Tour 01'

WHEN Admin xóa vĩnh viễn 'Điểm X'

THEN 'Điểm X' biến mất khỏi bản đồ và danh sách

AND trong 'Tour 01', lộ trình tự động loại bỏ điểm này (cascade)

AND cấu trúc Tour không bị hỏng, sequence\_order của các POI còn lại re-index

**AC-A10**

GIVEN tôi ở Tour Builder

WHEN tôi nhập tên Tour, kéo thả ≥ 2 POI vào lộ trình, nhấn 'Lưu'

THEN Tour mới hiển thị trong danh sách với đầy đủ số điểm và thời lượng dự kiến

WHEN để trống tên Tour HOẶC không chọn POI → cảnh báo 'Vui lòng nhập tên tour và chọn ít nhất một điểm!', không lưu

**AC-A12**

GIVEN Tour hiện có thứ tự \[A → B → C\]

WHEN Admin kéo POI C lên đầu danh sách và nhấn 'Cập nhật'

THEN thứ tự mới = \[C → A → B\] được lưu vào DB

AND Visitor App hiển thị lộ trình theo thứ tự mới

**AC-A14**

GIVEN tôi ở trang Analytics, chọn 'Hôm nay', bật Heatmap

THEN các khu vực nhiều khách hiển thị màu đỏ đậm

AND các khu vực vắng = màu xanh hoặc không tô

AND dữ liệu load ≤ 3 giây sau chọn filter (NFR-PERF-004)

# 7\. Non-Functional Requirements (NFRs)

## 7.1 Performance

**ID**

**Requirement**

**Target**

NFR-PERF-001

Tất cả CRUD (User, POI, Tour) hoàn thành

≤ 2 giây

NFR-PERF-002

Bản đồ Admin hiển thị tối đa 500 POI markers

≤ 1 giây

NFR-PERF-003

Trang danh sách Tour tải tối thiểu 50 Tour

≤ 2 giây

NFR-PERF-004

Heatmap và Route Tracking xử lý và hiển thị sau khi chọn filter

≤ 3 giây

NFR-PERF-005

Proximity trigger → audio phát (end-to-end TTS)

≤ 3 giây

NFR-PERF-006

QR scan → audio phát

≤ 5 giây

NFR-PERF-007

Merchant Analytics Dashboard load (≤ 30 ngày dữ liệu)

≤ 2 giây

NFR-PERF-008

Merchant Interaction History hiển thị 50 records đầu

≤ 2 giây

## 7.2 Security

**ID**

**Requirement**

NFR-SEC-001

Mỗi session (Admin / Merchant / Visitor) độc lập, không chia sẻ quyền truy cập.

NFR-SEC-002

Password input masked mặc định, có toggle show/hide. Không log password raw.

NFR-SEC-003

Auth state kiểm tra tại mỗi route navigation. Chưa đăng nhập → redirect login.

NFR-SEC-004

Password lưu bcrypt hash. Tọa độ GPS encrypt trước khi lưu DB.

NFR-SEC-005

Merchant chỉ truy cập POI/Analytics thuộc merchantId của mình (ownership validation, 403 nếu vi phạm).

NFR-SEC-006

JWT access token TTL: 1 giờ; refresh token TTL: 30 ngày. Admin session auto-logout sau 24h không hoạt động.

NFR-SEC-007

Rate limiting: POST /api/tts max 60 req/phút per user (chống Gemini cost abuse).

NFR-SEC-008

Input validation: tất cả lat/lng/radius/description validate trước khi lưu DB (parameterized queries, chống SQL injection).

NFR-SEC-009

XSS: escape tất cả user-generated content (POI name, description) trước khi render.

NFR-SEC-010

(Production) GEMINI\_API\_KEY chuyển sang server-side proxy. MVP: chấp nhận expose client-side.

## 7.3 Validation & Error Handling

*   Tất cả thông báo lỗi và xác nhận dùng Tiếng Việt rõ ràng.
*   Hành động phá hủy (Xóa User, POI, Tour) bắt buộc Confirmation Dialog.
*   Form validation inline messages dưới input field.
*   API errors: hiển thị toast notification. Lỗi TTS/network không được crash app (BR-029).
*   Image URL 404: graceful fallback (không crash layout).
*   Prevent double-submit: disable nút Save khi đang xử lý async, hiển thị spinner.
*   Form state giữ nguyên khi Admin/Merchant thu nhỏ trình duyệt hoặc chuyển tab.

## 7.4 Usability & Accessibility

*   Form inputs hỗ trợ Tab navigation theo thứ tự logic.
*   Icon hành động có Tooltip giải thích khi hover.
*   Map markers có color-coded với Legend (Bảng chú giải) rõ ràng.
*   Labels liên kết đúng input element bằng id và htmlFor.
*   Biểu đồ analytics có tooltip hoặc text description.
*   Responsive Desktop tối ưu từ 1280px – 1920px, tối thiểu 1280x720px.

## 7.5 Logging & Monitoring

*   Tất cả trigger POI (proximity/qr/manual) phải được log ở backend với: sessionId, poiId, triggerType, timestamp.
*   Lỗi hệ thống (TTS fail, DB error) log với stack trace.
*   GPS tracking log vào GPS\_TRACKS không ghi raw data ra console hay server logs (privacy).

## 7.6 Privacy & Data Retention

*   User consent: dialog xin quyền vị trí với giải thích rõ mục đích trước khi watchPosition.
*   GPS\_TRACKS: lưu tối đa 30 ngày, anonymize sau 30 ngày.
*   AUDIO\_PLAY\_HISTORY: anonymize sau 90 ngày.
*   Right to be forgotten: DELETE /api/users/:id xóa toàn bộ GPS\_TRACKS và AUDIO\_PLAY\_HISTORY liên quan.
*   HTTPS only toàn bộ traffic (Geolocation API yêu cầu HTTPS).

## 7.7 Browser & Platform Support

*   Chrome (latest), Firefox (latest), Safari (latest), Microsoft Edge (latest).
*   Visitor App: web mobile (iOS Safari, Android Chrome) — chú ý iOS autoplay policy cho audio.play().
*   Merchant Portal & Admin Dashboard: web desktop 1280px+.

## 7.8 Reliability

*   Cascade Delete: xóa POI → tự động gỡ khỏi tất cả Tour liên quan ngay lập tức (BR-008).
*   Tour với < 1 POI không thể lưu. Warning khi < 2 POI.
*   Khi xóa POI cuối cùng trong Tour: cảnh báo 'Tour sẽ không có điểm nào, tiếp tục?'
*   Marker clustering khi > 500 POI trên bản đồ (BR-027).

# 8\. Data Requirements

## 8.1 POI Data Model (points\_of\_interest)

**Field**

**Type**

**Required**

**Constraints & Notes**

id

UUID

Yes

PK, auto-generated

merchant\_id

UUID

Yes

FK → merchants.id. NULL nếu là System POI do Admin tạo

name

varchar(200)

Yes

1–200 ký tự

description

text

No

0–1000 ký tự

latitude

decimal(10,7)

Yes

\-90 to 90, 6 số thập phân

longitude

decimal(10,7)

Yes

\-180 to 180, 6 số thập phân

radius\_meters

integer

Yes

10–500 mét. Default: 15

priority

integer

Yes

1–10 (1=thấp nhất, 10=cao nhất). Default: 1

is\_active

boolean

Yes

Default: true. False → không trigger audio

audio\_mode

enum

Yes

'tts' | 'file'. Default: 'tts'

cooldown\_seconds

integer

Yes

≥0. Default: 30 (DB), MVP global: 300s

created\_at

timestamp

Yes

Auto: now()

updated\_at

timestamp

Yes

Auto: now()

## 8.2 POI Audio Data Model (poi\_audio)

**Field**

**Type**

**Required**

**Constraints & Notes**

id

UUID

Yes

PK, auto-generated

poi\_id

UUID

Yes

FK → points\_of\_interest.id

language\_code

varchar(10)

Yes

ISO code. Default: 'vi'. MVP: chỉ 'vi'

tts\_content

text

Cond.

Required nếu audio\_mode = 'tts'

audio\_url

varchar(500)

Cond.

Required nếu audio\_mode = 'file'. URL hợp lệ

file\_size\_bytes

bigint

No

≥0. Quyết định offline vs stream

status

enum

Yes

'active' | 'draft' | 'archived'. Default: 'active'

created\_at

timestamp

Yes

Auto: now()

## 8.3 Tour Data Model (tours)

**Field**

**Type**

**Required**

**Constraints & Notes**

id

UUID

Yes

PK, auto-generated

created\_by

UUID

Yes

FK → users.id (Admin tạo tour)

name

varchar(200)

Yes

1–200 ký tự

description

text

No

0–1000 ký tự

cover\_image\_url

varchar(500)

No

URL hợp lệ HTTPS. MVP: URL placeholder

duration\_minutes

integer

No

0–1440 phút. Có thể auto-calculate

status

enum

Yes

'active' | 'draft' | 'archived'. Default: 'active'

created\_at

timestamp

Yes

Auto: now()

updated\_at

timestamp

Yes

Auto: now()

## 8.4 Tour-POI Junction (tour\_poi)

**Field**

**Type**

**Required**

**Constraints & Notes**

id

UUID

Yes

PK, auto-generated

tour\_id

UUID

Yes

FK → tours.id

poi\_id

UUID

Yes

FK → points\_of\_interest.id

sequence\_order

integer

Yes

0-based index. Thứ tự di chuyển trong tour

is\_mandatory

boolean

Yes

Default: false

(unique)

—

—

UNIQUE(tour\_id, poi\_id) và UNIQUE(tour\_id, sequence\_order)

## 8.5 User & Merchant Data Model

**users — Field**

**Type**

**Required**

**Constraints**

id

UUID

Yes

PK

role\_id

UUID

Yes

FK → roles.id. 'tourist' | 'merchant' | 'admin'

full\_name

varchar(150)

Yes

1–150 ký tự

email

varchar(255)

Yes

Unique, valid email format

password\_hash

varchar(255)

Yes

bcrypt hash, không lưu plain text

phone

varchar(20)

No

Format linh hoạt

is\_active

boolean

Yes

Default: true. False = Banned

created\_at / updated\_at

timestamp

Yes

Auto

**merchants — Field**

**Type**

**Required**

**Constraints**

id

UUID

Yes

PK

user\_id

UUID

Yes

FK → users.id, UNIQUE (1-1 với user)

shop\_name

varchar(200)

Yes

1–200 ký tự

address

text

No

Free text

contact\_email

varchar(255)

No

Valid email format

status

enum

Yes

'active' | 'suspended' | 'pending'. Default: 'active'

created\_at

timestamp

Yes

Auto

## 8.6 Analytics Source Data Models

Các bảng sau là nguồn dữ liệu cho toàn bộ analytics — không cần bảng riêng cho báo cáo.

**Table / Field**

**Type**

**Ghi chú**

**audio\_play\_history**

—

Nguồn analytics chính

session\_id

UUID

FK → user\_sessions.id

poi\_id

UUID

FK → points\_of\_interest.id

triggered\_at

timestamp

Thời điểm trigger

trigger\_type

enum

'gps\_enter' | 'gps\_proximity' | 'qr\_scan' | 'manual'

play\_duration\_seconds

integer

Thời gian thực tế đã nghe (tính từ audio.play() đến pause/ended)

total\_duration\_seconds

integer

Tổng thời lượng audio

completed

boolean

true khi audio.onended fire

stop\_reason

varchar(30)

'completed' | 'moved\_too\_fast' | 'manual' | 'new\_poi'

**gps\_tracks**

—

Nguồn heatmap & route tracking

session\_id

UUID

FK → user\_sessions.id

latitude / longitude

decimal(10,7)

Tọa độ GPS tại thời điểm ghi

accuracy\_meters

decimal(6,2)

Độ chính xác GPS

speed\_mps

decimal(6,3)

Tốc độ di chuyển — detect đi quá nhanh

recorded\_at

timestamp

Thời điểm ghi

# 9\. API Assumptions (Contract Interface)

_Trong MVP: Backend API chưa triển khai đầy đủ, frontend dùng mock data. Các endpoint dưới đây định nghĩa contract giữa frontend và backend. Authentication: JWT Bearer Token. Base URL: /api/v1._

## 9.1 Auth APIs

**Method**

**Endpoint**

**Request**

**Response**

POST

/api/auth/login

{email, password}

{success, data: {token, user: {id,fullName,email,role}}}

POST

/api/auth/register

{fullName, email, password, phone}

{success, data: {id, email}}

POST

/api/auth/logout

(Bearer token)

{success: true, data: {}}

GET

/api/users/me

(Bearer token)

{success, data: {id, fullName, email, role}}

PUT

/api/users/me

{fullName?, phone?}

{success, data: User}

## 9.2 Merchant APIs (Admin only)

**Method**

**Endpoint**

**Request**

**Response**

GET

/api/merchants

query: status?, page?, limit?

{success, data: Merchant\[\]}

POST

/api/merchants

{userId, shopName, address?, contactEmail?}

{success, data: Merchant}

PUT

/api/merchants/:id

{shopName?, address?, contactEmail?}

{success, data: Merchant}

PATCH

/api/merchants/:id/status

{status: 'active'|'suspended'}

{success, data: Merchant}

## 9.3 POI APIs

**Method**

**Endpoint**

**Request**

**Response**

GET

/api/pois

query: merchantId?, isActive?

{success, data: POI\[\]}

GET

/api/pois/:id

—

{success, data: POI}

POST

/api/pois

{merchantId, name, desc?, lat, lng, radius, priority, audioMode}

{success, data: POI}

PUT

/api/pois/:id

{name?, desc?, lat?, lng?, radius?, priority?, isActive?}

{success, data: POI}

DELETE

/api/pois/:id

—

{success: true} + cascade remove from tours

GET

/api/pois/nearby

query: lat, lng, radius

{success, data: \[{poiId, distanceMeters}\]}

## 9.4 POI Audio APIs

**Method**

**Endpoint**

**Request**

**Response**

GET

/api/pois/:id/audio

query: languageCode?

{success, data: {poiId, ttsContent, audioUrl}}

POST

/api/poi-audio

{poiId, languageCode, ttsContent?, audioUrl?}

{success, data: POIAudio}

PUT

/api/poi-audio/:id

{ttsContent?, audioUrl?, status?}

{success, data: POIAudio}

DELETE

/api/poi-audio/:id

—

{success: true} (archive)

## 9.5 Tour APIs

**Method**

**Endpoint**

**Request**

**Response**

GET

/api/tours

query: status?, page?, limit?

{success, data: Tour\[\]}

GET

/api/tours/:id

—

{success, data: Tour + pois: TourPOI\[\]}

POST

/api/tours

{name, description?, coverImageUrl?, durationMinutes?}

{success, data: Tour}

PUT

/api/tours/:id

{name?, description?, coverImageUrl?, status?}

{success, data: Tour}

DELETE

/api/tours/:id

—

{success: true} (archive)

GET

/api/tours/:id/pois

—

{success, data: TourPOI\[\]}

POST

/api/tours/:id/pois

{poiId, sequenceOrder, isMandatory?}

{success, data: TourPOI}

PUT

/api/tours/:id/pois/:tpId

{sequenceOrder?}

{success, data: TourPOI}

DELETE

/api/tours/:id/pois/:tpId

—

{success: true}

## 9.6 Session, GPS & Audio History APIs

**Method**

**Endpoint**

**Request**

**Response**

POST

/api/sessions/start

{tourId?, deviceInfo?, offlineMode, appVersion}

{success, data: UserSession}

POST

/api/sessions/end

{sessionId}

{success: true}

GET

/api/sessions/:id

—

{success, data: UserSession}

POST

/api/gps-tracks

{sessionId, lat, lng, accuracyMeters?, speedMps?}

{success: true}

GET

/api/sessions/:id/gps-tracks

—

{success, data: GPSTrack\[\]}

POST

/api/audio-play

{sessionId, poiId, triggerType, playDurationSeconds, totalDurationSeconds, completed}

{success: true}

GET

/api/sessions/:id/audio-history

—

{success, data: AudioPlayHistory\[\]}

## 9.7 Analytics APIs

**Method**

**Endpoint**

**Query Params**

**Response**

GET

/api/analytics/top-pois

merchantId?, from?, to?, limit?

{success, data: \[{poiId, name, totalPlays, avgDuration}\]}

GET

/api/analytics/poi/:id

from?, to?

{success, data: {totalPlays, avgDuration, completionRate, triggerBreakdown}}

GET

/api/analytics/heatmap

from?, to?

{success, data: \[{lat, lng, density}\]}

GET

/api/analytics/routes

from?, to?, userId?

{success, data: \[{sessionId, tracks: GPSTrack\[\]}\]}

_Tất cả error response format: {success: false, message: 'Error description', code?: 'ERR\_CODE'}. HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error._

# 10\. Dependencies & Risks

## 10.1 Technical Stack

**Component**

**Technology**

**Version**

**Ghi chú**

Frontend Framework

React + TypeScript

19.x / 5.x

Vite 6, monorepo

Styling

TailwindCSS

4.x

Utility-first

Animation

Framer Motion

^12.x

Bottom sheet, QR modal, map markers

Icons

Lucide React

0.383.0

Icon library

HTTP Client

Axios

Latest

API communication

TTS Engine

Google Gemini 2.5 Flash Preview TTS

N/A (Preview)

Cần verify SLA trước production

Gemini SDK

@google/genai

^1.29.0

MVP: client-side; Production: server proxy

Geolocation

Browser Geolocation API

Native

HTTPS required; user permission required

Audio

HTMLAudioElement

Native

iOS autoplay policy cần user gesture

QR Decode

BarcodeDetector / jsQR

Native / lib

MVP: giả lập; Production: BarcodeDetector

Backend

Node.js + Express.js

20+ / 4.21

REST API server, TTS proxy

Auth

JWT

—

Access 1h / Refresh 30d

Validation

Zod / Joi

Latest

Request body validation

ORM

Prisma

Latest

Database access

Logging

Winston / Pino

Latest

System logging

Rate Limiting

Express Rate Limit

Latest

API protection

Database

PostgreSQL / SQLite

14+ / Latest

SQLite dev; PostgreSQL production

Geo Extension

PostGIS

Latest

Planned — spatial index GiST

## 10.2 Risks

**ID**

**Risk**

**Likelihood**

**Impact**

**Mitigation**

R-01

GEMINI\_API\_KEY expose client-side (MVP chủ ý)

Cao (MVP)

Cao

Chuyển server proxy trước production; rate limit 60 req/min

R-02

GPS không chính xác indoor (drift ±20–50m)

Cao

Cao

Tăng radius 25–30m indoor; QR + manual trigger fallback

R-03

iOS autoplay block audio.play()

Cao

Cao

Onboarding 'Nhấn để bắt đầu'; visible Play button; wrap try-catch

R-04

Gemini TTS latency > 8 giây

Trung bình

Trung bình

Spinner bắt buộc; pre-cache audio per POI khi load tour

R-05

Nhiều POI chồng vùng gây spam queue

Trung bình

Trung bình

Priority rule + cooldown; cap queue 10 items

R-06

Bản đồ > 500 POI giảm hiệu năng

Thấp

Trung bình

Marker clustering + lazy loading (BR-027)

R-07

Admin vô tình xóa POI dùng trong nhiều Tour

Trung bình

Cao

Cảnh báo 'POI đang dùng trong X tours. Xóa?' trước confirm

R-08

Nhập sai Lat/Lng → marker sai vị trí

Trung bình

Trung bình

Validate theo geo bounds; preview marker trước khi lưu

R-09

Refresh browser mất dữ liệu chưa lưu

Cao

Cao

Cảnh báo 'Bạn có dữ liệu chưa lưu. Rời trang?'

R-10

GPS tracking vi phạm GDPR/PDPA

Thấp (nếu consent)

Rất cao

Consent dialog; retention 30 ngày; anonymization; Privacy Policy

R-11

Gemini preview model ngừng hoạt động

Thấp

Cao

Monitor Google deprecation; kế hoạch migration stable model

R-12

Database geospatial query chậm khi scale

Thấp

Trung bình

Index PostGIS spatial GiST trên GPS\_TRACKS và POI coordinates

R-13

URL ảnh POI bị lỗi hoặc hết hạn

Thấp

Thấp

Validate URL trước lưu; production dùng S3/Cloudinary

R-14

Network loss khi generate audio

Trung bình

Thấp

Fail gracefully: không phát audio, app vẫn hoạt động (BR-029)

# 11\. Open Questions / Assumptions

**#**

**Câu hỏi / Giả định**

**Trạng thái**

OQ-01

QR payload format: boothId string hay URL deep-link? Ảnh hưởng đến cách generate QR và decode logic.

❓ Cần quyết định

OQ-02

iOS audio unlock: Cần user gesture trước audio.play(). Thêm onboarding screen 'Nhấn để bắt đầu' không?

❓ Cần confirm UX

OQ-03

Indoor venue GPS drift: Radius 15m có đủ không? Khuyến nghị 25–30m indoor. Ai quyết định per-POI radius?

❓ Cần confirm với BTC

OQ-04

cooldown\_seconds: ERD có field per-POI. MVP dùng global 300s. Production có cần per-POI override không?

Assumed: global MVP; per-POI production

OQ-05

audio\_mode 'file' vs 'tts': Khi nào dùng pre-recorded? Ai upload file? Admin panel hay seeder?

❓ Cần xác nhận production scope

OQ-06

Offline mode threshold: audio nhỏ hơn bao nhiêu MB thì cache offline? Ai config?

❓ Cần xác nhận

OQ-07

Map thật vs dot-grid: MVP dùng dot-grid CSS simulation. Production có cần Google Maps/Mapbox không? Budget?

❓ Cần confirm roadmap & budget

OQ-08

Tour vs Free-roam: USER\_SESSIONS có tour\_id nullable. Khi nào user bắt đầu 'tour' vs tham quan tự do? Có màn hình chọn tour không?

❓ Cần clarify UX flow

OQ-09

POI deletion cảnh báo: Nếu xóa POI cuối cùng trong Tour, Tour chỉ còn 0 POI → có tự archive Tour không?

Assumption: cảnh báo user, không tự archive

OQ-10

POI type phân loại: DBML có merchant\_id nhưng không có type enum MAIN/SUB/MERCHANT. Admin PRD có đề cập. Cần đồng thuận schema?

❓ Cần align schema

OQ-11

Merchant tự đăng ký vs Admin tạo: PRD Merchant cho phép đăng ký tự do; PRD Admin nói Admin tạo Merchant. Luồng nào là chuẩn?

❓ Conflict — cần quyết định

OQ-12

Progress bar duration: MVP hardcode 30s animation hay sync với audio.duration thực tế?

❓ Cần confirm UX

OQ-13

Data retention GDPR/PDPA: GPS 30 ngày, analytics 90 ngày là assumptions. Cần legal review cho market cụ thể (VN/EU)?

❓ Cần legal review

OQ-14

Gemini model 'gemini-2.5-flash-preview-tts': preview model chưa có SLA. Cần verify với Google trước production launch.

❓ Cần verify SLA

OQ-15

Manual trigger và cooldown: Click marker POI có bị chặn bởi cooldown không? Hay manual luôn override cooldown?

❓ Cần quyết định UX rule

# 12\. Future Enhancements (Post-MVP)

_Các tính năng sau KHÔNG nằm trong scope MVP. Ghi nhận để phát triển lộ trình tương lai._

## Phase 2 (v1.1 – v1.2)

*   Real map integration: Google Maps / Mapbox overlay thay dot-grid simulation
*   QR decode thật: BarcodeDetector API / jsQR
*   Server-side TTS proxy: che giấu GEMINI\_API\_KEY, cache audio per POI
*   Offline mode: Service Worker + IndexedDB cache audio
*   Tích hợp upload ảnh lên AWS S3 / Cloudinary
*   Multi-language TTS: EN, FR, ... User tự chọn ngôn ngữ
*   Audit logging: theo dõi ai tạo/sửa/xóa dữ liệu
*   Tour status workflow: Draft → Published → Archived
*   Phân quyền nâng cao: Super Admin, Content Editor

## Phase 3 (v2.0)

*   Battery optimizer: adaptive GPS frequency dựa trên accelerometer
*   Pre-cache TTS audio: generate tất cả audio khi user bắt đầu tour → không có latency
*   Merchant multi-staff: tạo tài khoản phụ cho nhân viên quản lý POI
*   Export báo cáo: PDF/Excel cho analytics và interaction history
*   Tìm kiếm nâng cao: lọc POI theo bán kính, loại hình, ngày tạo
*   Thao tác hàng loạt: import/export POI qua CSV/JSON

## Phase 4 (v3.0)

*   AR overlay: hướng camera về gian hàng để xem thông tin nổi
*   Social features: chia sẻ gian hàng, rating, comment sau khi nghe
*   Push notification Geofencing: thông báo POI đặc biệt khi vào khu vực
*   Public API: endpoint read-only cho app bên thứ ba
*   Multi-tenant: nhiều sự kiện / địa điểm trong một deployment
*   Collaborative editing: nhiều Admin cùng chỉnh sửa Tour realtime
*   Thanh toán / Subscription: Merchant trả phí feature POI lên top priority
*   Audio history: danh sách POI đã nghe; replay bất kỳ từ lịch sử

# 13\. Business Rules Summary

**BR ID**

**Rule Name**

**Description**

BR-001

Mandatory Location

POI phải có tọa độ hợp lệ trong phạm vi hệ thống cho phép trước khi lưu.

BR-002

Merchant Ownership

Merchant chỉ CRUD POI có merchant\_id của chính mình (403 nếu vi phạm).

BR-003

Radius Trigger

Audio chỉ trigger khi distance ≤ poi.radius\_meters.

BR-004

POI Activation

POI có is\_active = false không trigger audio và ẩn trên map Visitor.

BR-005

Priority Rule

Khi nhiều POI overlap, POI có priority cao hơn được kích hoạt trước.

BR-006

Cooldown Protection

Sau khi phát audio, POI không trigger lại trong cooldown\_seconds (global: 300s MVP).

BR-007

Audio Queue FIFO

POI trigger khi đang nghe → enqueue FIFO. Cap 10 items production.

BR-008

Cascade POI Removal

Xóa POI → tự động gỡ khỏi tất cả Tour liên quan, không làm hỏng Tour.

BR-009

Tour Minimum POI

Tour cần ≥ 1 POI để lưu. Warning khi < 2 POI.

BR-010

Tour Sequence

sequence\_order quyết định thứ tự tham quan (index 0 = điểm bắt đầu).

BR-011

Audio Mode

audio\_mode = 'tts' → cần tts\_content. audio\_mode = 'file' → cần audio\_url.

BR-012

Account Status

Tài khoản banned/suspended không thể đăng nhập; disconnect ngay nếu online.

BR-013

GPS Permission

Nếu Visitor không cấp quyền GPS, vẫn cho phép QR scan và manual trigger.

BR-014

Image Handling

Image URL phải là HTTPS hợp lệ. Nếu 404, graceful fallback, không crash.

BR-015

Error Resilience

Lỗi TTS/network không crash app. Audio đơn giản không phát.

BR-016

Marker Clustering

Bản đồ > 500 POI markers phải bật marker clustering.

BR-017

Data Retention

GPS\_TRACKS: xóa sau 30 ngày. AUDIO\_PLAY\_HISTORY: anonymize sau 90 ngày.

# Appendix — Revision History & Glossary

## Revision History

**Version**

**Date**

**Author**

**Changes**

1.0

2026-03-13

BA/PO Team

Consolidated PRD từ 4 tài liệu nguồn: PRD\_AutoBooth\_Narrator\_v2.0, PRD\_Admin, PRD\_chủ\_quán, api.docx + DBML schema

## Glossary

**Term**

**Definition**

POI

Point of Interest: Điểm quan tâm có tọa độ và bán kính để kích hoạt thuyết minh tự động.

Tour

Lộ trình gồm chuỗi POI được sắp xếp có thứ tự để khách du lịch tham quan.

Proximity Trigger

Hành động kích hoạt audio khi distance ≤ poi.radius\_meters.

FIFO Queue

First-In-First-Out: hàng đợi audio theo thứ tự trigger.

Cooldown

Khoảng thời gian chờ sau khi audio phát, ngăn trigger lại cùng POI.

TTS

Text-to-Speech: chuyển văn bản thành giọng nói qua Google Gemini API.

Haversine

Công thức tính khoảng cách địa lý giữa hai tọa độ GPS trên mặt cầu.

Cascade Delete

Xóa phân cấp: tự động gỡ các tham chiếu khi thực thể cha bị xóa.

MVP

Minimum Viable Product: phiên bản tối thiểu đủ tính năng cốt lõi để ra mắt.

Dwell Time

Thời gian khách dừng chân / nghe audio tại một điểm POI.

Heatmap

Biểu đồ mật độ gradient màu thể hiện tần suất xuất hiện khách tại khu vực.

Merchant

Chủ gian hàng / đơn vị kinh doanh sở hữu POI trong hệ thống.

Soft Delete

Đánh dấu bản ghi là deleted/archived thay vì xóa vật lý khỏi DB.

**\--- End of Document ---**

Audio Tour Guide System PRD v1.0 | © 2026 BA/PO Team | nguyenthanhnam255bmt@gmail.com