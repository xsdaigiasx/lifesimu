# Issue #133 — lô 5: vỏ phòng và cảnh đang dùng

Vẽ bằng imagegen tích hợp, tham chiếu phong cách duy nhất `assets/style-reference/room-reference.webp`. Ảnh cũ trong repo là đích sửa và chuẩn bố cục, không dùng ảnh ngoài. Mỗi cảnh một prompt trong `prompts.json`.

## Phạm vi

14 tệp runtime, 9 thiết kế:

- `room-master-storybook.webp`: 1448×1086, gốc sàn (724,350), ô 128×64, phòng 8×8, bếp 5×1, tắm 3×3. Bếp, chậu rửa, toilet, vòi sen, cửa sổ giữ trong vỏ; không có đồ đặt được.
- `houses/{townhouse-t1,townhouse-t2,villa-t1,villa-t2}.webp`: khung gốc lần lượt 1984×1168, 1984×1168, 3904×2128, 2752×1552; giữ ox/oy từ house-floors.json và dữ liệu phòng/cửa/cầu thang từ manifest lô nhà cũ.
- `offices/{small,medium,large}/background.webp`: 1536×1536. Ba bộ vốn có vỏ giống hệt nên dùng cùng thiết kế mới.
- `offices/{small,medium,large}/room-cleaned-v02.png`: bản PNG cùng vỏ, giữ đường dẫn mà manifest/office-packs hiện tham chiếu. Không cần sửa TypeScript hoặc manifest runtime. Ngoài công trình chuyển từ nền than sang alpha, bỏ dấu lấp lánh cũ.
- `static-scenes/{office,work}.webp`: hai cảnh đang được PackedOffice.tsx và WorkActivity.tsx dùng, khung 1536×1024. Cảnh kín giữ nền opaque. Người trong office được lấy lại từ ảnh gốc trong vùng bảo vệ, không thiết kế lại nhân vật.
- `room-master.webp`: ảnh mẫu có đồ trong điện thoại (Phone.tsx), giữ khung 1448×1086 và nền kem. Đây là ảnh xem mẫu, không dùng làm vỏ đặt đồ.

Không sửa TypeScript, core, save, bản đồ, món ăn, nguyên liệu, chân dung, các sprite đồ đạc hay dữ liệu đặt đồ.

## Giữ hình học và kiểm ảnh

`export.cjs` chỉ hoàn thiện raster: căn vùng chiếm ảnh về bbox cũ, giữ nguyên alpha gốc của phòng trọ và 4 tầng nhà, phục hồi vùng nhân vật gốc, resample khung và nén. Không dựng hình hoặc vẽ thay imagegen. Manifest ghi cách căn, bbox nguồn/đích, hash nguồn và đầu ra, neo, chân đế cùng dữ liệu phòng/cửa/vách.

Alpha gốc và khung được kiểm bằng máy; `geometry-preview.webp` đặt lưới cố định cùng đường đỉnh vách lên ảnh trước/sau để duyệt kiến trúc. Đây là đối chiếu raster, không phải phép chứng minh vị trí từng nét nội thất bằng máy.

- `contact-sheet.webp`: đủ 14 tệp; `page-*.webp` là các trang phóng lớn.
- `room-grid-preview.webp`: vỏ phòng mới + giường, tủ, bàn, cây, thảm, đèn lô 1 ở tọa độ và neo runtime.
- `mobile-390x844.png`: trang duyệt asset có thể cuộn, không phải ảnh chụp trong game.
- `baseline.json`, `baseline-contact.webp`: thông số và ảnh trước khi sửa, từ d259886.
- `verify.cjs`: kiểm số tệp, khung, hash, dung lượng, alpha gốc, vùng nhân vật, dữ liệu hình học runtime không đổi.

Master ở generated_images của Codex; `sources.local.json` là ánh xạ cục bộ được gitignore. Cần sharp để chạy exporter/verifier/geometry-preview, Playwright Edge để chụp mobile.

Ba bản PNG tương thích dùng mẫu 768px phóng đúng 2 lần về khung 1536px và palette 72 màu để dưới 150 KB; ưu tiên giữ sắc độ hơn bản 16 màu ở khung gốc. Bản WebP giữ mẫu 1536px. Ở mức phóng lớn PNG sẽ kém mịn hơn WebP; Claude có thể đổi đường dẫn sang WebP trong PR tích hợp riêng.

Kết quả cuối: 14 tệp, tổng 1.856.056 byte, lớn nhất 142.248 byte. Verifier đạt; app test/build đạt trên main d34ac16 (app 0.43.1), core check đạt 18 test. Build chỉ còn các cảnh báo CSS giải quyết lúc runtime và chunk lớn có sẵn. Hai ảnh mobile đã được xem; chi tiết ở validation.json.

## Ảnh cũ không vẽ lại — đề nghị Claude dọn riêng

Rà home-art.ts, WorkActivity.tsx, PackedOffice.tsx và toàn bộ app/src: static-scenes chỉ còn office.webp và work.webp được dùng trực tiếp. Các tệp dưới đây không còn được JSX/TypeScript tham chiếu; PR này không xoá:

- bedside-lamp.png
- home-detail.webp
- home-furniture.png
- home-two-directions.png
- home.webp
- rental-approved.webp
- rental-open-front.png
- rental-storybook.webp
- rental-storybook-bath-mask.webp
- standing-icon.png

`rental-diamond.png` còn tên trong CSS .home-wall cũ và RELEASE.json, nhưng không có phần tử .home-wall trong app/src hiện tại. Claude kiểm và dọn cùng CSS/metadata cũ; không vẽ lại.

Lưu ý mặt nạ tắm cũ thực tế là 1536×1536, không phải 1448×1086 của vỏ hiện dùng. Vì không còn đường render tham chiếu, không tự đổi khung hoặc tái dùng nó.
