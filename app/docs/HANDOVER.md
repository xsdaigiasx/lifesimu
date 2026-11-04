# Bàn giao — Một đời để sống, Basic 1.0 (04/11/2026)

Bản trước: `HANDOVER-v0.35.md` (01/11). File này dành cho phiên Claude mới: đọc hết trước khi làm, rồi đọc `CLAUDE.md`, `AGENTS.md`, `README.md`.

## 1. Tóm tắt

- Repo `xsdaigiasx/lifesimu`, game ở `app/` (React 19, TypeScript, Vite 8), engine kiểm tra ở `core/`.
- Thiết kế chi tiết: hai tài liệu Claude Docs *Workflow phát triển hoàn chỉnh* và *Kế hoạch và thiết kế Basic 1.0* (project `BvJJ1urceVRjfoNmQYohLr`, node `eb588493-56a5`; ticket T01–T89, mục "Để dành phát triển sau" ở cuối).
- Tiến độ Basic 1.0: khoảng 30% theo số ticket (T01–T24, T40, T41 xong; T25 bỏ, gộp vào issue #124). Tính cả phần làm trước của T26–T29 thì khoảng 33–35%.
- main hiện ở `859aa60` (gộp #128). Không có PR đang mở.

## 2. Quy trình bắt buộc

- Không bắt đầu ticket khi chủ dự án chưa duyệt đề xuất. Mỗi ticket: đề xuất ngắn (AskUserQuestion), duyệt, mở issue, nhánh `claude/<số-issue>-<tên>`, PR, **không tự gộp**.
- Trước khi đẩy: `cd app && npm test && npm run build`, `cd core && npm run check` đều xanh.
- Chụp màn hình kiểm tra (390×844) trước khi báo xong.
- Việc cố ý làm nhỏ hoặc hoãn: thêm một dòng vào "Để dành phát triển sau" ở tài liệu Kế hoạch.
- Trả lời chủ dự án bằng tiếng Việt, ngắn, hợp đọc trên điện thoại.

### Bài học (đã gây lỗi trong phiên trước)

- **Không thêm commit vào PR đã báo chủ dự án.** Chủ dự án gộp rất nhanh; commit đẩy sau khi gộp bị mất (đã xảy ra ở #75, #85, #95). Sửa thêm thì mở PR mới.
- **PR nối tiếp**: khi PR mới sửa cùng file với PR đang chờ, tách nhánh từ nhánh PR đó và ghi rõ "gộp sau #xx" trong tiêu đề, mô tả. Sau khi PR trước được gộp, gộp main vào nhánh sau để khỏi xung đột.
- Trước khi báo "gộp được", kiểm tra `mergeable_state` qua API.
- Trả lời bằng dữ liệu đã kiểm tra, không đoán (từng báo sai kết quả kiểm tra ảnh).

## 3. Môi trường phiên cloud

- npm: `NO_PROXY= no_proxy= npm ci --proxy="$HTTPS_PROXY" --https-proxy="$HTTPS_PROXY" --noproxy=""`.
- GitHub: chỉ dùng REST (`gh api repos/xsdaigiasx/lifesimu/...`), GraphQL không chạy. Mô tả PR dài thì ghi ra file rồi `-F body=@file`. API thỉnh thoảng trả 500/502: thử lại, rồi kiểm tra PR đã tạo chưa trước khi tạo lại.
- Sau khi đẩy nhánh mới: `git config --add remote.origin.fetch "+refs/heads/<b>:refs/remotes/origin/<b>"; git fetch origin; git branch -u origin/<b>`.
- Footer PR: `🤖 Generated with [Claude Code](https://claude.com/claude-code)` + link phiên. Commit kết thúc bằng `Co-Authored-By` và `Claude-Session`.
- Chụp màn hình: `npx vite preview --port 4174 --strictPort` (chạy nền, timeout dài), Playwright `require('playwright')`, nạp save vào localStorage `life-simulator-vi-v1`, hồ sơ `life-simulator-profile-v1` = `{"name":"Lâm","gender":"male","complete":true}`. Tạo save bằng `.test-build` (sau `npx tsc -p tsconfig.tests.json`).
- Test: `app/tests/*.test.cjs`, đăng ký vào mảng trong `app/scripts/test.mjs` (một dòng dài; chèn `,['tests/x.test.cjs']` sau mục cuối).

## 4. Quyết định đã chốt (ngoài CLAUDE.md)

- Giao diện: mỗi màn một việc; danh sách đồ là lưới thẻ có ảnh; thông tin phụ bằng biểu tượng kèm số có đơn vị rõ ("+2/ngày", "Nhanh 40%", "Căng thẳng −1/đêm"); nút cùng nhóm cùng cỡ; không tiêu đề lặp, không dòng mô tả thừa; nhãn trạng thái dạng biểu tượng đè góc ảnh.
- Thanh trên: ô giờ (T5 05/11, Ngày n) và ví cùng cao 42px; chip cảnh báo Đói, Mệt… hàng dưới khi có. Thanh dưới: Thành phố, Kỹ năng, Nhật ký, Quan hệ, Điện thoại.
- NPC: lựa chọn không lộ hệ quả, lựa chọn khoá hiện mờ; nhắc thời gian áng chừng (hôm qua, tuần trước…), không ghi ngày; NPC tự bắt chuyện ≤3/ngày; tin nhắn ≤2/ngày; xưng hô theo vai vế (người lớn nói kiểu người lớn, người chơi đáp "dạ… ạ").
- Tin nhắn trong điện thoại không tốn giờ; gọi điện 15 phút, chỉ Mẹ và người từ bậc Thân; hẹn đi ăn phải đến đúng nơi đúng giờ.
- Nội thất không chia hạng; mỗi loại 3 mẫu tên riêng (HOME_MODELS), mẫu đắt đẹp và nhiều tính năng hơn; xoay 4 hướng.
- Nhà phố, biệt thự: mỗi tầng một mặt bằng liền, kéo, phóng to; giá nhà phố thuê 6 triệu hoặc mua 2,5 tỷ, biệt thự 12 tỷ.
- Ăn uống: rủi ro ngộ độc theo độ tươi, độ chín, không theo giá; món quán, nhà hàng không rủi ro.
- Bản đồ thành phố: ghép từ mảnh nhỏ (ô 256×128) thay ảnh lớn bị mờ.
- Phong cách vẽ (chốt lại 04/11, issue #124): vẽ tay kiểu sách truyện, viền nâu đậm dày run tay, bo tròn, mũm mĩm, tô bút chì màu, nhiều đồ lặt vặt. Món ăn, đồ TTTM, chân dung NPC đã đạt, giữ nguyên.

## 5. Đã làm trong phiên 04/11 (đều đã vào main)

| Phần | PR |
|---|---|
| T20 tin nhắn, gọi điện, hẹn; xưng hô theo vai vế | #75, #76 |
| Báo chỉ số tăng giảm, cảnh báo thanh trên, quán ăn ven đường | #78 |
| Công thức mở dần, app Ngân hàng | #80 |
| Nhà hàng, Trung tâm thương mại | #82 |
| Nhà phố, biệt thự (mặt bằng liền vào ở #107) | #85, #107 |
| Ảnh nguyên liệu, ảnh lô 1–3 (món, đồ TTTM, chân dung) | #87, #105 |
| Nội thất bỏ hạng, 3 mẫu | #91 |
| Thanh trên, màn Sức khỏe | #93, #95, #96 |
| Ảnh lô 4–6, phòng trọ 2:1, nội thất 4 hướng | #107, #112 |
| Mua sắm điện thoại ảnh nhỏ; phòng trọ biểu tượng, tab Kỹ năng | #110, #114 |
| T21 tủ lạnh | #116 |
| T22 sổ công thức, ba nguồn học món | #119 |
| T23 nấu bừa | #122 |
| T24 chợ chiều, bệnh do ăn uống; biểu tượng Chiều, thẻ cà phê | #126, #127, #128 |

## 6. Đang chờ

### Codex (asset)

- **#124** chốt lại phong cách: Codex gửi PR thử gồm vỏ phòng trọ + 3 món (giường gỗ có ngăn kéo, tủ gỗ hai cánh, bàn gỗ có kệ sách) đủ 4 hướng. Claude ghép thử vào game (khớp ô, nét, tỉ lệ), báo chủ dự án. Điều kiện ghép ghi ở bình luận của #124 (tách lớp, đúng lưới lô 6, bố cục bếp 5×1 và phòng tắm 3×3, 4 hướng cùng thiết kế, không nền tối). Duyệt xong mới vẽ lại lô 4, 5, 6, ô nền và công trình bản đồ.
- **#120** ảnh 3 món mới (rauMuong, thitKho, comChien), 5 ảnh món tự chế (improv-com/xao/rim/luoc/la), cà phê, tủ lạnh 3 mẫu 4 hướng. Hiện đang dùng ảnh tạm (Cơm trứng, biểu tượng cốc, khối SVG `fridge-*.svg`).
- **#97** mảnh bản đồ: lô A (#118) và lô B (#123) đã đóng vì sai phong cách, chờ #124.
- **#55** đồ văn phòng, hoãn tới giai đoạn mở công ty.

### Claude

- **#98** dựng bản đồ ghép từ mảnh (khối tạm trước, nạp ảnh theo manifest) — chờ chủ dự án duyệt bắt đầu.
- Ticket tiếp theo: chủ dự án chọn **T26** (kho đồ, instanceId, lưới phòng) hay **T27** (chế độ bố trí: kéo, thả, xoay, huỷ, BFS lối đi). Phần đã có sẵn: lưới phòng trọ, xoay 4 hướng, kéo thả ở phòng trọ, chạm đặt ở nhà phố.
- Sau đó T28 (điểm dùng của đồ), T29 (TTTM giỏ, đơn, giao hàng, bán lại), rồi theo bảng ticket.

## 7. Bản đồ mã nguồn (domain mới hoặc đổi nhiều)

- `domain/inbox.ts` tin nhắn, cuộc gọi, hẹn; `voiceFor()` vai vế.
- `domain/director.ts` câu chuyện NPC; `lines.ts` câu thoại; `npc.ts` hồ sơ, xưng hô `ADDRESS`, `relationTier(score,id)`.
- `domain/life.ts` ăn uống, kho (lô có `cold`, `late`), tủ lạnh (`stockLot`, `chillPantry`), công thức (`knowsRecipe`, `learnRecipe`, `NPC_TEACHES`, `recipeSources`), nấu bừa (`improvise`, `improvName`, `improvCap`), rủi ro (`RISK`, `isStale`, `consume`), ăn ngoài `EAT_OUT`, ngân hàng `repayApp`, bệnh viện.
- `domain/vitals.ts` chỉ số, `applyIllness` (ngộ độc phát tác trễ, gọi trong `spendTime` và ca làm).
- `domain/home.ts` nội thất phòng trọ (`HOME_MODELS`, `FRIDGE`, `homeName`); `home-geometry.ts` lưới theo ảnh `room-master-storybook.webp` (1448×1086, gốc 724,350, ô 128×64).
- `domain/housing.ts` nhà phố, biệt thự (`HOUSES` theo tầng, `arrangeFloor`, `moveHouse`, `residenceOf`).
- `domain/stat-delta.ts` chip chỉ số sau mỗi hành động.
- `domain/furniture-sprites.json`, `house-floors.json` số đo ảnh Codex.
- Giao diện mới: `PhoneSocial.tsx`, `PhoneBank.tsx`, `MallShop.tsx`, `HouseView.tsx`, `HouseVisit.tsx`, `Improvise.tsx`, `NpcFace.tsx`, `furniture-art.ts`. CSS mới: `public/phone-social.css`, `life-feedback.css`, `housing.css`, `topbar.css` (nhớ tăng `?v=` trong `index.html` khi sửa).

## 8. Lưu ý kỹ thuật

- Mọi slice mới của save phải có validator và được nối vào `engine.ts`; test phải kiểm `engine.valid` và `engine.parse(JSON.stringify(s))`.
- Ngẫu nhiên luôn theo seed (hash ngày, id) để tải lại không đổi kết quả.
- Phòng trọ vẽ bằng sprite lô 5 neo đáy chân đế; ảnh nội thất cũ `static-scenes/furniture-v2` chỉ còn làm dự phòng.
- Ảnh tạm thiếu thì có `onError` quay về ảnh Cơm trứng hoặc biểu tượng.
- Thông tin tài khoản (hạn mức tuần) Claude không xem được; chủ dự án xem ở Settings > Usage.

## 9. Tiết kiệm quota (chủ dự án chốt 04/11)

- Trả lời ngắn; gộp sửa nhỏ vào một lượt; việc đã duyệt thì làm luôn, không hỏi lại.
- Chỉ chụp màn hình chính khi cần; review asset Codex bằng ảnh ghép tổng, không mở từng ảnh.
- Không đọc lại tài liệu Claude Docs dài trừ khi cần.
- Việc đơn giản (chữ, màu, icon) dùng Sonnet; thiết kế cơ chế, ticket lớn dùng Opus.
- Phiên dài thì mở phiên mới từ file này.
