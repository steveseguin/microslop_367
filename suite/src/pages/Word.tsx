import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
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
import * as docx from 'docx';
import * as mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import { AppHeader } from '../components/AppHeader';
import { StatusBar } from '../components/StatusBar';
import { Toolbar, ToolbarButton, ToolbarGroup } from '../components/Toolbar';
import { loadDocument, saveDocument } from '../utils/db';

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
  const [docId] = useState(() => searchParams.get('id') || `word-${Date.now()}`);
  const [fileName, setFileName] = useState('Untitled Document');
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

  const recognitionRef = useRef<any>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

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

    loadDocument<string>(docId)
      .then((doc) => {
        if (doc && doc.type === 'word') {
          setFileName(doc.title);
          editor.commands.setContent(doc.data);
          setLastSavedAt(doc.updatedAt);
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
          await saveDocument(docId, fileName, 'word', editor.getHTML());
          setSaveStatus('Saved');
          setLastSavedAt(Date.now());
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
  }, [docId, editor, fileName, isLoaded]);

  useEffect(() => {
    if (!editor || !isLoaded) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        await saveDocument(docId, fileName, 'word', editor.getHTML());
        setSaveStatus('Saved');
        setLastSavedAt(Date.now());
      } catch (error) {
        console.error('Failed to save renamed document', error);
        setSaveStatus('Save error');
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [docId, editor, fileName, isLoaded]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!editor) {
    return null;
  }

  const exportDocx = () => {
    const json = editor.getJSON();
    const children: docx.Paragraph[] = [];

    json.content?.forEach((node: any) => {
      if (node.type !== 'paragraph' && node.type !== 'heading') {
        return;
      }

      const runs: docx.TextRun[] = [];
      node.content?.forEach((child: any) => {
        if (child.type !== 'text') {
          return;
        }

        runs.push(
          new docx.TextRun({
            text: child.text,
            bold: child.marks?.some((mark: any) => mark.type === 'bold'),
            italics: child.marks?.some((mark: any) => mark.type === 'italic'),
            strike: child.marks?.some((mark: any) => mark.type === 'strike'),
          }),
        );
      });

      children.push(
        new docx.Paragraph({
          children: runs.length > 0 ? runs : [new docx.TextRun('')],
          heading:
            node.type === 'heading'
              ? docx.HeadingLevel[`HEADING_${node.attrs.level}` as keyof typeof docx.HeadingLevel]
              : undefined,
          alignment: node.attrs?.textAlign
            ? docx.AlignmentType[node.attrs.textAlign.toUpperCase() as keyof typeof docx.AlignmentType]
            : undefined,
        }),
      );
    });

    const documentFile = new docx.Document({
      sections: [
        {
          properties: {},
          children: children.length > 0 ? children : [new docx.Paragraph('')],
        },
      ],
    });

    void docx.Packer.toBlob(documentFile).then((blob) => saveAs(blob, `${fileName}.docx`));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setFileName(file.name.replace(/\.[^/.]+$/, ''));

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const arrayBuffer = loadEvent.target?.result as ArrayBuffer;
      mammoth
        .convertToHtml({ arrayBuffer })
        .then((result: any) => {
          editor.commands.setContent(result.value);
          setBanner({
            tone: 'success',
            title: 'DOCX imported.',
            detail: 'The document content has been loaded into the editor.',
          });
        })
        .catch((error: any) => {
          console.error(error);
          setBanner({
            tone: 'error',
            title: 'Import failed.',
            detail: 'This DOCX file could not be converted in the browser.',
          });
        });
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

  const insertImageFromUrl = () => {
    if (!imageUrl.trim()) {
      setBanner({
        tone: 'warning',
        title: 'Paste an image URL first.',
      });
      return;
    }

    // @ts-expect-error TipTap extension augments the editor commands at runtime.
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    setImageUrl('');
    setShowImagePanel(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // @ts-expect-error TipTap extension augments the editor commands at runtime.
      editor.chain().focus().setImage({ src: reader.result as string }).run();
      setBanner({
        tone: 'success',
        title: 'Image inserted.',
        detail: 'The selected file was embedded directly into this document.',
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
    setShowImagePanel(false);
  };

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
            <button className="btn btn-secondary" onClick={exportDocx} type="button">
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
          <ToolbarButton icon={Search} onClick={() => setShowFindReplace((value) => !value)} isActive={showFindReplace} title="Find and replace" />
          <ToolbarButton
            icon={TableIcon}
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert table"
          />
          <ToolbarButton icon={ImageIcon} onClick={() => setShowImagePanel((value) => !value)} isActive={showImagePanel} title="Insert image" />
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

      {showFindReplace && (
        <div className="find-replace-bar">
          <input
            className="form-control form-inline-field"
            placeholder="Find text"
            value={findText}
            onChange={(event) => setFindText(event.target.value)}
          />
          <input
            className="form-control form-inline-field"
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
            placeholder="Paste an image URL"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
          <button className="btn btn-primary" onClick={insertImageFromUrl} type="button">
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

      <div className="workspace">
        <div className="workspace-center">
          <div className="word-stage">
            <div className="document-stage">
              <div className="document-shell">
                <div className="document-page">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="workspace-sidebar">
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
