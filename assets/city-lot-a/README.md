# Issue #97 — Lô A: ô nền thành phố

34 WebP RGBA lossless, 256×128 px, chân đế đúng một ô hình thoi 2:1. Tổng 49.318 byte, ảnh lớn nhất 2.256 byte. Tệp runtime tại `app/public/assets/city/terrain/`.

| Nhóm | Số | Nội dung |
|---|---:|---|
| Đất và lát nền | 8 | Cỏ 3 mẫu, cỏ hoa, đất, cát, vỉa hè, quảng trường |
| Đường | 13 | Hai đường thẳng, bốn cua, bốn chữ T, ngã tư, hai vạch qua đường |
| Nước | 13 | Giữa hồ, bốn mép, bốn góc lồi, bốn góc lõm |

## Ghép và điểm neo

Mỗi ảnh có `footprint_tiles: [1,1]`, `frame_px: [256,128]`, `anchor_px: [128,128]`, gốc sàn `[128,0]`. Điểm neo là đỉnh dưới hình học, nằm trên biên dưới khung; không căn theo tâm vùng alpha.

Với gốc bản đồ O, ô (x,y) có đỉnh sau `O + [128*(x-y),64*(x+y)]`; đặt góc trên trái ảnh tại đỉnh sau cộng `[-128,0]`. Các ô chỉ có vật liệu trên chân đế, không có bóng hay nền giấy.

Các hướng `xm`, `xp`, `ym`, `yp` nghĩa là cạnh x=0, x=1, y=0, y=1. Trục x chạy xuống phải; y chạy xuống trái. Nối `xp` với `xm` và `yp` với `ym` của ô kế bên, cùng chiều tham số trên cạnh. Không dùng phép xoay ảnh PNG 90° để thay hướng: dùng đúng id của hướng đã xuất.

Tên `road-t-no-xm` nghĩa là ngã ba không nối cạnh xm. `connections` trong manifest là nguồn xác định kết nối, không suy từ tên hoặc alpha. Lòng đường rộng 0,6 ô, ở vị trí 0,2..0,8 của trục ngang đường. Các đầu nối có cùng làn xe, vỉa hè và gờ. Cua/ngã ba/ngã tư để trống vùng giữa, không vẽ vạch đứt chạy xuyên nút giao. Hai ô zebra giữ nguyên hồ sơ mép của ô thẳng.

Nước: `water-edge-xm` có bờ đất ở phía xm; tương tự các hướng khác. `convex` là góc lồi của mặt nước, hai cạnh phía đất đóng; `concave` là góc lõm của mặt nước quanh một góc đất, các mép nước còn lại mở. Manifest ghi 100 mẫu `edge_profiles` mỗi cạnh; chỉ ghép hai cạnh có hồ sơ vật liệu giống nhau khi muốn đường bờ liên tục. Ảnh hồ mẫu có 24 mép trong đã được kiểm tra tự động.

Ba ô cỏ có biên chung, khác các nét cỏ bên trong. Cỏ hoa không có hoa chạm mép. Lưới gạch và vật liệu lặp theo ô; không vẽ nét viền quanh chân đế để tránh tạo đường nối giả.

## Nguồn và tái tạo

Màu pastel theo #89, họa tiết loang cực nhẹ từ swatch cỏ và gạch kem của lô 4. Hai PNG trong `materials/` sao nguyên byte từ bộ đó; prompt OpenAI gốc trong prompts.json. Không dùng ảnh mẫu ngoài repo. Hình học đường, nước và phép phủ diamond do render.cjs dựng ở độ phân giải đích, không phóng to một ảnh bản đồ.

```sh
node assets/city-lot-a/render.cjs
node assets/city-lot-a/verify.cjs
```

Cần Node.js và Sharp để dựng asset; không thêm dependency runtime của game. Tất cả phép ngẫu nhiên trang trí dùng hàm số nguyên cố định theo ô, không dùng Math.random.

## Kiểm chứng

Giải mã cả 34 WebP: đúng khung/RGBA, alpha chính xác 0 hoặc 255, 16.384 pixel mặt sàn mỗi ảnh, SHA-256 khớp manifest. Kiểm tra từng pixel với bốn nửa mặt phẳng diamond độc lập. Ghép lưới 4×4 bằng source-over thông thường: không có khe alpha, kể cả góc giao bốn ô. Kiểm tra 372 cặp mép có hồ sơ tương thích và 7.440 mẫu màu trên ảnh đã giải mã; độ lệch tối đa nằm trong validation.json. Lòng đường ở cạnh chỉ xuất hiện khi cạnh đó được khai báo kết nối.

Ảnh xem trước: `lot-a.webp` đủ 34 ô; `streets.webp` đường giao nhau và zebra; `lake.webp` các bờ hồ; `mobile-380.webp` khung rộng 380 px. Chữ chỉ có trên ảnh ghép review.

Chưa nối vào renderer thành phố hoặc chơi thử UI. Kiểm tra khe ở đây tại kích thước gốc và tọa độ pixel nguyên. Khi Claude đóng atlas hoặc dùng lọc GPU ở zoom lẻ cần extrusion/gutter và QA thực tế; không căn UV theo alpha bbox. Không thay bản đồ hay khoảng cách di chuyển trong PR asset này.
