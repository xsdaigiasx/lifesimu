# Issue #97 — Lô B: công trình thành phố

12 địa điểm, cộng 2 mảnh công viên tách riêng; 12 ảnh địa điểm được vẽ lại từ cùng bộ công trình theo lô 7 #89. Phong cách sách truyện pastel ấm, nét nâu mảnh #4a3b33, chất liệu loang nhẹ, mặt phải tối dịu. Không người, chữ, thương hiệu hoặc bóng đổ ngoài chân đế.

| id | Công trình | Chân đế |
|---|---|---|
| home | Nhà trọ hai tầng, hẻm, ban công và dây phơi | 4×4 |
| office | Sáu tầng cửa sổ, sảnh có mái che | 6×6 |
| market | Mái tôn, bốn sạp thực phẩm, mái bạt | 6×6 |
| mall | Ba tầng kính, dải màu và biểu tượng túi không chữ | 6×6 |
| bank | Hàng cột, cửa đôi, mặt tiền có diềm | 4×4 |
| hospital | Tòa nhà và biểu tượng y tế xanh ngọc | 6×6 |
| bus | Mái che, ghế, kính chắn và biển hình không chữ | 2×4 |
| park | Chòi nghỉ và đài phun nước, ngoài hai vật hoàn toàn trong suốt | 8×8 |
| streetfood | Quầy, ô dù và bàn ghế nhựa | 4×4 |
| restaurant | Hai tầng, mái ngói và mái bạt | 4×4 |
| apartments | Ba nhà phố hai tầng màu khác nhau | 6×4 |
| villa | Nhà hai tầng, sân cỏ, cây và bể nước | 6×6 |

## Tệp và ghép bản đồ

`app/public/assets/city/buildings/<id>.webp` là ảnh độ phân giải gốc, không phóng to từ một ảnh thành phố. Ô 256×128, trục x `[128,64]`, trục y `[-128,64]`. Công trình cao có thêm khung phía trên. Tất cả hình học, cây, mái và nét viền nằm trong bề ngang chân đế.

Với chân đế w×h, khung rộng `(w+h)*128`, gốc sàn `[h*128,z_budget]`, khung cao `(w+h)*64+z_budget`. Công thức `px=128*h+128*(x-y)`, `py=z_budget+64*(x+y)-z`. Neo đỉnh dưới là `[128*w,frameHeight]`; **không luôn ở giữa khung**. Đặc biệt bus 2×4 có neo x=256 trong khung rộng 768; apartments 6×4 có neo x=768 trong khung rộng 1280. Không áp dụng độ xiên hoặc anchor của bộ ảnh bản đồ cũ.

Manifest ghi `footprint_tiles`, `frame_px`, `anchor_px`, `floor_origin_px`, chất lượng nén và SHA-256 từng ảnh. Để đặt công trình có gốc ô (x,y), lấy đỉnh sau tại `O+[128*(x-y),64*(x+y)]`, rồi trừ `floor_origin_px` để lấy góc trên trái sprite. Render theo độ sâu chân đế do Claude tích hợp.

### Công viên

Không gắn nền cỏ vào ảnh park. Có thể dùng một sprite 8×8 hoặc hai mảnh độc lập `park-gazebo` và `park-fountain` (mỗi mảnh 3×3). Bản tổng hợp đặt gazebo tại gốc `[0,0]`, fountain tại `[4,4]`; metadata components ghi đúng các vị trí này. Hai cách dùng là lựa chọn thay thế, không vẽ cả tổng hợp và hai mảnh lên nhau. Nền cỏ/lối đi lấy từ lô A hoặc bố trí của Claude.

### Ảnh địa điểm

Thay 12 tệp `app/public/assets/locations/<id>.webp` bằng thẻ 512×512 RGBA, có lề trong suốt và cùng hình công trình. Không dùng hình bản đồ lớn hoặc cắt mảnh AI bị mờ. Các tệp city mới chưa được nối vào renderer, không thay UI hoặc logic bản đồ. Claude cần kiểm tra cách crop/contain ảnh địa điểm sau khi gộp.

## Nguồn và tái tạo

Hình học minh họa bản địa viết trong render.cjs, mở rộng hệ chiếu và nét/mảng của các bộ isometric trước. Công cụ tạo ảnh OpenAI chỉ tạo mới chất liệu tường trát kem; PNG 256×256 `materials/plaster.png` được giảm từ ảnh gốc do công cụ tạo, prompt nguyên văn trong prompts.json. Không dùng ảnh bên ngoài hoặc đầu vào của người khác. Không tuyên bố 12 công trình do AI vẽ trực tiếp; hình dáng và chi tiết kiến trúc có nguồn dựng trong repo.

```sh
node assets/city-lot-b/render.cjs
node assets/city-lot-b/verify.cjs
node assets/city-lot-b/previews.cjs
```

Node.js và Sharp chỉ dùng khi dựng asset, không thêm vào runtime. Hai lệnh đầu không phụ thuộc lô A; lệnh ghép góc phố cần các ô lô A đã có trong workspace. Mỗi hướng công trình ở đây là hướng được giao; xe/người bốn hướng thuộc lô D.

## Kiểm chứng và preview

26/26 ảnh runtime giải mã đúng RGBA, có alpha, khung và SHA khớp; không cắt biên. Tổng 1.213.972 byte, lớn nhất 144.988 byte, mỗi ảnh dưới 150.000 byte. Hai công trình hình chữ nhật được kiểm tra neo riêng. Kiểm tra tất cả đỉnh hình học nằm trong chân đế và khung; không suy chân đế từ vùng alpha.

`previews/lot-b.webp`: đủ 12 công trình. `bus-grid.webp`, `apartments-grid.webp`: hai chân đế hình chữ nhật có lưới review. `street-corner.webp`: ghép năm địa điểm với nền/đường lô A. `detail-native-1x.webp`: crop ở pixel gốc, không nội suy phóng to. `mobile-380.webp`: góc phố ở chiều rộng 380 px. Chữ/lưới chỉ ở preview, không nằm trong sprite.

preview-layout.json chỉ là bố trí review 20×20, đã kiểm tra không chồng chân đế và không đặt công trình lên đường. Không phải layout gameplay, không thay tọa độ hay khoảng cách di chuyển hiện có. Chưa chơi thử renderer/UI, hit region, zoom hay culling; Claude tích hợp và QA sau. A và B được gửi trước để chủ dự án duyệt góc phố theo #97, rồi mới làm C và D. Không tự gộp PR.
