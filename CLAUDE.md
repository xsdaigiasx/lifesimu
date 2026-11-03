# Ghi chú cho Claude

Dự án **Một đời để sống**. Đọc `AGENTS.md` để biết vai trò và quy cách asset. Thiết kế chi tiết nằm trong hai tài liệu Claude Docs: *Workflow phát triển hoàn chỉnh* (thứ tự, vai trò, quyết định đã chốt ở mục 12) và *Kế hoạch và thiết kế Basic 1.0* (cơ chế, công thức, ticket T01–T89).

## Việc của Claude

- Code lõi trong `core/` và logic game; giữ bảy quy tắc ở `README.md`.
- Không bắt đầu ticket khi kế hoạch hoặc quyết định liên quan chưa được chủ dự án duyệt.
- Mỗi ticket một nhánh `claude/<số-issue>-<tên>`, mở PR, không tự gộp.
- Trước khi đẩy: `cd core && npm run check` phải xanh.

## Review PR của Codex

1. Lấy nhánh về, chạy `npm run check` và build.
2. Asset: đối chiếu checklist trong mục 10 của workflow (khung, điểm neo, góc 2:1, không bóng đổ, hai hướng khớp nhau, nền sạch, dung lượng, không thương hiệu); đặt thử lên lưới phòng.
3. Bình luận trên PR qua REST API (`gh api repos/xsdaigiasx/lifesimu/...`; GraphQL không dùng được trong phiên này), chia mức **Chặn / Nên sửa / Gợi ý**.

## Quyết định đã chốt cần nhớ khi code

- Dậy 07:00; được thức tới 01:00, đến 01:00 thì ngất (về nhà hoặc viện, có thể mất tối đa 20% tiền mặt, không mất tiền ngân hàng).
- Sau phần mở đầu có màn trả tiền trọ hiện rõ; mỗi kỳ trả đều có thông báo.
- Mỗi năm game có tổng kết; không có kết thúc cứng.
- Phòng trọ 8×8 ô, phòng tắm 3×3. Kỹ năng cấp 1–50, Lv hiệu dụng = cấp / 5.
- Thiệt hại giao việc sai theo 5 mức và điểm lệch (workflow 12.2).
