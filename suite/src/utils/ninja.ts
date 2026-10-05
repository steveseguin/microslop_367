/**
 * One place for how NinjaOffice reaches VDO.Ninja: the SDK build, the signaling
 * server, and the salt. The salt is our own, so room and stream names used here
 * can never collide with anyone using VDO.Ninja directly.
 */
export const NINJA_SDK_URL = 'https://cdn.jsdelivr.net/npm/@vdoninja/sdk@1.6.1/vdoninja-sdk.min.js';
export const NINJA_HOST = 'wss://wss.vdo.ninja';
export const NINJA_SALT = 'microslop.xyz';

let loading: Promise<void> | null = null;

/** Load the SDK once per page and return its constructor. */
export async function loadNinjaSdk<T>(): Promise<new (o: object) => T> {
  const w = window as unknown as { VDONinjaSDK?: new (o: object) => T };
  if (!w.VDONinjaSDK) {
    loading ??= new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = NINJA_SDK_URL;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        s.remove();
        reject(new Error('Could not load the VDO.Ninja SDK. Check your connection.'));
      };
      document.head.appendChild(s);
    });
    await loading;
  }
  return w.VDONinjaSDK!;
}

/** A new SDK client with NinjaOffice's server and salt. */
export async function ninjaClient<T>(options: Record<string, unknown> = {}): Promise<T> {
  const Ctor = await loadNinjaSdk<T>();
  return new Ctor({ host: NINJA_HOST, salt: NINJA_SALT, debug: false, ...options });
}
