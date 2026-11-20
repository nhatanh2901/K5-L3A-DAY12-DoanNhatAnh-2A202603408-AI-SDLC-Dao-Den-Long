# Bằng chứng kiểm chứng hiện tại

Tạo lại: `npm run verify -- --demo`. Mọi log/JSONL/JSON/video ở đây được tạo từ chương trình thật. `verification.json` ghi lệnh, mã thoát, môi trường và SHA-256 source. Thời gian, FPS và RSS có thể thay đổi theo máy; so sánh byte chỉ áp dụng headless cùng seed/input/source.

| Yêu cầu/hành vi | Cách kiểm chứng | Bằng chứng | Phạm vi |
|---|---|---|---|
| Tuning khớp khai báo | Engine nhập contract; test contract | `tests.log`, `game.contract.json` | Contract đang có trong repo, chưa đối chiếu bản ticket chính thức |
| Deterministic | Hai CLI headless cùng seed so sánh byte; spawn từng Night | `tests.log` | Cùng Node/input/source |
| CLI JSONL và mã lỗi 2 | Test args sai, JSON sai, scenario Bình Minh | `tests.log`, `headless.jsonl` | Có 600 tick seed 42 Night 1 |
| Thắng lúc Bình Minh, không thắng sớm | Unit và scenario 1 giây | `dawn-win.jsonl`, `dawn-win.log` | Scenario chủ động đặt mọi đèn sáng |
| Dầu hao 1/s, hút thêm 5/s | So sánh sau 60 tick | `tests.log` | Gồm refuel, tắt và thắp lại |
| Châm dầu dùng đúng số đom đóm | CLI với fixture 50 dầu, mang 5 | `refuel.jsonl`, `refuel.log` | 1 input interact tại tick 0 |
| Di chuyển, lướt, pause, pulse, rơi, sát thương | Unit regression | `tests.log` | Gồm cooldown, push, hồi stun và invulnerability |
| UI, điều khiển, chuyển Night 1–3, thắng/thua/restart | Tương tác DOM và phím trong Chromium thật | `browser.json`, `browser.log`, `gameplay.png` | Bình Minh được rút ngắn bằng fixture ghi rõ; chưa chứng minh chơi thắng 3 đêm thời gian thực |
| Bảng xếp hạng | Unit sort/validation; UI lưu localStorage; CLI export nguồn thật | `tests.log`, `browser.json` | Dữ liệu local của trình duyệt, không phải dịch vụ online |
| Ổn định 10 đêm cùng process | Chạy engine tự động, có di chuyển và thao tác | `soak.json`, `soak.log` | Thua game là outcome hợp lệ; crash được tính riêng; RSS đo đầu/cuối/đỉnh độc lập |
| Hiệu năng renderer | 30 giây thật sau warmup 2 giây, 1280×720 | `bench.json`, `bench.log` | Shared Three.js scene; giữ VSync; không gồm toàn bộ DOM HUD; không có ngưỡng ticket để kết luận đạt |
| Build web | Vite production | `build.log`, `dist/` khi build | Bản chạy cần HTTP server |
| Cài sạch không dùng node_modules cũ | Copy source sang thư mục riêng, npm ci, 24 test, build, headless | `clean-install.log`, `clean-tests.log`, `clean-build.log`, `clean-check.json` | Headless byte-identical; build sạch chạy lại ngoài sandbox sau lỗi quyền đọc thư mục cha, lưu riêng log lỗi môi trường |
| Gói ZIP chạy độc lập | Giải nén ZIP, chạy Node server, tải HTML và toàn bộ JS/CSS | `package-smoke.json` | Không npm install trong thư mục giải nén |
| Video có gameplay và bằng chứng | MediaRecorder canvas thật, đọc test/bench/soak đã chạy | `../demo/demo.mp4`, `../demo/recording.json` | Tự động, có fixture ghi nhãn; không nhận là người chơi trực tiếp |

Các file này chứng minh **bản sửa hiện tại**, không chứng minh các tag phase cũ. `phase-1`…`phase-4` đều trỏ `9af5b5e`; không sửa các tag để làm bằng chứng khớp giả tạo. Kết quả CI chỉ có sau khi workflow chạy trên GitHub. Điều kiện test ẩn, deadline và phát hành từng phase cần người học/Coach xác nhận.
