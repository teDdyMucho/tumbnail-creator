import React, { useState, useEffect } from 'react';
import { UrlData } from '../App';

interface UrlFormProps {
  onSubmit: (urlData: UrlData) => void;
  initialUrl?: string;
}

const UrlForm: React.FC<UrlFormProps> = ({
  onSubmit,
  initialUrl = ''
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const validateUrl = (input: string): boolean => {
    try {
      const urlObj = new URL(input);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    return `https://${trimmed}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setError('');
  };

  const handleBlur = () => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      const normalized = normalizeUrl(url);
      setUrl(normalized);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    
    if (!validateUrl(normalizedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname;
      const favicon = `${urlObj.origin}/favicon.ico`;

      // Try to fetch Open Graph data
      let title, description, image;
      try {
        // Note: This will likely fail due to CORS, but we'll try anyway
        const response = await fetch(normalizedUrl, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        if (response.ok) {
          // If HEAD request succeeds, try to get the full page for meta tags
          const fullResponse = await fetch(normalizedUrl, { mode: 'cors' });
          const html = await fullResponse.text();
          
          // Parse meta tags
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                  doc.querySelector('title')?.textContent ||
                  domain;
          
          description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="description"]')?.getAttribute('content');
          
          image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
        }
      } catch (corsError) {
        // CORS blocked - this is expected for most sites
        console.log('CORS blocked, using fallback data');
      }

      const urlData: UrlData = {
        url: normalizedUrl,
        domain,
        favicon,
        title: title || domain,
        description: description || undefined,
        image: image || undefined
      };

      onSubmit(urlData);
    } catch (err) {
      setError('Failed to process URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Website URL
        </label>
        <div className="relative">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
            className={`w-full px-4 py-3 font-mono text-sm border rounded-lg transition-colors focus-ring ${
              error
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear URL"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {error && (
          <p id="url-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Use this URL'
          )}
        </button>
      </div>
    </form>
  );
};

export default UrlForm;
