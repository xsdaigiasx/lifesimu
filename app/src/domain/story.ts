import type { StoryBeat } from './types';
    const rawBeats: StoryBeat[] = [
        { scene: 'black', duration: 6, tag: 'LỜI MỞ ĐẦU', text: 'Có những chuyến đi…\nkhông chỉ đưa ta đến một nơi khác.' },
        { art: '01_dawn', scene: 'rural', duration: 8, tag: '05:30 · QUÊ NHÀ', text: 'Sáng hôm ấy, làng vẫn còn ngủ.\nMẹ đã đứng đợi ngoài hiên từ bao giờ.' },
        { art: '02_goodbye', scene: 'rural', duration: 9, tag: 'LỜI MẸ DẶN', speaker: 'Mẹ', text: '“Lên đó nhớ ăn uống cho đàng hoàng.\nKhó quá thì về. Nhà mình vẫn ở đây.”' },
        { art: '03_ticket', scene: 'rural', duration: 8, tag: 'CHIẾC VÉ MỘT CHIỀU', text: 'Bạn gật đầu. Cất tấm vé vào túi.\nCó những lời hứa, lúc ấy chưa thể nói thành câu.' },
        { art: '04_departure', scene: 'rural', duration: 7, tag: 'TẠM BIỆT', text: 'Tiếng máy xe lấp đi lời tạm biệt.\nBóng mẹ nhỏ dần phía sau.' },
        { art: '05_seated', scene: 'bus', duration: 8, tag: 'TRÊN CHUYẾN XE', text: 'Hai mươi hai tuổi. Một chiếc ba lô.\nMột chiếc laptop cũ, đã theo bạn qua những đêm học lập trình.' },
        { art: '06_laptop', scene: 'bus', duration: 8, tag: 'NHỮNG ĐIỀU MANG THEO', text: 'Trong máy là vài dự án còn dang dở.\nTrong túi là số tiền dành dụm.\nTrong lòng là một thành phố chưa từng đặt chân đến.' },
        { art: '07_outskirts', scene: 'bus', duration: 7, tag: 'PHÍA BÊN KIA Ô CỬA', text: 'Đồng ruộng nhường chỗ cho những mái nhà.\nRồi những tòa nhà. Rồi một bầu trời đầy tiếng xe.' },
        { art: '08_open_door', scene: 'city', duration: 7, tag: '08:00 · THÀNH PHỐ', text: 'Xe dừng. Cánh cửa mở ra.\nThành phố chẳng biết bạn là ai.' },
        { art: '09_arrival', scene: 'city', duration: 8, tag: 'NGÀY ĐẦU TIÊN', text: 'Bạn đến đây để tìm công việc đầu tiên.\nNhưng trước hết… phải tìm một chỗ ở, một bữa ăn, một cơ hội.' },
        { art: '10_first_step', scene: 'city', duration: 8, tag: 'BƯỚC XUỐNG', text: 'Bạn siết lại quai ba lô.\nKhông ai biết ngày mai sẽ ra sao.\nLần này, chính bạn sẽ quyết định.' },
        { scene: 'title', duration: 9, tag: 'LIFE SIMULATOR', text: 'MỘT ĐỜI\nĐỂ SỐNG', sub: 'Từ một chuyến xe. Đến cuộc đời của bạn.' }
    ];
    let t = 0;
    const beats = rawBeats.map(b => { const next = { ...b, start: t }; t += b.duration; return next; });
    function locate(time: number): number { let i = beats.findIndex(b => time < b.start + b.duration); return i < 0 ? beats.length - 1 : Math.max(0, i); }
    function glyphs(text: string): string[] { return typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(text)].map(x => x.segment) : Array.from(text); }
    function reveal(text: string, seconds: number): string { let a = glyphs(text), budget = Math.max(0, seconds - .5), n = 0; for (const c of a) {
        budget -= /[.!?…]/.test(c) ? .23 : /[,;:]/.test(c) ? .10 : c === '\n' ? .18 : .032;
        if (budget < 0)
            break;
        n++;
    } return a.slice(0, n).join(''); }

export const story = { beats, duration: t, locate, reveal, glyphs };
export const genderedShots = new Set(['02_goodbye', '05_seated', '07_outskirts', '09_arrival', '10_first_step']);
export function shotURL(art: string, gender: 'male' | 'female'): string { return 'intro/shots/' + art + (genderedShots.has(art) ? '_' + gender : '') + '.webp'; }
