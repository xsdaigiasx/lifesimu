# Bàn giao — Một đời để sống, Basic 1.0 (05/11/2026, cập nhật sau T31)

Bản trước: `HANDOVER-v0.35.md` (01/11). File này dành cho phiên Claude mới: đọc hết trước khi làm, rồi đọc `CLAUDE.md`, `AGENTS.md`, `README.md`.

## 1b. Cập nhật cuối phiên 05/11 (đọc trước mục 1)

- **T30, T31 đã vào main** (#168 khôi phục T30, #175 gom #169, #170, #172: ba lô lô 2, nút i nhỏ mỏng, T31). Đã lạc hai lần vì xếp chồng PR (PR con gộp vào nhánh của PR cha, không vào main). **Từ nay mỗi PR mở thẳng vào main**; nếu phải xếp chồng thì sau khi gộp PR cha phải đổi base về main trước khi gộp PR con.
- **T31 xong** (issue #171): `domain/weekend.ts` (ca làm thêm Thứ 7, Chủ nhật: 4 giờ, 240.000đ, −20 năng lượng, +5 căng thẳng, mỗi ngày một ca, mở mọi lúc, nút trong app Công việc) và `domain/inbox.ts` (`MOM_AID`: tiền mặt cộng tiết kiệm dưới 100.000đ thì Mẹ nhắn `mom-aid`; gọi Mẹ trong 3 ngày để nhận 1.000.000đ; 14 ngày một lần). Chưa chụp màn hình.
- **T32 xong, chờ gộp #178** (issue #177, 0.43.0): `domain/side.ts`. Chủ dự án duyệt 05/11: cần bàn làm việc cao cấp đặt trong phòng; tối đa 2 đơn mở (Lập trình, Đồ họa, Logic), hạn 7 ngày; mỗi buổi tối (sau 18:00) 2 giờ, −10 năng lượng, +3 căng thẳng, 4 buổi xong một đơn; trả 2 đến 5 triệu theo Lv yêu cầu (`payFor`); nộp trễ trả 70%; quá hạn 3 ngày khách huỷ; uy tín tay trái 0–100, khởi đầu 50, +5 đúng hạn, −5 trễ, −10 huỷ, `repOf(state)` cho T33. Slice `side` trong save, action `sideWork`, `settleSide` trong `settleLifeDay`. Chưa chụp màn hình.
- **Phản hồi giao diện 05/11**: nút i phải nhỏ và mỏng để không che sản phẩm trong ảnh; nếu thông tin phụ trên thẻ dài thì bỏ khỏi thẻ, để trong nút i (đã bỏ dòng kích thước ở thẻ nội thất).
- **Ticket tiếp theo: T33** (điều kiện, vốn, văn phòng khi mở công ty; phụ thuộc T30, T32). Đọc mục 18.2 và mục 32 của tài liệu Kế hoạch, gửi AskUserQuestion trước khi code. Chủ dự án chọn **điều kiện mở công ty thấp hơn đề xuất để dễ test** (đề xuất gốc: Quản lý ≥ Lv6, kỹ năng chính ≥ Lv7, ≥ 12 tháng làm việc, vốn ≥ 150 triệu), vốn khoảng 50 triệu; con số Lv, số tháng, ngưỡng uy tín tay trái chưa chốt, hỏi khi làm T33. Văn phòng Nhỏ 40 m² thuê trước. Sau T33: T34 đã tách thành T44–T50 (Phần D mục 32–41).
- **Issue**: đã đóng #160, #162, #163, #166, #171, #173. Còn mở: #55 (hoãn tới giai đoạn mở công ty). **#133 đã đóng 05/11**: lô 1 đến lô 4 đều xong và đã nối (lô 4 chín món tự trỏ `/assets/meals/<id>.webp`, không cần sửa mã; còn `onError` quay về ảnh Cơm trứng làm đường dự phòng). Cuối mỗi phiên: đóng issue của PR đã vào main (kiểm `base` = main), bình luận tiến độ vào #133.
- **Bài học thêm**: PR gộp vào nhánh của PR khác chưa tới main thì thay đổi bị lạc. Trước khi báo "đã gộp", kiểm `base` của PR phải là `main` (`gh api repos/xsdaigiasx/lifesimu/pulls/<n> --jq .base.ref`). Clone nông (`--depth 1`) không gộp được nhánh khác (`unrelated histories`): dùng cherry-pick. Hook Stop báo "chưa đẩy" thì thêm refspec nhánh (mục 3).

## 1. Tóm tắt

- Repo `xsdaigiasx/lifesimu`, game ở `app/` (React 19, TypeScript, Vite 8), engine kiểm tra ở `core/`.
- Thiết kế chi tiết: hai tài liệu Claude Docs *Workflow phát triển hoàn chỉnh* và *Kế hoạch và thiết kế Basic 1.0* (project `BvJJ1urceVRjfoNmQYohLr`, node `eb588493-56a5`; ticket T01–T89, mục "Để dành phát triển sau" ở cuối).
- Tiến độ Basic 1.0: T01–T24, T26–T30, T40, T41 xong (T29 đã gộp; T30 ở #165 chờ gộp); T25 bỏ, gộp vào issue #124.
- main ở `164f344` (app 0.39.1, đã gộp #158 nối ảnh Codex lô 1). **PR mở 05/11, gộp theo thứ tự**: #161 (TTTM và Mua sắm: ô mục, nút i, thang chữ, phí giao theo cỡ, 0.40.0), rồi #164 (nút i trong suốt, 0.40.1) và #165 (T30 Ngân hàng, 0.41.0); #164 và #165 tách từ nhánh của #161, sau khi #161 gộp thì đổi base về main. Issue mở: #133 (Codex asset), #55 (hoãn).

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
- **T29 xong, đã gộp #157** (issue #156, app 0.39.0). Chủ dự án duyệt 04/11: giỏ và đơn dùng chung cho đồ TTTM và nội thất; bán lại 55% giá gốc; đặt qua điện thoại phí giao 15.000đ mỗi đơn, giao sớm nhất hôm sau, trả khi nhận. Mã: `domain/orders.ts` (`checkout`, `placeOrder`, `receiveOrder`, `cancelOrder`, `sellBack`, `saleOf`, `validOrders`, slice `orders` trong save), `components/cart.ts` (giỏ trong bộ nhớ, không vào save), `ShopCards.tsx` (`HomeCards`, `CartPanel`), `MallShop.tsx` (thêm khu Nội thất, Bán lại, Giỏ hàng), `FurnitureShop.tsx` (điện thoại: giỏ, tab Đơn hàng). `buyHome` tách `planHome` (tính chưa trừ tiền). Mua nội thất trên điện thoại không còn tức thì: phải đặt và nhận hàng ở nhà; muốn mua ngay thì đến TTTM. Giới hạn: tối đa 8 món/giỏ, 3 đơn chờ; bán lại chỉ đồ không đang dùng, nội thất phải cất vào kho, tủ lạnh không bán. Test `tests/orders.test.cjs`. Để dành: giảm giá theo mùa và quan hệ, hạng Bình dân/Chuẩn/Cao cấp cho đồ TTTM, giao trễ ngẫu nhiên, nhận hàng ngoài nhà, ghi dòng này vào mục "Để dành phát triển sau" của tài liệu Kế hoạch (chưa ghi để tiết kiệm quota).
- **T28 xong, đã gộp #154** (issue #153, app 0.38.0): chạm đồ trong phòng trọ mở thanh thao tác (`USE_ACTIONS` trong `Room.tsx`): Giường Ngủ, Nghỉ 1 giờ; Bàn laptop Học, Làm thêm online (`domain/home-use.ts`: `napAtHome`, `onlineGig`, 1 lần/ngày, khoá `daily.nap`, `daily.gig`); Bàn ăn, Tủ lạnh mở Bếp. Hiệu ứng chỉ khi đồ đang đặt và đang ở trọ (`placedAt`, `livesInTro` trong `home.ts`): Tự học +0/10/20% XP theo mẫu bàn, ăn ở bàn Tâm trạng +2/3/4, trang trí giảm Căng thẳng đêm tối đa −6 (`decorRelief`). Test `tests/home-use.test.cjs`.
- **Codex lô 1 (#152) đã gộp và đã nối vào game** (issue #133, app 0.39.1): 112 ảnh chuyển sang WebP lossless (4,3 MB còn 2,9 MB, kiểm điểm ảnh giống hệt), `furniture-sprites.json` trỏ `.webp`, thêm tranh hướng c/d, tủ lạnh dùng ảnh mới, bỏ `fridge-*.svg` và `static-scenes/furniture-v2`; `HOME_ART` (đường dự phòng không còn dùng tới) trỏ `<id>-basic_a|b.webp`. Ảnh cửa `door-main-basic_*.webp` đã có nhưng chưa nối (chờ tính cửa trong `homeWalkError`). PNG gốc chỉ còn trong lịch sử git; `export.cjs`, `verify.cjs` của lô cần khôi phục PNG trước khi chạy. Lô 2 (8 đồ TTTM) và các lô sau của #133 chưa làm.
- **05/11 tối, chờ gộp #161/#164/#165**:
  - Mua sắm (TTTM và điện thoại): màn đầu là lưới ô mục (`ZoneGrid`, `ShopCards.tsx`), thanh trên chỉ có Giỏ và Kho (điện thoại: Đơn hàng và Giỏ); bán lại nằm trong Kho. Nút "i" (`ShopInfo.tsx`, biểu tượng vòng tròn nền trong suốt) mở bảng thông tin theo loại, dữ liệu ở `domain/specs.ts` (cân nặng, kích thước, điện năng, thực phẩm: hạn dùng, bảo quản). Chợ nguyên liệu cũng có nút i nhưng chưa chụp màn hình kiểm vị trí so với huy hiệu hàng chiều.
  - **Phí giao đơn điện thoại thay đổi** (thay mức 15.000đ của T29): `deliveryFee(lines)` = 10.000 + 800/kg tính phí (lớn hơn giữa cân thật và thể tích × 100 kg/m³), làm tròn nghìn, từ 15.000 đến 120.000đ. Không lưu trong save.
  - **Thang chữ 5 bậc** `public/type-scale.css` (22/16/13/11/10px, lớp `t-stat`, `t-title`…), quy tắc 9, 10 trong `app/AGENTS.md`. Màn cũ còn nhiều cỡ 7–9px, đổi dần khi chạm tới.
  - **T30 Ngân hàng** (`domain/bank.ts`, `BankDesk.tsx`, `PhoneBank.tsx`): vay 6/12/24 tháng lãi 14%/năm PMT, tối đa 2 khoản, hạn mức 3 × lương × hệ số tín dụng (0,5–1,2), điểm 300–850 khởi đầu 600, trễ hạn phí 2% một lần mỗi kỳ và −20 điểm, không âm số dư. Tiết kiệm 3/6/12 tháng lãi 4/5/6%/năm lưu `rate` lúc gửi (sổ cũ không có `rate`). Khoản vay cũ `life.loan` giữ để đọc save cũ, UI không mở mới. Action `loan`, `payLoan`, `payoff` đi qua `lifeAction`; `settleLifeDay` gọi `settleBank`. Chưa chụp: tab Tiết kiệm mới, màn trễ hạn.
  - Lỗi mất save 04/11 đã rõ nguyên nhân: đổi thử việc 60 về 30 ngày làm `validOffice` (`pr.end===pr.start+PROBATION_DAYS`) từ chối save cũ. Chủ dự án chọn **không sửa** (đang test). Khi có người chơi thật phải làm: validator nới, và giữ bản gốc ở khoá riêng khi tải lỗi.
  - Để dành chưa ghi vào tài liệu Kế hoạch: nút i cho chợ và đồ ăn mang về; điện năng chỉ là thông tin tới khi có hoá đơn điện nước; bảo hiểm, vay vốn kinh doanh, phục hồi mềm (T31).
- Ticket tiếp theo (chủ dự án 04/11 giao làm tiếp lần lượt cho xong Basic 1.0, không cần hỏi lại thứ tự): ticket tiếp theo theo bảng ticket trong tài liệu Kế hoạch (sau T30 là T31 Phục hồi mềm khi hết tiền, rồi theo bảng ticket). Nếu PR T29 chưa gộp mà ticket mới sửa cùng file thì tách nhánh từ `claude/156-gio-don-hang`, ghi "gộp sau" trong tiêu đề PR.
- Chụp màn hình phòng trọ: chọn Khu nhà trọ, Đến, Vào phòng; bấm đồ bằng `dispatchEvent('click')` (nút Đi ngủ đè lên giường). Playwright ở `/home/claude/.npm-global/lib/node_modules/playwright`. Mở phiên mới từ file này; trước khi làm, đọc đề xuất ticket trong tài liệu Kế hoạch và gửi AskUserQuestion ngắn nếu có chỗ chưa rõ. Phần đã có sẵn: lưới phòng trọ, xoay 4 hướng, kéo thả ở phòng trọ, chạm đặt ở nhà phố.
- **T26 xong** (issue #146): `uid` cho mỗi đồ (bản đầu giữ mã loại để save cũ khớp), trần số lượng `HOME_MAX` (cây, đèn 3; tranh 2; còn lại 1), mua thêm khi chưa đủ, tranh cùng tường không chồng. Nhà phố, biệt thự vẫn đặt một món mỗi loại (bản thể thứ 2 nằm trong kho); mở rộng khi làm T27 nếu cần.
- **T27 xong** (issue #148): `homeWalkError` (BFS): ô sàn trống phải thông từ bếp tới lối vào vệ sinh và cạnh giường; chỉ kiểm khi lưu, không kiểm khi tải save. Phòng chưa có cửa nên chưa tính cửa (thêm khi có ảnh cửa ở #133). Kéo, thả, xoay, hủy, chặn kéo cảnh trên điện thoại đã có từ trước.
- **Quy tắc phiên bản (chủ dự án 04/11)**: mỗi PR có thay đổi app nâng `version` (PR chỉ tài liệu thì không) trong `app/package.json` và `package-lock.json` (T26+T27 là 0.37.0; PR sau 0.37.1, 0.38.0… tuỳ cỡ).

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
