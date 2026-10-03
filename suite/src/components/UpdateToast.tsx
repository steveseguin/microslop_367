import { useCallback, useEffect, useRef, useState } from 'react';
import { registerServiceWorker } from '../utils/registerServiceWorker';
import './UpdateToast.css';

/**
 * Registers the service worker and, when a newer build is waiting, offers to switch to it.
 *
 * It is an offer rather than an automatic reload on purpose: everything in this app is
 * unsaved work in IndexedDB, and reloading a tab someone is typing in to deliver a new
 * bundle would be a worse bug than whatever the new bundle fixes. Ignoring the toast is a
 * supported choice — the waiting worker takes over on its own the next time every tab of
 * the app has been closed.
 *
 * Renders nothing at all until there is an update, so it costs nothing on a normal load.
 */
export function UpdateToast() {
  const [updateReady, setUpdateReady] = useState(false);
  const applyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerServiceWorker((apply) => {
      applyRef.current = apply;
      setUpdateReady(true);
    });
  }, []);

  const reload = useCallback(() => {
    applyRef.current?.();
  }, []);

  if (!updateReady) return null;

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <div className="update-toast__text">
        <strong>A new version is ready</strong>
        <p>Your open files are saved locally and will still be here.</p>
      </div>
      <div className="update-toast__actions">
        <button className="update-toast__button update-toast__button--primary" type="button" onClick={reload}>
          Reload
        </button>
        <button className="update-toast__button" type="button" onClick={() => setUpdateReady(false)}>
          Later
        </button>
      </div>
    </div>
  );
}
