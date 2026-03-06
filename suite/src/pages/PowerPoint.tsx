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
import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import { AppHeader } from '../components/AppHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import { loadDocument, saveDocument } from '../utils/db';

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

export default function PowerPoint({ toggleTheme, isDarkMode }: PowerPointProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docId] = useState(() => searchParams.get('id') || `powerpoint-${Date.now()}`);
  const [fileName, setFileName] = useState('Untitled Presentation');
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pptImportRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const isHistoryUpdate = useRef(false);

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
  }, [isPresenterView]);

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

    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await saveDocument(docId, fileName, 'powerpoint', { slides });
        setSaveStatus('Saved');
        setLastSavedAt(Date.now());
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
  }, [docId, fileName, isLoaded, slides]);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const image = await fabric.Image.fromURL(reader.result as string);
        image.scaleToWidth(260);
        image.set({ left: 120, top: 120 });
        fabricCanvas.add(image);
        fabricCanvas.setActiveObject(image);
      } catch (error) {
        console.error('Image load failed', error);
        setBanner({
          tone: 'error',
          title: 'Image could not be inserted.',
        });
      }
    };

    reader.readAsDataURL(file);
    event.target.value = '';
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

  const importPptxFile = async (file: File) => {
    setSaveStatus('Importing...');
    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    try {
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
        const slideXml = await zip.file(`ppt/${slideRef}`)?.async('string');
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

        slideDoc.querySelectorAll('p\\:sp, sp').forEach((shape) => {
          const textBody = shape.querySelector('p\\:txBody, txBody');
          if (!textBody) {
            return;
          }

          const parts: string[] = [];
          textBody.querySelectorAll('a\\:t, t').forEach((textNode) => {
            parts.push(textNode.textContent || '');
          });

          if (!parts.length) {
            return;
          }

          const transform = shape.querySelector('a\\:xfrm, xfrm');
          let left = 90;
          let top = 110;

          if (transform) {
            const offset = transform.querySelector('a\\:off, off');
            if (offset) {
              left = (parseInt(offset.getAttribute('x') || '0', 10) / 914400) * 96;
              top = (parseInt(offset.getAttribute('y') || '0', 10) / 914400) * 96;
            }
          }

          tempCanvas.add(
            createTextObject(parts.join(' '), {
              left: Math.max(40, left),
              top: Math.max(40, top),
              fontSize: 24,
            }),
          );
        });

        if (tempCanvas.getObjects().length === 0) {
          applySlideTemplate(tempCanvas as unknown as fabric.Canvas, importedSlides.length === 0 ? 'cover' : 'content');
        }

        importedSlides.push({
          id: `slide-${Date.now()}-${importedSlides.length}`,
          data: tempCanvas.toJSON(),
          notes: '',
          thumbnail: tempCanvas.toDataURL({ format: 'png', multiplier: 0.22 }),
        });

        tempCanvas.dispose();
      }

      if (!importedSlides.length) {
        throw new Error('No slides were imported');
      }

      setSlides(importedSlides);
      setCurrentSlideId(importedSlides[0].id);
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

    const presentation = new pptxgen();
    presentation.layout = 'LAYOUT_WIDE';
    presentation.author = 'OfficeNinja';
    presentation.subject = fileName;
    presentation.title = fileName;

    exportSlides.forEach((slideData) => {
      const slide = presentation.addSlide();
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
          slide.addShape(pptxgen.ShapeType.roundRect, {
            x,
            y,
            w: Math.max(0.3, w),
            h: Math.max(0.3, h),
            fill: { color: normalizeColor(object.fill) },
            line: { color: normalizeColor(object.stroke || object.fill) },
          });
        } else if (object.type === 'circle') {
          slide.addShape(pptxgen.ShapeType.ellipse, {
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
            />
          </div>
          <ToolbarButton icon={Play} onClick={() => void toggleFullscreen()} title={isFullscreen ? 'Exit fullscreen' : 'Present fullscreen'} />
          <ToolbarButton icon={MonitorPlay} onClick={togglePresenterView} isActive={isPresenterView} title="Presenter view" />
        </ToolbarGroup>
      </Toolbar>

      {banner && (
        <div className={`editor-banner editor-banner--${banner.tone}`}>
          <div>
            <div className="editor-banner__text">{banner.title}</div>
            {banner.detail && <div className="editor-banner__hint">{banner.detail}</div>}
          </div>
          <button className="btn btn-secondary btn-icon" onClick={() => setBanner(null)} type="button">
            <X size={16} />
          </button>
        </div>
      )}

      {isPresenterView ? (
        <div className="presenter-shell">
          <div className="presenter-stage">
            <div className="presenter-toolbar">
              <div className="presenter-clock">{formatTime(elapsedTime)}</div>
              <button className="btn btn-secondary" onClick={togglePresenterView} type="button">
                Exit presenter view
              </button>
            </div>
            <div className="canvas-shell" ref={stageRef}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          <aside className="presenter-sidebar">
            {notesPanel}
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
          </aside>
        </div>
      ) : (
        <div className="workspace">
          <div className="slides-layout">
            <aside className="slide-sidebar">
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

              <div className="slide-list">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    className={`slide-card ${slide.id === currentSlideId ? 'slide-card--active' : ''}`}
                    onClick={() => switchSlide(slide.id)}
                    type="button"
                  >
                    <div className="slide-card__thumb">
                      {slide.thumbnail ? <img src={slide.thumbnail} alt={`Slide ${index + 1}`} /> : <span>Slide preview</span>}
                    </div>
                    <div className="slide-card__caption">
                      <span>Slide {index + 1}</span>
                      <span>{slide.id === currentSlideId ? 'Editing' : 'Open'}</span>
                    </div>
                    <span
                      className="slide-card__delete"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPendingDeleteSlideId(slide.id);
                      }}
                    >
                      <X size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="presentation-stage">
              <div className="canvas-shell" ref={stageRef}>
                <canvas ref={canvasRef} />
              </div>
            </div>

            <aside className="notes-sidebar">{notesPanel}</aside>
          </div>
        </div>
      )}

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
