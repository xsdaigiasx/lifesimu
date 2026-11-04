import type {LifeState} from './life';
import type {HomeState} from './home';
import type {OfficeItems} from './office-items';
import type {SocialState} from './social';
import type {Skills,WorkState} from './work';
import type {StudyState} from './study';
import type {StoryState} from './director';
import type {InboxState} from './inbox';
import type {JournalEntry} from './journal';
import type {OfficeLayout} from './layout';
import type {GameClock} from './time';
import type {OfficeState} from './office';
import type {FishingState} from './fishing';
import type {RentState} from './rent';
import type {BauCuaRound} from './bau-cua';
export type ItemId = 'plant' | 'lamp' | 'rug';
export type DailyAction = 'work' | 'study' | 'rest';
export type ViewId = 'city' | 'room' | 'lake';
export type Gender = 'male' | 'female';
export type PlaceId = 'home' | 'office' | 'market' | 'mall' | 'bank' | 'hospital' | 'bus' | 'park' | 'streetfood' | 'restaurant' | 'apartments' | 'villa' | 'lake';
export interface Item {name:string;price:number;bonus:number;desc:string;effect:string}
export interface LedgerEntry {name:string;amount:number;day:number}
export interface DayReport {action:DailyAction;earn:number;cost:number;xp:number;net:number;efficiency:number;day:number;faint?:{place:'home'|'out'|'hospital';lost:number}}
export interface GameState {txIds?:string[];txSeq?:number;rent?:RentState;life?:LifeState;home?:HomeState;officeItems?:OfficeItems;social?:SocialState;skills?:Skills;study?:StudyState;story?:StoryState;inbox?:InboxState;work?:WorkState;journal?:JournalEntry[];officeLayout?:OfficeLayout;clock?:GameClock;office?:OfficeState;fishing?:FishingState;bauCuaLast?:BauCuaRound;version:1;day:number;money:number;energy:number;fullness?:number;coffee?:{day:number;count:number;crashAt:number|null};mood:number;health:number;stress:number;xp:number;owned:ItemId[];equipped:ItemId[];ledger:LedgerEntry[];lastReport:DayReport|null}
export type GameResult = {ok:true;state:GameState} | {ok:false;error:string};
export interface EngineApi {KEY:string;COST:number;ITEMS:Record<ItemId,Item>;initial():GameState;valid(value:unknown):value is GameState;buy(state:GameState,id:string):GameResult;toggle(state:GameState,id:string):GameResult;advance(state:GameState,action:string):GameResult;parse(raw:string|null):GameState|null}
export interface Appointment {id:string;title:string;date:string}
export interface Alarm {id:string;label:string;time:string;enabled:boolean}
export interface PhoneState {version:1;notes:string;appointments:Appointment[];alarms:Alarm[];readReport:number;lastSaved:string|null}
export interface PhoneDataApi {KEY:string;initial():PhoneState;valid(value:unknown):value is PhoneState;parse(raw:string|null):PhoneState|null}
export interface PlayerProfile {name:string;gender:Gender;complete:boolean}
export interface ProfileApi {hadSave:boolean;get():PlayerProfile|null;name():string;gender():Gender;set(p:unknown):PlayerProfile|null;escape(s:unknown):string;htmlName():string;render():void}
export interface Place {id:PlaceId;name:string;icon:string;x:number;y:number;summary:string;detail:string}
export interface StoryBeat {scene:string;duration:number;start?:number;art?:string;tag:string;text:string;speaker?:string;sub?:string}
export interface StoryApi {beats:StoryBeat[];duration:number;locate(time:number):number;reveal(text:string,seconds:number):string;glyphs(text:string):string[]}
export interface IntroApi {play(options?:{name?:string;gender?:Gender}):void;pause():void;skip():void}
