# Lõi engine (T01–T05)

| Ticket | File | Nội dung |
|---|---|---|
| T01 | `src/schema.ts`, `src/config.ts`, `data/config.json` | Bộ kiểm tra dữ liệu không phụ thuộc gói ngoài; cấu hình cân bằng có schema và kiểm tra nhất quán |
| T02 | `src/clock.ts`, `src/rng.ts` | Đồng hồ và lịch (ngày 0 = 2026-11-02, Thứ Hai); RNG sfc32 theo seed, nhiều dòng độc lập, lưu và khôi phục được |
| T03 | `src/ledger.ts` | Sổ cái idempotent theo `txId`, giao dịch nhiều chân nguyên tử, không cho số dư âm, nén mà vẫn chống trùng |
| T04 | `src/save.ts` | Save v2 có schema; migration thuần từ save v1 của bản build v0.35 (khoá `life-simulator-vi-v1`), giữ phần chưa hiểu trong `legacy` |
| T05 | `src/sim.ts` | Mô phỏng không giao diện, tất định theo seed, chạy tiếp từ save giữa chừng cho cùng kết quả |
| Kỹ năng | `src/skills.ts` | Giữ đường cong XP của v0.35 (cấp 1–50, XP = 100 + 25 × (cấp − 1)); Lv hiệu dụng = cấp / 5 |

## Dùng trong giao diện

```ts
import { parseSave, newGame, serializeSave, applySaveTx, LEGACY_STORAGE_KEY } from './core/src';

const loaded = parseSave(localStorage.getItem(LEGACY_STORAGE_KEY) ?? '', { playthroughId: 'p1' });
const save = loaded.ok ? loaded.save : newGame({ seed: crypto.randomUUID(), playthroughId: 'p1' });
```

Ghi save mới vào một khoá riêng (ví dụ `mot-doi-de-song-save-v2`) và giữ khoá cũ làm bản dự phòng cho đến khi chắc chắn chuyển đổi ổn.

## Việc còn lại khi nối vào bản build

- Thay mọi chỗ `money += …` hoặc `money -= …` bằng `applySaveTx` với `txId` theo quy ước `txIds`.
- Thay `Math.random` bằng `RngHub.stream(<tên hệ thống>)`.
- Chuyển dần từng phần trong `save.legacy` sang schema riêng theo các ticket sau.
