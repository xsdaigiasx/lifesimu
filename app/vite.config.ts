/// <reference types="node" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf-8'));
/** Mã bản dựng: commit của Cloudflare nếu có, ngược lại là thời điểm dựng. Dùng để báo "có phiên bản mới". */
const BUILD_ID=(process.env.WORKERS_CI_COMMIT_SHA||process.env.CF_PAGES_COMMIT_SHA||'').slice(0,7)||Date.now().toString(36);
const versionFile=()=>({name:'version-json',generateBundle(){(this as unknown as {emitFile(f:{type:'asset';fileName:string;source:string}):void}).emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({build:BUILD_ID,version:pkg.version})})}});
export default defineConfig({plugins:[react(),versionFile()],base:'./',define:{__BUILD_ID__:JSON.stringify(BUILD_ID),__APP_VERSION__:JSON.stringify(pkg.version)},build:{outDir:'dist',emptyOutDir:true},server:{host:'0.0.0.0',allowedHosts:['terminal.local']}});
