import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Download, Upload, Mic, Volume2, Square
} from 'lucide-react';
import * as docx from 'docx';
import * as mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import { AppHeader } from '../components/AppHeader';
import { Toolbar, ToolbarGroup, ToolbarButton } from '../components/Toolbar';
import { StatusBar } from '../components/StatusBar';
import { saveDocument, loadDocument } from '../utils/db';

interface WordProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export default function Word({ toggleTheme, isDarkMode }: WordProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docId] = useState(() => searchParams.get('id') || `word-${Date.now()}`);
  
  const [fileName, setFileName] = useState('Untitled Document');
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isLoaded, setIsLoaded] = useState(false);
  const recognitionRef = useRef<any>(null);

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
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '<h2>Welcome to NinjaWord</h2><p>Start typing your document here...</p>',
  });

  useEffect(() => {
    if (editor && !isLoaded) {
      if (searchParams.get('id')) {
        loadDocument(docId).then(doc => {
          if (doc && doc.type === 'word') {
            setFileName(doc.title);
            editor.commands.setContent(doc.data);
          }
          setIsLoaded(true);
        }).catch(err => {
          console.error("Failed to load document", err);
          setIsLoaded(true);
        });
      } else {
        setIsLoaded(true);
      }
    }
  }, [editor, searchParams, docId, isLoaded]);

  useEffect(() => {
    if (editor && isLoaded) {
      const handleUpdate = () => {
        setSaveStatus('Saving...');
        saveDocument(docId, fileName, 'word', editor.getHTML())
          .then(() => setSaveStatus('Saved'))
          .catch(err => {
            console.error("Failed to auto-save", err);
            setSaveStatus('Error saving');
          });
      };
      
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, isLoaded, docId, fileName]);

  useEffect(() => {
    // Save when filename changes
    if (editor && isLoaded) {
      saveDocument(docId, fileName, 'word', editor.getHTML()).catch(console.error);
    }
  }, [fileName, docId, editor, isLoaded]);

  if (!editor) return null;

  const exportDocx = () => {
    const json = editor.getJSON();
    const children: any[] = [];
    
    json.content?.forEach((node: any) => {
      if (node.type === 'paragraph' || node.type === 'heading') {
        const textRuns: docx.TextRun[] = [];
        node.content?.forEach((n: any) => {
          if (n.type === 'text') {
            textRuns.push(new docx.TextRun({ 
              text: n.text, 
              bold: n.marks?.some((m: any) => m.type === 'bold'), 
              italics: n.marks?.some((m: any) => m.type === 'italic'),
              strike: n.marks?.some((m: any) => m.type === 'strike')
            }));
          }
        });
        
        children.push(new docx.Paragraph({ 
          children: textRuns.length > 0 ? textRuns : [new docx.TextRun("")], 
          heading: node.type === 'heading' ? docx.HeadingLevel[`HEADING_${node.attrs.level}` as keyof typeof docx.HeadingLevel] : undefined,
          alignment: node.attrs?.textAlign ? docx.AlignmentType[node.attrs.textAlign.toUpperCase() as keyof typeof docx.AlignmentType] : undefined
        }));
      }
    });

    const doc = new docx.Document({
        sections: [{ properties: {}, children: children.length > 0 ? children : [new docx.Paragraph("")] }]
    });

    docx.Packer.toBlob(doc).then(blob => saveAs(blob, `${fileName}.docx`));
  };

  const wordCount = editor.getText().trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      const arrayBuffer = loadEvent.target?.result as ArrayBuffer;
      mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
        .then((result: any) => {
          editor.commands.setContent(result.value);
        })
        .catch((err: any) => console.error(err));
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleDictation = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsDictating(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        editor.commands.insertContent(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsDictating(false);
    };
    
    recognition.onend = () => setIsDictating(false);

    recognition.start();
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = editor.getText();
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="app-container">
      <AppHeader 
        appName="NinjaWord" 
        fileName={fileName} 
        setFileName={setFileName}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        actions={
          <>
            <input 
              type="file" 
              id="upload-word" 
              accept=".docx" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <button className="btn btn-secondary" onClick={() => document.getElementById('upload-word')?.click()}>
              <Upload size={16} /> Import DOCX
            </button>
            <button className="btn btn-secondary" onClick={exportDocx}>
              <Download size={16} /> Export DOCX
            </button>
          </>
        }
      />

      <Toolbar>
        <ToolbarGroup>
          <ToolbarButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} isDisabled={!editor.can().undo()} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} isDisabled={!editor.can().redo()} title="Redo" />
        </ToolbarGroup>
        
        <ToolbarGroup>
          <ToolbarButton icon={Heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1" />
          <ToolbarButton icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold" />
          <ToolbarButton icon={Italic} onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic" />
          <ToolbarButton icon={Strikethrough} onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton icon={AlignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left" />
          <ToolbarButton icon={AlignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center" />
          <ToolbarButton icon={AlignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right" />
          <ToolbarButton icon={AlignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton icon={List} onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List" />
          <ToolbarButton icon={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List" />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton icon={Mic} onClick={toggleDictation} isActive={isDictating} title={isDictating ? "Stop Dictation" : "Start Dictation"} />
          <ToolbarButton icon={isSpeaking ? Square : Volume2} onClick={toggleSpeech} isActive={isSpeaking} title={isSpeaking ? "Stop Reading" : "Read Aloud"} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton icon={TableIcon} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table" />
          <ToolbarButton icon={ImageIcon} onClick={() => {
            const url = window.prompt('URL');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }} title="Insert Image" />
        </ToolbarGroup>
      </Toolbar>

      <div className="workspace">
        <div className="workspace-center" style={{ background: '#f0f0f0', overflowY: 'auto' }}>
          <div className="document-page" style={{ margin: '2rem auto', background: 'white', padding: '1in', minHeight: '11in', width: '8.5in', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      
      <StatusBar 
        leftContent={<span>Page 1 of 1 &bull; {wordCount} words &bull; {saveStatus}</span>}
        rightContent={<span>100%</span>}
      />
    </div>
  );
}