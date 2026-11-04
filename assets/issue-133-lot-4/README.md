# Issue #133 — lô 4: món ăn mới

9 ảnh mới, giữ nét món ăn hiện có: viền nâu mảnh, màu ấm, tô mềm. Tham chiếu duy nhất là `app/public/assets/meals/comTam.webp`; không đổi sang phong cách nội thất bán hiện thực.

| ID | Món |
|---|---|
| rauMuong | Rau muống xào tỏi |
| thitKho | Thịt kho trứng, nồi đất nhỏ |
| comChien | Cơm chiên trứng |
| improv-com | Cơm trộn nhiều nguyên liệu |
| improv-xao | Chảo xào rau |
| improv-rim | Chén đồ rim nước sệt |
| improv-luoc | Đĩa rau luộc |
| improv-la | Món lạ, màu hơi ngả và làn khói lạ |
| coffee | Cà phê sữa đá cùng phin nhỏ |

## Giao nộp

- Runtime: `app/public/assets/meals/<id>.webp`, 256×256, nền alpha thật, từng ảnh dưới 40.000 byte.
- `manifest.json`: khung, neo tâm thẻ (128,128), hướng nhìn, bbox alpha, dung lượng và SHA-256. Món ăn là thẻ, không có chân đế lưới.
- `prompts.json`: prompt thực tế, tạo bằng imagegen tích hợp. Không dùng CLI hay ảnh ngoài.
- `contact-sheet.webp`: toàn bộ 9 món cùng mẫu thu nhỏ 64px trên nền tối để kiểm viền.
- `mobile-390x844.png`: trang duyệt asset, không phải ảnh chụp game.
- Master gốc lưu ngoài repo tại thư mục generated_images của Codex; `sources.local.json` là ánh xạ cục bộ được gitignore. Manifest ghi hash master.

## Xuất và kiểm tra

`node assets/issue-133-lot-4/export.cjs` chỉ cắt alpha, thu đồng tỉ lệ, đặt giữa khung và nén WebP; không vẽ thay imagegen. Cần sharp và bản đồ master cục bộ.

`node assets/issue-133-lot-4/verify.cjs` kiểm ID, WebP, khung, alpha, lề trống, tâm, dung lượng và hash. `mobile-preview.cjs` dùng Playwright Edge để kiểm 9 ảnh giải mã, không tràn 390×844.

Không sửa món cũ, TypeScript, core, save hay bản đồ. Claude nối các ID món mới nếu đường hiển thị hiện còn dùng ảnh tạm.
