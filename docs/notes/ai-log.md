# Nhật ký dùng AI

## Dữ liệu lịch sử

Repo ban đầu chỉ có một commit sản phẩm `9af5b5e`, cả bốn tag phase trỏ vào đó. Ghi chú cũ nêu tổng 150k–250k token nhưng không có log usage hỗ trợ. Ước tính đó **chưa xác minh**, không được chia thành số từng phase để giả làm nhật ký.

| Phase | Token/chi phí có thể xác minh | Prompt/kết quả lịch sử |
|---|---|---|
| 1 | Chưa có dữ liệu | Chưa có log gốc |
| 2 | Chưa có dữ liệu | Chưa có log gốc |
| 3 | Chưa có dữ liệu | Chưa có log gốc |
| 4 | Chưa có dữ liệu | Chưa có log gốc |

Người học cần bổ sung số thật từ dashboard của công cụ AI nếu còn truy xuất được. Không tạo số ước lượng để lấp chỗ trống.

## Phiên sửa ngày 20/11/2026

- Công cụ: OpenAI Codex, làm trực tiếp trong repo; không dùng subagent; không lấy source của người học khác.
- Yêu cầu người học: “bài lab của tôi đã hoàn thành chưa”, tiếp theo “hoàn thành giúp tôi”.
- Kế hoạch thực hiện: đối chiếu contract/README/rubric; chạy test/build/headless; sửa lỗi được tái hiện; thêm regression và scenario; dựng UI từ engine; thay phép đo giả; ghi video và chuẩn bị bàn giao.
- Các lỗi và điều chỉnh harness được ghi tại `evaluation.md`. Mã nguồn, test và output CLI tạo từ lệnh thực; hash nằm trong proof.
- Token/chi phí phiên này: không có số usage do ứng dụng cung cấp trong workspace. Chưa xác minh; không nhận tổng ước lượng cũ là số đo mới.
- Tiết kiệm: dùng contract làm nguồn tuning; đọc/search theo nhóm; chạy các scenario ngắn để phát hiện lỗi trước UI; tái dùng renderer game cho benchmark/demo; không cài thêm framework hoặc dependency browser.
- Điều còn cần người học: đối chiếu ticket chính thức; xem và giải thích mã; xác nhận quyền nộp sau thời hạn; nộp link LMS. Không thể bổ sung lại tiến trình phase đã qua bằng commit mới.
