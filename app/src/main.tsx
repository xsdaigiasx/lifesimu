import {createRoot} from 'react-dom/client';
import App from './App';
createRoot(document.getElementById('root')!).render(<App/>);

if('serviceWorker' in navigator&&window.isSecureContext)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(r=>{const urls=[location.href,...performance.getEntriesByType('resource').map(e=>e.name)];r.active?.postMessage({type:'CACHE_URLS',urls})}).catch(()=>{})});
