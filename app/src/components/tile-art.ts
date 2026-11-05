import TILES from '../domain/tile-art.json';
/** Ảnh riêng của ô trong danh sách (chợ, cửa hàng, bếp). Khoá `<nhóm>-<id>` ghi ở domain/tile-art.json; chưa có khoá thì ô dùng biểu tượng. */
export type TileGroup='market'|'shop'|'kitchen';
export const tileArt=(group:TileGroup,id:string):string|undefined=>{const k=`${group}-${id}`;return (TILES as string[]).includes(k)?`/assets/tiles/${k}.webp`:undefined};
