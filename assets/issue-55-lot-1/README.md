# #55 — lô 1: bàn, ghế, kệ, cây

7 ảnh mới trong `app/public/assets/office-kit/`, WebP lossless/alpha thật, không chữ hay thương hiệu. Phong cách bán hiện thực, gỗ mật ong, sage và kem theo ảnh chuẩn `assets/style-reference/room-reference.webp`; bộ38 ảnh văn phòng chỉ là tham chiếu vật liệu.

| Món | Khung | Hướng a: footprint/neo | Hướng b: footprint/neo |
|---|---|---|---|
| desk-pc | 192×160 | 2×1 / (128,160) | 1×2 / (64,160) |
| chair | 128×96 | 1×1 / (64,96) | 1×1 / (64,96) |
| shelf | 192×192 | 2×1 / (128,192) | 1×2 / (64,192) |
| plant | 128×128 | 1×1 / (64,128) | — |

**Chủ dự án đã xác nhận trong chat:** hướng b xoay90°, đổi w/d; bàn/kệ b dùng1×2 và x64, a giữ2×1 và x128. Khung ảnh không đổi. Không suy neo về giữa khung cho đồ chữ nhật.

Manifest runtime giữ id/w/d/h/files theo schema issue; thêm views cho footprint/neo từng hướng. w/d/h gốc là hướng a, vẫn khớp KIT. IsoOffice hiện đọc files.a; metadata b sẵn cho lúc hỗ trợ xoay. Không đổi KIT hoặc chiều cao.

## Nguồn và xuất

Tạo/sửa bằng imagegen tích hợp, một call cho từng hình/hướng; không mirror bitmap để tạo b. prompts.json có prompt thực tế, quy tắc hướng mới và các thử b cũ được đánh dấu superseded. guides/ là bao hình học native để hướng dẫn camera, không dùng thay art.

export.cjs chỉ cắt alpha, thu đồng tỉ lệ, căn tiếp đất về neo, chặn alpha vượt cạnh trước chân đế và nén lossless. Không kéo giãn hay vẽ đối tượng bằng code. manifest.json bàn giao có khung/footprint/neo từng hướng, hash nguồn/đầu ra và số liệu căn ảnh. Master ở generated_images của Codex; sources.local.json là ánh xạ máy này và được gitignore.

Tổng125.464 B; lớn nhất31.902 B; cả7 tệp dưới150.000 B.

## Ảnh duyệt và kiểm

- contact-sheet.webp: đủ7 hình, có tên/khung/neo và thumbnail64px trên nền tối.
- eight-seat-preview.webp: đúng buildPlan('small','tech',8), kích thước/neo spriteBox, 19 sprite lô1 trên vỏ Nhỏ14×14. Sáu khối xám là các món lô2 đang dùng fallback KIT, không phải asset mới.
- directions-preview.webp: đủ7 hình trên sàn, có footprint/neo riêng từng hướng; variant-placements.json ghi tọa độ.
- baseline.json: plan25 món, 8 ghế ngồi và19 vị trí thuộc lô1, cùng KIT/box/depth từ code thật. Hash office-plan.ts, IsoOffice.tsx và vỏ phòng được giữ nguyên.
- verify.cjs: schema runtime, đúng7 file/4 model, khung/neo/alpha/contact/hash/dung lượng, a/b khác ảnh, hình học b đã đảo w/d; kiểm25 footprint không chồng/lấn cửa và19 neo spriteBox khớp.

## Bằng chứng renderer và điểm tích hợp

renderer-review.cjs mount **component IsoOffice thật** qua override module main trong context Playwright biệt lập, không ghi sửa mã app hoặc đọc save người chơi. Component tự fetch manifest thật; đã kiểm HTTP200, giải mã đủ4 ảnh a, 19 image có tọa độ/kích thước đúng từng spriteBox, không lỗi trang hay tràn ngang. Hai ảnh renderer-*-390x844.png chụp trước/sau zoom.

**Đây là khung QA renderer, không phải màn chủ công ty trong luồng game.** Trên main đã kiểm, Office.tsx vẫn render PackedOffice ở page space; không có chỗ import/mount IsoOffice. Vì vậy asset sẵn cho bộ đọc manifest, nhưng Claude cần nối IsoOffice vào màn chủ công ty riêng. PR này không tự sửa TypeScript.

Lô2 chưa làm; đợi Claude duyệt lô1. Kết quả test/build cuối ở validation.json. PR dùng Refs#55, không đóng toàn issue.
