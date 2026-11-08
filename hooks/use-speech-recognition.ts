"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/**
 * Minimal structural types for the Web Speech API. It is not part of the
 * standard TypeScript DOM library, and browser dictation is provided by the
 * browser itself (no audio is uploaded to this application's backend).
 */
interface SpeechRecognitionResultLike extends ArrayLike<{ transcript: string }> {
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

function messageFor(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was denied. Allow it in your browser settings, or type instead.";
    case "no-speech":
      return "No speech detected. Try again in a quieter place.";
    case "audio-capture":
      return "No microphone was found on this device.";
    case "network":
      return "The browser speech service is unavailable right now.";
    case "aborted":
      return "Voice input stopped.";
    default:
      return `Voice input failed (${code}). You can still type your message.`;
  }
}

export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  error: string | null;
  toggle: () => void;
  stop: () => void;
  clearError: () => void;
}

export function useSpeechRecognition(
  onTranscript: (text: string) => void,
): SpeechRecognitionState {
  // useSyncExternalStore is SSR-safe: the server snapshot is `false`, and the
  // browser snapshot is read during hydration without a mismatch warning.
  const supported = useSyncExternalStore(
    () => () => {},
    () => getConstructor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const callbackRef = useRef(onTranscript);

  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    [],
  );

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Constructor = getConstructor();
    if (!Constructor) {
      setError("Voice dictation is not supported in this browser.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Constructor();
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.isFinal) transcript += result[0]?.transcript ?? "";
      }
      const clean = transcript.trim();
      if (clean) callbackRef.current(clean);
    };
    recognition.onerror = (event) => {
      setError(messageFor(event.error));
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setError(null);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start voice input. Try typing instead.");
      setListening(false);
      recognitionRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  const clearError = useCallback(() => setError(null), []);

  return { supported, listening, error, toggle, stop, clearError };
}
