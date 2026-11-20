# Retro

## Kết quả kỹ thuật hiện tại

Có engine deterministic, UI 3 Night, kiểm thử unit/CLI và browser, scenario JSONL, soak 10 đêm, benchmark Chromium thật và video tự động có nhãn fixture. Số đo và số test chính xác được lấy từ `../proof/` thay vì sao chép số có thể lỗi thời vào ghi chú.

## Bài học

- Test xanh không chứng minh đúng yêu cầu nếu test cũng khẳng định đơn vị sai. Test cũ từng mong 1 dầu hết sau 1 tick; cần tính theo 60 tick/giây.
- Đo hiệu năng phải gắn renderer, đồng hồ, thời lượng và môi trường thật. Mảng FPS cố định và hai trường bộ nhớ cùng lấy từ một lần đo không phải bằng chứng.
- Thực thể nhìn thấy phải tồn tại trong engine; scene dùng chung dữ liệu và collision giúp tránh “kẻ địch trang trí”.
- Commit/tag cuối cùng không chứng minh đã làm SDLC qua 4 phase. Không đổi tag cũ hoặc tạo log token để dựng lại lịch sử.
- Thiếu ticket chính thức thì ghi giả định và chỗ chưa xác minh, không coi code cũ là nguồn yêu cầu chắc chắn.
- Dừng sửa source trong lúc ghi video để tránh Vite HMR làm đứt phiên recording.

## Nếu làm lại

Lưu ticket và tiêu chí nghiệm thu ngay khi nhận; viết scenario trước code; commit/tag thật sau từng phase; bật verify/CI từ đầu; lưu usage AI thực mỗi phase; quay một lượt người học chơi thật kèm terminal kiểm chứng. Bản sửa này cải thiện sản phẩm và tính trung thực của bằng chứng nhưng không phục hồi được các mốc lịch sử thiếu.
