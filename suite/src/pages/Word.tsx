import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Download,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Mic,
  Redo,
  Search,
  Square,
  Strikethrough,
  Table as TableIcon,
  Undo,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import ImageResize from 'tiptap-extension-resize-image';
import { AppHeader } from '../components/AppHeader';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import { getCurrentClientId, loadDocument, saveDocument, subscribeToDocument } from '../utils/db';

interface WordProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

type BannerTone = 'success' | 'warning' | 'error';

interface BannerState {
  tone: BannerTone;
  title: string;
  detail?: string;
}

export default function Word({ toggleTheme, isDarkMode }: WordProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFileName = 'Untitled Document';
  const [docId] = useState(() => searchParams.get('id') || `word-${Date.now()}`);
  const [fileName, setFileName] = useState(defaultFileName);
  const [documentRevision, setDocumentRevision] = useState(0);
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [isDropTargetActive, setIsDropTargetActive] = useState(false);
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState<'editor' | 'insights'>('editor');

  const recognitionRef = useRef<any>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const dragDepthRef = useRef(0);
  const previousFileNameRef = useRef(fileName);

  useEffect(() => {
    if (!searchParams.get('id')) {
      setSearchParams({ id: docId }, { replace: true });
    }
  }, [docId, searchParams, setSearchParams]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ImageResize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content:
      '<h1>Project Brief</h1><p>Use this space for structured writing, meeting notes, and polished copy.</p><p>Tip: open the ribbon on mobile to access formatting tools without losing space.</p>',
  });

  useEffect(() => {
    if (!editor || isLoaded) {
      return;
    }

    loadDocument<string | JSONContent>(docId)
      .then((doc) => {
        if (doc && doc.type === 'word') {
          setFileName(doc.title);
          previousFileNameRef.current = doc.title;
          editor.commands.setContent(doc.data);
          setLastSavedAt(doc.updatedAt);
          setDocumentRevision(doc.revision);
          if (doc.source === 'backup') {
            setBanner({
              tone: 'warning',
              title: 'Recovered the latest local backup.',
              detail: 'This document was restored from the browser backup cache after a storage mismatch.',
            });
          }
        }
        if (!doc) {
          previousFileNameRef.current = defaultFileName;
        }
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load document', error);
        setBanner({
          tone: 'error',
          title: 'Document failed to load cleanly.',
          detail: 'The editor opened with a fresh document instead.',
        });
        setIsLoaded(true);
      });
  }, [docId, editor, isLoaded]);

  useEffect(() => {
    if (!editor || !isLoaded) {
      return;
    }

    const queueSave = () => {
      setSaveStatus('Saving...');
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const result = await saveDocument(docId, fileName, 'word', editor.getJSON(), { knownRevision: documentRevision });
          setDocumentRevision(result.record.revision);

          if (result.status === 'conflict') {
            setSaveStatus('Conflict detected');
            setBanner({
              tone: 'warning',
              title: 'A newer version was saved in another tab.',
              detail: 'Your latest content is still cached locally. Save again from this tab to replace the newer version, or reload to review it first.',
            });
            return;
          }

          setSaveStatus('Saved');
          setLastSavedAt(result.record.updatedAt);
        } catch (error) {
          console.error('Failed to auto-save document', error);
          setSaveStatus('Save error');
          setBanner({
            tone: 'error',
            title: 'Autosave failed.',
            detail: 'Your latest changes are still in the editor, but they could not be written locally.',
          });
        }
      }, 600);
    };

    editor.on('update', queueSave);
    return () => {
      editor.off('update', queueSave);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [docId, documentRevision, editor, fileName, isLoaded]);

  useEffect(() => {
    if (!editor || !isLoaded) {
      return;
    }

    if (previousFileNameRef.current === fileName) {
      return;
    }

    previousFileNameRef.current = fileName;
    setSaveStatus('Saving...');

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await saveDocument(docId, fileName, 'word', editor.getJSON(), { knownRevision: documentRevision });
        setDocumentRevision(result.record.revision);

        if (result.status === 'conflict') {
          setSaveStatus('Conflict detected');
          setBanner({
            tone: 'warning',
            title: 'A newer version was saved in another tab.',
            detail: 'This title change is still cached locally. Save again from this tab to replace the newer version, or reload to review it first.',
          });
          return;
        }

        setSaveStatus('Saved');
        setLastSavedAt(result.record.updatedAt);
      } catch (error) {
        console.error('Failed to save renamed document', error);
        setSaveStatus('Save error');
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [docId, documentRevision, editor, fileName, isLoaded]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setShowImagePanel(false);
        setShowFindReplace(true);
      }

      if (event.key === 'Escape') {
        setShowFindReplace(false);
        setShowImagePanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        title: 'A newer version is available from another tab.',
        detail: 'Reload this document if you want the latest saved version from that session.',
      });
    });
  }, [docId, documentRevision, isLoaded]);

  if (!editor) {
    return null;
  }

  const triggerDownload = (blob: Blob, nextFileName: string) => {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = nextFileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('File could not be read'));
      reader.readAsDataURL(file);
    });

  const loadImageBinary = async (source: string) => {
    if (source.startsWith('data:')) {
      const response = await fetch(source);
      return response.arrayBuffer();
    }

    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Image request failed with ${response.status}`);
    }

    return response.arrayBuffer();
  };

  const inferDocxImageType = (source: string, data: ArrayBuffer): 'png' | 'jpg' | 'gif' | 'bmp' => {
    const mimeMatch = source.match(/^data:image\/([a-zA-Z0-9.+-]+);/);
    const extensionMatch = source.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    const hint = (mimeMatch?.[1] ?? extensionMatch?.[1] ?? '').toLowerCase();

    if (hint === 'jpeg' || hint === 'jpg') {
      return 'jpg';
    }
    if (hint === 'gif') {
      return 'gif';
    }
    if (hint === 'bmp') {
      return 'bmp';
    }
    if (hint === 'png') {
      return 'png';
    }

    const bytes = new Uint8Array(data);
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return 'bmp';
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'gif';
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'jpg';
    }

    return 'png';
  };

  const insertImageFile = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // @ts-expect-error TipTap extension augments the editor commands at runtime.
      editor.chain().focus().setImage({ src: dataUrl }).run();
      setBanner({
        tone: 'success',
        title: 'Image inserted.',
        detail: `Added ${file.name} directly into this document.`,
      });
    } catch (error) {
      console.error('Image file insert failed', error);
      setBanner({
        tone: 'error',
        title: 'Image could not be inserted.',
        detail: 'The selected file could not be read in this browser session.',
      });
    }
  };

  const exportDocx = async () => {
    const docx = await import('docx');
    const json = editor.getJSON();
    const alignmentMap = {
      left: docx.AlignmentType.LEFT,
      center: docx.AlignmentType.CENTER,
      right: docx.AlignmentType.RIGHT,
      justify: docx.AlignmentType.JUSTIFIED,
    } as const;

    const buildTextRuns = (content: any[] = []) =>
      content.flatMap((child: any) => {
        if (child.type === 'hardBreak') {
          return [new docx.TextRun({ text: '', break: 1 })];
        }

        if (child.type !== 'text') {
          return [];
        }

        return [
          new docx.TextRun({
            text: child.text,
            bold: child.marks?.some((mark: any) => mark.type === 'bold'),
            italics: child.marks?.some((mark: any) => mark.type === 'italic'),
            strike: child.marks?.some((mark: any) => mark.type === 'strike'),
          }),
        ];
      });

    const buildParagraph = (
      node: any,
      listContext?: { type: 'bullet' | 'ordered'; level: number },
    ) =>
      new docx.Paragraph({
        children: buildTextRuns(node.content).length > 0 ? buildTextRuns(node.content) : [new docx.TextRun('')],
        heading:
          node.type === 'heading'
            ? docx.HeadingLevel[`HEADING_${Math.min(Math.max(node.attrs?.level ?? 1, 1), 3)}` as keyof typeof docx.HeadingLevel]
            : undefined,
        alignment: node.attrs?.textAlign ? alignmentMap[node.attrs.textAlign as keyof typeof alignmentMap] : undefined,
        bullet: listContext?.type === 'bullet' ? { level: listContext.level } : undefined,
        numbering:
          listContext?.type === 'ordered'
            ? {
                reference: 'officeninja-numbering',
                level: listContext.level,
              }
            : undefined,
      });

    const buildChildren = async (nodes: any[] = [], listLevel = 0): Promise<any[]> => {
      const children: any[] = [];

      for (const node of nodes) {
        if (node.type === 'paragraph' || node.type === 'heading') {
          children.push(buildParagraph(node));
          continue;
        }

        if (node.type === 'bulletList' || node.type === 'orderedList') {
          for (const listItem of node.content ?? []) {
            for (const child of listItem.content ?? []) {
              if (child.type === 'paragraph' || child.type === 'heading') {
                children.push(buildParagraph(child, { type: node.type === 'bulletList' ? 'bullet' : 'ordered', level: listLevel }));
                continue;
              }

              if (child.type === 'bulletList' || child.type === 'orderedList') {
                children.push(...(await buildChildren([child], listLevel + 1)));
              }
            }
          }
          continue;
        }

        if (node.type === 'image' && node.attrs?.src) {
          const data = await loadImageBinary(node.attrs.src);
          const width = Math.max(160, Math.min(520, Number(node.attrs?.width) || 420));
          const height = Math.max(120, Math.min(420, Number(node.attrs?.height) || Math.round(width * 0.6)));
          children.push(
            new docx.Paragraph({
              children: [
                new docx.ImageRun({
                  type: inferDocxImageType(node.attrs.src, data),
                  data,
                  transformation: {
                    width,
                    height,
                  },
                }),
              ],
            }),
          );
          continue;
        }

        if (node.type === 'table') {
          const rows = await Promise.all(
            (node.content ?? []).map(async (row: any) => {
              const cells = await Promise.all(
                (row.content ?? []).map(async (cell: any) => {
                  const cellChildren = (await buildChildren(cell.content ?? [], listLevel)) as any[];
                  return new docx.TableCell({
                    children: cellChildren.length ? cellChildren : [new docx.Paragraph('')],
                  });
                }),
              );

              return new docx.TableRow({
                children: cells,
                tableHeader: row.content?.some((cell: any) => cell.type === 'tableHeader') ?? false,
              });
            }),
          );

          children.push(
            new docx.Table({
              rows,
              width: { size: 100, type: docx.WidthType.PERCENTAGE },
            }),
          );
        }
      }

      return children;
    };

    const children = await buildChildren(json.content ?? []);
    const documentFile = new docx.Document({
      numbering: {
        config: [
          {
            reference: 'officeninja-numbering',
            levels: [
              { level: 0, format: docx.LevelFormat.DECIMAL, text: '%1.', alignment: docx.AlignmentType.START },
              { level: 1, format: docx.LevelFormat.LOWER_LETTER, text: '%2.', alignment: docx.AlignmentType.START },
              { level: 2, format: docx.LevelFormat.LOWER_ROMAN, text: '%3.', alignment: docx.AlignmentType.START },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {},
          children: children.length > 0 ? children : [new docx.Paragraph('')],
        },
      ],
    });

    const blob = await docx.Packer.toBlob(documentFile);
    triggerDownload(blob, `${fileName}.docx`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const arrayBuffer = loadEvent.target?.result as ArrayBuffer;
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        editor.commands.setContent(result.value);
        setBanner({
          tone: 'success',
          title: 'DOCX imported.',
          detail: 'The document content has been loaded into the editor.',
        });
      } catch (error: any) {
        console.error(error);
        setBanner({
          tone: 'error',
          title: 'Import failed.',
          detail: 'This DOCX file could not be converted in the browser.',
        });
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleFindReplace = () => {
    if (!findText.trim()) {
      setBanner({
        tone: 'warning',
        title: 'Enter text to find first.',
        detail: 'Type a word or phrase before running Replace All.',
      });
      return;
    }

    const { state, dispatch } = editor.view;
    let transaction = state.tr;
    let replacementCount = 0;

    state.doc.descendants((node, position) => {
      if (!node.isText || !node.text) {
        return;
      }

      let searchIndex = node.text.indexOf(findText);
      let offset = 0;

      while (searchIndex !== -1) {
        const start = position + searchIndex + offset;
        const end = start + findText.length;

        if (replaceText.length === 0) {
          transaction = transaction.delete(start, end);
        } else {
          transaction = transaction.replaceWith(start, end, state.schema.text(replaceText));
        }

        replacementCount += 1;
        offset += replaceText.length - findText.length;
        searchIndex = node.text.indexOf(findText, searchIndex + findText.length);
      }
    });

    if (replacementCount === 0) {
      setBanner({
        tone: 'warning',
        title: `No matches found for "${findText}".`,
      });
      return;
    }

    dispatch(transaction);
    setBanner({
      tone: 'success',
      title: `${replacementCount} replacement${replacementCount === 1 ? '' : 's'} applied.`,
      detail: replaceText ? `Updated "${findText}" to "${replaceText}".` : `Removed "${findText}" from the document.`,
    });
  };

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBanner({
        tone: 'warning',
        title: 'Speech recognition is unavailable.',
        detail: 'Try Chrome or Edge on desktop if you want live dictation.',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          transcript += `${event.results[index][0].transcript} `;
        }
      }

      if (transcript) {
        editor.commands.insertContent(transcript);
      }
    };
    recognition.onerror = () => setIsDictating(false);
    recognition.onend = () => setIsDictating(false);
    recognition.start();
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const { from, to } = editor.state.selection;
    let textToSpeak = editor.state.doc.textBetween(from, to, ' ');

    if (!textToSpeak.trim()) {
      textToSpeak = editor.getText();
    }

    if (!textToSpeak.trim()) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const insertImageFromUrl = async () => {
    if (!imageUrl.trim()) {
      setBanner({
        tone: 'warning',
        title: 'Paste an image URL first.',
      });
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Image failed to load'));
        image.src = imageUrl.trim();
      });

      // @ts-expect-error TipTap extension augments the editor commands at runtime.
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl('');
      setShowImagePanel(false);
      setBanner({
        tone: 'success',
        title: 'Image inserted.',
        detail: 'The image URL loaded successfully into this document.',
      });
    } catch (error) {
      console.error('Image URL insert failed', error);
      setBanner({
        tone: 'error',
        title: 'Image could not be loaded.',
        detail: 'Check the URL and try a direct image file instead.',
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await insertImageFile(file);
    event.target.value = '';
    setShowImagePanel(false);
  };

  const resetDropTarget = () => {
    dragDepthRef.current = 0;
    setIsDropTargetActive(false);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    const imageFiles = [...event.dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!imageFiles) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropTargetActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    const imageFiles = [...event.dataTransfer.items].some((item) => item.kind === 'file' && item.type.startsWith('image/'));
    if (!imageFiles) {
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

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.ProseMirror')) {
        return;
      }

      const imageFile = [...(event.clipboardData?.files ?? [])].find((file) => file.type.startsWith('image/'));
      if (!imageFile) {
        return;
      }

      event.preventDefault();
      await insertImageFile(imageFile);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editor]);

  const textContent = editor.getText().trim();
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
  const characterCount = textContent.replace(/\s/g, '').length;
  const paragraphCount = editor
    .getJSON()
    .content?.filter((node: any) => node.type === 'paragraph' || node.type === 'heading').length ?? 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const saveSummary =
    saveStatus === 'Saved' && lastSavedAt
      ? `Saved ${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastSavedAt)}`
      : saveStatus;

  return (
    <div className="app-container">
      <AppHeader
        appName="NinjaWord"
        fileName={fileName}
        setFileName={setFileName}
        defaultFileName={defaultFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        saveStatus={saveStatus}
        actions={
          <>
            <input ref={importInputRef} type="file" accept=".docx" hidden onChange={handleFileUpload} />
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            <button className="btn btn-secondary" onClick={() => importInputRef.current?.click()} type="button">
              <Upload size={16} />
              Import DOCX
            </button>
            <button className="btn btn-secondary" onClick={() => void exportDocx()} type="button">
              <Download size={16} />
              Export DOCX
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup label="History">
          <ToolbarButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} isDisabled={!editor.can().undo()} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} isDisabled={!editor.can().redo()} title="Redo" />
        </ToolbarGroup>

        <ToolbarGroup label="Styles">
          <ToolbarButton
            icon={Heading1}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          />
          <ToolbarButton
            icon={Heading2}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          />
          <ToolbarButton icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold" />
          <ToolbarButton
            icon={Italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          />
          <ToolbarButton
            icon={Strikethrough}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Alignment">
          <ToolbarButton
            icon={AlignLeft}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align left"
          />
          <ToolbarButton
            icon={AlignCenter}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align center"
          />
          <ToolbarButton
            icon={AlignRight}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align right"
          />
          <ToolbarButton
            icon={AlignJustify}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Lists">
          <ToolbarButton
            icon={List}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bulleted list"
          />
          <ToolbarButton
            icon={ListOrdered}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered list"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Insert">
          <ToolbarButton
            icon={Search}
            onClick={() => {
              setShowImagePanel(false);
              setShowFindReplace((value) => !value);
            }}
            isActive={showFindReplace}
            title="Find and replace"
          />
          <ToolbarButton
            icon={TableIcon}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert table"
          />
          <ToolbarButton
            icon={ImageIcon}
            onClick={() => {
              setShowFindReplace(false);
              setShowImagePanel((value) => !value);
            }}
            isActive={showImagePanel}
            title="Insert image"
          />
        </ToolbarGroup>

        <ToolbarGroup label="Review">
          <ToolbarButton icon={Mic} onClick={toggleDictation} isActive={isDictating} title={isDictating ? 'Stop dictation' : 'Start dictation'} />
          <ToolbarButton
            icon={isSpeaking ? Square : Volume2}
            onClick={toggleSpeech}
            isActive={isSpeaking}
            title={isSpeaking ? 'Stop read aloud' : 'Read aloud'}
          />
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

      {showFindReplace && (
        <div className="find-replace-bar">
          <input
            className="form-control form-inline-field"
            aria-label="Find text"
            placeholder="Find text"
            value={findText}
            onChange={(event) => setFindText(event.target.value)}
          />
          <input
            className="form-control form-inline-field"
            aria-label="Replace with"
            placeholder="Replace with"
            value={replaceText}
            onChange={(event) => setReplaceText(event.target.value)}
          />
          <button className="btn btn-primary" onClick={handleFindReplace} type="button">
            Replace all
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => setShowFindReplace(false)} type="button">
            <X size={16} />
          </button>
        </div>
      )}

      {showImagePanel && (
        <div className="insert-image-panel">
          <input
            className="form-control form-inline-field form-inline-field--wide"
            aria-label="Image URL"
            placeholder="Paste an image URL"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
          <button className="btn btn-primary" onClick={() => void insertImageFromUrl()} type="button">
            Insert URL
          </button>
          <button className="btn btn-secondary" onClick={() => imageInputRef.current?.click()} type="button">
            Upload file
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => setShowImagePanel(false)} type="button">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="workspace-mobile-switcher" role="group" aria-label="Word mobile sections">
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('editor')}
          type="button"
          aria-pressed={mobileWorkspaceView === 'editor'}
        >
          Editor
        </button>
        <button
          className={`workspace-switcher-tab ${mobileWorkspaceView === 'insights' ? 'active' : ''}`}
          onClick={() => setMobileWorkspaceView('insights')}
          type="button"
          aria-pressed={mobileWorkspaceView === 'insights'}
        >
          Insights
        </button>
      </div>

      <div className="workspace">
        <div
          className={`workspace-center ${mobileWorkspaceView === 'insights' ? 'workspace-pane--hidden-mobile' : ''}`}
          onClick={() => setMobileWorkspaceView('editor')}
        >
          <div className="word-stage">
            <div className="document-stage">
              <div className="document-shell">
                <div
                  className={`document-page ${isDropTargetActive ? 'document-page--drop-target' : ''}`}
                  role="region"
                  aria-label="Document editor"
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(event) => void handleDrop(event)}
                >
                  {isDropTargetActive && <div className="drop-target-hint">Drop an image to embed it here.</div>}
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className={`workspace-sidebar ${mobileWorkspaceView === 'editor' ? 'workspace-pane--hidden-mobile' : ''}`}>
          <div className="panel-stack">
            <div className="panel-card">
              <div className="panel-section">
                <h3>Document insights</h3>
                <div className="metric-grid">
                  <div className="metric-card">
                    <span className="metric-label">Words</span>
                    <span className="metric-value">{wordCount}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Characters</span>
                    <span className="metric-value">{characterCount}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Paragraphs</span>
                    <span className="metric-value">{paragraphCount}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Read time</span>
                    <span className="metric-value">{readingMinutes} min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-section">
                <h3>Working session</h3>
                <ul className="panel-list">
                  <li>Autosave status: {saveSummary}</li>
                  <li>Import DOCX when you need to start from an existing file.</li>
                  <li>Use the ribbon button on mobile to keep the page focused while editing.</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <StatusBar leftContent={<span>Page 1 of 1 | {wordCount} words | {saveSummary}</span>} rightContent={<span>Rich text mode</span>} />
    </div>
  );
}
