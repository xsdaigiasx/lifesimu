# Lõi engine (T01–T05)

| Ticket | File | Nội dung |
|---|---|---|
| T01 | `src/schema.ts`, `src/config.ts`, `data/config.json` | Bộ kiểm tra dữ liệu không phụ thuộc gói ngoài; cấu hình cân bằng có schema và kiểm tra nhất quán |
| T02 | `src/clock.ts`, `src/rng.ts` | Đồng hồ và lịch (ngày 0 = 2026-11-02, Thứ Hai); RNG sfc32 theo seed, nhiều dòng độc lập, lưu và khôi phục được |
| T03 | `src/ledger.ts` | Sổ cái idempotent theo `txId`, giao dịch nhiều chân nguyên tử, không cho số dư âm, nén mà vẫn chống trùng |
| T04 | `src/save.ts` | Save v2 có schema. Còn giữ migration từ save v1 (khoá `life-simulator-vi-v1`) nhưng không bắt buộc dùng: chủ dự án đã chốt không cần giữ save của bản build hiện tại |
| T05 | `src/sim.ts` | Mô phỏng không giao diện, tất định theo seed, chạy tiếp từ save giữa chừng cho cùng kết quả |
| Kỹ năng | `src/skills.ts` | Lv 1–10, XP lên từ Lv n = 80 × n^1,6 (làm tròn), khớp `app/src/domain/skill-xp.ts` |

## Dùng trong giao diện

```ts
import { parseSave, newGame, serializeSave, applySaveTx } from './core/src';

const loaded = parseSave(localStorage.getItem('mot-doi-de-song-save-v2') ?? '', { playthroughId: 'p1' });
const save = loaded.ok ? loaded.save : newGame({ seed: crypto.randomUUID(), playthroughId: 'p1' });
```

Bản build hiện tại chưa dùng lõi này; game chạy bằng logic trong `app/src/domain`.

## Việc còn lại khi nối vào bản build

- Thay mọi chỗ `money += …` hoặc `money -= …` bằng `applySaveTx` với `txId` theo quy ước `txIds`.
- Thay `Math.random` bằng `RngHub.stream(<tên hệ thống>)`.
- Chuyển dần từng phần trong `save.legacy` sang schema riêng theo các ticket sau.
- `data/config.json` vẫn cho ngày kết thúc lúc 22:00 (`dayEndMinute` 1320); quyết định đã chốt là thức tới 01:00. Sửa khi nối đồng hồ vào bản build.
