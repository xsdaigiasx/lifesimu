/** Phát hiện bản mới: so mã bản dựng đang chạy với version.json trên máy chủ (không bao giờ được lưu đệm). */
declare const __BUILD_ID__: string | undefined;
declare const __APP_VERSION__: string | undefined;
export const BUILD_ID: string = typeof __BUILD_ID__ === 'undefined' ? 'dev' : __BUILD_ID__;
export const APP_VERSION: string = typeof __APP_VERSION__ === 'undefined' ? '0.0.0' : __APP_VERSION__;
export interface RemoteVersion { build: string; version: string }
export const parseRemoteVersion = (raw: unknown): RemoteVersion | null => {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  return typeof v.build === 'string' && v.build.length > 0 && v.build.length <= 64 && typeof v.version === 'string' && v.version.length <= 32 ? { build: v.build, version: v.version } : null;
};
/** Chỉ báo khi chắc chắn khác: bản dev, hoặc không đọc được, thì không báo. */
export const hasNewVersion = (local: string, remote: RemoteVersion | null): boolean => !!remote && local !== 'dev' && remote.build !== local;
export async function fetchRemoteVersion(fetcher: typeof fetch = fetch, base = ''): Promise<RemoteVersion | null> {
  try {
    const res = await fetcher(`${base}version.json?t=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? parseRemoteVersion(await res.json()) : null;
  } catch { return null; }
}
