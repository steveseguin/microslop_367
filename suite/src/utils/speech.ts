/** Browser speech recognition helpers shared by every speech-input control. */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
export interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  processLocally?: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<RecognitionResult>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
interface RecognitionConstructor {
  new (): Recognition;
  available?: (options: {
    langs: string[];
    processLocally: boolean;
  }) => Promise<string>;
}


export function speechRecognition(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Join spoken words onto existing text with sensible spacing and capitals. */
export function appendSpoken(previous: string, spoken: string) {
  const text = spoken.trim();
  if (!text) return previous;
  if (!previous.trim()) return text.charAt(0).toUpperCase() + text.slice(1);
  const joiner = /[\s\n]$/.test(previous) ? '' : ' ';
  const capital = /[.!?]\s*$/.test(previous);
  return `${previous}${joiner}${capital ? text.charAt(0).toUpperCase() + text.slice(1) : text}`;
}

/** Spoken numbers come back as words or with units; keep just the number. */
export function spokenNumber(spoken: string) {
  const match = spoken.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? match[0] : '';
}


/**
 * Put spoken text where the user's cursor is: replace the selection if there is
 * one, otherwise insert at the caret with sensible spacing.
 */
export function spliceSpoken(
  value: string,
  start: number | null,
  end: number | null,
  spoken: string,
) {
  const text = spoken.trim();
  if (!text) return value;
  const a = start ?? value.length;
  const b = end ?? a;
  const before = value.slice(0, a);
  const after = value.slice(b);
  const head = before && !/\s$/.test(before) ? `${before} ` : before;
  const piece =
    !head.trim() || /[.!?]\s*$/.test(head)
      ? text.charAt(0).toUpperCase() + text.slice(1)
      : text;
  const tail = after && !/^[\s.,!?;:]/.test(after) ? ` ${after}` : after;
  return `${head}${piece}${tail}`;
}
