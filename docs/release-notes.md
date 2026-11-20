# Đảo Đèn Lồng v1.0.0

Bản sửa sau kiểm tra: dầu hao theo giây, thắng tại Bình Minh, UI lấy thực thể từ engine, campaign 3 Đêm, pause/dash/jump/fall, bảng xếp hạng local và các cơ chế được ghi rõ trong giả định.

- Chạy ZIP: giải nén, cài Node.js 24, chạy `node serve.mjs`, mở http://127.0.0.1:4173. Không cần npm install.
- `demo.mp4` là video tự động có cảnh chơi, scenario rút ngắn có nhãn và bảng bằng chứng đọc từ output thật.
- `docs/proof/verification.json` trong source và `proof/` trong ZIP chứa kết quả test/build/headless/scenario/soak/browser/benchmark và hash source.
- Benchmark là đo WebGL thật 1280×720 trong Chromium, giữ VSync. Ngưỡng/máy chấm Ticket-04 chưa được đối chiếu.
- Bốn tag phase cũ cùng trỏ `9af5b5e` và được giữ nguyên. Release mới không phục hồi lịch sử từng phase, mốc thời hạn hay usage AI còn thiếu. Ticket đầy đủ chưa có trong repo; xem `docs/notes/assumptions.md`.
