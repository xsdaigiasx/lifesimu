# #124 — Bộ thử phòng và nội thất vẽ tay

Phạm vi theo bình luận [6629307790](https://github.com/xsdaigiasx/lifesimu/issues/124#issuecomment-6629307790): một vỏ phòng và ba món `comfort`, mỗi món bốn hướng. Giữ nét chì/sáp, gỗ mật ong, màu kem và xanh dịu của ảnh phòng được chủ dự án chọn. Đây là bộ thử để review và ghép vào game trước khi vẽ các lô còn lại.

## Tệp để ghép thử

| Tệp | Số ảnh | Khung | Chân đế a/c |
| --- | ---: | --- | --- |
| `room-master-storybook.webp` | 1 | 1448×1086 | 8×8 |
| `furniture/bed-comfort_{a,b,c,d}.png` | 4 | 320×288 | 2×3 |
| `furniture/wardrobe-comfort_{a,b,c,d}.png` | 4 | 192×288 | 2×1 |
| `furniture/desk-comfort_{a,b,c,d}.png` | 4 | 256×256 | 2×2 |

Ảnh đều độc lập, có alpha trong suốt, dưới 150.000 byte. Không ghi đè hoặc nối vào `app/public` trong PR thử. Basename, khung, chân đế, chiều cao và neo của từng hướng giữ đúng manifest lô 5. `manifest.json` ghi đầy đủ giá trị, hash và dung lượng thực. Nguồn ảnh AI mới và prompt đi kèm để tiếp tục chỉnh nét.

Vỏ phòng chỉ có sàn, tường, cửa sổ và bếp/phòng tắm cố định; không có cửa ra vào, đồ đặt được, dép hay mèo trên sàn. Bếp `(0,0) 5×1`, phòng tắm `(5,0) 3×3`, lối mở tại `y=3, x=6..7`. Cả bốn mặt bàn đều trống để đặt đèn và các món `mount: surface` riêng; sách trong kệ được giữ lại. Mặt sau tủ và kệ có hình riêng, không lật ảnh mặt trước.

## Sửa hai lỗi chặn sau ghép thử

Theo [review 6630177184](https://github.com/xsdaigiasx/lifesimu/issues/124#issuecomment-6630177184):

- Đã sửa ảnh nguồn và xuất lại bàn a/b/c/d: bỏ cả đèn (kể cả phần chụp lộ phía sau kệ) và sách mở trên mặt bàn. Không vẽ kèm món đặt được; sách nằm trong kệ giữ nguyên.
- Chủ dự án yêu cầu **bỏ cửa**, thay cho phương án dời/thu cửa. Vỏ phòng nay không vẽ cửa ra vào ở bất kỳ tường nào; chỗ cửa cũ được trả về tường kem và chân tường. `room.entry_door.baked=false`, vị trí và vùng cấm treo tranh do cửa đều `null`. Claude không cần khóa vùng tường trái y=5..7 vì cửa của bản này. Các ràng buộc treo tranh khác của game không thay đổi.
- Bản sửa tiếp nối PR #130 sau khi PR đó đã được gộp. Chỉ sửa asset thử và metadata, không đổi logic vào/ra nhà hay vùng treo tranh trong game.

## Lưới và neo

Gốc sàn `(724,350)`, phép chiếu `px=724+64*(x-y)`, `py=350+32*(x+y)-z`. Bốn góc sàn chuẩn là `(724,350)`, `(1236,606)`, `(724,862)`, `(212,606)`. Neo là đỉnh dưới chân đế **thật**, kế thừa lô 5; không đặt mọi neo vào giữa ảnh. Ví dụ giường a/c `(128,288)`, b/d `(192,288)`.

Đặt món tại góc ô `(x,y)` bằng cách chiếu `(x+w,y+d)`, rồi trừ `anchor_px` để lấy góc trái ảnh. Hướng a = +Y, b = +X, c = −Y, d = −X. b/d đổi rộng sâu; xoay trong trình xem giữ tâm chân đế.

Ảnh tạo bằng image_gen, dùng các ảnh hình học do chính dự án dựng làm khuôn và ảnh phòng Codex vừa tạo làm tham chiếu nét vẽ; không dùng ảnh của người khác. `build.cjs` chỉ xử lý xuất: loại alpha mờ quanh biên, đưa bounding box đồ về khuôn cũ, đăng ký affine mặt sàn về lưới chuẩn, nén PNG/WebP. Không dựng lại tranh bằng vector. `sources/` là nguồn tác giả WebP chất lượng 93, không phải asset runtime và không áp giới hạn 150 KB; tổng bộ nguồn khoảng vài MB. Các tệp nguồn là ảnh tạo riêng cho từng hướng.

## Xem và kiểm tra

- `rental-sample.webp`: ghép **chính vỏ phòng và sprite đã giao**, không phải ảnh AI vẽ chung cả phòng.
- `previews/room-grid.webp`: lưới sàn, bếp/phòng tắm, chân đế và chấm neo.
- `previews/rotations.webp`: đủ 12 ảnh mặt trước/mặt sau.
- `previews/mobile-380.webp`: ảnh ghép rộng 380 px.
- `preview.html`: trình xem độc lập, chọn món, chạm sàn để chuyển vị trí, xoay bốn hướng, kiểm tra chồng đồ và vùng cố định. Không đọc/ghi save game.

Từ gốc repo, với Node.js, Sharp và ImageMagick `convert`:

```sh
node assets/style-sample/build.cjs
node assets/style-sample/previews.cjs
node assets/style-sample/verify.cjs
python -m http.server 8000
```

Mở `http://localhost:8000/assets/style-sample/preview.html`. Có thể chạy `node assets/style-sample/qa-preview.cjs` nếu môi trường đã có Playwright và Chromium; script kiểm tra xoay, chuyển ô, vùng cấm và viewport 380 px. Không thêm dependency vào game.

## Kết quả và phần cần review

`validation.json`: giải mã đủ 13 ảnh, xác minh hash, khung, alpha, giới hạn byte, tên/hướng, chân đế/neo bằng lô 5; kiểm tra ảnh sau không phải bản lật gương chính xác; bố trí mẫu không đè vùng cố định hoặc nhau, còn 38 ô trống liên thông. Đã xem vỏ phòng, ảnh ghép, bảng bốn hướng và ảnh lưới.

Hình vẽ được căn theo bounding box của khuôn; phép này **không chứng minh mọi chân đồ và cạnh bên trong khớp pixel với mô hình 3D**. Vỏ phòng căn bằng ba điểm mặt sàn đo trên ảnh, nét viền vẽ tay có sai lệch nhỏ quanh đường chuẩn. Cần review trực quan điểm tiếp đất, tỉ lệ, chi tiết xuyên suốt bốn hướng và lớp che khi Claude ghép vào game; không coi kiểm tra số là nghiệm thu mỹ thuật.

Chưa chạy được kiểm tra trình xem bằng trình duyệt trong phiên này vì không có Chromium. Chưa tích hợp hoặc chơi thử trong game; không sửa TypeScript, `core`, save hay cân bằng. Bộ này không thay cho vẽ lại các lô còn lại của #124. Không tự gộp PR.
