# Phòng hình thoi v0.30

Ảnh runtime: public/assets/static-scenes/rental-diamond.png. Tạo bằng image_gen tích hợp, edit từ rental-open-front.png theo yêu cầu sửa hình phòng. Không dùng CLI/API fallback.

## Hệ tọa độ

Lưới10×10 dùng một hệ tọa độ chung cho nền/lưới/đồ/kéo thả/thảm. Gốc(50,30.25)%, mỗi bước hai trục là(+4.25,+2.875)% và(-4.25,+2.875)%. Bốn góc: sau(50,30.25), phải(92.5,59), trước(50,87.75), trái(7.5,59). Hai trục bằng nhau, đối xứng. Runtime căn theo góc ảnh thực tế (~34.08° mỗi bên); ảnh AI xấp xỉ yêu cầu30° trong prompt. Không khẳng định ảnh là mô hình3D đo kiến trúc chính xác.

Chỉ khóa dải y<3 cho bếp/vệ sinh. Bỏ hai vùng khóa góc cũ, gồm lối cửa phía trước đã xóa. Save cũ vẫn hợp lệ, không đổi tọa độ logic hay reset save.

Phòng dùng toàn vùng game sau header công cụ48px. Desktop kho đồ bên trái; mobile hàng ngang. Kích thước ảnh tính theo chiều rộng/cao thật của vùng nhìn, căn giữa và chỉ cắt phần nền giấy trống; kiểm tra ba góc sàn nhìn thấy đều trong viewport. Không còn footerKhu nhà trọ hay headerGóc nhỏ. Kỹ năng là icon ở hàng công cụ.

## Bản đồ

public/assets/player-bust.svg là SVG viết bằng mã: đầu–vai, không chân. Không có nhãn tên dưới icon; tên chỉ còn trong aria-label. Tam giác chỉ về địa điểm đang chọn khi nhìn thấy nhân vật; khi marker bám mép, tam giác xoay về vị trí thật ngoài khung. Bấm icon vẫn đưa camera về nhân vật. Tên các địa điểm không thay đổi.

## Prompt nền (built-in image_gen)

Use case: precise-object-edit. Redraw this cozy rental room game background using a STRICT TRUE ISOMETRIC ORTHOGRAPHIC CAMERA: azimuth45degrees, elevation35.264degrees, parallel vertical lines straight up. The SQUARE room floor must project to a perfectly symmetric DIAMOND RHOMBUS: both floor axes have IDENTICAL scale, going down-right30degrees and down-left30degrees. Square canvas. Exact desired floor-corner layout as percentages of canvas: hidden back floor corner(50,36), right corner(96,62.56), front corner(50,89.12), left corner(4,62.56). Both near foreground sides open, NO low walls or entrance door. Thin exposed wooden slab. Keep same warm honey-oak floor, same cream back walls/window on left, kitchenette along far edge and small enclosed bathroom occupying rear-right corner, painterly stylized game material. Kitchen and bathroom footprints sit INSIDE the diamond, not outside. Back wall height about24percent of canvas. Empty room, no furniture or people, no grid, no text. Center floor diamond horizontally. Keep surrounding background flat warm cream. Composition should be geometric, perfectly equal left/right floor sides, no wide-angle perspective or trapezoid floor. Match provided material/style, but correct camera and floor geometry to the stated equal-axis diamond.

