# Nguyên liệu chợ — Issue #60

Bộ ảnh cho thẻ hàng trong quầy chợ: gạo, trứng, rau củ, thịt heo, đậu phụ và cá tươi.

## Tệp dùng trong game

`app/public/assets/ingredients/<id>.webp`, với id: `rice`, `egg`, `vegetable`, `pork`, `tofu`, `fish`.

- Mỗi ảnh 256×256 px, RGBA, nền trong suốt thật.
- Vật được căn giữa theo vùng alpha; cạnh dài vùng vật khoảng 220 px, chừa ít nhất 18 px quanh khung.
- Mỗi ảnh dưới 40.000 byte; số đo từng ảnh trong `manifest.json`.
- Ảnh là hình minh họa thẻ hàng, không phải đồ đặt trên lưới phòng. Điểm neo là tâm khung; không áp dụng chân đế 128×64 hoặc hai hướng a/b.
- Không có chữ, nhãn hiệu, nền sạp hoặc bóng đổ ra ngoài vật.

Đây là bộ asset độc lập. Theo issue, Claude nối ảnh vào `app/src/components/Market.tsx` sau khi được duyệt. PR này không sửa giao diện hoặc logic game.

## Xem trước và kiểm tra

`previews/ingredients.webp` đặt đủ sáu món trên nền sáng, kèm bản 64 px trên nền xanh đậm để kiểm tra viền alpha và độ rõ khi thu nhỏ. Nhãn chỉ có trên ảnh ghép, không có trong sprite.

Đã giải mã từng WebP, kiểm tra khung 256×256, alpha, lề trong suốt ít nhất 16 px và dung lượng dưới 40.000 byte. Đã xem trực tiếp cả bộ ở kích thước thẻ và 64 px. Không thay đổi TypeScript nên không chạy kiểm thử engine/build.

## Nguồn và xử lý

Tạo bằng công cụ tạo ảnh tích hợp của OpenAI trong phiên Codex ngày 04/11/2026. Mỗi món được tạo riêng, sau đó chỉnh một lượt để giản lược sáng tối và nét, dùng `assets/furniture/bed-basic_a_sage.png` của repo làm tham chiếu phong cách. Nội dung yêu cầu nằm trong `prompts.json`.

Xuất WebP bằng Sharp: căn vùng alpha của vật, thu về cạnh dài 220 px, đặt giữa khung trong suốt 256×256. Năm ảnh nén lossless; `rice.webp` dùng quality 95 và alphaQuality 100 để đạt giới hạn dung lượng. Không đưa ảnh nháp độ phân giải lớn vào repo.

Ảnh là raster do AI tạo, có thể còn sai khác màu rất nhẹ trong các mảng lớn; không coi đây là vector có màu đồng nhất tuyệt đối. Cần duyệt phong cách qua ảnh ghép trước khi tích hợp.
