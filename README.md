# Đảo Đèn Lồng

[Video demo MP4 tự động, dưới 1 phút](docs/demo/demo.mp4) · [Bằng chứng chạy thật](docs/proof/README.md) · [Hướng dẫn bản phát hành](docs/RELEASE.md)

Game 3D Three.js/Vite: Mây gom đom đóm, thắp và châm dầu Đèn Lồng, né Bóng Mực, giữ tất cả đèn sáng **đúng lúc Bình Minh** qua 3 Đêm. Video có cảnh chơi theo script, một scenario rút ngắn được ghi nhãn, và bảng kết quả đọc từ các lệnh kiểm chứng thật.

## Cài đặt và chạy

Cần Node.js 24 và trình duyệt hỗ trợ WebGL 2. Trong thư mục clone sạch:

```sh
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị. Để chạy bản production: `npm run build`, sau đó `npm run serve` (http://127.0.0.1:4173). Thư mục `dist/` có thể đặt trên web host tĩnh. Bản ZIP phát hành chạy bằng Node, không cần cài dependency; xem [hướng dẫn](docs/RELEASE.md).

## Cách chơi

| Phím | Thao tác |
|---|---|
| WASD | Di chuyển theo trục đảo |
| J | Nhảy, dùng để lên các tầng đá |
| Shift | Lướt 0,2 giây; hồi 1,5 giây |
| E | Thắp/châm dầu đèn gần nhất trong bán kính 2 m |
| Space | Tỏa sáng, tốn 3 đom đóm; đẩy và làm choáng kẻ địch |
| P / Esc | Tạm dừng/tiếp tục |

Sức chứa 10 đom đóm. Đèn thắp lần đầu cần 10, thắp lại cần 5. Đèn có tối đa 100 dầu, hao 1/giây; mỗi đom đóm châm thêm 10. Bóng Mực có thể hút dầu ở đèn yếu. Mất hết 3 ngọn lửa sẽ thua; rơi khỏi đảo cũng mất lửa. Đêm 2 có hai đảo nối bằng cầu, gió và Bùa Gió; Đêm 3 có tầng đá. Thắng một đêm rồi nhấn nút sang đêm tiếp theo. Kết quả lưu trên trình duyệt; có nút xuất bảng xếp hạng JSON. Có tùy chọn giảm chuyển động và tắt âm thanh.

## Kiểm chứng bằng một lệnh

```sh
npm run verify
```

Lệnh chạy test, build, headless/scenario, soak 10 đêm, kiểm tra UI thật bằng Chrome/Edge và đo WebGL 30 giây. Dừng ngay khi có lỗi; lưu log, output và SHA-256 mã nguồn ở `docs/proof/`. Cần Chrome/Edge/Chromium; nếu không tìm thấy, đặt biến môi trường `BROWSER_PATH` bằng đường dẫn trình duyệt. Có CI chạy lại khi push/PR; trạng thái CI chỉ được xác nhận sau lần chạy trên GitHub.

Để **ghi lại** demo MP4 bằng `--demo`, cần FFmpeg có trong PATH hoặc biến `FFMPEG_PATH` trỏ đến file thực thi (Windows cũng tự tìm `artifacts/tools/ffmpeg.exe`). Trình duyệt ghi WebM thật, FFmpeg chuyển sang H.264/MP4. Xem video có sẵn không cần FFmpeg.

```sh
npm test
npm run headless -- --seed 42 --night 1 --ticks 600 --out out.jsonl
npm run bench -- --seed 42 --duration 30 --out bench.json
npm run soak -- --seed 7 --nights 10 --out soak.json
npm run verify -- --demo
```

Máy không có trình duyệt có thể dùng `npm run verify -- --skip-browser`; cách này **chỉ** chứng minh phần core/build, không chứng minh UI hay FPS. Benchmark lấy khoảng cách thời gian rAF từ renderer thật 1280×720, camera quay, giữ VSync của trình duyệt (`vsync_off:false`). Không tự nhận đạt ngưỡng hiệu năng của ticket chưa được đối chiếu.

## Test Contract

`game.contract.json` giữ phiên bản 1.3 và các lệnh package. Engine nhập trực tiếp tuning từ file này, chạy cố định 60 tick/giây, không dùng ngẫu nhiên không seed. UI chỉ gửi input và hiển thị trạng thái engine.

Headless nhận `--seed`, `--night`, `--ticks`, `--scenario`, `--inputs`, `--snapshot-every`, `--out`. JSONL gồm `snapshot`, `event`, `end`. Input có dạng `{"frames":[{"tick":0,"move":[1,0]},{"tick":20,"interact":true}]}`: tick đầu vào bắt đầu từ 0; move/yaw được giữ đến thay đổi tiếp theo; jump/dash/pulse/interact/pause chỉ phát ở tick được chỉ định. `--ticks` là số tick đầu vào, tick mô phỏng không tăng trong khi pause. Lỗi tham số/JSON/scenario trả mã 2.

```sh
npm run headless -- --seed 42 --ticks 60 --scenario scenarios/dawn-win.json --out dawn.jsonl
npm run headless -- --seed 42 --ticks 60 --scenario scenarios/refuel.json --inputs scenarios/refuel-inputs.json --out refuel.jsonl
npm run headless -- --leaderboard leaderboard.json --export-leaderboard exported.json
```

## Sáng tạo của tôi

Mây đội mũ đỏ và mang đèn cá nhân; sương xanh tím, đom đóm vàng và màu đèn đổi theo mức dầu. Các hình khối và âm thanh được sinh bằng mã, không tải asset ngoài. Đây là phần hiển thị, không thêm thực thể vào headless. Xem [ảnh gameplay thật](docs/proof/gameplay.png) và video ở đầu trang.

## Trạng thái và giới hạn bàn giao

Phần sửa chữa hiện tại có kiểm chứng tái lập. PRD-0 và Ticket-02/03/04 chưa có bản đầy đủ trong repo; [lab board](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW) không truy cập được qua công cụ trong phiên sửa này. Những lựa chọn bổ sung được ghi là giả định tại [assumptions](docs/notes/assumptions.md), chưa khẳng định vượt toàn bộ test ẩn.

Bốn tag phase cũ cùng trỏ commit `9af5b5e`. Chúng được giữ nguyên; bản sửa hiện tại không tạo lại được lịch sử hoặc bằng chứng từng phase trong quá khứ. Cần người học đối chiếu ticket, mốc giờ và nộp link LMS theo thông báo của Coach.

## Tài liệu

- [Bằng chứng và phạm vi kiểm chứng](docs/proof/README.md)
- [Evaluation](docs/notes/evaluation.md), [nhật ký AI](docs/notes/ai-log.md), [retro](docs/notes/retro.md)
- [CHANGELOG](CHANGELOG.md), [CREDITS](CREDITS.md), [LICENSE](LICENSE), [AGENTS](AGENTS.md)
- [CHECKPOINTS](CHECKPOINTS.md), [SUBMISSION](SUBMISSION.md), [RULES](RULES.md), [RUBRIC](RUBRIC.md)
