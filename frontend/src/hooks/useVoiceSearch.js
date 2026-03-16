import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceSearch = (options = {}) => {
  const {
    language = 'id-ID',
    continuous = false,
    onResult = () => {},
    onError = () => {},
    onEnd = () => {},
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = continuous;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcriptPart;
            } else {
              interim += transcriptPart;
            }
          }

          if (final) {
            setTranscript(final);
            onResult(final);
          }
          setInterimTranscript(interim);
        };

        recognitionRef.current.onerror = (event) => {
          setError(event.error);
          setIsListening(false);
          onError(event.error);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          onEnd();
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, onResult, onError, onEnd]);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    start,
    stop,
    toggle,
  };
};

export default useVoiceSearch;
