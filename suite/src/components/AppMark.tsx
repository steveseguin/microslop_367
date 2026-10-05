import { useId } from 'react';
import {
  RefreshCw,
  Video,
  ImageIcon,
  Spline,
  Clock3,
  FilePenLine,
  FileText,
  NotebookPen,
  Presentation,
  Table,
} from 'lucide-react';

/**
 * One identity per app, used everywhere that app is pictured: the workspace's
 * create buttons, launcher cards and file rows, and each editor's header. The
 * workspace and the editor used to draw different marks for the same app
 * (a pen icon vs Blueline's own tile, "P" for both Slides and PDF).
 */
export type AppKind =
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'blueline'
  | 'time'
  | 'notes'
  | 'pdf'
  | 'image'
  | 'svg'
  | 'meet'
  | 'sync';

const ICONS = {
  word: FileText,
  excel: Table,
  powerpoint: Presentation,
  time: Clock3,
  notes: NotebookPen,
  pdf: FilePenLine,
  image: ImageIcon,
  svg: Spline,
  meet: Video,
  sync: RefreshCw,
} as const;

/** Blueline's own mark, drawn the same way as `.mark` in blueline/src/style.css. */
export function BluelineGlyph({ size = 16 }: { size?: number | string }) {
  const clip = `blueline-clip-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className="blueline-glyph"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={clip}>
        <rect width="18" height="18" rx="4" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect width="18" height="18" className="blueline-glyph__ink" />
        <path d="M0 0h18L0 18z" className="blueline-glyph__blue" />
        <rect x="3" y="8" width="12" height="2" className="blueline-glyph__bar" />
      </g>
    </svg>
  );
}

/** The bare glyph, for places that supply their own chip (create buttons). */
export function AppGlyph({ app, size = 16 }: { app: AppKind; size?: number }) {
  if (app === 'blueline') return <BluelineGlyph size={size} />;
  const Icon = ICONS[app];
  return <Icon size={size} aria-hidden="true" />;
}

/** A filled brand chip carrying the app's glyph. */
export function AppMark({
  app,
  size = 'md',
  className = '',
}: {
  app: AppKind;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const px = size === 'sm' ? 14 : size === 'lg' ? 20 : 18;
  return (
    <span className={`app-mark app-mark--${size} app-mark--${app} ${className}`.trim()} aria-hidden="true">
      {app === 'blueline' ? <BluelineGlyph size="100%" /> : <AppGlyph app={app} size={px} />}
    </span>
  );
}
