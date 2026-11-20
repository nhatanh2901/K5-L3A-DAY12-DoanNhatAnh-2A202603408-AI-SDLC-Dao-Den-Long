# Bằng chứng kiểm chứng

| Yêu cầu | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|
| Contract v1.3 | Test unit đọc tuning | `npm test` | Đạt |
| Tất định | Chạy hai headless cùng seed | Test determinism | Đạt |
| Headless JSONL | Chạy 600 tick seed 42 | `headless.jsonl` | Đạt |
| Soak 10 Đêm | Chạy cùng process seed 7 | `soak.json` | Đạt 0 crash |
| Benchmark 30 giây | Chạy mode benchmark 1280×720 chuẩn | `bench.json` | Đạt định dạng |
| Build web | Vite production build | `npm run build` | Đạt |

Lưu ý benchmark local là cấu hình Node/CI chưa phải máy giảng viên. Ngưỡng cuối được đo trên máy chấm chung.
