# Bàn giao — Một đời để sống, Basic 1.0 (04/11/2026)

Bản trước: `HANDOVER-v0.35.md` (01/11). File này dành cho phiên Claude mới: đọc hết trước khi làm, rồi đọc `CLAUDE.md`, `AGENTS.md`, `README.md`.

## 1. Tóm tắt

- Repo `xsdaigiasx/lifesimu`, game ở `app/` (React 19, TypeScript, Vite 8), engine kiểm tra ở `core/`.
- Thiết kế chi tiết: hai tài liệu Claude Docs *Workflow phát triển hoàn chỉnh* và *Kế hoạch và thiết kế Basic 1.0* (project `BvJJ1urceVRjfoNmQYohLr`, node `eb588493-56a5`; ticket T01–T89, mục "Để dành phát triển sau" ở cuối).
- Tiến độ Basic 1.0: khoảng 33% theo số ticket (T01–T24, T26, T27, T40, T41 xong; T25 bỏ, gộp vào issue #124). Phần làm trước của T28–T29 chưa tính.
- main hiện ở `96873a7` (gộp #150), bản app 0.37.0. Không có PR đang mở; chuỗi PR #134–#145 đã gộp hết. Issue mở: #133 (Codex asset), #55 (hoãn).

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
- Mang về và túi (#139): quán và nhà hàng hỏi Ăn tại chỗ hay Mang về (giá +10%, hạn 1 ngày); túi mặc định 3 món, ba lô (TTTM, 350.000đ) 8 món; món trong túi ăn ở đâu cũng được, tab Món đã nấu ở nhà hiện thẻ "Mang về". Ba lô dùng tạm biểu tượng ứng dụng, cần ảnh `products/backpack.webp` trong #133 lô 2.
- Mini game sự cố theo nhóm kỹ năng (`domain/bug-game.ts`, `GAMES_BY_SKILL`): Lập trình và Logic (nối dây, xếp số, chuỗi quy luật), Đồ họa (tìm khác biệt, mảnh thiếu, phối màu), Quản lý (xếp ưu tiên, chia người), Giao tiếp (tình huống, ghép lời), Nấu ăn (nhớ thứ tự, bấm nhịp). Chọn trò theo seed; không có đọc code.
- Ăn uống: rủi ro ngộ độc theo độ tươi, độ chín, không theo giá; món quán, nhà hàng không rủi ro.
- Bản đồ thành phố: ghép từ mảnh nhỏ (ô 256×128) thay ảnh lớn bị mờ.
- Phong cách đồ hoạ (chốt 04/11, issue #133): **bán hiện thực** như ảnh chuẩn `assets/style-reference/room-reference.webp`; thay phong cách sách truyện (#124) và màu phẳng cũ. Viền mảnh cùng tông, ánh sáng cố định trên-trái, không bóng đổ ngoài chân đế. Món ăn, nguyên liệu, chân dung NPC, địa điểm, nhà phố, biệt thự, vỏ phòng giữ nguyên.
- **Bản đồ thành phố giữ nguyên, huỷ sửa** (#97, #98 đóng 04/11): không ghép mảnh, không vẽ lại ô nền hay công trình.

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
| T23 thử nấu | #122 |
| T24 chợ chiều, bệnh do ăn uống; biểu tượng Chiều, thẻ cà phê | #126, #127, #128 |

## 6. Đang chờ

### Codex (asset)

- **#133** issue Codex duy nhất: vẽ lại mọi ảnh đồ theo phong cách bán hiện thực. Lô 1 nội thất phòng trọ (28 mẫu × 4 hướng, gồm tủ lạnh và cửa), lô 2 đồ TTTM (8), lô 3 đồ văn phòng (38), lô 4 món ăn mới (giữ phong cách món hiện có; gồm 3 món, 5 món tự chế, cà phê từ #120). Claude duyệt lô 1 bằng ảnh ghép tổng trước, đạt mới làm lô sau; khi gộp, bỏ `fridge-*.svg`, ảnh tạm cơm trứng và `static-scenes/furniture-v2`.
- **#55** đồ văn phòng mới, hoãn tới giai đoạn mở công ty, sẽ theo phong cách bán hiện thực.
- Đã đóng: #124, #97, #98, #120 (xem #133).

### Cần kiểm tra bằng chơi thử (chưa chụp màn hình)

Bấm nhịp, Nhớ thứ tự, thẻ món Bếp, cửa sổ chọn số lượng, Ăn tại chỗ hoặc Mang về (từ chuỗi #136–#143).

### Nghi vấn mất save (04/11 tối, chưa rõ nguyên nhân)

Chủ dự án báo một lần save quay về ngày 1 với 5.200.000đ. Cơ chế: `engine.parse` trả null thì `initialSession` tải `initial()` và autosave ghi đè save cũ. Đã thử tải save sinh từ 5 bản cũ (#76 đến #145) bằng build hiện tại, đều tải được. Cần: địa chỉ/máy lúc mất, nội dung `life-simulator-vi-v1` nếu còn. Đề xuất chưa làm (chờ duyệt): tải lỗi thì giữ bản gốc ở khoá riêng, không ghi đè.

### Claude

- **Để dành, chủ dự án nêu 04/11 chưa làm**: (1) hướng dẫn việc tiếp theo những ngày đầu và sau giờ làm, tạm hoãn tới khi xong toàn bộ game, ý chủ dự án là thêm hoạt động khác cho người chơi; (2) tên nhiệm vụ công việc còn đơn giản, cần đa dạng và thật hơn; (3) quán ăn: hỏi Ăn tại chỗ hay Mang về (#139).
- Ticket tiếp theo (chủ dự án 04/11 giao làm tiếp lần lượt cho xong Basic 1.0, không cần hỏi lại thứ tự): **T28**, rồi T29. Mở phiên mới từ file này; trước khi làm, đọc đề xuất ticket trong tài liệu Kế hoạch và gửi AskUserQuestion ngắn nếu có chỗ chưa rõ. Phần đã có sẵn: lưới phòng trọ, xoay 4 hướng, kéo thả ở phòng trọ, chạm đặt ở nhà phố.
- **T26 xong** (issue #146): `uid` cho mỗi đồ (bản đầu giữ mã loại để save cũ khớp), trần số lượng `HOME_MAX` (cây, đèn 3; tranh 2; còn lại 1), mua thêm khi chưa đủ, tranh cùng tường không chồng. Nhà phố, biệt thự vẫn đặt một món mỗi loại (bản thể thứ 2 nằm trong kho); mở rộng khi làm T27 nếu cần.
- **T27 xong** (issue #148): `homeWalkError` (BFS): ô sàn trống phải thông từ bếp tới lối vào vệ sinh và cạnh giường; chỉ kiểm khi lưu, không kiểm khi tải save. Phòng chưa có cửa nên chưa tính cửa (thêm khi có ảnh cửa ở #133). Kéo, thả, xoay, hủy, chặn kéo cảnh trên điện thoại đã có từ trước.
- **Quy tắc phiên bản (chủ dự án 04/11)**: mỗi PR có thay đổi app nâng `version` (PR chỉ tài liệu thì không) trong `app/package.json` và `package-lock.json` (T26+T27 là 0.37.0; PR sau 0.37.1, 0.38.0… tuỳ cỡ).
- Sau đó T28 (điểm dùng của đồ), T29 (TTTM giỏ, đơn, giao hàng, bán lại), rồi theo bảng ticket.

## 7. Bản đồ mã nguồn (domain mới hoặc đổi nhiều)

- `domain/inbox.ts` tin nhắn, cuộc gọi, hẹn; `voiceFor()` vai vế.
- `domain/director.ts` câu chuyện NPC; `lines.ts` câu thoại; `npc.ts` hồ sơ, xưng hô `ADDRESS`, `relationTier(score,id)`.
- `domain/life.ts` ăn uống, kho (lô có `cold`, `late`), tủ lạnh (`stockLot`, `chillPantry`), công thức (`knowsRecipe`, `learnRecipe`, `NPC_TEACHES`, `recipeSources`), nấu bừa (`improvise`, `improvName`, `improvCap`), rủi ro (`RISK`, `isStale`, `consume`), ăn ngoài `EAT_OUT`, ngân hàng `repayApp`, bệnh viện.
- `domain/vitals.ts` chỉ số, `applyIllness` (ngộ độc phát tác trễ, gọi trong `spendTime` và ca làm).
- `domain/home.ts` nội thất phòng trọ (`HOME_MODELS`, `FRIDGE`, `homeName`); `home-geometry.ts` lưới theo ảnh `room-master-storybook.webp` (vỏ phòng giữ nguyên) (1448×1086, gốc 724,350, ô 128×64).
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
- Phiên dài thì mở phiên mới từ file này. Phiên 04/11 tối làm T26, T27 và đóng issue trong một phiên là đã dài: sau 2 ticket thì dừng, cập nhật file này, mở phiên mới.
- Mẹo môi trường: không dùng `pkill -f` (giết luôn shell), dùng `fuser -k <cổng>/tcp`; clone nông cần thêm refspec nhánh mới (mục 3) kẻo hook báo commit chưa đẩy; `core` không có lockfile, cài bằng `npm install --no-package-lock`.
