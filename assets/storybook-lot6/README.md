# Issue #89 — Lô 6: phòng trọ sách truyện

Phòng 8×8, bếp cố định `(0,0) 5×1`, phòng tắm `(5,0) 3×3`, hai cạnh trước mở. Không có giường, bàn, thảm hay cây đặt sẵn. Sàn gỗ mật ong, tường kem, rèm xanh dịu và gạch xanh nhạt dùng đúng ba chất liệu của lô 4. Nét nâu #4a3b33, không bóng đổ ngoài vật, chữ, thương hiệu hoặc nền màu trong ảnh runtime.

## Tệp bàn giao

| Tệp | Khung | Byte | Dùng khi tích hợp |
|---|---|---:|---|
| `app/public/assets/static-scenes/rental-storybook.webp` | 1536×1536 | 91.576 | Nền phòng trọ, giữ hệ chiếu phần trăm hiện hành |
| `app/public/assets/static-scenes/rental-storybook-bath-mask.webp` | 1536×1536 | 5.342 | Lớp che riêng các vách phòng tắm |
| `app/public/assets/room-master-storybook.webp` | 1448×1086 | 54.108 | Bản 2:1, cùng khung pixel với room-master cũ |

Hai nền WebP q86, alpha100; lớp che lossless. Không đổi ảnh cũ, TypeScript, UI, core, save hoặc cân bằng. Claude nối nền và lớp che theo phân công trong #89. Tệp được đặt tên mới để giao ảnh cùng tọa độ mà không kích hoạt lớp che CSS cũ trước khi tích hợp.

## Tọa độ và khác biệt cần biết

`home-geometry.ts` hiện dùng góc sàn phần trăm `[50,30.25]`, `[92.5,59]`, `[50,87.75]`, `[7.5,59]`. Ảnh vuông mới giữ đúng bốn điểm này. Với 8 ô, trục pixel là `[81.6,55.2]`, `[-81.6,55.2]`, gốc `[768,464.64]`. Phép chiếu này **không phải 2:1**; giữ nguyên để tọa độ đồ đang lưu không đổi khi nối nền. Lưới an toàn giữ biên 0,4 ô và hệ số 0,9 đúng code, không dùng góc alpha để căn lưới.

Bản master 1448×1086 có gốc `[724,350]`, trục `[64,32]`, `[-64,32]`, ô 128×64 đúng chuẩn 2:1 và cùng chất liệu lô 4. Cạnh đứng vẫn thẳng đứng ở cả hai bản. Manifest ghi đủ đỉnh sàn, neo, trục, bếp, phòng tắm, lối mở và lưới an toàn.

Hai ảnh tham chiếu cũ không có chung hình học: `room-master.webp` là cảnh có đồ, sàn dạng đa giác lệch, khung 1448×1086; `rental-diamond.png` là ảnh vuông dùng bởi Room.tsx. Vì vậy không thể giữ đồng thời đa giác sàn của cả hai và tạo phòng 8×8. Bản runtime ưu tiên hệ tọa độ đang chạy; bản master ưu tiên khung cũ và chuẩn 2:1. Đây là hai phép xuất cùng một hình học phòng, không dùng bản master để thay trực tiếp nền runtime.

Connector trả nội dung rỗng cho rental-diamond.png (>1 MB), không giải mã được PNG gốc trong phiên này. Đã đối chiếu tọa độ phần trăm với code và tài liệu hiện hành; **không tuyên bố xác minh cùng kích thước pixel hay chồng khít từng pixel với PNG đó**. Khung vuông 1536×1536 là khung xuất mới, có cùng tỉ lệ và tọa độ sàn chuẩn hóa. Ảnh room-master cũ đã được xem để xác nhận khung và sự khác biệt bố cục, không đưa ảnh tham chiếu cũ vào lô hoặc dùng làm đầu vào AI.

Khi tích hợp: đổi nguồn ảnh nền; thay `.home-wall-bath` dùng `rental-storybook-bath-mask.webp` phủ cùng khung, bỏ clip polygon cũ. Lớp che chỉ có vách, không có sàn để tránh che đồ. Không đổi `HOME_FLOOR` hoặc tọa độ save. Phòng tắm có lối mở rộng 1 ô tại y=3, x=6..7; đó là hình minh họa, chưa có logic đi lại trong PR này.

## Nguồn và tái tạo

Mở rộng nguồn vector bản địa `assets/source/build-room.cjs` và cách chiếu chất liệu của `assets/storybook-lot4/render.cjs`. Không tạo ảnh AI mới: ba swatch PNG trong materials/ được sao nguyên byte từ lô 4 do công cụ tạo ảnh OpenAI tạo trước bằng mô tả chữ. prompts.json giữ nguyên prompt nguồn, thêm đặc tả cảnh mới. Không dùng ảnh mẫu bên ngoài, không thêm dependency runtime.

Từ gốc repo, với Node.js và Sharp:

```sh
node assets/storybook-lot6/render.cjs
node assets/storybook-lot6/verify.cjs
```

manifest.json ghi SHA-256 và byte ảnh cuối. source-reference.json ghi SHA GitHub của các tệp làm cơ sở. `previews/lot-6.webp` ghép hai cách xuất và bản có lưới; `previews/mobile-380.webp` kiểm tra ở chiều rộng 380 px. Lưới xanh là sàn ngoài, cam là vùng đặt an toàn; chữ và lưới debug chỉ ở preview.

## Kiểm chứng

Giải mã ba WebP cuối: RGBA, có vùng alpha trong suốt, không cắt biên, từng tệp dưới 150.000 byte, hash khớp manifest. Kiểm tra bốn góc runtime đúng tọa độ phần trăm, bản master đúng 2:1; 9 ô tắm + 5 ô bếp, 50 ô còn lại liên thông; 289 giao điểm lưới an toàn (kể cả nửa ô) nằm trong sàn. Đã xem nền, lưới và preview 380 px.

Không chạy kiểm tra TypeScript hay chơi thử browser vì không sửa/nối code game. Cần Claude kiểm tra lớp che, kích thước ảnh hiển thị và đồ thực trong Room sau tích hợp. Không tự gộp PR.
