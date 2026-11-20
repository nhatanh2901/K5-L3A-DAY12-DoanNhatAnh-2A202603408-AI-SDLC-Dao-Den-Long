# Evaluation của bản sửa hiện tại

Đây là đánh giá sau khi sửa lỗi, không phải nhật ký kiểm chứng ở thời điểm từng phase. Xem lệnh, exit code, môi trường, hash và kết quả ở `../proof/verification.json`.

| Nhóm phase | Phần đã kiểm chứng bằng bản hiện tại | Phần chưa xác minh |
|---|---|---|
| 1 | Engine/headless tách renderer; input/JSONL; RNG seed; nhặt/nạp/pulse/sát thương; so hai CLI byte-identical | PRD-0 chính thức, test ẩn và snapshot lịch sử phase-1 |
| 2 | 3 Night; địa hình cầu/tầng dùng chung collision/render; dash, jump, pause; browser đi qua campaign | Ticket-02 chính thức; thông số gió/Bùa Gió/Gió Lạc đang là giả định; chưa có lượt người chơi thắng trọn 3 đêm thật |
| 3 | Hao dầu theo giây; drain; refuel/relight; thắng chỉ tại Bình Minh; regressions | Công thức điểm và thứ tự xử lý chính thức của Ticket-03 |
| 4 | Build; browser kiểm tra; benchmark thật; soak độc lập; bảng xếp hạng, video tự động; cài dependency trong thư mục sạch, test/build/headless; giải nén ZIP và tải HTML/JS/CSS; CI cấu hình | Ngưỡng/chế độ đo Ticket-04; CI trên GitHub chỉ xác nhận bằng lần chạy thật; lịch sử tag và deadline cần đối chiếu |

## Lỗi AI phát hiện và cách chặn

1. Bản trước tạo mảng 16,667 ms cho mọi frame rồi công bố FPS. Đã thay bằng Chromium/WebGL và performance.now; xuất renderer, số frame, thời lượng thực, VSync và giới hạn phép đo.
2. Hao dầu trừ 1 mỗi tick thay vì mỗi giây. Test mới bắt buộc sau 60 tick chỉ giảm 1 dầu; test tắt đèn cũ đổi từ 1 tick sang 60 tick vì đang khẳng định sai đơn vị.
3. Thắng ngay khi tất cả đèn sáng, trái mô tả Bình Minh trong CHANGELOG. Test mới chứng minh chưa thắng trước hạn và chỉ có một event game_over khi hết giờ.
4. UI cũ vẽ enemy không có trong engine, không vẽ đom đóm. Scene mới chỉ dựng từ trạng thái engine; kiểm tra browser và ảnh thật.
5. Soak cũ ghi một số RSS vào cả start/end. Bản mới đo trước vòng lặp, cuối vòng lặp và lấy mẫu đỉnh, ghi riêng outcome lost và crash.
6. Khi sửa video, đã gặp rAF timestamp đầu tiên trước thời điểm khởi tạo, dẫn tới segment -1, và một lần HMR reload trong lúc recording. Đã chặn chỉ số nhỏ hơn 0; lần ghi cuối cần thực hiện sau khi ngừng sửa source.
7. Bước lấy video từ Chromium bị treo dù ghi hình đã chạy đủ thời gian. Chẩn đoán DevTools thấy đang ở giai đoạn encoding; thay việc trả cả video base64 trong một thông điệp bằng các phần 256 KiB. Ghi WebM/VP9 rồi chuyển FFmpeg H.264/MP4; có timeout/log tiến độ và chỉ nhận file sau khi lưu hoàn tất.

Harness mới `scripts/verify.mjs` dừng ở lỗi đầu tiên, giữ log thật; workflow tự động chạy khi push/PR. Các ghi chú không dùng lời “đạt toàn bộ rubric” khi chưa có ticket/test ẩn hoặc lịch sử hợp lệ.
