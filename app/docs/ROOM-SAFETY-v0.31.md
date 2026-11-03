# Mép an toàn và laptop v0.31

Ảnh sửa bằng image_gen tích hợp (không dùng CLI/API): public/assets/static-scenes/furniture-v2/desk-0.png. Runtime dùng query?v=31 để tránh cache cũ. Metadata biến thểdesk[1] được đo lại theo alpha. Không đổi ghế/bàn hay ảnh hướng còn lại.

## Mép an toàn

HOME_OUTER_FLOOR giữ toàn mặt sàn v0.30. HOME_SAFE_MARGIN=.5 theo lưới tham chiếu (xấp xỉ25cm ở tỷ lệ minh họa). HOME_FLOOR là vùng đặt đồ bên trong, co đều90% và dịch gốc vào khoảng lùi; toàn bộ sprite, footprint, lưới, thảm và phép đổi con trỏ dùng cùng hệ tọa độ này. Điểm trước của vùng đặt là(50,84.875)% so với mép sàn ngoài(50,87.75)%.

Bố cục đã lưu giữ nguyên các ô logic0–10 nhưng tự hiển thị phía trong viền; không reset save, không cất hoặc xóa đồ. Thả vào viền trả ra tọa độ ngoài vùng0–10 nên bị từ chối; giữ nguyên vị trí cũ. Khi sắp xếp có dải viền vàng nhạt và đường nét đứt để nhận biết. Khoảng mét là minh họa, không phải số đo mô hình3D.

## Prompt chỉnh laptop

Use case: precise-object-edit. Edit ONLY the laptop in this transparent isometric desk-and-chair game sprite. The laptop currently faces the WRONG side. Physically ROTATE ONLY THE LAPTOP 90degrees on the tabletop so the keyboard front/touchpad is nearest the green chair at the LOWER-RIGHT side, and the OPEN DISPLAY SCREEN faces that chair. The chair occupant must look directly into the display and type with the keyboard in front, not see the back of the lid. Laptop hinge and keyboard width edges must be PARALLEL to the tabletop edge beside the chair (that edge runs up-right/down-left); laptop front-to-back direction goes from chair/lower-right toward far/upper-left. We should see the dark display screen, not a solid exterior lid on the chair side. Keep EXACTLY the existing wooden desk, chair, camera, dimensions, framing, alpha, all legs, wood texture, drawer and lighting UNCHANGED. Only one laptop, no labels, no background, no halo, genuine transparent alpha.

## Kiểm chứng

npm test18suite; qa-home cho chuột/cảm ứng/lưu/reload; qa-home-safety seed bố cục giống ảnh người dùng, gồm cây ở9,9 và bàn/giường hướng90. Kiểm tra thả vào mép ngoài bị chặn, sau lưu cây vẫn9,9; xem ảnh hai hướng qua qa-home-art. Ảnh QA trong .qa-artifacts/home, không đóng gói.

