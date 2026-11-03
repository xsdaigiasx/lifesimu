# Kiểm chứng tải bản đồ và zoom — 29/10/2026

- npm test:6 nhóm đạt, gồm map-interaction mới kiểm handler thực của CityMap.
- npm run build: TypeScript strict và Vite đạt.
- npm run deploy:check: Wrangler dry-run đạt, không triển khai.
- Tải ảnh, decode, draw được tách điều kiện: cache ready đơn thuần không đủ. Canvas không mở được, draw lỗi hoặc viewport0×0 không mở cổng.
- Pinch giữ tọa độ giữa hai ngón; clamp mức zoom; thả một ngón tiếp tục pan không nhảy; cancel dừng kéo; kéo/chụm không chọn nhầm địa điểm.
- Browser QA: mở save thấy màn chờ với số ô, sau đó bản đồ có ảnh; từ phòng xem lại intro không kẹt tải; start→skip→entry có màn chuẩn bị; kéo camera đổi scrollLeft từ0 sang240.
- Chưa kiểm hai ngón trên Android vật lý hoặc mạng chậm thực tế. Mất decode, retry, kích thước ảnh sai được kiểm bằng ảnh giả lập ở test bộ tải.
- Ảnh nguồn1536×1024 và16 tile384×256 vẫn là bản dự phòng; không upscale, không đạt native4K.
