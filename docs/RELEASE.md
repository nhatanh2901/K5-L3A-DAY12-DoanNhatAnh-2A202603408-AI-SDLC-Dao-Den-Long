# Bản chạy Đảo Đèn Lồng v1.0.0

Giải nén `dao-den-long-v1.0.0.zip`. Cần Node.js 24, trình duyệt WebGL 2. Trong thư mục vừa giải nén, chạy:

```sh
node serve.mjs
```

Mở http://127.0.0.1:4173. Bản ZIP đã chứa thư mục web `dist/`; không cần npm install. Không mở index.html bằng file://. Có thể host nguyên nội dung dist trên HTTP server tĩnh.

WASD di chuyển; J nhảy; Shift lướt; E nạp đèn; Space tỏa sáng; P/Esc tạm dừng. Giữ tất cả đèn sáng lúc hết giờ; thắng từng đêm để sang đêm tiếp theo. Tên 3–12 ký tự chữ/số/_. Bảng xếp hạng lưu trên máy, có nút xuất JSON.

`proof/verification.json` và các log đi kèm ghi lại kiểm chứng của source dùng để đóng gói. Video demo ở repo/Release là bản ghi tự động, một đoạn dùng fixture rút ngắn được ghi rõ. Các thông số chưa có ticket gốc để đối chiếu và lịch sử phase thiếu được nêu trong README của repository.

Tạo lại ZIP trên Windows: `powershell -ExecutionPolicy Bypass -File scripts/package.ps1` sau khi `npm run verify -- --demo` đạt. Script chỉ tạo thư mục staging mới và ZIP trong `artifacts/`, không thay tag cũ.
