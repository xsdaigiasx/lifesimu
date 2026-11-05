# Kế hoạch Basic 1.0 (bản chép từ Claude Docs)

Bản chép markdown của tài liệu Claude Docs *Kế hoạch và thiết kế Basic 1.0* (project `BvJJ1urceVRjfoNmQYohLr`, rev 65, chép 05/11/2026), chia theo phần để đọc bằng `grep` hoặc Read từng tệp thay cho đọc tài liệu gốc qua Docs (dài, hay bị phân trang và lỗi).

- Tài liệu gốc vẫn là bản chuẩn. Khi chủ dự án sửa tài liệu gốc thì chép lại (cách làm ở mục cuối).
- Tiến độ ticket: `../TICKETS.md`.

| Tệp | Dòng | Mục |
|---|---|---|
| `00-mo-dau.md` | 60 | Mục lục / Việc cần bạn chốt |
| `A-ke-hoach.md` | 209 | 1. Định nghĩa "bản cơ bản" / 2. Kiến trúc kỹ thuật bắt buộc / 3. Danh sách việc theo thứ tự phụ thuộc / 4. Ngân sách nội dung tối thiểu / 5. Quy trình giao Codex và review / 6. Kiểm thử, cân bằng và smoke test / 7. Chống nhàm ngay trong bản cơ bản / 8. Quyết định cần chốt trước khi bắt đầu Pha 0 / 9. Việc tiếp theo |
| `B-thiet-ke-he-thong.md` | 406 | 10. Tầm nhìn và ba chương / 11. Chỉ số nhân vật / 12. Kỹ năng và công việc kiểu game dev simulator / 13. Kinh tế vi mô và dòng tiền / 14. Nấu ăn / 15. Bản đồ dạng node và phương tiện / 16. Nhà ở và sắp xếp đồ đạc / 17. NPC nói chuyện theo sự kiện, không theo kịch bản / 18. Ngân hàng và mở công ty / 19. Trung tâm thương mại và các nguồn tiêu tiền / 20. Tìm "thiếu sót" và kiểm thử cân bằng |
| `C-noi-dung-npc.md` | 190 | 21. Nguyên tắc nội dung / 22. Pool thuộc tính / 23. Bộ sinh NPC và hồ sơ / 24. Quan hệ và bậc thân thiết / 25. Ký ức và chuỗi tiếp nối / 26. Mô-típ / 27. Ghép lời thoại / 28. Bốn mô-típ mẫu / 29. Khối lượng và sản xuất theo lô / 30. Kiểm tra ràng buộc và chống nhàm / 31. Tác động lên kế hoạch |
| `D-cong-ty.md` | 265 | 32. Vai trò của Chương 3 / 33. Ứng viên và thông tin ẩn / 34. Nhân viên là NPC có tính cách / 35. Dự án và phân việc nhóm / 36. Tài chính công ty / 37. Sai lầm tuyển dụng và hậu quả / 38. Chính sách công ty / 39. Mốc phát triển và kết thúc / 40. Dữ liệu và quy tắc kỹ thuật / 41. Ticket cho công ty |
| `E-pham-vi-day-du.md` | 194 | 42. Đối chiếu 15 mục với kế hoạch / 43. Phân giai đoạn phát hành / 44. Bản đồ và các khu vực / 45. Nhà ở và tiện ích / 46. Máy tính đa dụng / 47. Tin tức và thị trường / 48. Ăn uống / 49. Công viên và rèn luyện / 50. NPC liên kết nhau và cốt truyện đời / 51. Thành tựu / 52. Nâng cấp công ty / 53. Ticket bổ sung |
| `F-doi-nghe-online.md` | 132 | 54. Mỗi đời có hồ sơ riêng / 55. Chuyển đời, kế thừa, không mất gia sản / 56. Nghề là mô-đun / 57. Ngành kinh doanh / 58. Giữ chân hằng ngày / 59. Online / 60. Ticket bổ sung |
| `G-y-tuong-giu-chan.md` | 65 | 61. Thú cưng / 62. Sở thích trong nhà / 63. Cộng đồng khu trọ / 64. Hồi ức / 65. Cuối tuần có kế hoạch / 66. Mạng xã hội trong game / 67. Ticket bổ sung |
| `H-chi-so.md` | 230 | 68. Chỉ số nhân vật chính / 69. Chỉ số nhân viên NPC / 70. Chỉ số thế giới và công ty / 71. Công thức tham chiếu nhanh / 72. Quy tắc chung cho mọi chỉ số / 73. Chỗ chưa thống nhất cần chốt / 68. Chỉ số sống của người chơi / 69. Tiến trình và tài chính của người chơi / 70. Chỉ số nhân viên NPC / 71. Thú cưng, công ty, nhà ở, phương tiện / 72. Công thức liên kết các chỉ số / 73. Quyết định thống nhất chỉ số / 74. Tận dụng bản build v0.35 / Để dành phát triển sau |

## Chép lại khi tài liệu gốc đổi

1. Gọi `mcp__Claude_Docs__export` với `container {kind:project,id:BvJJ1urceVRjfoNmQYohLr}`, `file 6909d25a-6cb2`, `format markdown` (một lần gọi, không phân trang). Kết quả lớn được lưu ra tệp.
2. Giải base64 ở `data.bytes_b64`, cắt theo tiêu đề `# Phần A` đến `# Phần H` (hai phần H gộp vào `H-chi-so.md`), ghi đè các tệp ở đây, sửa số rev ở đầu tệp này.
3. Không sửa nội dung các tệp này bằng tay; sửa ở tài liệu gốc rồi chép lại.
