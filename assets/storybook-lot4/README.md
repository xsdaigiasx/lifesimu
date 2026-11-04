# Issue #89 — Lô 4: mặt bằng nhà phố và biệt thự

Bốn ảnh mặt bằng liền, mỗi tầng một ảnh. Tọa độ phòng và cầu thang lấy đúng phần lô 4 của issue #89; kích thước từng phòng đã đối chiếu với `HOUSES` trong `app/src/domain/housing.ts`. Bản mã nguồn đối chiếu và các kích thước được ghi trong `layouts.json` và manifest.

## Tệp dùng trong game

| Tệp trong `app/public/assets/houses/` | Sàn theo ô | Khung ảnh | Dung lượng |
|---|---|---|---|
| `townhouse-t1.webp` | 18×12 | 1984×1168 px | 97.404 byte |
| `townhouse-t2.webp` | 18×12 | 1984×1168 px | 128.948 byte |
| `villa-t1.webp` | 30×30 | 3904×2128 px | 280.490 byte |
| `villa-t2.webp` | 28×14 | 2752×1552 px | 152.436 byte |

Tất cả là WebP **lossless RGBA**, mỗi ảnh dưới 400.000 byte, trong suốt ngoài mặt bằng, không chữ, logo hoặc bóng đổ ra ngoài vật. Không có đồ nội thất, quầy bếp hoặc thiết bị vệ sinh cố định; người chơi sẽ tự đặt đồ. Sân vườn có cỏ, lối đi và năm khóm cây thấp ở mép theo yêu cầu.

## Hình học và tích hợp

- Ô sàn 128×64 px, mỗi ô logic là 1×1; trục x `[64,32]`, trục y `[-64,32]`. Cạnh đứng chỉ đổi y theo z, không đổi x.
- Công thức: `px = originX + 64*(x-y)`; `py = originY + 32*(x+y) - z`.
- `manifest.json` ghi `origin_px`, bốn `floor_corners` tương ứng `(0,0)`, `(w,0)`, `(w,h)`, `(0,h)`, các trục, khung ảnh và neo tại đỉnh trước của sàn. Không căn lưới theo alpha bbox hoặc tâm khung ảnh.
- Chỉ hai tường ngoài phía sau, trên cạnh x=0 và y=0; hai cạnh trước mở để nhìn mặt bằng. Tường sau cao 128 px, tường trong thấp 32 px, không đổ bóng.
- Tường trong nằm trên biên phòng; mỗi cửa mở đúng 2 ô. Danh sách cửa, hai vùng được nối và các đoạn tường đều có tọa độ ô trong manifest.
- Các ô ngoài phòng/cầu thang là hành lang màu trung tính. Vườn không có tường bao; tường của phòng tắm kề vườn vẫn là tường phòng tắm, có cửa nối.
- Tầng 1 thể hiện cầu thang đi lên; tầng 2 thể hiện giếng thang và bậc đi xuống. Cả hai nằm trong vùng 4×4 được giao, không vẽ thêm tầng.

Claude tích hợp từng ảnh nền vào `HouseView.tsx` và dùng phép chiếu trên để khớp lưới. PR này không thay giao diện hoặc logic. Mã game hiện mới có kích thước/phân loại phòng, chưa có dữ liệu x/y cả tầng; `layouts.json` là bản giao tọa độ để tích hợp.

## Nguồn và phong cách

Hình học phòng, lưới, tường, cửa và cầu thang được dựng chính xác bằng SVG từ tọa độ; không dùng ảnh AI để suy đoán kích thước hoặc đếm ô. Mảng màu pastel ấm, nét nâu mảnh `#4a3b33`, các cạnh bo nét nhẹ, mặt trên sáng hơn và mặt bên tối nhẹ. Gỗ, gạch kem, gạch xanh nhạt và cỏ dùng chất liệu loang màu nước/bút chì màu.

Bốn swatch chất liệu được tạo riêng bằng công cụ tạo ảnh tích hợp OpenAI trong phiên Codex ngày 04/11/2026, từ mô tả chữ, không dùng ảnh mẫu bên ngoài. Prompt nguyên văn trong `prompts.json`; bản chất liệu 256×256 PNG ở `materials/`. Chất liệu được chiếu theo mặt sàn và dùng với độ đậm nhẹ. Các khóm cây trang trí được dựng bằng nét/mảng SVG trong cùng hệ tọa độ.

`render.cjs` lưu toàn bộ nguồn dựng hình và kiểm tra; `previews.cjs` dựng ảnh ghép. Cần Node.js và Sharp trong môi trường chạy:

```sh
node assets/storybook-lot4/render.cjs
node assets/storybook-lot4/previews.cjs
```

Hai lệnh chạy từ gốc repo. Không cần đưa Sharp hoặc mã dựng ảnh vào gói game runtime; không thay dependencies của app trong PR này.

## Kiểm chứng

`validation.json` ghi kết quả từng tầng:

- Phòng/cầu thang nằm đúng trong sàn, không chồng nhau; kích thước khớp bản `HOUSES` đã đối chiếu.
- Mọi cửa đều nằm trên đúng biên của hai vùng khai báo và rộng 2 ô, không tạo lỗ ngẫu nhiên trên tường.
- Duyệt đồ thị ô sàn sau khi dựng tường/mở cửa: 216/216, 216/216, 900/900 và 392/392 ô liên thông. Đây là kiểm tra liên thông bố cục 2D, chưa phải pathfinding 3D của người chơi trên bậc thang.
- Ảnh sau nén giải mã đúng khung, có alpha, không chạm mép khung (lề alpha tối thiểu 21 px), dưới 400.000 byte. SHA-256 nằm trong manifest.
- Đã xem ảnh ghép có tên/kích thước phòng và vệt cửa để đối chiếu, cùng bản tổng thể rộng 380 px. Ảnh nguồn giữ độ phân giải lớn cho bước tích hợp kéo/zoom.

## Xem trước

- `previews/lot-4.webp`: đủ bốn tầng, có nhãn phòng và đánh dấu cửa màu cam (chỉ phục vụ review).
- `previews/mobile-380.webp`: tổng thể bốn tầng trong khung điện thoại 380 px.

Chữ và vệt cửa màu cam không có trong ảnh nền runtime. Lưới 1×1, vật liệu, tường, bậc thang và cây vườn có trong nền.

## Điểm cần duyệt khi tích hợp

Theo đúng tọa độ issue, cầu thang nhà phố tầng 1 ở `(14,8)`, tầng 2 ở `(10,8)`, lệch nhau 4 ô theo x; không tự đổi vị trí trong lô asset. Nếu cần cùng một trục thang đứng giữa hai tầng, chủ dự án/Claude cần chốt lại tọa độ trước khi tích hợp mô hình nhiều tầng. Cầu thang biệt thự ở `(0,10)` trên cả hai tầng.

Không sửa TypeScript, save, số cân bằng hoặc tự gộp PR. Không chạy kiểm thử engine/build vì không thay mã game; đã chạy dựng ảnh và các kiểm tra bố cục/ảnh nêu trên.
