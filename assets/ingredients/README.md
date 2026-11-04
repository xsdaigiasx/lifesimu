# Nguyên liệu chợ — phong cách sách truyện (#89, lô 1)

Sáu sprite tại `app/public/assets/ingredients/`: `rice.webp`, `egg.webp`, `vegetable.webp`, `pork.webp`, `tofu.webp`, `fish.webp`.

Bộ này thay ảnh #60 theo yêu cầu lô 1 của issue #89, giữ nguyên ID và đường dẫn. Ảnh #60 cũ còn trong lịch sử Git. Các ảnh mới dùng nét nâu mảnh, màu pastel ấm, loang nhẹ và hình tròn trịa; nền trong suốt sạch, không bóng đổ ra ngoài vật, không chữ, logo hoặc thương hiệu.

Mỗi ảnh 256×256 px RGBA, cạnh dài vùng vật khoảng 220 px, tâm `[128,128]`, lề ít nhất 18 px, dưới 40.000 byte. `manifest.json` chứa số đo và SHA-256 của từng ảnh hiện hành; `prompts.json` chứa prompt tạo ảnh mới. `previews/ingredients.webp` ghép đủ sáu món trên nền sáng, kèm ảnh nhỏ trên nền tối.

Nguồn: công cụ tạo ảnh tích hợp OpenAI, mỗi món tạo riêng từ mô tả chữ ngày 04/11/2026, không dùng ảnh tham chiếu đầu vào. Sharp chỉ căn khung, thu nhỏ và nén WebP.

Tài liệu đầy đủ và ảnh ghép 17 món nằm tại [`../storybook-lot1/README.md`](../storybook-lot1/README.md). Chủ dự án duyệt phong cách lô 1 trước khi vẽ các lô tiếp theo. Không thay giao diện hoặc logic trong PR asset này.
