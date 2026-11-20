# Đặc tả đang có và giả định bổ sung

Ngày sửa: 20/11/2026 (ICT). Nguồn: `game.contract.json`, README/CHANGELOG và ghi chép cũ trong repo. Chưa đọc được PRD-0 và Ticket-02/03/04 đầy đủ trên lab board; các giá trị dưới đây không được xem là trích dẫn ticket.

## Phase 1: lõi và headless

- Logic thuần Node, không phụ thuộc DOM/GPU; tick 1/60 giây. RNG LCG dùng seed trong engine, seed 0 cũng hợp lệ.
- Bán kính đảo Night 1: 40 m, điểm xuất hiện đom đóm trong 34 m. Giữ vị trí 5 đèn từ bản trước.
- Bổ sung để game chơi được: bắt đầu 40 đom đóm, sinh 1 con mỗi 30 tick, tối đa 100 con đang tồn tại. Khi `random_motes:false` thì không sinh thêm. Đom đóm rơi tồn tại 10 giây.
- Motes mới, enemy và gió đều dùng cùng RNG engine. UI không tự thay trạng thái engine.

## Phase 2: ba đêm và vận động

- Night 1/2/3 có 5/6/7 đèn; thời lượng 300/330/360 giây theo contract. Vị trí đèn kế thừa mã cũ.
- Night 2: đảo tâm (0,0) và (70,0), bán kính 30 m; cầu rộng 6 m dài 30 m giữa hai đảo. Night 3: đảo bán kính 43 m; các tầng cao 3 m, 6 m, có bậc trung gian để nhảy.
- Nhảy có vận tốc ban đầu 12 m/s, trọng lực 20 m/s². Ngoài mặt đất và rơi dưới Y=-8: mất 1 lửa, rơi nửa đom đóm, trở về tâm đảo. Lướt dùng tuning trong contract.
- Bóng Mực sinh mỗi 8/7/6 giây tương ứng Night, tối đa 8; sinh cách người chơi 20 m. Tốc độ dùng `shade_speed`; vùng đèn sáng đẩy Bóng Mực vào trạng thái recoil 0,5 giây, trừ khi nó đang nhắm đèn yếu.
- Gió xuất hiện 5 giây cuối mỗi chu kỳ 20 giây ở Night 2/3, đẩy 1 m/s theo hướng có seed. Bùa Gió ở (8,0,0): tác dụng 10 giây, tốc độ ×1,2, chặn gió và trộm, hồi sau 30 giây.
- GiÓ Lạc (drifter) Night 2/3 sinh mỗi 15 giây, tối đa 2, tốc độ 3 m/s; lấy tối đa 2 đom đóm mỗi lần chạm, hồi 3 giây. Pulse cũng tác động lên drifter. Đây là triển khai giả định, cần đối chiếu Ticket-02.
- Pause là thao tác toggle; không tăng sim_tick/thời gian/dầu khi pause. Move/yaw headless giữ trạng thái; các thao tác còn lại chỉ tại tick input được chỉ định.

## Phase 3: nhiên liệu và Bình Minh

- Theo contract: dầu tối đa 100, hao 1/giây, thêm 10 mỗi đom đóm; dưới 30 là yếu; Bóng Mực drain trong bán kính 6 m hút thêm 5/giây. Mỗi tick nhân tốc độ với 1/60; không làm tròn dầu nội bộ.
- Giữ luật cũ ghi trong mã: thắp lần đầu 10 đom đóm, thắp lại sau khi tắt 5; tắt thì deposited=0, ever_lit được giữ.
- Thắng duy nhất ở Bình Minh khi mọi đèn còn dầu; hết lửa luôn thua. Scenario.time_left_s là thời gian còn lại thật.
- Điểm giả định: nạp/châm mỗi đom đóm +5; stun +5, shade đang drain +15; lúc thắng cộng floor(tổng 100 × dầu/100 của từng đèn) +50 mỗi lửa. Không cộng điểm chỉ nhặt đom đóm. `score.per_second_left` là trường kế thừa, không áp dụng cho luật thắng Bình Minh. Công thức này cần đối chiếu Ticket-03 trước khi nhận đạt test ẩn.

## Phase 4: đo và bàn giao

- Benchmark dùng scene/renderer chung với UI, 1280×720, pixel ratio 1, camera quay, người chơi đứng yên; đo khoảng thời gian rAF bằng đồng hồ thật trong 30 giây sau warmup 2 giây. Có gl.finish, giữ VSync (`vsync_off:false`). Đây là phép đo local, chưa đối chiếu chế độ/chuẩn máy chấm Ticket-04.
- `peak_mem_mb:null` trên benchmark vì chưa có đo RSS riêng browser đáng tin cậy. Soak Node ghi RSS đầu/cuối/đỉnh độc lập, không thay bằng số browser.
- Demo tự động có fixture rút ngắn ghi nhãn và phần bằng chứng từ file output. Không phải video người học chơi trực tiếp.
- Không dựng lại lịch sử phase hay số liệu token quá khứ. Release hiện tại và các kiểm chứng hiện tại không thay thế các mốc nộp cũ.
