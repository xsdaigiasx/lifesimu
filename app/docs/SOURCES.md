# Nguồn tài nguyên

Ảnh, âm thanh và nội dung kế thừa nguyên byte từ gói v0.11 của dự án Một đời để sống, trước đó lấy từ gói v0.10 trên Drive. Không tạo thêm ảnh hoặc âm thanh trong lần dọn gói này.

- Ảnh: `public/intro/shots/`, `public/assets/room-*.webp`, `public/assets/map-tiles/`. Prompt bản đồ còn trong `art/seamless-map-prompt.json`; master hiện có trong `art/map-source/`.
- Âm thanh: `public/intro/audio/`. Gói đầu vào không có đủ URL gốc và giấy phép riêng cho từng âm thanh; chưa thể xác minh toàn bộ quyền sử dụng. Việc giữ file không bổ sung hay thay đổi giấy phép.
- Font: giữ giấy phép DejaVu tại `public/fonts/LICENSE-DejaVu.txt`.
- React, React DOM, Scheduler: giữ giấy phép MIT tại `public/licenses/`.
- Công cụ phát triển có giấy phép trong gói npm tương ứng; phiên bản khóa trong `package-lock.json`.

Ghi chú lịch sử nguồn: nguồn ban đầu 1536 × 1024. Runtime kế thừa v0.19 hiện dùng master đã upscale 6144 × 4096 và 16 tile; không ghi nhận là chi tiết native 6K/8K. Không thay ảnh trong v0.20. SVG nội thất mới được viết trong dự án; nguồn lịch nghỉ ghi trong src/domain/calendar-2026.json.

V0.24 thêm3ảnh văn phòng và hoạt động, tạo bằng imagegen tích hợp. Gốc1086×1448, WebP quality93 không resize; brief và nguồn tại art/work/README.md. Không đưa các ảnh kiểu nhà bị từ chối vào gói.

V0.28: thêm14 PNG nội thất bằng image_gen tích hợp, tại public/assets/static-scenes/furniture-v2. Prompt set, cách chiếu thảm và giới hạn tại docs/FURNITURE-RENDER.md. Giữ nguyên nền nhà đã chốt.


V0.29: image_gen tích hợp edit rental-approved.webp thành rental-open-front.png theo yêu cầu bỏ tường/cửa phía trước; thay ảnh plant-90.png bằng một chậu. Prompt và cách hiệu chỉnh camera tại docs/FURNITURE-RENDER.md.


V0.30: rental-diamond.png tạo bằng image_gen tích hợp theo yêu cầu cân sàn hình thoi. Prompt và hệ tọa độ tại docs/ROOM-ISOMETRIC-v0.30.md. player-bust.svg là SVG viết bằng mã, không phải ảnh AI.


V0.31: image_gen tích hợp chỉnh riêng laptop trong furniture-v2/desk-0.png để quay về ghế; prompt và mép an toàn tại docs/ROOM-SAFETY-v0.31.md.

