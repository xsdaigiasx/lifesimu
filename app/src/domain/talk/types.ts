/** H1: kiểu dữ liệu của bộ sinh hội thoại (HOI-THOAI T.2). Câu NPC ghép từ khung (Frame) và mảnh (Piece) theo 6 trục. */
import type {PlaceId} from '../types';
import type {Voice} from '../lines';
import type {Plan} from './outing';

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
 vars:Record<string,string|number>;
 /** #364: nhãn biến cố chính xác, không gộp bán ế/đắt hàng thành money. */tags?:string[]}

/** H6: chủ đề người chơi tự mở lời: hỏi thăm sức khoẻ, công việc; kể chuyện mình; hỏi chuyện của họ; nhờ việc, hỏi mua bán. */
export type PlayerTopic='health'|'mine'|'theirs'|'favor';
export const PLAYER_TOPICS:readonly PlayerTopic[]=['health','mine','theirs','favor'];
/** H6: hành động của người chơi ở lượt trước mà NPC đáp tiếp (Hỏi thêm, Giúp, Kể chuyện mình) hoặc gạt đi (tin nhắn: từ chối, im lặng, né). */
export type After='ask'|'help'|'share'|'brush';
export const AFTERS:readonly After[]=['ask','help','share','brush'];
/** Kiểu khung đặc biệt: câu đáp tiếp lượt sau (`follow`) hoặc câu đáp chủ đề người chơi mở (`answer`). Khung thường không ghi. */
export type FrameMode='follow'|'answer';
/** Khung theo ý định. Ô có dấu `?` ở cuối là tuỳ chọn, thiếu mảnh thì bỏ qua. Khung `mode` dùng cho mọi ý định (không ghi `intent`). */
export interface Frame{id:string;intent?:Intent;mode?:FrameMode;slots:string[];channel?:Channel[];weight?:number}
export interface Piece{id:string;slot:Slot;text:string;
 intent?:Intent[];
 /** chủ đề con hoặc nhóm chủ đề của dữ kiện; không ghi là dùng chung */topic?:string[];
 emotion?:Emotion[];minTier?:Tier;privacy?:0|1|2|3;
 /** vùng giọng; không ghi là trung tính */voice?:Voice;
 /** mảnh riêng của một người (mã vai) */npc?:string;
 /** H7a: mảnh riêng của NPC ngẫu nhiên theo kiểu người (town-data.ts) */arch?:string[];
 /** H7a: kiểu người NPC ngẫu nhiên không dùng mảnh này (đánh cờ thì không "đi nha") */noArch?:string[];
 /** H7a: chỉ dùng khi dữ kiện có tông này (tốt, xấu, thường) */tone?:('good'|'bad'|'plain')[];
 /** H7a: true chỉ NPC ngẫu nhiên nói; false thì NPC ngẫu nhiên không nói (câu của người buôn bán) */town?:boolean;
 /** biến phải có trong dữ kiện, thiếu thì loại */needs?:string[];
 where?:PlaceId[];when?:When[];channel?:Channel[];
 /** tuổi NPC [từ, đến] */age?:[number,number];
 /** câu hứa cho đồ: món (mã trong danh mục quà) và số lượng, người chơi Nhận thì cho thật */gift?:[string,number];
 /** mảnh lạnh nhạt: chỉ dùng khi Bất hoà */cold?:boolean;weight?:number;
 /** H6: mảnh đáp tiếp sau hành động này của người chơi (chỉ dùng trong khung `follow`) */after?:After[];
 /** #357: câu rủ mang kế hoạch (lúc nào, ở đâu, làm gì); nhận lời thì thành hẹn thật */plan?:Plan;
 /** H6: mảnh đáp chủ đề người chơi mở (chỉ dùng trong khung `answer`) */answer?:PlayerTopic[]}
export interface TalkData{frames:Frame[];pieces:Piece[]}
