# Issue #266, lô 2: ảnh danh mục

Bộ 12 ảnh minh họa gồm 3 ô Chợ, 5 ô Cửa hàng và 4 ô Bếp. Ảnh tạo bằng imagegen tích hợp, theo ảnh chuẩn của phòng và các ảnh nguyên liệu, món ăn, sản phẩm sẵn có. Xem [ảnh ghép theo màu nền từng ô](contact-sheet.webp) và [bộ prompt](prompts.json).

Ảnh WebP lossless 360×160 px nằm trong `app/public/assets/tiles/`. Nền trong suốt để màu của thẻ hiện qua. Chủ thể nằm trong vùng giữa tối đa 244×120 px. [Manifest](manifest.json) ghi đường dẫn, giới hạn alpha, dung lượng và SHA-256. `app/src/domain/tile-art.json` đăng ký 12 khóa cho các màn hiện có. Ô Ba lô hiện nằm ở TTTM. Cửa hàng điện thoại dùng bốn mục Nội thất, Điện tử, Quần áo và Xe.

`export.cjs` cần Sharp và đường dẫn tới 12 master đã chọn trong `sources.local.json` (tệp cục bộ). Script cắt theo alpha, thu đều, đặt giữa khung, rồi xuất ảnh, manifest và ảnh ghép.

`mobile-review.cjs` cần Edge, Playwright, `app/npm test` và Vite ở cổng 4174. Script dùng save QA trong context riêng để mở bốn màn thật, giải mã ảnh và kiểm tra vùng alpha nằm trong khung `object-fit: cover` ở 390×844. [Chợ](market-390x844.png), [TTTM](mall-390x844.png), [Điện thoại](phone-390x844.png), [Bếp](kitchen-390x844.png) và [kết quả](mobile-validation.json).
