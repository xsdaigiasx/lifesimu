import {pinPosition} from '../map/city-layout';
import type {Place} from './types';
const basePlaces = [
    { id: 'home', name: 'Khu nhà trọ', icon: 'home', x: 20, y: 67, summary: 'Hẻm Nắng Phòng 03', detail: 'Khu trọ trong hẻm yên tĩnh. Phòng 03 là nơi bạn nghỉ ngơi sau một ngày làm việc.' },
    { id: 'office', name: 'Tòa nhà văn phòng', icon: 'city', x: 15, y: 28, summary: '6 công ty Sảnh, chỗ làm & mặt bằng cho thuê', detail: 'Nơi làm việc của các công ty tại An Nhiên. Giờ hành chính 08–12h và 13–17h.' },
    { id: 'market', name: 'Chợ dân sinh', icon: 'bag', x: 74, y: 88, summary: 'Nguyên liệu nấu ăn', detail: 'Khu chợ đông đúc với các sạp thực phẩm và đồ dùng hằng ngày.' },
    { id: 'mall', name: 'Trung tâm thương mại', icon: 'mall', x: 64, y: 31, summary: 'Mua sắm, giải trí Chưa mở', detail: 'Khu mua sắm hiện đại ở trung tâm thành phố.' },
    { id: 'bank', name: 'Ngân hàng', icon: 'bank', x: 40, y: 25, summary: 'Tiết kiệm và vay ngân hàng', detail: 'Chi nhánh ngân hàng phục vụ cư dân trong khu phố.' },
    { id: 'hospital', name: 'Bệnh viện', icon: 'hospital', x: 30, y: 47, summary: 'Khám và điều trị', detail: 'Bệnh viện của thành phố, nơi chăm sóc sức khỏe cho người dân.' },
    { id: 'bus', name: 'Trạm xe buýt', icon: 'bus', x: 15, y: 86, summary: 'Tuyến 07 Đi Hồ Sen ngoại ô', detail: 'Tuyến 07 đi Hồ Sen. Vé khứ hồi 40.000đ; mỗi lượt đi 45 phút.' },
    { id: 'park', name: 'Công viên', icon: 'leaf', x: 55, y: 67, summary: 'Đi dạo, tập luyện và nghỉ ngơi', detail: 'Khoảng xanh giữa phố, có lối dạo và đài phun nước.' },
    { id: 'streetfood', name: 'Quán ăn ven đường', icon: 'food', x: 32, y: 87, summary: 'Cà phê, bữa ăn bình dân', detail: 'Quán ăn nhỏ ven đường, quen thuộc với người đi làm.' },
    { id: 'restaurant', name: 'Nhà hàng', icon: 'restaurant', x: 88, y: 73, summary: 'Ăn uống, gặp gỡ Chưa mở', detail: 'Không gian ăn uống và gặp gỡ ở khu phố trung tâm.' },
    { id: 'apartments', name: 'Khu nhà phố', icon: 'building', x: 88, y: 32, summary: 'Nhà liền kề ven phố Chưa mở', detail: 'Khu nhà liền kề, phía dưới là cửa hàng và phía trên là chỗ ở.' },
    { id: 'villa', name: 'Biệt thự', icon: 'villa', x: 76, y: 51, summary: 'Khu nhà ở cao cấp Chưa mở', detail: 'Khu biệt thự yên tĩnh với sân vườn rộng.' }
] satisfies Place[];
export const places=basePlaces.map(place=>({...place,...pinPosition(place.id)}));
