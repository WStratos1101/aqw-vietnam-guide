import { useEffect, useRef, useState } from 'react';

/**
 * AQWVN System V4. Cô lập CSS/JS của demo để không can thiệp Home, Codex,
 * theme hoặc các trang khác. Header/Footer do App.tsx của website render.
 */
export function SystemArchiveV4() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1450);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const sendTheme = () => {
      const mode = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      frame.contentWindow?.postMessage(
        { type: 'aqwvn:system-v4:theme', theme: mode },
        window.location.origin,
      );
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type !== 'aqwvn:system-v4:height') return;
      const candidate = Number(event.data?.height);
      if (!Number.isFinite(candidate) || candidate < 200 || candidate > 50000) return;
      setHeight(current => Math.abs(current - candidate) > 2 ? candidate : current);
    };
    const themeObserver = new MutationObserver(sendTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', sendTheme);
    sendTheme();
    return () => {
      window.removeEventListener('message', onMessage);
      frame.removeEventListener('load', sendTheme);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <main id="main" className="aqw-system-v4" style={{ background: 'var(--paper)', width: '100%' }}>
      <h1 className="sr-only">Hệ thống AQW</h1>
      <iframe
        ref={iframeRef}
        title="Hệ thống AQW — Cơ chế chiến đấu, chỉ số, Enhancement, Scroll và Potion"
        src="/system-archive-v4/index.html"
        loading="eager"
        style={{ display: 'block', width: '100%', height, border: 0, background: 'var(--paper)' }}
      />
    </main>
  );
}
