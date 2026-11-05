/** H1: kiểu dữ liệu của bộ sinh hội thoại (HOI-THOAI T.2). Câu NPC ghép từ khung (Frame) và mảnh (Piece) theo 6 trục. */
import type {PlaceId} from '../types';
import type {Voice} from '../lines';

/** Trục 1: ý định. */
export type Intent='brag'|'complain'|'ask'|'invite'|'request'|'news'|'tease'|'apologize';
export const INTENTS:readonly Intent[]=['brag','complain','ask','invite','request','news','tease','apologize'];
/** Trục 2: nhóm chủ đề. */
export type TopicGroup='self'|'player'|'other'|'world';
export const TOPIC_GROUPS:readonly TopicGroup[]=['self','player','other','world'];
/** Trục 3: cảm xúc trong ngày của NPC. */
export type Emotion='happy'|'excited'|'neutral'|'tired'|'sad'|'annoyed';
export const EMOTIONS:readonly Emotion[]=['happy','excited','neutral','tired','sad','annoyed'];
/** Trục 4: độ thân (Bất hoà, Lạ, Quen biết, Thân, Tri kỷ). */
export type Tier='hostile'|'stranger'|'acquaint'|'close'|'bestie';
export const TIERS:readonly Tier[]=['hostile','stranger','acquaint','close','bestie'];
/** Trục 6: kênh và thời điểm. */
export type Channel='face'|'text'|'call';
export const CHANNELS:readonly Channel[]=['face','text','call'];
export type When='morning'|'noon'|'afternoon'|'evening'|'late';
export const WHENS:readonly When[]=['morning','noon','afternoon','evening','late'];
/** Ô trong khung: mở lời, nội dung, cảm xúc, lời rủ hoặc nhờ, đuôi câu. */
export type Slot='open'|'body'|'feel'|'ask'|'tail';
export const SLOTS:readonly Slot[]=['open','body','feel','ask','tail'];
export const VOICES:readonly Voice[]=['tay','bac','trung','sg','que'];

/** Dữ kiện có thật trong game mà NPC có thể nhắc tới (H2 gom từ trạng thái game). */
export interface Fact{id:string;topic:TopicGroup;
 /** chủ đề con: 'food', 'rain', 'promotion', 'debt', 'sick'... */sub:string;
 /** 'player', mã NPC hoặc 'world' */about:string;
 day:number;tone:'good'|'bad'|'plain';private:0|1|2|3;
 /** ai được biết: mọi người, người có mặt hôm đó, hoặc danh sách NPC */knownBy:'all'|'present'|string[];
 vars:Record<string,string|number>}

/** Khung theo ý định. Ô có dấu `?` ở cuối là tuỳ chọn, thiếu mảnh thì bỏ qua. */
export interface Frame{id:string;intent:Intent;slots:string[];channel?:Channel[];weight?:number}
export interface Piece{id:string;slot:Slot;text:string;
 intent?:Intent[];
 /** chủ đề con hoặc nhóm chủ đề của dữ kiện; không ghi là dùng chung */topic?:string[];
 emotion?:Emotion[];minTier?:Tier;privacy?:0|1|2|3;
 /** vùng giọng; không ghi là trung tính */voice?:Voice;
 /** mảnh riêng của một người (mã vai) */npc?:string;
 /** biến phải có trong dữ kiện, thiếu thì loại */needs?:string[];
 where?:PlaceId[];when?:When[];channel?:Channel[];
 /** tuổi NPC [từ, đến] */age?:[number,number];
 /** câu hứa cho đồ: món (mã trong danh mục quà) và số lượng, người chơi Nhận thì cho thật */gift?:[string,number];
 /** mảnh lạnh nhạt: chỉ dùng khi Bất hoà */cold?:boolean;weight?:number}
export interface TalkData{frames:Frame[];pieces:Piece[]}
