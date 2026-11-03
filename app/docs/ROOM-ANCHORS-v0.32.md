# Căn tâm nội thất và vuốt kho — v0.32

Không tạo ảnh AI mới. Dùng nguyên bộ ảnh đang có; chỉnh cách chiếu và xử lý đầu vào.

## Ground anchor

Trước đây lấy trung bình dải alpha thấp nhất làm góc trước footprint. Một chân bàn/giường hoặc mép chậu không phải tâm mặt đỡ nên ảnh có thể lệch khỏi ô. Nay HOME_GROUND ghi tâm sàn đỡ riêng theo phần trăm mỗi ảnh, ước lượng từ các chân đối diện hoặc tâm đế tròn; chiều rộng nền đỡ dùng cho các món dạng hộp. Image transform-origin và vị trí button cùng dùng tâm này; tâm sàn đỡ gắn vào floorPoint(x+w/2,y+h/2).

Tham chiếu ảnh kiểm tra có lưới tọa độ tại .qa-artifacts/calibration, không đưa vào ZIP. Hệ số nằm trong src/domain/home-art.ts. Alpha bounds cũ chỉ còn dùng dữ liệu ảnh/thumbnail. Thảm vẫn chiếu texture lên bốn góc sàn chính xác như trước.

Độ dốc camera tham chiếu được hiệu chỉnh lại theo cạnh thẳng, giữ cạnh đứng; ảnh AI không hoàn toàn trực giao ở mọi cạnh, nên không thể bảo đảm mọi nét phối cảnh giống mô hình3D. Đây là hiệu chỉnh ảnh2D với tâm mặt đỡ cố định.

## Rotate and save

rotateHomeObject tính top-left mới từ tâm cũ: x+=(oldW-newW)/2, y+=(oldH-newH)/2. Tọa độ có thể là nửa ô cho footprint cạnh lẻ. validHome cho phép bội0.5; collision kiểm tra rectangle overlap liên tục. Di chuyển cũng snap nửa ô. Không đủ chỗ thì giữ nguyên bố cục. Không xóa/reset/migrate ép vị trí của save cũ.

## Touch gestures

Kho mobile cho trình duyệt pan-x, kho desktop pan-y. Chạm lên thumbnail chưa preventDefault/capture; chờ hướng di chuyển vượt10px. Theo trục cuộn: bỏ pending drag, cho native scroll. Vuông góc: chọn món và capture để kéo. Tap riêng vẫn chọn được ngay sau một lần vuốt. lostpointercapture từ img con không được hủy drag đang chuyển sang button.

scripts/qa-home-shelf.cjs kiểm tra bằng CDP touch: vuốt sang cuối7món, lựa chọn cũ không đổi; kéo cây dọc vào phòng, save; kéo/xoay giường giữ nguyên left/top của tâm; reload vẫn giữ bố cục. Unit test phủ cả7món, cả0/90 và các va chạm lệch nửa ô.
