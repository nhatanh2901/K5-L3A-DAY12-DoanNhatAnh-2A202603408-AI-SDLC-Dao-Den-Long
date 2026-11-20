# AGENTS

- Game: Node.js ES modules + Vite + Three.js. Logic game nằm trong `src/game-core.js`; UI chỉ gọi engine.
- Build: `npm install`, `npm run build`.
- Test: `npm test`; headless: `npm run headless -- --seed 42 --night 1 --ticks 600 --out out.jsonl`.
- Contract: giữ `game.contract.json` khớp tuning và các lệnh trong package.
- Trước khi kết thúc: chạy `npm test`, `npm run build`, ít nhất một lần headless.
- Không thay output headless bằng tay; bằng chứng phải tạo từ lệnh thực.
- Giữ deterministic: mọi sinh ngẫu nhiên dùng seed trong engine, không dùng random không seed.
- Cổng bàn giao: `npm run verify` dừng ngay nếu test/build/scenario/browser/bench/soak lỗi; có thể thêm `-- --demo` để ghi video. `--skip-browser` chỉ kiểm tra core, không chứng minh WebGL.
- Benchmark phải lấy thời gian khung hình thật từ Chromium; không điền FPS hoặc bộ nhớ giả. Kiểm tra `docs/proof/verification.json` và SHA-256 của source trước bàn giao.
- Thiếu đặc tả ticket hoặc số liệu token quá khứ: ghi chưa xác minh, không suy đoán thành yêu cầu chính thức; không di chuyển tag cũ để dựng lại lịch sử phase.
