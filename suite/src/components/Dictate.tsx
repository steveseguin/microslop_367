import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Mic, Square } from 'lucide-react';
import '../styles/dictate.css';
import { speechRecognition } from '../utils/speech';
import type { Recognition } from '../utils/speech';

/**
 * Speak instead of type, using the browser's own speech recognition.
 *
 * On-device recognition is used whenever the browser offers it for the
 * language; otherwise the browser's online service is used, but only after the
 * user has agreed once (audio may leave the device). Nothing is recorded or
 * stored by OfficeNinja. Where the API does not exist (e.g. Firefox), the
 * button is simply not rendered and typing works as before.
 */

const CONSENT_KEY = 'officeninja_speech_online_ok';

let active: Recognition | null = null;

export function DictateButton({
  onText,
  label,
  continuous = false,
  className = '',
  disabled,
}: {
  /** Receives each final phrase. */
  onText: (text: string) => void;
  /** What is being dictated, e.g. "description" — used in the accessible name. */
  label: string;
  /** Keep listening across pauses (long text). Short fields stop after one phrase. */
  continuous?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [problem, setProblem] = useState('');
  const instance = useRef<Recognition | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  });
  useEffect(
    () => () => {
      instance.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!problem) return;
    const t = window.setTimeout(() => setProblem(''), 6000);
    return () => window.clearTimeout(t);
  }, [problem]);

  const Constructor = speechRecognition();
  if (!Constructor) return null;

  const stop = () => instance.current?.stop();

  const start = async () => {
    // One microphone at a time across the whole page.
    active?.stop();
    setProblem('');
    const lang = navigator.language || 'en-US';
    const recognition = new Constructor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    let local = false;
    if ('processLocally' in recognition && Constructor.available) {
      try {
        local =
          (await Constructor.available({ langs: [lang], processLocally: true })) ===
          'available';
      } catch {
        local = false;
      }
    }
    if (local) recognition.processLocally = true;
    else {
      let agreed = false;
      try {
        agreed = localStorage.getItem(CONSENT_KEY) === '1';
      } catch {
        /* storage blocked: ask every time */
      }
      if (!agreed) {
        agreed = window.confirm(
          'Speech input uses your browser’s speech service, which may send microphone audio online. OfficeNinja never records or stores audio. Continue?',
        );
        if (!agreed) return;
        try {
          localStorage.setItem(CONSENT_KEY, '1');
        } catch {
          /* ignore */
        }
      }
      if ('processLocally' in recognition) recognition.processLocally = false;
    }
    recognition.onresult = (event) => {
      let final = '';
      let partial = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else partial += result[0].transcript;
      }
      setInterim(partial);
      if (final.trim()) handler.current(final.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setProblem(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access is blocked. Allow it in your browser’s site settings.'
          : `Speech input stopped (${event.error}).`,
      );
    };
    recognition.onend = () => {
      if (instance.current === recognition) instance.current = null;
      if (active === recognition) active = null;
      setListening(false);
      setInterim('');
    };
    instance.current = recognition;
    active = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setProblem('Speech input could not start.');
    }
  };

  return (
    <span className={`dictate ${className}`.trim()}>
      <button
        type="button"
        className="dictate__btn"
        aria-pressed={listening}
        // A fixed name, so it never collides with the field's own label; the
        // field it belongs to is in the description.
        aria-label={listening ? 'Stop voice input' : 'Voice input'}
        title={listening ? 'Stop listening' : `Speak to enter ${label}`}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => (listening ? stop() : void start())}
      >
        {listening ? <Square size={13} /> : <Mic size={15} />}
      </button>
      {(interim || problem) && (
        <span
          className={`dictate__bubble${problem ? ' dictate__bubble--problem' : ''}`}
          role="status"
        >
          {problem || `${interim}…`}
        </span>
      )}
    </span>
  );
}

/** An input or textarea with a mic button tucked inside its right edge. */
export function DictateField({
  children,
  onText,
  label,
  continuous,
  disabled,
  multiline,
}: {
  children: ReactNode;
  onText: (text: string) => void;
  label: string;
  continuous?: boolean;
  disabled?: boolean;
  multiline?: boolean;
}) {
  if (!speechRecognition()) return <>{children}</>;
  return (
    <span className={`dictate-field${multiline ? ' dictate-field--multiline' : ''}`}>
      {children}
      <DictateButton
        onText={onText}
        label={label}
        continuous={continuous}
        disabled={disabled}
      />
    </span>
  );
}
