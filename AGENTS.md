# AGENTS

- Game: Node.js ES modules + Vite + Three.js. Logic game nằm trong `src/game-core.js`; UI chỉ gọi engine.
- Build: `npm install`, `npm run build`.
- Test: `npm test`; headless: `npm run headless -- --seed 42 --night 1 --ticks 600 --out out.jsonl`.
- Contract: giữ `game.contract.json` khớp tuning và các lệnh trong package.
- Trước khi kết thúc: chạy `npm test`, `npm run build`, ít nhất một lần headless.
- Không thay output headless bằng tay; bằng chứng phải tạo từ lệnh thực.
- Giữ deterministic: mọi sinh ngẫu nhiên dùng seed trong engine, không dùng random không seed.
