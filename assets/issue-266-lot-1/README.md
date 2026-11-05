# Issue #266, lô 1: TV nội thất

Ba mẫu, mỗi mẫu bốn hướng, tạo bằng imagegen tích hợp. [Ảnh ghép trên lưới](tv-grid-review.webp) và [bộ prompt](prompts.json) đi kèm. Ảnh xuất nằm trong `app/public/assets/furniture/`. Manifest ở `assets/furniture/manifest.json`, ánh xạ dùng trong game ở `app/src/domain/furniture-sprites.json`.

| Mẫu | Khung | Chiều cao dùng để dựng khung |
| --- | --- | --- |
| TV 32 inch chân đế | 192×156 px | 60 px |
| TV 43 inch kèm kệ | 192×175 px | 79 px |
| TV 55 inch kèm kệ gỗ | 192×192 px | 96 px |

Chiều cao là thông số dựng sprite theo tỷ lệ nội thất trong game. Hướng a/c có chân đế 2×1 và neo x=128, hướng b/d có chân đế 1×2 và neo x=64. Neo y là đáy khung. Chân thật của mẫu 32 inch nằm bên trong ô chiếm chỗ, nên phần trong suốt phía dưới vẫn giữ trong khung. Hướng a/b cho thấy màn hình, c/d cho thấy vỏ sau và mặt sau của kệ.

`guides.cjs` tạo khối tham chiếu 2:1, `export.cjs` cắt theo alpha, thu đều, đặt vào khung và nén WebP lossless. Để xuất lại cần Sharp, chạy `node guides.cjs`, cung cấp các master đã chọn trong `sources.local.json` với khóa `basic_a` đến `premium_d`, rồi chạy `node export.cjs`. Hai nhóm tệp cục bộ được bỏ qua trong Git.

`in-game-review.cjs` kiểm tra từng mẫu và hướng trong luồng phòng trọ thật bằng save QA riêng. Script cần kết quả biên dịch từ `app/npm test`, Edge, Playwright và Vite ở cổng 4174. Xem ảnh mobile [32 inch](in-game-basic-390x844.png), [43 inch](in-game-comfort-390x844.png), [55 inch](in-game-premium-390x844.png) và [kết quả 12 hướng](in-game-validation.json).
