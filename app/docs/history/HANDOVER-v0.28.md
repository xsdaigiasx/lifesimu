# Bàn giao — Một đời để sống v0.28

Ngày: 01/11/2026. Đây là trạng thái mã nguồn bàn giao, không phải xác nhận website Cloudflare đang chạy đã được cập nhật.

## 1. Chạy và build

- React 19 + TypeScript, Vite 8; Node.js 24, npm.
- Giải nén source, mở terminal trong thư mục có package.json.
- `npm ci`
- `npm run dev`: chạy phát triển.
- `npm test`: kiểm thử domain và các điều kiện luồng game.
- `npm run build`: kiểm tra TypeScript và tạo dist.
- `npm run preview`: xem bản build.

Source ZIP chứa src, public (ảnh/âm thanh/font), tests, scripts, cấu hình và tài liệu. Không chứa node_modules, save người chơi, fixture trình duyệt, thông tin đăng nhập hay bản build dist. Bộ ảnh gốc của mọi lần thử không nằm đầy đủ trong source; các tài nguyên cần để chạy game có trong public.

## 2. Triển khai đúng cách người dùng đang dùng

Người dùng tải ZIP web tĩnh trực tiếp lên Cloudflare, không cần chuyển sang CLI. Sau khi build, nén NỘI DUNG dist: index.html và assets phải nằm ngay gốc ZIP, không thêm lớp thư mục dist hoặc source. Không thêm tệp `_redirects` vào gói này. Gói hiện hành Mot_Doi_De_Song_v0.28_Upload.zip có index.html và assets ở gốc; gói v0.27_Upload.zip cũ chưa có bản sửa kéo thả.

Nguyên nhân lỗi deploy trước chưa được xác nhận vì chưa có nguyên văn lỗi; việc bỏ `_redirects` là thay đổi đóng gói để trở về dạng bản24. Không khẳng định đây là nguyên nhân gốc. Cấu hình wrangler.jsonc chỉ dùng nếu người phát triển chọn triển khai bằng Wrangler; assets.directory trỏ ./dist, tên Worker motdoi. Không có tài khoản/token trong source.

## 3. Trạng thái chức năng

### Thành phố và địa điểm

- Giữ bản đồ 16 tile, tải/giải mã vùng ban đầu trước khi vào game; tải tiếp nền, kéo và pinch zoom.
- Địa điểm dùng mô tả ngắn và nút gọn; có thông báo khi đến.
- Camera theo vị trí thực nhân vật, tên địa điểm hiển thị; icon người đứng SVG ở vị trí hiện tại, bám mép khi kéo ra xa. Bấm icon để quay về nhân vật.
- Thanh dưới: Thành phố, Nhật ký, Quan hệ, Điện thoại.

### Công việc và kỹ năng

- Luồng CV → phỏng vấn ngày tiếp theo → nhận việc theo lịch domain; công việc IT, Lv/XP kỹ năng, học tối và lương kỳ tháng giữ nguyên.
- Hai ca 08–12h / 13–17h, tiến độ chạy nhanh; tự giao việc theo ngày/công ty/kỹ năng, lưu assignment để không đổi khi reload.
- Trong ca hiển thị góc máy tính + %, có pause/resume/rời ca; không trò chuyện, kể cả pause. Ngoài ca có hai đồng nghiệp An/Linh, điểm quan hệ/cooldown.
- Nhân viên không mua hay nâng cấp đồ công ty. Chủ công ty còn luồng riêng; không xem đó là hệ thống công ty tự động hóa đã hoàn thiện.
- 12h: popup ăn cơm và nghỉ đến13h, phí30.000đ, +20 năng lượng/-10 stress; hoặc ra ngoài một lát. Không ăn lại được khi đã13h. Chưa có chọn món/nấu ăn cho bữa trưa.
- 17h: popup hết ca, nút **Ra ngoài phố**, không tự đi về nhà. Trở về bản đồ trước công ty, giữ thời gian và vị trí office. Người chơi tự chọn nơi tiếp theo.
- Lời mời tăng ca khoảng30%, theo seed/ngày, ổn định khi tải lại; chỉ nhận lúc17h sau ca chiều, đủ18 năng lượng; chạy17–19h. Sau19h có popup ra phố. Thời gian được ghi vào kỳ lương mức thường; CHƯA có hệ số tăng ca riêng.
- Không vào công ty sau giờ khi không có ca tăng ca đang chạy; ngày nghỉ cũng khóa nhân viên. Dữ liệu lễ âm lịch ngoài2026 chưa đầy đủ.

### Nhà ở và nội thất

- Nền nhà trọ vuông đã chốt, dự kiến27m², có bếp và vệ sinh khép kín. Hình là ảnh minh họa, chưa bảo đảm số đo kiến trúc chính xác.
- Giường mặc định, không cho cất vào kho; bấm giường mở xác nhận ngủ đến sáng mai, phí sinh hoạt90.000đ do domain xử lý. Bỏ màn lịch sinh hoạt trong ngày; lịch hẹn trên điện thoại vẫn giữ.
- Cửa hàng nhà: giường, tủ, bàn laptop, bàn ăn nhỏ, cây, đèn, thảm. Giường/bàn laptop mặc định; đồ mua vào kho, chống mua trùng, trừ tiền và ghi sổ.
- Sắp xếp bằng lưới10×10 ô, mỗi ô cạnh0,5m (diện tích lưới25m²). Có chọn món/đặt/xoay90°/cất/lưu/hủy; chặn chồng đồ, bếp, vệ sinh, lối cửa. Hình nền dự kiến27m² và lưới25m² chưa được chuẩn hóa cùng tỷ lệ mét.
- v0.28: 14 PNG riêng cho 7 món × 2 hướng tại public/assets/static-scenes/furniture-v2. Căn theo vùng alpha và điểm chân riêng trong src/domain/home-art.ts. Thảm là ảnh raster được chiếu affine lên đúng bốn góc footprint; xoay là đổi trục trên sàn, không lật ảnh.
- Icon xoay/cất/lưu đặt cạnh món đang chọn; icon Lưu trong kho không đẩy khung phòng khi đổi lựa chọn. Phòng desktop tối đa520px, tự giảm theo chiều cao màn hình.
- Tường trước, tường phải/cửa và khối vệ sinh phủ lên đồ bằng vùng clip lấy đúng ảnh nền đã chốt; không thay ảnh nền. Lớp đồ z-index<=203, lớp tường500, icon600.
- Bỏ nhãn mọi món khi không sắp xếp, chỉ giữ nút Đi ngủ trên giường.
- Bản sửa local 31/10: kéo thả chuột/cảm ứng ngay trên nền phòng; kho có ảnh để kéo vào phòng. Lưới, con trỏ và vị trí đồ dùng chung phép chiếu. Vùng đặt xanh/đỏ; vị trí sai trả lại chỗ cũ. Có xoay/cất/lưu/hủy và di chuyển bằng phím mũi tên khi chọn đồ. Chừa 80px cho thanh địa điểm để không che nút Lưu. Không thay nền hoặc định dạng save. Bản sửa được đóng gói trong Mot_Doi_De_Song_v0.27_DragDrop_Source.zip và Mot_Doi_De_Song_v0.27_DragDrop_Upload.zip; hai ZIP gốc giữ lại làm lịch sử.
- v0.27 sửa CSS cũ làm phòng lệch sang phải, tiêu đề đè nút; sửa vùng cắt atlas và điểm đặt theo mặt sàn. Đã xem khung390×780 trên trình duyệt.

## 4. Điểm vào mã

| Phần | Tệp |
|---|---|
| Điều hướng, popup ca/ngủ, commit save | src/App.tsx |
| Bản đồ/camera/icon | src/components/CityMap.tsx, public/map-player.css, public/assets/standing-player.svg |
| Nhà/cửa hàng/editor/cắt atlas | src/components/Room.tsx, public/static-scenes.css |
| Kho nhà, giá, footprint, collision, validation | src/domain/home.ts |
| Phép chiếu sàn và tọa độ con trỏ | src/domain/home-geometry.ts |
| Ảnh riêng và anchor | src/domain/home-art.ts, docs/FURNITURE-RENDER.md |
| Công việc, tăng ca, bữa trưa, kỹ năng/lương | src/domain/work.ts |
| Đồng hồ, đi lại, kết thúc ngày | src/domain/time.ts |
| Save và kiểu dữ liệu | src/domain/engine.ts, src/domain/types.ts |
| Văn phòng và giao tiếp | src/components/Office.tsx, OfficeWorkScene.tsx; src/domain/social.ts |
| Cảnh công ty/máy tính | src/components/PackedOffice.tsx, WorkActivity.tsx |
| Tài nguyên mới | public/assets/static-scenes/ |

Save giữ key `life-simulator-vi-v1`, profile `life-simulator-profile-v1`; home/work là dữ liệu mở rộng optional để đọc save cũ. Không reset save để nâng phiên bản.

## 5. Kiểm chứng và giới hạn

- Đã qua TypeScript, production build và các suite hiện hành. Có test riêng shift-choices cho phí ăn trưa, chặn lặp, lời mời tăng ca ổn định, chạy/lưu/lương/khóa cửa. Browser QA mới nhất xác nhận nút Ra ngoài phố giữ nhân vật trước công ty và phòng không lệch khung.
- Chưa kiểm tra toàn bộ đồ ở mọi ô/hướng, mọi màn hình và mọi save cũ. Không xem build thành công là bằng chứng mọi ảnh đã chuẩn.
- Bộ ảnh v0.28 là ảnh AI độc lập theo hai hướng, không phải ảnh render từ một mô hình3D chung; chi tiết bất đối xứng giữa hướng có thể khác nhẹ. Thảm trong cảnh dùng một texture với phép chiếu sàn để bảo đảm góc xoay hình học; ảnh thảm90 gốc chỉ dùng thumbnail. Không cam kết mọi chi tiết là bản xoay3D tuyệt đối.
- Có anchor chân riêng theo alpha, phép chiếu thống nhất và lớp tường tiền cảnh. Tỷ lệ chiều cao và mét vẫn là minh họa; chưa kiểm tra đường đi liên tục. Vùng tường dùng mask cố định theo ảnh nền, không phải mô hình3D.
- Cần kiểm tra save nhà từ các bản thử đã cất giường trước khi khóa cất; migration bảo đảm mọi save có giường đặt trong phòng chưa hoàn chỉnh.
- Cửa hàng nội thất cũ trong điện thoại vẫn có dữ liệu/luồng legacy3 món; cần hợp nhất với kho nhà mới để tránh hai cửa hàng khác nhau. Không xóa đồ cũ của người chơi.
- Ca tăng ca hiện tính lương thường; nên chốt hệ số/phụ cấp trước khi mở rộng kinh tế. Một số nhãn ca chiều còn dùng chung khi đang tăng ca.
- Tính năng tương lai chưa hoàn thiện: nhà phố/biệt thự, công ty tự động hóa dòng tiền, điện nước/dịch vụ, thời tiết/mùa, NPC thế giới/sự kiện sâu, mua hàng giao hôm sau, đồ ăn hạn dùng/nấu ăn, bệnh viện, tiết kiệm/vay ngân hàng, về quê.

- QA bản sửa local: `npm test` qua 18 suite; `npm run build` qua. Edge headless kiểm tra chuột kéo từ kho và trực tiếp trong phòng, cảm ứng kéo từ kho, chặn va chạm, xoay, hủy, lưu/tải lại; nút Lưu dùng được ở 320×640, 390×780, 430×932 và 1280×900. Script: scripts/qa-home.cjs (cần Playwright/Edge, QA_BASE_URL tùy chọn; PLAYWRIGHT_MODULE nếu module cài ngoài dự án). Ảnh QA lưu ở .qa-artifacts/home; không đưa dữ liệu QA vào gói source.

## 6. Tài nguyên và quyền

Ảnh nhà, cảnh công ty/máy tính và atlas nội thất mới được tạo bằng công cụ tạo ảnh AI trong phiên làm việc theo chỉ đạo người dùng; SVG icon người đứng viết bằng mã. Tệp runtime nằm trong public, ảnh AI không phải sản phẩm cắt chính xác từ một bản vẽ3D. Không cam kết độc quyền hoặc quyền của bên thứ ba ngoài những gì có thể xác minh. Nguồn tài nguyên trước đó kế thừa docs/SOURCES.md; các ghi chú cũ mô tả ảnh/luồng đã thay không còn là trạng thái hiện hành. Bộ ZIP văn phòng người dùng đã bác bỏ không được coi là bộ tài nguyên được duyệt.

## 7. Ưu tiên tiếp theo

1. Tinh chỉnh tỷ lệ mét/chiều cao và đối chiếu chi tiết bất đối xứng giữa hai hướng khi cần.
2. Hợp nhất cửa hàng/kho legacy; migration giường cho save cũ.
3. Bổ sung kiểm thử UI ngủ, hai lựa chọn nghỉ trưa, từ chối/nhận tăng ca và ra phố sau19h.
4. Sau khi nhà trọ ổn định mới mở rộng các loại nhà và sự kiện đã chốt.



## Kiểm chứng v0.28

- npm test:18suite; npm run build:TypeScript và production.
- scripts/qa-home.cjs: kéo chuột/kéo cảm ứng, vị trí sai, xoay, lưu/hủy, tải lại và các khung320–1280px.
- scripts/qa-home-art.cjs: đủ7món ở0/90°, icon cạnh vật phẩm, giới hạn520px desktop, kiểm tra pixel lớp tường trước/phải/vệ sinh che marker trong khi phần sàn không che. Ảnh QA trong .qa-artifacts/home, không đóng gói.
- ZIP v0.28 gồm bản sửa này; các ZIP v0.27 và DragDrop cũ là lịch sử. Không triển khai lên Cloudflare trong phiên này.
