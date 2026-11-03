import manifest from './manifest.json';
import {TileLoader} from './TileLoader';
export const mapManifest=manifest;
export const mapTiles=manifest.tiles;
export const mapCache=new TileLoader(undefined,3,import.meta.env.BASE_URL);
export const cityCache=mapCache;
export const cityAssets=mapTiles;
