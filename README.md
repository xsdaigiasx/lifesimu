# Một đời để sống

Game mô phỏng đời sống một thanh niên từ quê lên phố, kết hợp trang trí nhà cửa isometric.

## Cấu trúc kho

| Thư mục | Nội dung | Ai làm |
|---|---|---|
| `core/` | Lõi engine thuần TypeScript (không phụ thuộc giao diện): đồng hồ, RNG theo seed, sổ cái giao dịch, save có migration, mô phỏng | Claude |
| `app/` (sắp thêm) | Giao diện React của bản build v0.35 | Đẩy source v0.35 vào đây |
| `assets/` (sắp thêm) | Ảnh isometric, icon, âm thanh theo bảng đặc tả asset | Codex |

## Quy tắc chung

1. Engine không biết giao diện; giao diện gửi lệnh, engine kiểm tra rồi đổi state.
2. Mọi thay đổi tiền đi qua **sổ cái có `txId`**, nên không trừ hoặc thưởng trùng khi reload.
3. Mọi ngẫu nhiên dùng **RNG theo seed** lưu trong save.
4. **Đồng hồ game** là nguồn thời gian duy nhất.
5. Số cân bằng nằm trong `core/data/*.json`, không hard-code.
6. Save có phiên bản và migration; không bao giờ reset save của người chơi.
7. Mỗi ticket một nhánh; chỉ gộp khi test xanh và không còn lỗi mức Chặn.

## Chạy lõi engine

```bash
cd core
npm install
npm run check   # kiểm tra kiểu + chạy test
```

Workflow và thiết kế chi tiết nằm trong hai tài liệu Claude Docs của dự án: *Workflow phát triển hoàn chỉnh* và *Kế hoạch và thiết kế Basic 1.0*.
