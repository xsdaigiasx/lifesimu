# #189 — lô 6: nhà phố và biệt thự có chi tiết vật liệu

4 ảnh runtime trong `app/public/assets/houses/`: townhouse-t1, townhouse-t2, villa-t1, villa-t2. Tạo/sửa bằng imagegen tích hợp, không dùng ảnh ngoài. Ảnh chuẩn duy nhất là `assets/style-reference/room-reference.webp`; vỏ trọ hiện hành dùng để so độ hoàn thiện. Prompt gốc ở prompts.json, các lượt sửa đúng vật liệu phòng ở material-fixes.json.

Sàn gỗ có vân và mối ghép theo từng phòng; phòng tắm lát gạch, sân vườn có cỏ và lối lát đá. Vách giữ chiều cao cũ nhưng có mặt nắp, chân tường, cạnh vát và tô khối rõ; cầu thang rõ bậc/riser. Không thêm đồ vào vỏ.

## Bất biến

- Giữ tên, khung 1984×1168 / 1984×1168 / 3904×2128 / 2752×1552.
- Giữ alpha gốc chính xác sau giải mã, kiểm SHA-256 từng kênh alpha.
- Giữ ox/oy, kích thước/vị trí phòng, cửa, cầu thang; hash house-floors.json và furniture-sprites.json không đổi.
- Không sửa TypeScript, save, core, bản đồ hay sprite đồ đạc.

baseline.json và baseline/*.webp là bản gốc từ main 1316f0f, để verifier/ảnh đối chiếu không cần Git lịch sử. manifest.json có frame, neo, chân đế, dữ liệu hình học, chất lượng nén, hash đầu ra/nguồn và bbox căn ảnh.

## Xuất và kiểm

export.cjs chỉ căn raster về bbox gốc, giữ alpha, khử RGB bẩn ở viền thiếu coverage rồi nén WebP; không tạo hình thay imagegen. alpha-registration.cjs chỉ điền màu RGB lân cận của ảnh sinh ở viền yếu, không đổi alpha.

review.cjs tạo contact-sheet.webp, geometry-preview.webp (trước/sau với lưới và đỉnh vách cố định), furniture-preview.webp và placed-*.webp. Nội thất lô 1 dùng ảnh/khung/neo runtime, bố cục ghi trong preview-placements.json.

verify.cjs kiểm đủ bốn ID, khung, hash, alpha chính xác, từng ảnh dưới 150.000 byte, dữ liệu hình học không đổi và đồ mẫu nằm trong phòng, không chồng chân đế. Chỉ cần Node + sharp, không cần commit baseline.

in-game-review.cjs dùng Playwright Edge với hai context riêng và save QA sở hữu nhà tổng hợp, không đọc hoặc sửa save người chơi. Mở nhà phố/biệt thự trong app thật và chụp cả hai tầng ở 390×844; kiểm không lỗi trang và không tràn ngang. Bốn ảnh in-game-*-390x844.png và in-game-validation.json là bằng chứng.

## Kết quả

4 tệp tổng 549.472 B, lớn nhất 146.308 B. Tất cả đạt verifier. WebP dùng alphaQuality100; villa-t1 có khung lớn 3904×2128 nên nén RGB quality35 để giữ giới hạn 150 KB, chi tiết nén được ghi rõ trong manifest.

Đã xem đủ bốn tầng trên ảnh tổng, ảnh đặt đồ và đối chiếu lưới; đã chụp trong game thật. Kết quả test/build cuối ghi validation.json. Master sinh ở generated_images của Codex; sources.local.json là ánh xạ máy này và được gitignore.
