# Ghi chú kỹ thuật v0.11

## Kiến trúc

- `src/main.tsx`, `src/App.tsx`: React root, trạng thái và điều phối; không gọi renderer cũ.
- `src/components/`: bản đồ, phòng trọ, điện thoại, mở đầu, modal, cửa hàng và báo cáo bằng JSX.
- `src/domain/`: kiểu dữ liệu, kinh tế, hồ sơ, dữ liệu điện thoại, địa điểm, lời mở đầu. Logic thuần giữ định dạng save1 và số liệu cũ.
- `src/map/geometry.ts`: vùng nhìn, ô lân cận và tọa độ camera1440×960.
- `src/map/TileLoader.ts`: hàng đợi3 yêu cầu, ưu tiên vùng nhìn, khử tải lặp, chờ decode, timeout/lỗi/thử lại.
- `src/map/manifest.json`: nguồn và16 ô, kích thước thật, crop box và SHA256. URL có hash phiên bản để không dùng nhầm tile cũ từ cache.
- `public/`: CSS, font, ảnh, âm thanh. `dist/` sinh bởi Vite, không sửa tay.
- `art/map-quality/`: báo cáo không-upscale, pixel ghép và crop100%.

Không còn `window.LifeEngine`, renderer innerHTML, script-global hay cầu nối iframe trong bản game đang chạy. Tác vụ imperative giới hạn ở canvas, âm thanh, focus và hiệu ứng có cleanup.

## Bản đồ — phần đạt và chưa đạt

Bản đang bàn giao giữ hình học và12 vị trí từ master cũ để không lệch công trình. Nguồn hiện tại1536×1024 được cắt4×4 thành **16 ô384×256**. Đây là bản dự phòng trung thực, KHÔNG phải16 ô960×640.

Mỗi ô mã hóa WebP lossless; ghép lại pixel-identical với master đã giải mã, không resize, feather, blur hoặc đè mép. Canvas có kích thước bằng nguồn, vẽ các ô1:1 lên đúng tọa độ; phần hiển thị1440×960 không có filter blur hoặc chuyển động crossfade; có phóng/thu bản đồ bằng cử chỉ và quy đổi vùng nhìn về tọa độ gốc. Không vẽ lại toàn bộ raster mỗi lần kéo; mỗi ô chỉ vẽ khi được giải mã.

Mật độ nguồn hiện tại1536/1440≈1,07; mục tiêu3840/1440≈2,67 **chưa đạt**. Thay renderer không thể tạo chi tiết gốc còn thiếu trên điện thoạiDPR cao.

`npm run art:verify` kiểm16 file, SHA256, kích thước, từng crop và ghép lại; báo riêng `native3840TargetMet:false`. Lệnh thành công nghĩa là tính toàn vẹn của bản dự phòng đạt, không có nghĩa mục tiêu4K đã đạt.

## Chuẩn bị ảnh đúng3840×2560

Cần có master được vẽ chi tiết ở3840×2560 và kiểm nguồn/provenance + crop100% bằng mắt. Kích thước file đơn thuần không chứng minh được ảnh chưa bị upscale.

```sh
python scripts/prepare-map.py --source art/map-master-native.png --native-detail-reviewed
npm run art:verify
npm run build
```

Script sẽ từ chối nguồn khác3840×2560 trong chế độ chuẩn, không tự upscale. Cờ `--native-detail-reviewed` là xác nhận người thực hiện đã kiểm chứng chi tiết gốc, không phải thuật toán tự chứng minh độ phân giải. Chỉ khi nguồn đạt mới xuất16 ô960×640. Bản dự phòng có thể tái tạo bằng cờ rõ ràng `--allow-low-resolution-fallback`.

## Tải vùng trong lúc mở đầu

Bản đồ được gắn cùng lúc với màn mở đầu, giữ layout để đo đúng khung nhìn. Vùng nhà trọ được đặt camera trước, ô đang nhìn ưu tiên cao, ô lân cận ưu tiên sau. Chỉ khi toàn bộ vùng nhìn đầu đã tải và `decode()` xong mới mở nút **Bước vào thành phố** hoặc **Tiếp tục game đang chơi**. Cả nút disabled và handler đều có kiểm tra; bỏ qua mở đầu không vượt được cổng này.

Sau đó mới tải hết phần còn lại ở nền, không đợi đủ16 ô để vào game. Kéo sang vùng khác sẽ ưu tiên lại những ô đang cần. Lỗi mạng/giải mã hoặc sai kích thước không được tính là sẵn sàng; có thử lại.

## Tương thích và kiểm chứng

Giữ ba khóa save, schema, tiền ban đầu5.200.000đ, phí90.000đ/ngày, lịch02/11/2026; chỉ xác nhận mới qua ngày. Chọn biểu tượng không tự vào nhà; chỉ Về nhà mới đổi cảnh. Mua/cất/đặt nội thất giữ cơ chế cũ. Điện thoại đóng/mở bằng cùng nút, có chuyển động và giảm chuyển động; ghi chú, lịch, báo thức cấu hình và số liệu giữ định dạng cũ.

Giữ12 nhịp/93giây mở đầu,15 ảnh nam/nữ, các file âm thanh hiện tại. Nhạc không seek theo chữ/cảnh. morning-real đã là đoạn38giây cắt sẵn; bus-start-real đã7giây, phát từ0; không cắt thêm lần nữa.

Đã đạt: strict typecheck, build,5 nhóm kiểm thử chính (kinh tế/90ngày; điện thoại; hồ sơ/save/lời dẫn; bộ tải tile; handler mở đầu/âm thanh) và kiểm pixel ghép ảnh. Browser QA desktop và iframe viewport390×760: tạo hồ sơ nữ, bỏ qua→vào thành phố, phòng, mua cây, cùng nút đóng điện thoại, ghi chú Unicode tồn tại sau reload, chọn/xác nhận ngày và thu chi. Chưa nghiệm thu trên điện thoại vật lý/DPR cao hoặc kiểm mạng chậm thật; các lỗi decode/timeout được kiểm bằng ảnh giả lập.


Luồng tải mới và cử chỉ xem phần cuối README. Bộ đếm sẵn sàng dựa trên ô đã vẽ thành công, không chỉ ảnh đã giải mã.

## Thay đổi do chủ dự án quyết định (Issue #2, 2026-11-03)

Bỏ phí sinh hoạt 90.000đ/ngày. Thay bằng tiền trọ 1.500.000đ/tháng (`src/domain/rent.ts`): trả tháng đầu ngay sau phần mở đầu, các tháng sau tự trả vào ngày 1; thiếu tiền được gia hạn 3 ngày rồi bị giảm tâm trạng, tăng căng thẳng mỗi ngày. Save cũ không có `rent` không bị tính tiền ngay.
