import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as fabric from 'fabric';
import { Download, Type, Square, Circle, Trash2, Plus, Play, MonitorPlay, Upload, Palette, Eraser } from 'lucide-react';
import pptxgen from "pptxgenjs";
import JSZip from 'jszip';
import { AppHeader } from '../components/AppHeader';
import { Toolbar, ToolbarGroup, ToolbarButton } from '../components/Toolbar';
import { StatusBar } from '../components/StatusBar';
import { saveDocument, loadDocument } from '../utils/db';

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

export default function PowerPoint({ toggleTheme, isDarkMode }: PowerPointProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docId] = useState(() => searchParams.get('id') || `powerpoint-${Date.now()}`);

  const [fileName, setFileName] = useState('Untitled Presentation');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([{ id: 'slide-1', data: null, notes: '' }]);
  const [currentSlideId, setCurrentSlideId] = useState('slide-1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresenterView, setIsPresenterView] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentColor, setCurrentColor] = useState('#1a73e8');

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('id') && !isLoaded) {
      loadDocument(docId).then(doc => {
        if (doc && doc.type === 'powerpoint') {
          setFileName(doc.title);
          if (doc.data && doc.data.slides && doc.data.slides.length > 0) {
            setSlides(doc.data.slides);
            setCurrentSlideId(doc.data.slides[0].id);
          }
        }
        setIsLoaded(true);
      }).catch(err => {
        console.error("Failed to load presentation", err);
        setIsLoaded(true);
      });
    } else {
      setIsLoaded(true);
    }
  }, [docId, searchParams, isLoaded]);

  // Render current slide onto canvas when switching or after load
  useEffect(() => {
    if (isLoaded && fabricCanvas) {
       const currentSlide = slides.find(s => s.id === currentSlideId);
       if (currentSlide?.data) {
         fabricCanvas.loadFromJSON(currentSlide.data, () => {
           fabricCanvas.renderAll();
         });
       } else {
         fabricCanvas.clear();
         fabricCanvas.backgroundColor = '#ffffff';
         // Add default text if it's the very first slide and empty
         if (slides.length === 1 && !currentSlide?.data) {
           const text = new fabric.IText('Double click to edit', {
              left: 280,
              top: 240,
              fontFamily: 'Segoe UI',
              fontSize: 40,
              fill: '#333333'
            });
            fabricCanvas.add(text);
         }
         fabricCanvas.renderAll();
       }
    }
  }, [isLoaded, currentSlideId, fabricCanvas]);

  // Hook up auto-save when canvas changes
  useEffect(() => {
    if (!fabricCanvas || !isLoaded) return;
    
    let timeout: any;
    const saveState = () => {
       const currentData = fabricCanvas.toJSON();
       const thumbnail = fabricCanvas.toDataURL({ format: 'png', multiplier: 0.3 });
       
       setSlides(prev => {
         const updatedSlides = prev.map(s => s.id === currentSlideId ? { ...s, data: currentData, thumbnail } : s);
         
         setSaveStatus('Saving...');
         clearTimeout(timeout);
         timeout = setTimeout(() => {
            saveDocument(docId, fileName, 'powerpoint', { slides: updatedSlides })
              .then(() => setSaveStatus('Saved'))
              .catch(err => {
                console.error("Failed to save", err);
                setSaveStatus('Error saving');
              });
         }, 1000);

         return updatedSlides;
       });
    };

    fabricCanvas.on('object:modified', saveState);
    fabricCanvas.on('object:added', saveState);
    fabricCanvas.on('object:removed', saveState);

    return () => {
       fabricCanvas.off('object:modified', saveState);
       fabricCanvas.off('object:added', saveState);
       fabricCanvas.off('object:removed', saveState);
       clearTimeout(timeout);
    };
  }, [fabricCanvas, isLoaded, currentSlideId, fileName, docId]);

  // General auto-save for when slides array changes (e.g. new slide, notes updated)
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      setSaveStatus('Saving...');
      saveDocument(docId, fileName, 'powerpoint', { slides })
        .then(() => setSaveStatus('Saved'))
        .catch(console.error);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [slides, fileName, docId, isLoaded]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 960,
      height: 540,
      backgroundColor: '#ffffff',
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

  const switchSlide = (id: string) => {
    if (!fabricCanvas || id === currentSlideId) return;
    
    // Save current slide state before switching
    const currentData = fabricCanvas.toJSON();
    setSlides(prev => prev.map(s => s.id === currentSlideId ? { ...s, data: currentData } : s));
    
    // The actual loading happens in the useEffect hook watching currentSlideId
    setCurrentSlideId(id);
  };

  const addNewSlide = () => {
    if (!fabricCanvas) return;
    const currentData = fabricCanvas.toJSON();
    const newId = `slide-${Date.now()}`;
    
    setSlides(prev => [
      ...prev.map(s => s.id === currentSlideId ? { ...s, data: currentData } : s),
      { id: newId, data: null, notes: '' }
    ]);
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setCurrentSlideId(newId);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePresenterView = () => {
    setIsPresenterView(!isPresenterView);
    setElapsedTime(0);
  };

  useEffect(() => {
    let interval: any;
    if (isPresenterView) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPresenterView]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const updateNotes = (notes: string) => {
    setSlides(prev => prev.map(s => s.id === currentSlideId ? { ...s, notes } : s));
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText('New Text', {
      left: 100,
      top: 100,
      fontFamily: 'Segoe UI',
      fontSize: 24,
      fill: '#000000'
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
  };

  const addRect = () => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: '#1a73e8',
      width: 100,
      height: 100
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: '#ea4335',
      radius: 50
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
  };

  const deleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) {
      alert("A presentation must have at least one slide.");
      return;
    }
    if (window.confirm("Delete this slide?")) {
      const newSlides = slides.filter(s => s.id !== id);
      setSlides(newSlides);
      if (currentSlideId === id) {
        setCurrentSlideId(newSlides[0].id);
      }
    }
  };

  const applyColor = (color: string) => {
    setCurrentColor(color);
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    activeObjects.forEach(obj => {
      obj.set('fill', color);
    });
    fabricCanvas.renderAll();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Prevent deletion if editing text
        if (fabricCanvas && fabricCanvas.getActiveObject() && (fabricCanvas.getActiveObject() as any).isEditing) return;
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas]);

  const handlePptxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, ""));
    setSaveStatus('Importing...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Read presentation XML
      const presentationXml = await zip.file('ppt/presentation.xml')?.async('string');
      if (!presentationXml) throw new Error('Invalid PPTX file');

      // Parse slide relationships
      const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
      const slideRefs: string[] = [];

      if (relsXml) {
        const relsParser = new DOMParser();
        const relsDoc = relsParser.parseFromString(relsXml, 'text/xml');
        const relationships = relsDoc.querySelectorAll('Relationship');

        relationships.forEach(rel => {
          const type = rel.getAttribute('Type');
          const target = rel.getAttribute('Target');
          if (type && type.includes('slide') && target && target.includes('slide')) {
            slideRefs.push(target.replace(/^\/ppt\//, '').replace(/^\.\.\//, ''));
          }
        });
      }

      slideRefs.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

      const newSlides: Slide[] = [];

      for (const slideRef of slideRefs) {
        const slideXml = await zip.file('ppt/slides/' + slideRef)?.async('string');
        if (!slideXml) continue;

        const parser = new DOMParser();
        const slideDoc = parser.parseFromString(slideXml, 'text/xml');

        // Create a temporary, off-screen fabric canvas just to generate JSON
        const tempEl = document.createElement('canvas');
        tempEl.width = 960;
        tempEl.height = 540;
        const tempCanvas = new fabric.Canvas(tempEl, { width: 960, height: 540 });

        const textElements = slideDoc.querySelectorAll('p\\:sp, sp');
        textElements.forEach(sp => {
          const txBody = sp.querySelector('p\\:txBody, txBody');
          if (txBody) {
            const textContent: string[] = [];
            const paragraphs = txBody.querySelectorAll('a\\:p, p');
            paragraphs.forEach(p => {
              const runs = p.querySelectorAll('a\\:r, r');
              runs.forEach(r => {
                const t = r.querySelector('a\\:t, t');
                if (t) textContent.push(t.textContent || '');
              });
            });

            if (textContent.length > 0) {
              const xfrm = sp.querySelector('p\\:spPr a\\:xfrm, spPr xfrm');
              let x = 100, y = 100;

              if (xfrm) {
                const off = xfrm.querySelector('a\\:off, off');
                if (off) {
                  x = parseInt(off.getAttribute('x') || '0') / 914400 * 96;
                  y = parseInt(off.getAttribute('y') || '0') / 914400 * 96;
                }
              }

              const text = new fabric.IText(textContent.join(' '), {
                left: Math.max(0, x),
                top: Math.max(0, y),
                fontFamily: 'Segoe UI',
                fontSize: 24,
                fill: '#000000',
              });
              // @ts-ignore - overriding internal width if needed, but standard IText handles it mostly
              tempCanvas.add(text);
            }
          }
        });

        if (tempCanvas.getObjects().length === 0) {
           const text = new fabric.IText('Imported slide', {
              left: 280, top: 240, fontFamily: 'Segoe UI', fontSize: 40, fill: '#666666'
           });
           tempCanvas.add(text);
        }

        newSlides.push({
          id: `slide-${Date.now()}-${Math.random()}`,
          data: tempCanvas.toJSON(),
          notes: ''
        });
        
        tempCanvas.dispose();
      }

      if (newSlides.length > 0) {
        setSlides(newSlides);
        setCurrentSlideId(newSlides[0].id);
        setSaveStatus('Saved');
      } else {
        setSaveStatus('Import failed');
      }

    } catch (err: any) {
      console.error('PPTX import error:', err);
      setSaveStatus('Import Error');
    }

    e.target.value = '';
  };

  const exportPptx = async () => {
    if (!fabricCanvas) return;
    let pptx = new pptxgen();
    let slide = pptx.addSlide();

    // Very basic export - in reality we'd iterate through fabricCanvas._objects
    // and map them to pptxgen elements based on type, coordinates, etc.
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
        // Convert coordinates from 960x540 to inches (10x5.625 default pptxgen)
        const scaleX = 10 / 960;
        const scaleY = 5.625 / 540;
        const x = (obj.left || 0) * scaleX;
        const y = (obj.top || 0) * scaleY;
        const w = (obj.width || 0) * (obj.scaleX || 1) * scaleX;
        const h = (obj.height || 0) * (obj.scaleY || 1) * scaleY;

        if (obj.type === 'i-text' || obj.type === 'text') {
            slide.addText((obj as fabric.IText).text || '', {
                x, y, w, h,
                fontSize: ((obj as fabric.IText).fontSize || 12) * scaleY * 1.5,
                color: ((obj.fill as string) || '#000000').replace('#', '')
            });
        } else if (obj.type === 'rect') {
            slide.addShape(pptx.ShapeType.rect, {
                x, y, w, h, fill: { color: ((obj.fill as string) || '#000000').replace('#', '') }
            });
        } else if (obj.type === 'circle') {
            slide.addShape(pptx.ShapeType.ellipse, {
                x, y, w, h, fill: { color: ((obj.fill as string) || '#000000').replace('#', '') }
            });
        }
    });

    pptx.writeFile({ fileName: `${fileName}.pptx` });
  };

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
              type="file" 
              id="upload-pptx" 
              accept=".pptx" 
              style={{ display: 'none' }} 
              onChange={handlePptxImport} 
            />
            <button className="btn btn-secondary" onClick={() => document.getElementById('upload-pptx')?.click()}>
              <Upload size={16} /> Import PPTX
            </button>
            <button className="btn btn-secondary" onClick={exportPptx}>
              <Download size={16} /> Export PPTX
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup>
          <ToolbarButton icon={Plus} onClick={addNewSlide} title="New Slide" />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton icon={Type} onClick={addText} title="Add Text" />
          <ToolbarButton icon={Square} onClick={addRect} title="Add Rectangle" />
          <ToolbarButton icon={Circle} onClick={addCircle} title="Add Circle" />
        </ToolbarGroup>
        <ToolbarGroup>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
            <Palette size={18} color={currentColor} />
            <input 
              type="color" 
              value={currentColor} 
              onChange={(e) => applyColor(e.target.value)} 
              style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </div>
          <ToolbarButton icon={Trash2} onClick={deleteSelected} isDisabled={!hasSelection} title="Delete Selected Object" />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton icon={Play} onClick={toggleFullscreen} title="Present Fullscreen" />
          <ToolbarButton icon={MonitorPlay} onClick={togglePresenterView} title="Presenter View" />
        </ToolbarGroup>
      </Toolbar>

      <div className="workspace" style={isPresenterView ? { background: '#111', color: '#fff', flexDirection: 'column' } : {}}>
        
        {isPresenterView && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', padding: '1rem', flexShrink: 0 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatTime(elapsedTime)}</div>
            <button className="btn btn-secondary" style={{ background: '#333', color: '#fff', border: 'none' }} onClick={togglePresenterView}>Exit Presenter View</button>
          </div>
        )}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {!isPresenterView && (
            <div className="slide-panel" style={{ width: '200px', background: 'var(--bg)', borderRight: '1px solid var(--border)', padding: '1rem', overflowY: 'auto' }}>
              {slides.map((slide, index) => (
                <div 
                  key={slide.id}
                  className={`slide-thumbnail ${currentSlideId === slide.id ? 'active' : ''}`} 
                  onClick={() => switchSlide(slide.id)}
                  style={{ 
                    background: 'white', 
                    border: `2px solid ${currentSlideId === slide.id ? 'var(--primary)' : 'var(--border)'}`, 
                    borderRadius: '4px', 
                    aspectRatio: '16/9', 
                    position: 'relative',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ccc'
                  }}
                >
                  {slide.thumbnail && (
                    <img src={slide.thumbnail} alt={`Slide ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )}
                  <button 
                    onClick={(e) => deleteSlide(slide.id, e)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.8)', border: 'none', color: 'white', borderRadius: '4px', padding: '2px', cursor: 'pointer', opacity: currentSlideId === slide.id ? 1 : 0 }}
                    className="delete-slide-btn"
                  >
                    <X size={12} />
                  </button>
                  <div className="slide-number" style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '3px' }}>
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="presentation-container" style={{
            flex: isPresenterView ? 2 : 1,
            ...(isFullscreen ? {
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'
            } : isPresenterView ? {
              background: '#222', margin: '1rem', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column'
            } : {})
          }}>
            {isPresenterView && <h3 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Current Slide</h3>}
            <div className="canvas-wrapper" style={{
              ...(isFullscreen ? { transform: 'scale(1.5)', transition: 'transform 0.3s' } : isPresenterView ? { transformOrigin: 'top left', transform: 'scale(0.8)' } : {})
            }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {isPresenterView && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', paddingLeft: 0 }}>
              <div style={{ background: '#222', padding: '1rem', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Speaker Notes</h3>
                <textarea 
                  value={slides.find(s => s.id === currentSlideId)?.notes || ''}
                  onChange={(e) => updateNotes(e.target.value)}
                  style={{ flex: 1, background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '1rem', fontSize: '1.1rem', resize: 'none', outline: 'none' }}
                  placeholder="Click to add speaker notes..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem', background: '#222', borderRadius: '8px' }}>
                <button className="btn btn-primary" onClick={() => switchSlide(slides[Math.max(0, slides.findIndex(s => s.id === currentSlideId) - 1)].id)}>Previous</button>
                <button className="btn btn-primary" onClick={() => switchSlide(slides[Math.min(slides.length - 1, slides.findIndex(s => s.id === currentSlideId) + 1)].id)}>Next Slide</button>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <StatusBar 
        leftContent={<span>Slide {slides.findIndex(s => s.id === currentSlideId) + 1} of {slides.length} &bull; {saveStatus}</span>}
        rightContent={<span>75%</span>}
      />
    </div>
  );
}