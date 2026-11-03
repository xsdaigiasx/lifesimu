import {useEffect,useState} from 'react';
import {BUILD_ID,APP_VERSION,fetchRemoteVersion,hasNewVersion} from '../domain/update';
import type {RemoteVersion} from '../domain/update';
const CHECK_MS=5*60*1000;
/** Kiểm tra bản mới khi mở game, khi quay lại ứng dụng và mỗi 5 phút. */
export function useUpdateCheck(){
  const [remote,setRemote]=useState<RemoteVersion|null>(null);
  useEffect(()=>{
    let alive=true;
    const check=async()=>{const v=await fetchRemoteVersion();if(alive&&hasNewVersion(BUILD_ID,v))setRemote(v)};
    check();const id=setInterval(check,CHECK_MS);
    const visible=()=>{if(document.visibilityState==='visible')check()};
    document.addEventListener('visibilitychange',visible);
    return()=>{alive=false;clearInterval(id);document.removeEventListener('visibilitychange',visible)};
  },[]);
  return remote;
}
export function reloadForUpdate(){
  const done=()=>location.reload();
  try{navigator.serviceWorker?.getRegistration().then(r=>r?r.update().then(done,done):done(),done)}catch{done()}
}
/** Thanh thông báo phiên bản mới, nằm trên thanh điều hướng dưới. Dữ liệu chơi không bị mất vì save nằm trong localStorage. */
export function UpdateBanner({remote}:{remote:RemoteVersion|null}){
  const [hidden,setHidden]=useState<string|null>(null);
  if(!remote||hidden===remote.build)return null;
  return <div className="update-banner" role="status"><div><strong>Có phiên bản mới {remote.version}</strong><small>Tiến độ của bạn được giữ nguyên.</small></div><button className="update-now" onClick={reloadForUpdate}>Cập nhật</button><button className="update-later" aria-label="Để sau" onClick={()=>setHidden(remote.build)}>×</button></div>;
}
interface InstallEvent extends Event{prompt():Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>}
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||(navigator as unknown as {standalone?:boolean}).standalone===true}catch{return false}};
const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let deferred:InstallEvent|null=null;
if(typeof window!=='undefined')window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e as InstallEvent});
/** Thẻ "Cài game lên điện thoại" trong Điện thoại → Cài đặt. */
export function InstallCard(){
  const [ready,setReady]=useState(!!deferred),[installed,setInstalled]=useState(isStandalone()),[msg,setMsg]=useState('');
  useEffect(()=>{const on=(e:Event)=>{e.preventDefault();deferred=e as InstallEvent;setReady(true)},done=()=>{setInstalled(true);deferred=null};window.addEventListener('beforeinstallprompt',on);window.addEventListener('appinstalled',done);return()=>{window.removeEventListener('beforeinstallprompt',on);window.removeEventListener('appinstalled',done)}},[]);
  const install=async()=>{if(!deferred)return;try{await deferred.prompt();const c=await deferred.userChoice;setMsg(c.outcome==='accepted'?'Đã cài. Mở game từ màn hình chính nhé.':'Bạn có thể cài sau.')}catch{setMsg('Chưa cài được. Hãy dùng menu trình duyệt → Cài đặt ứng dụng.')}deferred=null;setReady(false)};
  if(installed)return <div className="phone-info-card"><small>ỨNG DỤNG</small><h3>Đã cài trên thiết bị</h3><p>Game đang chạy toàn màn hình như một ứng dụng.</p></div>;
  return <div className="phone-info-card"><small>CÀI LÊN ĐIỆN THOẠI</small><h3>Chơi như một ứng dụng</h3><p>Có biểu tượng trên màn hình chính, mở toàn màn hình, không còn thanh địa chỉ trình duyệt.</p>{ready?<button className="primary wide" onClick={install}>Cài game</button>:isIos()?<p className="install-hint">Trên iPhone: bấm nút <b>Chia sẻ</b> của Safari, chọn <b>Thêm vào MH chính</b>.</p>:<p className="install-hint">Mở menu trình duyệt (⋮), chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.</p>}{msg&&<p className="install-hint" role="status">{msg}</p>}</div>;
}
export function VersionCard(){
  const remote=useUpdateCheck();
  const [state,setState]=useState<'idle'|'checking'|'latest'|'new'|'fail'>('idle');
  const check=async()=>{setState('checking');const v=await fetchRemoteVersion();setState(!v?'fail':hasNewVersion(BUILD_ID,v)?'new':'latest')};
  return <div className="phone-info-card"><small>PHIÊN BẢN</small><h3>Một đời để sống {APP_VERSION}</h3><p>Bản dựng {BUILD_ID}{remote||state==='new'?', đã có bản mới':''}</p>{remote||state==='new'?<button className="primary wide" onClick={reloadForUpdate}>Cập nhật ngay</button>:<button className="phone-secondary" onClick={check} disabled={state==='checking'}>{state==='checking'?'Đang kiểm tra…':'Kiểm tra cập nhật'}</button>}{state==='latest'&&<p className="install-hint" role="status">Bạn đang dùng bản mới nhất.</p>}{state==='fail'&&<p className="install-hint" role="status">Chưa kiểm tra được. Hãy thử lại khi có mạng.</p>}</div>;
}
