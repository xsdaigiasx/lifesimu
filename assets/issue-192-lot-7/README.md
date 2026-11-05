# #192 — lô 7: vỏ văn phòng Nhỏ 14×14

Asset mới: `app/public/assets/offices/small/room-shell.webp`, **2048×1408**, WebP quality95 / alphaQuality100, **261.906 B** (dưới 300.000 B). Một sàn làm việc liền, trống đồ; hai tường sau cao224px, tường trước dạng cutaway32px, khung cửa mở192px ở cạnh y14.

Tạo bằng imagegen tích hợp. geometry-guide.svg/png là hướng dẫn hình học native, không dùng thay art. Ảnh chuẩn phong cách duy nhất là assets/style-reference/room-reference.webp; vỏ trọ hiện tại là đối chiếu vật liệu. Prompt thực tế ở prompts.json. Master sinh ở generated_images của Codex; sources.local.json là ánh xạ cục bộ được gitignore.

## Tọa độ giao Claude

- Ô 128×64, camera trực giao2:1, lưới14×14.
- P(x,y) = (1024 + 64×(x−y), 320 + 32×(x+y)).
- Gốc ox/oy **(1024,320)**.
- Bốn đỉnh sàn: (1024,320), (1920,768), (1024,1216), (128,768).
- Sàn hình thoi **1792×896**, khung giữ lề đủ cho tường và đế.
- Cửa mở trên cạnh y14, x từ6 đến8. Hai ô vào cửa là cột6 và7; vùng chừa bên trong x=[6,8), y=[12,14), đúng layout.ts.

manifest.json ghi khung, neo/gốc, chân đế, hướng, số đo, cửa/apron, hash và dữ liệu tám món mẫu. Không sửa TypeScript, office-packs.json, office manifest hoặc toạ độ38 món. Claude nối đường dẫn mới và cập nhật placement sau khi duyệt. Không thay vỏ Vừa/Lớn, sprite, cảnh tĩnh hay nhà phố/biệt thự.

## Hoàn thiện và kiểm

export.cjs căn raster sinh theo bbox hướng dẫn, giữ alpha hình học của guide, làm sạch RGB viền coverage yếu và nén WebP. Không dựng hoặc vẽ chất liệu thay imagegen. floor-mask.png là mặt sàn raster dùng cùng bốn đỉnh của guide.

verify.cjs không cần Git lịch sử. Kiểm WebP/khung/hash/alpha, dưới300KB, bbox mặt sàn raster1792×896, toàn bộ196 tâm ô có coverage, cửa/apron, tám món nằm trong14×14 không chồng nhau hoặc lối cửa, và hash layout/pack/manifest runtime không đổi.

Phần đo máy xác nhận khung/matte/lưới; nét vật liệu được xem cùng overlay, không tuyên bố từng nét RGB là phép đo hình học.

## Ảnh duyệt

- contact-sheet.webp: tổng hợp vỏ/lưới, tám món và so kích thước.
- shell-grid.webp: lưới14×14; vùng vàng là lối cửa phải chừa.
- eight-samples.webp: tám sprite văn phòng lô3 ở kích thước pixel gốc, dùng anchor trong manifest runtime. Footprint trong ảnh là bố trí mẫu để duyệt, không ghi đè placement runtime.
- scale-comparison.webp: vỏ mới và phòng trọ8×8 trên cùng canvas, **không resize từng ảnh**, nên sàn rộng1792 so với1024px (tỉ lệ1,75).
- before-after.webp: vỏ cũ với lưới14×14 cố định để thấy không khớp tỉ lệ; vỏ mới được khóa theo guide. Lưới chồng lên ảnh cũ chỉ là chẩn đoán, không coi là gốc tọa độ hợp lệ của ảnh cũ.
- mobile-390x844.png: trang duyệt asset, không phải màn game; vỏ mới chưa được nối theo phạm vi issue.

Kết quả test/build và verifier ghi trong validation.json. Không tự gộp PR.
