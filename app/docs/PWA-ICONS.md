# Icon chính thức — issue #11

Biểu tượng L và mũi tên đi lên-phải theo nhận diện `L↗` đang có trong game. Dùng xanh đậm `#173e38`, vàng ấm `#e8c98b` và kem `#fef0d7`, nét lớn để đọc được ở 32/48 px. Không có chữ nhỏ hay chi tiết căn phòng khó đọc ở màn hình chính.

Nguồn: Codex tự vẽ vector; `app/public/icons/icon.svg` là bản gốc. PNG raster hóa bằng sharp, không dùng ảnh stock, thương hiệu/nhân vật của bên thứ ba hoặc ảnh AI. Không thay code, manifest, service worker hoặc dữ liệu game.

## Tệp

- `icon-192.png`, `icon-512.png`: nền bo góc; ngoài góc có alpha.
- `icon-maskable-512.png`: nền xanh tràn viền, hoàn toàn opaque. Hình chính nằm trong đường tròn an toàn tâm (256,256), bán kính 204.8 px (80% chiều rộng).
- `apple-touch-icon.png`: 180×180, nền tràn viền, hoàn toàn opaque; iOS tự cắt góc.
- `favicon-32.png`: 32×32.
- Giữ nguyên tên và đường dẫn nên các tham chiếu hiện tại trong manifest/index.html tiếp tục dùng được.

## Kiểm tra và tái tạo

Ảnh xem: `assets/pwa-icons/sizes.png`, `mask-circle.png`, `mask-squircle.png` (tương đối với thư mục docs này). Cỡ 48 và 32 được hiển thị ở kích thước thật trong ảnh sizes.

Cần Node + sharp. Đặt `SHARP_MODULE` trỏ đến module sharp nếu cài ngoài repo. Chạy `node app/scripts/build-pwa-icons.cjs` từ gốc repo. `--verify-only` chỉ kiểm tra file hiện có: kích thước, dưới 50 KB, alpha, mọi pixel hình chính nằm trong vùng an toàn maskable, và đường dẫn manifest.

Các preview là ảnh render tĩnh. Chưa cài PWA trên thiết bị Android/iOS thật; cách làm mới icon đã được hệ điều hành cache cần được kiểm tra khi phát hành. Đây là thay đổi asset, không đụng TypeScript nên không cần check core.
