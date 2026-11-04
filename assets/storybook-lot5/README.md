# Nội thất sách truyện — lô 5, issue #89

94 PNG RGBA cho 24 mẫu nội thất và một mẫu cửa. Đây là bộ asset để Claude review và tích hợp; PR không đổi giao diện, logic xoay, save hay dữ liệu cân bằng.

| Loại | Mẫu | Hướng mỗi mẫu | Số ảnh | Chân đế a/c |
| --- | ---: | --- | ---: | --- |
| Giường | 3 | a, b, c, d | 12 | 2×3 |
| Tủ | 3 | a, b, c, d | 12 | 2×1 |
| Bàn làm việc | 3 | a, b, c, d | 12 | 2×2 |
| Bàn ăn kèm ghế | 3 | a, b, c, d | 12 | 2×2 |
| Cây | 3 | a, b, c, d | 12 | 1×1 |
| Đèn | 3 | a, b, c, d | 12 | 1×1 |
| Thảm | 3 | a, b, c, d | 12 | 3×2 |
| Tranh | 3 | a, b | 6 | 2×1 vùng đặt; tranh nằm trên mặt tường |
| Cửa ra vào | 1 | a, b, c, d | 4 | 0×2, mặt tường |

Tên mẫu lấy đúng `HOME_MODELS`. `basic`, `comfort`, `premium` chỉ là khóa nội bộ và tên tệp, không phải tên hiển thị. Mỗi loại có ba thiết kế, vật liệu và chi tiết riêng theo issue. Cửa là một mẫu ở trạng thái đóng; issue không giao thêm trạng thái mở.

## Tệp giao

- Ảnh dùng trong game: `app/public/assets/furniture/<id>-<model>_<direction>.png`.
- `manifest.json`: 94 đường dẫn, tên mẫu, hướng, chân đế, khung, điểm neo, gốc chiếu, tâm chân đế, bốn đỉnh, dung lượng và SHA-256.
- `previews/`: 25 ảnh xoay theo từng mẫu (tranh có hai hướng), một bảng so sánh ba mẫu mỗi loại, một phòng mẫu đầy đủ và bản xem 380 px. Lưới, chấm neo và chữ chỉ có trong ảnh review.
- `prompts.json`, `materials/`: bảy chất liệu/tác phẩm tạo mới bằng image_gen, hai chất liệu gỗ/đá do chính Codex tạo ở lô 4 và mô tả thiết kế. Không có ảnh tham chiếu của người khác.
- `render.cjs`, `previews.cjs`, `verify.cjs`: nguồn minh họa, ghép preview và kiểm tra, chỉ dùng khi làm asset. Việc che khuất được tính theo độ sâu ở từng mẫu pixel để khung và nệm không che nhầm chăn khi nhìn phía sau. Cần Node.js và Sharp; không thêm phụ thuộc vào game.
- `source-reference.json`: commit và SHA nguồn đã đọc. `validation.json`: kiểm tra trực tiếp các PNG đã giải mã.

## Hình học và điểm neo

Lưới 128×64, một z = 32 px. Các khối, đường nét, bề mặt vải và tranh được dựng từ nguồn minh họa có thể chỉnh sửa, ghép chất liệu vẽ tay rồi raster hóa; không lấy ảnh a/b lật gương để giả hướng c/d. Mặt sau tủ không có cánh/gương, mặt sau đầu giường che gối và đèn đúng góc nhìn, kệ và màn hình quay theo bàn.

Với chân đế đã xoay `w×d`, gốc là `(64d, Z)` và phép chiếu là:

```
pixelX = 64d + 64(x-y)
pixelY = Z + 32(x+y) - z
frame = ((w+d)*64, (w+d)*32 + Z)
anchor_px = (64w, frameHeight)
```

Đây là **đỉnh dưới thật của chân đế**, vì vậy neo hình chữ nhật lệch tâm, đúng quy ước manifest hiện có. Ví dụ giường a/c neo `(128,288)`, b/d neo `(192,288)`; tuyệt đối không thay tất cả bằng 50% bề ngang. Thảm giữ đệm trên 8 px như manifest cũ, chiều cao vật lý bằng 0. Các trường `height_px`, `top_padding_px`, `render_extent_height_px` phân biệt rõ điều này.

Xoay trong hệ tọa độ game: a = mặt trước +Y (xuống trái), b = +X (xuống phải), c = −Y, d = −X. Xoay quanh tâm chân đế; b/d hoán đổi rộng sâu. Khi đổi hướng, giữ tọa độ tâm phòng rồi tính lại góc trái của chân đế mới, không chỉ đổi tệp ảnh.

Chân đế đồ nội thất lấy từ `HOME_ITEMS` hiện hành. Bàn làm việc 2×2 theo dữ liệu này; `desk-work` 2×1 trong bộ SVG cũ là một asset khác, không được dùng để đổi kích thước bàn của game. Tranh vẫn dành vùng đặt 2×1, mặt tranh hướng a nằm tại y≈0.923 trong vùng đó; Claude cần khớp mặt tranh với tường thay vì coi ảnh này là đồ sàn. Cửa giữ chân đế tường 0×2, khung 128×320 và neo `(0,320)` ở hướng a theo manifest cửa cũ; `front_vector_xy` ghi đúng pháp tuyến mặt cửa cho từng hướng.

## Khi tích hợp

Dùng trực tiếp phép chiếu và neo trong manifest; các phép chỉnh độ xiên dành cho ảnh cũ trong `home-art.ts` không áp dụng cho bộ ảnh 2:1 này. Logic hiện tại mới chấp nhận 0°/90°; phần thêm 180°/270°, giao diện xoay và kiểm tra save thuộc việc Claude làm sau khi review lô 5, như issue đã giao. Không đổi tên khóa nội bộ khi nối ảnh.

## Tái tạo và kiểm tra

Từ thư mục repo:

```
node assets/storybook-lot5/render.cjs
node assets/storybook-lot5/verify.cjs
node assets/storybook-lot5/previews.cjs
```

Kiểm tra đủ 94 tên tệp/hướng, PNG bốn kênh có alpha, khung và neo, SHA-256, biên alpha không bị cắt, mọi đỉnh hình học trong chân đế và chiều cao cho phép, phép xoay quanh tâm theo công thức độc lập, b/d đổi rộng sâu, chăn kẻ vẫn hiện ở cả bốn hướng, từng ảnh dưới 150.000 byte. Đã xem bảng so sánh, các mặt trước/sau và preview 380 px. Không chạy test TypeScript vì PR không sửa TypeScript và chưa tích hợp vào giao diện.
