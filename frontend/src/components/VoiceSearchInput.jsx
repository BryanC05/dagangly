import { useState, useEffect } from 'react';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { Mic, MicOff, X } from 'lucide-react';

const VoiceSearchInput = ({ onSearch, placeholder = 'Search...' }) => {
  const [inputValue, setInputValue] = useState('');
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    toggle,
  } = useVoiceSearch({
    language: 'id-ID',
    onResult: (result) => {
      setInputValue(result);
      onSearch(result);
    },
  });

  useEffect(() => {
    if (interimTranscript) {
      setInputValue(interimTranscript);
    }
  }, [interimTranscript]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  if (!isSupported) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="absolute right-2 flex items-center gap-1">
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={toggle}
          className={`p-1 rounded-full ${
            isListening
              ? 'text-red-500 animate-pulse'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start voice search'}
        >
          {isListening ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>
      </div>
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
          Listening...
        </div>
      )}
    </form>
  );
};

export default VoiceSearchInput;
