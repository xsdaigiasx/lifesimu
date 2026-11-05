# Issue 55 — lô 2

10 mẫu còn lại, 17 ảnh WebP lossless, tạo bằng image_gen built-in. `prompts.json` lưu prompt thực dùng; `spec.json` là thông số. Raw master nằm ở Codex generated_images, đường dẫn cục bộ trong `sources.local.json` (không commit); SHA-256 master được ghi ở `manifest.json`.

## Hình học và xuất ảnh

Ô 128×64, cao z=32. Giữ nguyên KIT hiện tại. Hướng a dùng w×d, neo `(w*64,H)`; hướng b xoay thật 90°, dùng d×w, neo `(d*64,H)` theo quyết định chủ dự án. Bàn họp 3×2 neo x192 trên khung rộng320. Các quầy 3×1: a neo192, b neo64. Không lật bitmap.

Tủ máy chủ: KIT h=4, do đó H=(1+1+4)×32=192. Dùng128×192 theo công thức và spriteBox thật; ô128×160 trong bảng issue không khớp h=4. Không thay KIT hoặc chiều cao runtime.

`guides.cjs` chỉ tạo khối hướng dẫn hình học, không phải ảnh giao hàng. `export.cjs` chỉ crop alpha, co đều, đặt điểm tiếp đất và nén lossless; không vẽ thay hình AI. Mask mép trước loại alpha vượt chân đế, số pixel được ghi riêng từng ảnh. Manifest runtime giữ nguyên 4 mẫu/7 ảnh lô 1; `lot1-baseline.json` kiểm hash và metadata không đổi.

## Xem và kiểm tra

- `contact-sheet-1.webp` đến `contact-sheet-3.webp`: toàn bộ 17 ảnh, kèm thumbnail trên nền tối để soi alpha.
- `directions-preview-1.webp` đến `directions-preview-3.webp`: tất cả hướng trên vỏ Nhỏ, chân đế và neo đánh dấu, không chồng ô.
- `eight-seat-preview.webp`: đúng `buildPlan('small','tech',8)`, đủ25 món có ảnh, không còn khối tạm.
- `renderer-390x844.png`, `renderer-detail-390x844.png`: component IsoOffice thật, qua harness thay entry module chỉ trong trình duyệt; không thay code sản phẩm hoặc save.

Main đã gộp #214 (7ddab5c), nối Office → OwnerFloor → IsoOffice. `in-game-owner-390x844.png` là màn chủ thật, vào qua nút Vào → Vào công ty; save QA hợp lệ trong browser context riêng, không thay entry hoặc dữ liệu người dùng. `in-game-validation.json` ghi đủ25 sprite, không lỗi trang và không tràn ngang. Các ảnh renderer-* vẫn là harness độc lập để soi tọa độ và mặt bằng Lớn.

Chạy bằng Node có Sharp/Playwright trong NODE_PATH: capture-baseline.cjs, export.cjs, review.cjs, verify.cjs. Renderer cần Vite ở127.0.0.1:4174 và Edge. `validation.json`, `renderer-validation.json` ghi kết quả. App test/build và core check bắt buộc trước khi đẩy.

Góp ý ghế lô1 ở #211 được giữ cho lượt nhân vật ngồi: lô2 không đổi các ảnh lô1 đã duyệt.
