# Logo và icon Next Day

Tên game là **Next Day**, slogan **Một đời để sống**. Logo là mặt trời mọc trên con đường bậc đá, xanh đậm `#175239`, vàng `#ecb04e` và kem `#fef7eb`. Bản gốc do chủ dự án gửi 05/11: `docs/assets/brand/next-day-source.png` (logo tròn, chữ NEXT DAY, icon ứng dụng).

## Tệp trong `public/icons/`

- `logo.png`: logo tròn nền trong suốt, dùng ở màn mở đầu và thanh bên.
- `icon-192.png`, `icon-512.png`: ô vuông bo góc, ngoài góc có alpha.
- `icon-maskable-512.png`: nền xanh tràn viền, hoàn toàn opaque; hình chính thu 92% để nằm trong vùng an toàn.
- `apple-touch-icon.png`: 180×180 nền xanh tràn viền; iOS tự cắt góc.
- `favicon-32.png`: 32×32.

Tên và đường dẫn giữ nguyên nên manifest và `index.html` vẫn dùng được. Không còn `icon.svg`.

## Tái tạo

`python3 app/scripts/build-brand-icons.py` (cần Pillow). Script cắt logo và icon từ ảnh gốc, tạo alpha, làm phẳng màu xanh nền cho bản maskable và nén bảng màu 64 màu. Đã xem ảnh kết quả bằng mắt; tệp đều dưới 50 KB trừ maskable ở mức khoảng 38 KB.

Lưu ý: ảnh gốc chỉ khoảng 385 px cho icon, nên `icon-512` là bản phóng to nhẹ. Khi có ảnh vector hoặc ảnh lớn hơn, chạy lại script với ảnh mới.
