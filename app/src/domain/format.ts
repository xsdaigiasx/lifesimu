export const money=(n:number)=>new Intl.NumberFormat('vi-VN').format(n)+'đ';
export const dateAt=(day:number)=>new Date(Date.UTC(2026,10,2+day));
export const dateText=(day:number)=>new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'long',timeZone:'UTC'}).format(dateAt(day));
export const shortDate=(day:number)=>new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(dateAt(day));
