# CHANGELOG

## Sửa chữa và kiểm chứng ngày 20/11/2026

- Sửa hao dầu theo 1/60 giây, countdown scenario và thắng lúc Bình Minh; sửa điểm nhặt/nạp, drain bonus và hồi stun; đọc tuning từ contract.
- Bổ sung spawn có seed, dash/jump/fall/pause, gió/Bùa Gió/Gió Lạc theo giả định công khai; scene và collision dùng cùng mặt đất.
- UI có đom đóm, enemy engine, dầu, campaign 3 Night, thắng/thua/restart, bảng xếp hạng local/export, giảm chuyển động và âm thanh lập trình.
- Thay benchmark tạo FPS cố định bằng Chromium/WebGL timing thật; sửa RSS soak, thêm regression/CLI/browser checks, scenario, verify gate và CI.
- Bổ sung demo tự động có bằng chứng, script đóng gói web tĩnh và ghi chú rõ phần thiếu ticket/lịch sử/usage AI.
- Giữ nguyên bốn tag phase cũ. Nội dung v1.0.0 cũ bên dưới là mô tả từng ghi trong repo, không phải bằng chứng tất cả tính năng đã hoạt động ở tag cũ.

## v1.0.0

- Tích hợp Three.js, chế độ chơi 3D và HUD.
- Chuỗi 3 Đêm, bản đồ Night 1–3 và Test Contract v1.1–v1.3.
- Đèn có nhiên liệu, hao dầu và hút dầu; luật thắng theo Bình Minh.
- Thêm headless, benchmark, soak test, xác suất random theo seed.
- Thêm bảng xếp hạng local, export và tùy chọn accessibility.

## Phase 3 — Breaking changes

- Đèn đã sáng không còn đóng kín: có thể châm thêm nhiên liệu.
- Luật thắng thay từ "đã thắp hết đèn" sang mọi đèn còn sáng cùng lúc Bình Minh.
- Công thức điểm thay sang điểm nạp đom đóm và điểm Bình Minh theo nhiên liệu.

## Phase 2

- Chuẩn hóa số liệu, thêm Night 2/3, Gió Lạc, Bùa Gió, pause và HUD.

## Phase 1

- Tạo Đêm 1, đom đóm, đèn, Bóng Mực, pulse, win/loss và headless contract v1.0.
