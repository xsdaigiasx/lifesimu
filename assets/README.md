# Lô 1 — phòng trọ tách lớp (#3)

19 PNG độc lập, kèm SVG gốc, hai manifest và bản ghép. Đây là asset để review/tích hợp; không thay nền đang dùng trong app.

## Nguồn

Codex tự vẽ bằng vector từ các mặt phẳng/tọa độ isometric. PNG raster hóa từ SVG bằng sharp. Không dùng stock, font, thương hiệu hoặc nhân vật của bên thứ ba. Các bản thử ImageGen không dùng trong bộ nộp này. Màu và không khí tham chiếu ảnh phòng v0.35 `app/public/assets/static-scenes/rental-diamond.png`; manifest ghi 8 mã màu cùng tọa độ pixel lấy mẫu.

## Tọa độ

- Một ô: 128×64 px, 1z: 32 px. Trục x xuống-phải, y xuống-trái, z lên trên.
- `footprint_tiles` đã xoay theo ảnh, `a` nhìn xuống-trái, `b` nhìn xuống-phải.
- `anchor_px`: đỉnh dưới thực của chân đế. Đã được chủ dự án chốt giữ khung và ghi neo thực trong trao đổi ngày 03/11/2026. Chân đế chữ nhật có neo lệch tâm: giường a `[128,288]`, b `[192,288]`.
- `mount_origin_px`: góc sau của chân đế ở z=0 trong ảnh. Đặt ảnh bằng `screen(worldOrigin) - mount_origin_px`, hoặc bằng `screen(worldOrigin + footprint) - anchor_px`.
- Cửa/cửa sổ là mặt phẳng tường có chiều sâu 0. Cửa chính và cửa sổ gắn tường x=0; cửa tắm gắn vách y=3. Trạng thái mở/đóng dùng cùng khung và neo.
- Vỏ phòng 1152×896: gốc sàn `[576,384]`; phòng tắm x∈[5,8], y∈[0,3]. Phần trống phía trên dành cho tường 9z. Bếp, bồn rửa và thiết bị tắm là phần cố định; không chứa đồ di chuyển.

## Xem và tái tạo

- `previews/room-furnished.png`: ghép các loại đồ và cửa/cửa sổ trên sàn 8×8; `placements.json` chứa vị trí, `room-furnished.svg` là bản ghép sửa được.
- `previews/room-mobile-380.png`: cùng bố cục ở rộng 380 px.
- `previews/contact-sheet.png`: đủ 19 PNG, cả hai hướng, màu và trạng thái cửa trên nền caro.
- Cần Node và sharp. Cài sharp ngoài thư mục source nếu không muốn thay dependencies của game. Đặt biến `SHARP_MODULE` bằng đường dẫn tới module sharp, rồi chạy `node assets/source/build-room.cjs`, `node assets/source/preview-room.cjs`, `node assets/source/verify-room.cjs` từ gốc repo.

## Chỗ cần review

- Cửa chính rộng 2 ô/cao 8z cần 128×320 theo công thức trong AGENTS, trong khi issue ghi 128×288. Chủ dự án đã chốt cao 8z/khung 128×320 trong trao đổi ngày 03/11/2026; cả hai trạng thái dùng kích thước này.
- Điểm neo thực của đồ chữ nhật là ngoại lệ đã được chủ dự án chấp thuận; bên tích hợp cần đọc manifest, không mặc định giữa mép dưới.
- Chiều cao ghi trong manifest là giới hạn khung cho mỗi loại. Một số phần rỗng phía trên được giữ trong suốt; đồ nhỏ không kéo giãn để lấp khung.
- Màu sage được lấy từ vùng tủ/gạch xanh olive trong ảnh gốc. Cần chủ dự án duyệt cảm giác màu và bố cục minh họa. Viền 1.4 px ở ảnh gốc có thể rất mảnh khi xem cả phòng ở 380 px.
- Bộ này chỉ cung cấp asset và ảnh ghép; chưa nối vào renderer/va chạm hoặc thử tương tác trong game vì issue không giao phần đó.
