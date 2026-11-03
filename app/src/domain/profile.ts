import type {PlayerProfile} from './types';
export const PROFILE_KEY='life-simulator-profile-v1';
export function cleanProfile(input:unknown):PlayerProfile|null{if(!input||typeof input!=='object'||!('name'in input)||typeof input.name!=='string')return null;const name=input.name.normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,32);if(!name)return null;return{name,gender:'gender'in input&&input.gender==='female'?'female':'male',complete:'complete'in input&&input.complete===true};}
export function parseProfile(raw:string|null):PlayerProfile|null{try{return raw?cleanProfile(JSON.parse(raw)):null}catch{return null}}
