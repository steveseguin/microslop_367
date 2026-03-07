import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as fabric from 'fabric';
import {
  BringToFront,
  Circle,
  Copy,
  Download,
  Image as ImageIcon,
  MonitorPlay,
  Palette,
  Play,
  Plus,
  Redo,
  SendToBack,
  Square,
  Trash2,
  Type,
  Undo,
  Upload,
  X,
} from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import { getCurrentClientId, loadDocument, saveDocument, subscribeToDocument } from '../utils/db';

interface PowerPointProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface Slide {
  id: string;
  data: any;
  notes?: string;
  thumbnail?: string;
}

interface BannerState {
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail?: string;
}

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

function createTextObject(text: string, options: Partial<fabric.ITextProps>) {
  return new fabric.IText(text, {
    ...options,
    fontFamily: options.fontFamily ?? 'Aptos, Segoe UI, sans-serif',
    fill: options.fill ?? '#0f172a',
  });
}

function applySlideTemplate(canvas: fabric.Canvas, variant: 'cover' | 'content') {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';

  const accentBar = new fabric.Rect({
    left: 0,
    top: 0,
    width: SLIDE_WIDTH,
    height: 14,
    fill: '#2563eb',
    selectable: false,
    evented: false,
  });

  canvas.add(accentBar);

  if (variant === 'cover') {
    canvas.add(
      createTextObject('Presentation Title', {
        left: 86,
        top: 110,
        fontSize: 38,
        fontWeight: '700',
      }),
    );
    canvas.add(
      createTextObject('Subtitle or presenter name', {
        left: 90,
        top: 190,
        fontSize: 22,
        fill: '#475569',
      }),
    );
  } else {
    canvas.add(
      createTextObject('Slide Title', {
        left: 78,
        top: 68,
        fontSize: 34,
        fontWeight: '700',
      }),
    );
    canvas.add(
      createTextObject('Add key points here\n- Explain the point\n- Support it with numbers', {
        left: 86,
        top: 164,
        fontSize: 22,
        fill: '#334155',
        width: 720,
      }),
    );
  }

  canvas.renderAll();
}

function createSlideSnapshot(variant: 'cover' | 'content') {
  const tempElement = document.createElement('canvas');
  tempElement.width = SLIDE_WIDTH;
  tempElement.height = SLIDE_HEIGHT;
  const tempCanvas = new fabric.StaticCanvas(tempElement, {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    backgroundColor: '#ffffff',
  });

  applySlideTemplate(tempCanvas as unknown as fabric.Canvas, variant);
  const snapshot = {
    data: tempCanvas.toJSON(),
    thumbnail: tempCanvas.toDataURL({ format: 'png', multiplier: 0.22 }),
  };
  tempCanvas.dispose();
  return snapshot;
}

function normalizeColor(value: string | undefined) {
  if (!value) {
    return '000000';
  }

  return value.replace('#', '');
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Blob could not be read'));
    reader.readAsDataURL(blob);
  });
}

function resolveZipTarget(basePath: string, target: string) {
  if (target.startsWith('/')) {
    return target.replace(/^\/+/, '');
  }

  const segments = basePath.split('/');
  segments.pop();

  for (const part of target.split('/')) {
    if (!part || part === '.') {
      continue;
    }

    if (part === '..') {
      segments.pop();
      continue;
    }

    segments.push(part);
  }

  return segments.join('/');
}

function extractTextContent(container: ParentNode) {
  const paragraphs = [...container.querySelectorAll('a\\:p, p')].map((paragraph) =>
    [...paragraph.querySelectorAll('a\\:t, t')]
      .map((textNode) => textNode.textContent || '')
      .join(''),
  );

  return paragraphs.filter(Boolean).join('\n');
}

function extractTransformMetrics(node: ParentNode | null) {
  const transform = node?.querySelector('a\\:xfrm, xfrm');
  const offset = transform?.querySelector('a\\:off, off');
  const extent = transform?.querySelector('a\\:ext, ext');

  const left = ((parseInt(offset?.getAttribute('x') || '0', 10) || 0) / 914400) * 96;
  const top = ((parseInt(offset?.getAttribute('y') || '0', 10) || 0) / 914400) * 96;
  const width = ((parseInt(extent?.getAttribute('cx') || '0', 10) || 0) / 914400) * 96;
  const height = ((parseInt(extent?.getAttribute('cy') || '0', 10) || 0) / 914400) * 96;

  return { left, top, width, height };
}

export default function PowerPoint({ toggleTheme, isDarkMode }: PowerPointProps) {
  const maxImportFileBytes = 30 * 1024 * 1024;
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFileName = 'Untitled Presentation';
  const [docId] = useState(() => searchParams.get('id') || `powerpoint-${Date.now()}`);
  const [fileName, setFileName] = useState(defaultFileName);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([{ id: 'slide-1', data: null, notes: '' }]);
  const [currentSlideId, setCurrentSlideId] = useState('slide-1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresenterView, setIsPresenterView] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2563eb');
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [pendingDeleteSlideId, setPendingDeleteSlideId] = useState<string | null>(null);
  const [importCandidate, setImportCandidate] = useState<File | null>(null);
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState<'slides' | 'canvas' | 'notes'>('canvas');
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pptImportRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isHistoryUpdate = useRef(false);
  const dragDepthRef = useRef(0);
  const documentRevisionRef = useRef(documentRevision);
  const hasInitializedSaveRef = useRef(false);

  useEffect(() => {
    documentRevisionRef.current = documentRevision;
  }, [documentRevision]);

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    setFabricCanvas(canvas);

    canvas.on('selection:created', () => setHasSelection(true));
    canvas.on('selection:updated', () => setHasSelection(true));
    canvas.on('selection:cleared', () => setHasSelection(false));

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas || isLoaded) {
      return;
    }

    loadDocument<{ slides?: Slide[] }>(docId)
      .then((doc) => {
        if (doc && doc.type === 'powerpoint') {
          setFileName(doc.title);
          if (doc.data?.slides?.length) {
            setSlides(doc.data.slides);
            setCurrentSlideId(doc.data.slides[0].id);
          }
          setLastSavedAt(doc.updatedAt);
          setDocumentRevision(doc.revision);
          if (doc.source === 'backup') {
            setBanner({
              tone: 'warning',
              title: 'Recovered the latest local backup.',
              detail: 'This deck was restored from the browser backup cache after a storage mismatch.',
            });
          }
        }
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load presentation', error);
        setBanner({
          tone: 'error',
          title: 'Presentation failed to load cleanly.',
          detail: 'A new slide deck was opened instead.',
        });
        setIsLoaded(true);
      });
  }, [docId, fabricCanvas, isLoaded]);

  const seedHistory = (snapshot: any) => {
    setHistory([snapshot]);
    setHistoryIndex(0);
  };

  const captureCurrentSlideSnapshot = () => {
    if (!fabricCanvas) {
      return null;
    }

    return {
      data: fabricCanvas.toJSON(),
      thumbnail: fabricCanvas.toDataURL({ format: 'png', multiplier: 0.22 }),
    };
  };

  const persistCurrentSlide = () => {
    const snapshot = captureCurrentSlideSnapshot();
    if (!snapshot || isHistoryUpdate.current) {
      return;
    }

    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === currentSlideId ? { ...slide, data: snapshot.data, thumbnail: snapshot.thumbnail } : slide,
      ),
    );
  };

  const recordHistory = () => {
    const snapshot = fabricCanvas?.toJSON();
    if (!snapshot || isHistoryUpdate.current) {
      return;
    }

    setHistory((previousHistory) => {
      const truncated = previousHistory.slice(0, historyIndex + 1);
      const nextHistory = [...truncated, snapshot].slice(-30);
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
  };

  useEffect(() => {
    if (!fabricCanvas || !isLoaded) {
      return;
    }

    const currentSlide = slides.find((slide) => slide.id === currentSlideId);
    if (!currentSlide) {
      return;
    }

    isHistoryUpdate.current = true;

    const loadSlide = async () => {
      if (currentSlide.data) {
        await fabricCanvas.loadFromJSON(currentSlide.data);
        fabricCanvas.backgroundColor = '#ffffff';
        fabricCanvas.renderAll();
      } else {
        applySlideTemplate(fabricCanvas, slides.length === 1 ? 'cover' : 'content');
        const snapshot = captureCurrentSlideSnapshot();
        setSlides((previousSlides) =>
          previousSlides.map((slide) =>
            slide.id === currentSlideId ? { ...slide, data: snapshot?.data, thumbnail: snapshot?.thumbnail } : slide,
          ),
        );
      }

      setHasSelection(false);
      seedHistory(fabricCanvas.toJSON());
      isHistoryUpdate.current = false;
    };

    void loadSlide();
  }, [currentSlideId, fabricCanvas, isLoaded, slides]);

  useEffect(() => {
    if (!fabricCanvas || !isLoaded) {
      return;
    }

    const handleCanvasMutation = () => {
      if (isHistoryUpdate.current) {
        return;
      }

      persistCurrentSlide();
      recordHistory();
    };

    fabricCanvas.on('object:modified', handleCanvasMutation);
    fabricCanvas.on('object:added', handleCanvasMutation);
    fabricCanvas.on('object:removed', handleCanvasMutation);
    fabricCanvas.on('text:changed', handleCanvasMutation);

    return () => {
      fabricCanvas.off('object:modified', handleCanvasMutation);
      fabricCanvas.off('object:added', handleCanvasMutation);
      fabricCanvas.off('object:removed', handleCanvasMutation);
      fabricCanvas.off('text:changed', handleCanvasMutation);
    };
  }, [currentSlideId, fabricCanvas, historyIndex, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!hasInitializedSaveRef.current) {
      hasInitializedSaveRef.current = true;
      return;
    }

    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const currentSnapshot = captureCurrentSlideSnapshot();
        const slidesToSave = slides.map((slide) =>
          slide.id === currentSlideId && currentSnapshot ? { ...slide, data: currentSnapshot.data, thumbnail: currentSnapshot.thumbnail } : slide,
        );

        const result = await saveDocument(docId, fileName, 'powerpoint', { slides: slidesToSave }, { knownRevision: documentRevisionRef.current });
        setDocumentRevision(result.record.revision);

        if (result.status === 'conflict') {
          setSaveStatus('Conflict detected');
          setBanner({
            tone: 'warning',
            title: 'A newer presentation was saved in another tab.',
            detail: 'Your latest slide edits are still cached locally. Save again from this tab to replace the newer version, or reload to review it first.',
          });
          return;
        }

        setSaveStatus('Saved');
        setLastSavedAt(result.record.updatedAt);
      } catch (error) {
        console.error('Failed to save presentation', error);
        setSaveStatus('Save error');
        setBanner({
          tone: 'error',
          title: 'Autosave failed.',
          detail: 'The deck stayed open, but local persistence did not complete.',
        });
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentSlideId, docId, fileName, isLoaded, slides]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    return subscribeToDocument(docId, (event) => {
      if (event.lastSavedBy === getCurrentClientId() || event.revision <= documentRevision) {
        return;
      }

      setBanner({
        tone: 'warning',
        title: 'A newer presentation is available from another tab.',
        detail: 'Reload this deck if you want the latest saved version from that session.',
      });
    });
  }, [docId, documentRevision, isLoaded]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isPresenterView) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedTime((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isPresenterView]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      if ((fabricCanvas?.getActiveObject() as any)?.isEditing) {
        return;
      }

      deleteSelected();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas]);

  const currentSlideIndex = slides.findIndex((slide) => slide.id === currentSlideId);
  const currentSlide = slides[currentSlideIndex];

  const saveSummary =
    saveStatus === 'Saved' && lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastSavedAt)}`
      : saveStatus;

  const slideCountLabel = `${currentSlideIndex + 1} / ${slides.length}`;

  const switchSlide = (nextSlideId: string) => {
    if (nextSlideId === currentSlideId) {
      return;
    }

    const snapshot = captureCurrentSlideSnapshot();
    if (snapshot) {
      setSlides((previousSlides) =>
        previousSlides.map((slide) =>
          slide.id === currentSlideId ? { ...slide, data: snapshot.data, thumbnail: snapshot.thumbnail } : slide,
        ),
      );
    }

    setCurrentSlideId(nextSlideId);
    setMobileWorkspaceView('canvas');
  };

  const addSlide = (variant: 'cover' | 'content' = 'content') => {
    const newId = `slide-${Date.now()}`;
    const template = createSlideSnapshot(variant);
    const snapshot = captureCurrentSlideSnapshot();

    setSlides((previousSlides) => {
      const withSavedCurrent = snapshot
        ? previousSlides.map((slide) =>
            slide.id === currentSlideId ? { ...slide, data: snapshot.data, thumbnail: snapshot.thumbnail } : slide,
          )
        : previousSlides;

      const insertIndex = Math.max(currentSlideIndex, 0) + 1;
      const nextSlides = [...withSavedCurrent];
      nextSlides.splice(insertIndex, 0, { id: newId, data: template.data, notes: '', thumbnail: template.thumbnail });
      return nextSlides;
    });

    setCurrentSlideId(newId);
    setMobileWorkspaceView('canvas');
  };

  const duplicateSlide = () => {
    const sourceSlide = slides[currentSlideIndex];
    const snapshot = captureCurrentSlideSnapshot();
    const duplicatedData = snapshot?.data ?? sourceSlide?.data;

    if (!duplicatedData) {
      return;
    }

    const newId = `slide-${Date.now()}`;
    setSlides((previousSlides) => {
      const withSavedCurrent = snapshot
        ? previousSlides.map((slide) =>
            slide.id === currentSlideId ? { ...slide, data: snapshot.data, thumbnail: snapshot.thumbnail } : slide,
          )
        : previousSlides;

      const nextSlides = [...withSavedCurrent];
      nextSlides.splice(currentSlideIndex + 1, 0, {
        id: newId,
        data: JSON.parse(JSON.stringify(duplicatedData)),
        notes: sourceSlide?.notes ?? '',
        thumbnail: snapshot?.thumbnail ?? sourceSlide?.thumbnail,
      });
      return nextSlides;
    });

    setCurrentSlideId(newId);
    setMobileWorkspaceView('canvas');
  };

  const deleteSlide = () => {
    if (!pendingDeleteSlideId) {
      return;
    }

    if (slides.length <= 1) {
      setBanner({
        tone: 'warning',
        title: 'A presentation needs at least one slide.',
      });
      setPendingDeleteSlideId(null);
      return;
    }

    const nextSlides = slides.filter((slide) => slide.id !== pendingDeleteSlideId);
    setSlides(nextSlides);

    if (currentSlideId === pendingDeleteSlideId) {
      setCurrentSlideId(nextSlides[Math.max(0, currentSlideIndex - 1)]?.id ?? nextSlides[0].id);
    }

    setPendingDeleteSlideId(null);
  };

  const addText = () => {
    if (!fabricCanvas) {
      return;
    }

    const text = createTextObject('New text', {
      left: 110,
      top: 110,
      fontSize: 26,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
  };

  const addRect = () => {
    if (!fabricCanvas) {
      return;
    }

    const shape = new fabric.Rect({
      left: 120,
      top: 140,
      width: 180,
      height: 110,
      rx: 16,
      ry: 16,
      fill: '#2563eb',
    });

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
  };

  const addCircle = () => {
    if (!fabricCanvas) {
      return;
    }

    const shape = new fabric.Circle({
      left: 160,
      top: 150,
      radius: 62,
      fill: '#f97316',
    });

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
  };

  const deleteSelected = () => {
    if (!fabricCanvas) {
      return;
    }

    const activeObjects = fabricCanvas.getActiveObjects();
    if (!activeObjects.length) {
      return;
    }

    activeObjects.forEach((object) => fabricCanvas.remove(object));
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  };

  const applyColor = (color: string) => {
    setCurrentColor(color);
    if (!fabricCanvas) {
      return;
    }

    fabricCanvas.getActiveObjects().forEach((object) => {
      object.set('fill', color);
    });
    fabricCanvas.requestRenderAll();
  };

  const bringForward = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (fabricCanvas && activeObject) {
      fabricCanvas.bringObjectForward(activeObject);
      fabricCanvas.requestRenderAll();
    }
  };

  const sendBackward = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (fabricCanvas && activeObject) {
      fabricCanvas.sendObjectBackwards(activeObject);
      fabricCanvas.requestRenderAll();
    }
  };

  const undo = async () => {
    if (!fabricCanvas || historyIndex <= 0) {
      return;
    }

    isHistoryUpdate.current = true;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    await fabricCanvas.loadFromJSON(history[nextIndex]);
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    isHistoryUpdate.current = false;
    persistCurrentSlide();
  };

  const redo = async () => {
    if (!fabricCanvas || historyIndex >= history.length - 1) {
      return;
    }

    isHistoryUpdate.current = true;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    await fabricCanvas.loadFromJSON(history[nextIndex]);
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    isHistoryUpdate.current = false;
    persistCurrentSlide();
  };

  const insertImageFile = async (file: File) => {
    if (!file || !fabricCanvas) {
      return;
    }

    try {
      const dataUrl = await readBlobAsDataUrl(file);
      const image = await fabric.Image.fromURL(dataUrl);
      const baseWidth = image.width || 320;
      const baseHeight = image.height || 240;
      const scale = Math.min(1, 320 / baseWidth, 220 / baseHeight);

      image.set({
        left: 120,
        top: 120,
        scaleX: scale,
        scaleY: scale,
      });
      fabricCanvas.add(image);
      fabricCanvas.setActiveObject(image);
      fabricCanvas.requestRenderAll();
      fabricCanvas.fire('selection:created', { selected: [image], target: image } as never);
      window.requestAnimationFrame(() => setHasSelection(fabricCanvas.getActiveObjects().length > 0));
      setMobileWorkspaceView('canvas');
      setBanner({
        tone: 'success',
        title: 'Image inserted.',
        detail: `Added ${file.name} to the current slide.`,
      });
    } catch (error) {
      console.error('Image load failed', error);
      setBanner({
        tone: 'error',
        title: 'Image could not be inserted.',
        detail: 'The selected file could not be read in this browser session.',
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await insertImageFile(file as File);
    event.target.value = '';
  };

  const resetDropTarget = () => {
    dragDepthRef.current = 0;
    setIsDropTargetActive(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    const hasImageFile = [...event.dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!hasImageFile) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropTargetActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const hasImageFile = [...event.dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!hasImageFile) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDropTargetActive(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const imageFile = [...event.dataTransfer.files].find((file) => file.type.startsWith('image/'));
    resetDropTarget();

    if (!imageFile) {
      return;
    }

    await insertImageFile(imageFile);
  };

  const toggleFullscreen = async () => {
    if (!stageRef.current) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await stageRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error', error);
    }
  };

  const togglePresenterView = () => {
    setIsPresenterView((previous) => !previous);
    setElapsedTime(0);
  };

  const updateNotes = (notes: string) => {
    setSlides((previousSlides) => previousSlides.map((slide) => (slide.id === currentSlideId ? { ...slide, notes } : slide)));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const remainder = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  useEffect(() => {
    if (!fabricCanvas) {
      return;
    }

    const handlePaste = async (event: ClipboardEvent) => {
      if (isPresenterView) {
        return;
      }

      const imageFile = [...(event.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'));
      if (!imageFile) {
        return;
      }

      event.preventDefault();
      await insertImageFile(imageFile);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [fabricCanvas, isPresenterView]);

  const importPptxFile = async (file: File) => {
    if (file.size > maxImportFileBytes) {
      setBanner({
        tone: 'error',
        title: 'Presentation is too large to import safely.',
        detail: 'Choose a smaller deck before converting it in the browser.',
      });
      return;
    }

    setSaveStatus('Importing...');
    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    try {
      const { default: JSZip } = await import('jszip');
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const relationshipsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
      const slideRefs: string[] = [];

      if (relationshipsXml) {
        const relsDoc = new DOMParser().parseFromString(relationshipsXml, 'text/xml');
        relsDoc.querySelectorAll('Relationship').forEach((relationship) => {
          const type = relationship.getAttribute('Type');
          const target = relationship.getAttribute('Target');
          if (!type?.includes('slide') || !target) {
            return;
          }

          const normalizedTarget = target
            .replace(/^\/+/, '')
            .replace(/^ppt\//, '')
            .replace(/^\.\.\//, '');
          slideRefs.push(normalizedTarget);
        });
      }

      slideRefs.sort((left, right) => {
        const leftNumber = parseInt(left.match(/\d+/)?.[0] || '0', 10);
        const rightNumber = parseInt(right.match(/\d+/)?.[0] || '0', 10);
        return leftNumber - rightNumber;
      });

      const importedSlides: Slide[] = [];

      for (const slideRef of slideRefs) {
        const slidePath = `ppt/${slideRef}`;
        const slideFileName = slideRef.split('/').pop();
        const slideXml = await zip.file(slidePath)?.async('string');
        if (!slideXml) {
          continue;
        }

        const tempElement = document.createElement('canvas');
        tempElement.width = SLIDE_WIDTH;
        tempElement.height = SLIDE_HEIGHT;
        const tempCanvas = new fabric.StaticCanvas(tempElement, {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          backgroundColor: '#ffffff',
        });
        const slideDoc = new DOMParser().parseFromString(slideXml, 'text/xml');
        const slideRelationships = new Map<string, { type: string; target: string }>();
        const slideRelationshipsXml = slideFileName
          ? await zip.file(`ppt/slides/_rels/${slideFileName}.rels`)?.async('string')
          : undefined;

        if (slideRelationshipsXml) {
          const relsDoc = new DOMParser().parseFromString(slideRelationshipsXml, 'text/xml');
          relsDoc.querySelectorAll('Relationship').forEach((relationship) => {
            const id = relationship.getAttribute('Id');
            const type = relationship.getAttribute('Type');
            const target = relationship.getAttribute('Target');
            if (!id || !type || !target) {
              return;
            }

            slideRelationships.set(id, { type, target });
          });
        }

        slideDoc.querySelectorAll('p\\:sp, sp').forEach((shape) => {
          const textBody = shape.querySelector('p\\:txBody, txBody');
          if (!textBody) {
            return;
          }

          const textContent = extractTextContent(textBody);
          if (!textContent) {
            return;
          }

          const metrics = extractTransformMetrics(shape);

          tempCanvas.add(
            createTextObject(textContent, {
              left: Math.max(40, metrics.left || 90),
              top: Math.max(40, metrics.top || 110),
              fontSize: 24,
              width: Math.max(220, metrics.width || 720),
            }),
          );
        });

        for (const picture of slideDoc.querySelectorAll('p\\:pic, pic')) {
          const blip = picture.querySelector('a\\:blip, blip');
          const embedId = blip?.getAttribute('r:embed') ?? blip?.getAttribute('embed');
          if (!embedId) {
            continue;
          }

          const imageRelationship = slideRelationships.get(embedId);
          if (!imageRelationship || !imageRelationship.type.includes('/image')) {
            continue;
          }

          const imagePath = resolveZipTarget(slidePath, imageRelationship.target);
          const imageBlob = await zip.file(imagePath)?.async('blob');
          if (!imageBlob) {
            continue;
          }

          const imageDataUrl = await readBlobAsDataUrl(imageBlob);
          const image = await fabric.Image.fromURL(imageDataUrl);
          const metrics = extractTransformMetrics(picture);
          const width = Math.max(120, metrics.width || image.width || 260);
          const height = Math.max(90, metrics.height || image.height || 180);

          image.set({
            left: Math.max(40, metrics.left || 90),
            top: Math.max(40, metrics.top || 120),
            scaleX: width / (image.width || width),
            scaleY: height / (image.height || height),
          });
          tempCanvas.add(image);
        }

        const notesRelationship = [...slideRelationships.values()].find((relationship) => relationship.type.includes('/notesSlide'));
        const notesPath = notesRelationship ? resolveZipTarget(slidePath, notesRelationship.target) : null;
        const notesXml = notesPath ? await zip.file(notesPath)?.async('string') : undefined;
        let notesText = '';

        if (notesXml) {
          const notesDoc = new DOMParser().parseFromString(notesXml, 'text/xml');
          const notesBody = [...notesDoc.querySelectorAll('p\\:sp, sp')].find(
            (shape) => (shape.querySelector('p\\:ph, ph')?.getAttribute('type') ?? '') === 'body',
          );
          notesText = notesBody ? extractTextContent(notesBody).trim() : '';
        }

        if (tempCanvas.getObjects().length === 0) {
          applySlideTemplate(tempCanvas as unknown as fabric.Canvas, importedSlides.length === 0 ? 'cover' : 'content');
        }

        importedSlides.push({
          id: `slide-${Date.now()}-${importedSlides.length}`,
          data: tempCanvas.toJSON(),
          notes: notesText,
          thumbnail: tempCanvas.toDataURL({ format: 'png', multiplier: 0.22 }),
        });

        tempCanvas.dispose();
      }

      if (!importedSlides.length) {
        throw new Error('No slides were imported');
      }

      setSlides(importedSlides);
      setCurrentSlideId(importedSlides[0].id);
      setMobileWorkspaceView('canvas');
      setSaveStatus('Saved');
      setBanner({
        tone: 'success',
        title: 'Presentation imported.',
        detail: `${importedSlides.length} slide${importedSlides.length === 1 ? '' : 's'} loaded from PPTX.`,
      });
    } catch (error) {
      console.error('PPTX import error', error);
      setSaveStatus('Import error');
      setBanner({
        tone: 'error',
        title: 'Import failed.',
        detail: 'The PPTX file could not be converted in the browser.',
      });
    }
  };

  const exportPptx = async () => {
    const currentSnapshot = captureCurrentSlideSnapshot();
    const exportSlides = slides.map((slide) =>
      slide.id === currentSlideId && currentSnapshot ? { ...slide, data: currentSnapshot.data } : slide,
    );

    const { default: PptxGenJS } = await import('pptxgenjs');
    const presentation = new PptxGenJS();
    presentation.layout = 'LAYOUT_WIDE';
    presentation.author = 'OfficeNinja';
    presentation.subject = fileName;
    presentation.title = fileName;

    exportSlides.forEach((slideData) => {
      const slide = presentation.addSlide();
      if (slideData.notes?.trim()) {
        slide.addNotes(slideData.notes);
      }
      const objects = Array.isArray(slideData.data?.objects) ? slideData.data.objects : [];

      if (!objects.length) {
        slide.addText('Untitled slide', { x: 1, y: 1, w: 8, h: 1, fontSize: 24, color: '334155' });
        return;
      }

      objects.forEach((object: any) => {
        const x = ((object.left || 0) / SLIDE_WIDTH) * 10;
        const y = ((object.top || 0) / SLIDE_HEIGHT) * 5.625;
        const w = (((object.width || 0) * (object.scaleX || 1)) / SLIDE_WIDTH) * 10;
        const h = (((object.height || 0) * (object.scaleY || 1)) / SLIDE_HEIGHT) * 5.625;

        if (object.type === 'i-text' || object.type === 'textbox' || object.type === 'text') {
          slide.addText(object.text || '', {
            x,
            y,
            w: Math.max(1, w),
            h: Math.max(0.4, h),
            fontFace: 'Aptos',
            fontSize: Math.max(14, (object.fontSize || 24) * 0.75),
            color: normalizeColor(object.fill),
            bold: object.fontWeight === '700' || object.fontWeight === 700,
          });
        } else if (object.type === 'rect') {
          slide.addShape(PptxGenJS.ShapeType.roundRect, {
            x,
            y,
            w: Math.max(0.3, w),
            h: Math.max(0.3, h),
            fill: { color: normalizeColor(object.fill) },
            line: { color: normalizeColor(object.stroke || object.fill) },
          });
        } else if (object.type === 'circle') {
          slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x,
            y,
            w: Math.max(0.3, w),
            h: Math.max(0.3, h),
            fill: { color: normalizeColor(object.fill) },
            line: { color: normalizeColor(object.stroke || object.fill) },
          });
        } else if (object.type === 'image' && object.src) {
          slide.addImage({
            data: object.src,
            x,
            y,
            w: Math.max(0.4, w),
            h: Math.max(0.4, h),
          });
        }
      });
    });

    await presentation.writeFile({ fileName: `${fileName}.pptx` });
  };

  const previousSlideId = slides[Math.max(0, currentSlideIndex - 1)]?.id ?? currentSlideId;
  const nextSlideId = slides[Math.min(slides.length - 1, currentSlideIndex + 1)]?.id ?? currentSlideId;

  useEffect(() => {
    if (!isPresenterView) {
      return;
    }

    const handlePresenterKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsPresenterView(false);
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        switchSlide(nextSlideId);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        switchSlide(previousSlideId);
      }
    };

    window.addEventListener('keydown', handlePresenterKeyDown);
    return () => window.removeEventListener('keydown', handlePresenterKeyDown);
  }, [currentSlideId, isPresenterView, nextSlideId, previousSlideId]);

  const notesPanel = (
    <div className="panel-stack">
      <div className="panel-card">
        <div className="panel-section">
          <h3>Speaker notes</h3>
          <textarea
            className="notes-textarea"
            value={currentSlide?.notes || ''}
            onChange={(event) => updateNotes(event.target.value)}
            placeholder="Outline talking points, reminders, or handoff notes."
            aria-label="Speaker notes"
          />
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-section">
          <h3>Deck status</h3>
          <ul className="panel-list">
            <li>Current slide: {slideCountLabel}</li>
            <li>Selection: {hasSelection ? 'Object selected' : 'Nothing selected'}</li>
            <li>Autosave: {saveSummary}</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <AppHeader
        appName="NinjaSlides"
        fileName={fileName}
        setFileName={setFileName}
        defaultFileName={defaultFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        saveStatus={saveStatus}
        actions={
          <>
            <input
              ref={pptImportRef}
              type="file"
              accept=".pptx"
              hidden
              onChange={(event) => {
                setImportCandidate(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <button className="btn btn-secondary" onClick={() => pptImportRef.current?.click()} type="button">
              <Upload size={16} />
              Import PPTX
            </button>
            <button className="btn btn-secondary" onClick={exportPptx} type="button">
              <Download size={16} />
              Export PPTX
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup label="Slides">
          <ToolbarButton icon={Plus} onClick={() => addSlide('content')} title="New slide" />
          <ToolbarButton icon={Copy} onClick={duplicateSlide} title="Duplicate slide" />
        </ToolbarGroup>

        <ToolbarGroup label="History">
          <ToolbarButton icon={Undo} onClick={() => void undo()} isDisabled={historyIndex <= 0} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => void redo()} isDisabled={historyIndex >= history.length - 1} title="Redo" />
        </ToolbarGroup>

        <ToolbarGroup label="Insert">
          <ToolbarButton icon={Type} onClick={addText} title="Add text" />
          <ToolbarButton icon={Square} onClick={addRect} title="Add rectangle" />
          <ToolbarButton icon={Circle} onClick={addCircle} title="Add circle" />
          <ToolbarButton icon={ImageIcon} onClick={() => imageInputRef.current?.click()} title="Add image" />
        </ToolbarGroup>

        <ToolbarGroup label="Arrange">
          <ToolbarButton icon={BringToFront} onClick={bringForward} isDisabled={!hasSelection} title="Bring forward" />
          <ToolbarButton icon={SendToBack} onClick={sendBackward} isDisabled={!hasSelection} title="Send backward" />
          <ToolbarButton icon={Trash2} onClick={deleteSelected} isDisabled={!hasSelection} title="Delete selected object" />
        </ToolbarGroup>

        <ToolbarGroup label="Present">
          <div className="toolbar-group-controls">
            <Palette size={16} color={currentColor} />
            <input
              className="slide-color-input"
              type="color"
              value={currentColor}
              onChange={(event) => applyColor(event.target.value)}
              title="Fill color"
              aria-label="Slide object fill color"
            />
          </div>
          <ToolbarButton icon={Play} onClick={() => void toggleFullscreen()} title={isFullscreen ? 'Exit fullscreen' : 'Present fullscreen'} />
          <ToolbarButton icon={MonitorPlay} onClick={togglePresenterView} isActive={isPresenterView} title="Presenter view" />
        </ToolbarGroup>
      </Toolbar>

      {banner && (
        <div
          className={`editor-banner editor-banner--${banner.tone}`}
          role={banner.tone === 'error' ? 'alert' : 'status'}
          aria-live={banner.tone === 'error' ? 'assertive' : 'polite'}
        >
          <div>
            <div className="editor-banner__text">{banner.title}</div>
            {banner.detail && <div className="editor-banner__hint">{banner.detail}</div>}
          </div>
          <button className="btn btn-secondary btn-icon" onClick={() => setBanner(null)} type="button" aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {!isPresenterView && (
        <div className="workspace-mobile-switcher" role="group" aria-label="Slides mobile sections">
          <button
            className={`workspace-switcher-tab ${mobileWorkspaceView === 'slides' ? 'active' : ''}`}
            onClick={() => setMobileWorkspaceView('slides')}
            type="button"
            aria-pressed={mobileWorkspaceView === 'slides'}
          >
            Slides
          </button>
          <button
            className={`workspace-switcher-tab ${mobileWorkspaceView === 'canvas' ? 'active' : ''}`}
            onClick={() => setMobileWorkspaceView('canvas')}
            type="button"
            aria-pressed={mobileWorkspaceView === 'canvas'}
          >
            Canvas
          </button>
          <button
            className={`workspace-switcher-tab ${mobileWorkspaceView === 'notes' ? 'active' : ''}`}
            onClick={() => setMobileWorkspaceView('notes')}
            type="button"
            aria-pressed={mobileWorkspaceView === 'notes'}
          >
            Notes
          </button>
        </div>
      )}

      <div className={isPresenterView ? 'presenter-shell' : 'workspace'}>
        {!isPresenterView && (
          <aside className={`slide-sidebar ${mobileWorkspaceView !== 'slides' ? 'workspace-pane--hidden-mobile' : ''}`} aria-label="Slide thumbnails">
            <div className="slide-sidebar__header">
              <div>
                <h3 style={{ margin: 0 }}>Slides</h3>
                <p className="panel-note" style={{ margin: '0.25rem 0 0' }}>
                  Tap a thumbnail to move through the deck.
                </p>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => addSlide('content')} type="button">
                <Plus size={16} />
              </button>
            </div>

            <div className="slide-list" role="list" aria-label="Slides">
              {slides.map((slide, index) => (
                <article
                  key={slide.id}
                  className={`slide-card ${slide.id === currentSlideId ? 'slide-card--active' : ''}`}
                  onClick={() => switchSlide(slide.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      switchSlide(slide.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open slide ${index + 1}`}
                >
                  <div className="slide-card__thumb">
                    {slide.thumbnail ? <img src={slide.thumbnail} alt={`Slide ${index + 1}`} /> : <span>Slide preview</span>}
                  </div>
                  <div className="slide-card__caption">
                    <span>Slide {index + 1}</span>
                    <span>{slide.id === currentSlideId ? 'Editing' : 'Open'}</span>
                  </div>
                  <button
                    className="slide-card__delete"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setPendingDeleteSlideId(slide.id);
                    }}
                    type="button"
                    aria-label={`Delete slide ${index + 1}`}
                  >
                    <X size={14} />
                  </button>
                </article>
              ))}
            </div>
          </aside>
        )}

        <div
          className={`${isPresenterView ? 'presenter-stage' : 'presentation-stage'} ${!isPresenterView && mobileWorkspaceView !== 'canvas' ? 'workspace-pane--hidden-mobile' : ''}`}
          onClick={() => {
            if (!isPresenterView) {
              setMobileWorkspaceView('canvas');
            }
          }}
        >
          {isPresenterView && (
            <div className="presenter-toolbar">
              <div className="presenter-clock">{formatTime(elapsedTime)}</div>
              <button className="btn btn-secondary" onClick={togglePresenterView} type="button">
                Exit presenter view
              </button>
            </div>
          )}

          <div
            className={`canvas-shell ${isDropTargetActive ? 'canvas-shell--drop-target' : ''}`}
            ref={stageRef}
            role="region"
            tabIndex={0}
            aria-label="Slide canvas"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(event) => void handleDrop(event)}
          >
            {isDropTargetActive && <div className="canvas-drop-target-hint">Drop an image to add it to this slide.</div>}
            <canvas ref={canvasRef} />
          </div>
        </div>

        <aside
          className={`${isPresenterView ? 'presenter-sidebar' : 'notes-sidebar'} ${!isPresenterView && mobileWorkspaceView !== 'notes' ? 'workspace-pane--hidden-mobile' : ''}`}
          aria-label={isPresenterView ? 'Presenter notes' : 'Slide notes'}
          onClick={() => {
            if (!isPresenterView) {
              setMobileWorkspaceView('notes');
            }
          }}
        >
          {notesPanel}
          {isPresenterView && (
            <div className="panel-card" style={{ marginTop: '1rem' }}>
              <div className="panel-section">
                <h3>Slide controls</h3>
                <div className="slide-nav">
                  <button className="btn btn-secondary" onClick={() => switchSlide(previousSlideId)} type="button">
                    Previous
                  </button>
                  <button className="btn btn-primary" onClick={() => switchSlide(nextSlideId)} type="button">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <StatusBar leftContent={<span>Slide {slideCountLabel} | {saveSummary}</span>} rightContent={<span>{isFullscreen ? 'Fullscreen presentation' : 'Editing canvas'}</span>} />

      <ConfirmDialog
        open={Boolean(pendingDeleteSlideId)}
        title="Delete slide?"
        description="This slide will be removed from the presentation. The remaining deck stays intact."
        confirmLabel="Delete slide"
        tone="danger"
        onConfirm={deleteSlide}
        onClose={() => setPendingDeleteSlideId(null)}
      />

      <ConfirmDialog
        open={Boolean(importCandidate)}
        title="Replace this presentation?"
        description="Importing a PPTX will replace the slides currently open in this deck."
        confirmLabel="Import presentation"
        onConfirm={() => {
          if (importCandidate) {
            void importPptxFile(importCandidate);
          }
          setImportCandidate(null);
        }}
        onClose={() => setImportCandidate(null)}
      />
    </div>
  );
}
