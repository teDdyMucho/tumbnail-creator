import React, { useState, useEffect } from 'react';
import { UrlData } from '../App';

interface UrlPreviewProps {
  urlData: UrlData;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const UrlPreview: React.FC<UrlPreviewProps> = ({ urlData, onToast }) => {
  const [faviconError, setFaviconError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [corsBlocked, setCorsBlocked] = useState(false);

  useEffect(() => {
    // Simulate loading time and check if we have OG data
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!urlData.title || urlData.title === urlData.domain) {
        setCorsBlocked(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [urlData]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(urlData.url);
      onToast('URL copied to clipboard!', 'success');
    } catch (err) {
      onToast('Failed to copy URL', 'error');
    }
  };

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Preview
        </h3>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Preview
      </h3>

      {/* Domain and Favicon */}
      <div className="flex items-center space-x-3">
        {urlData.favicon && !faviconError ? (
          <img
            src={urlData.favicon}
            alt=""
            className="w-6 h-6 rounded"
            onError={handleFaviconError}
          />
        ) : (
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
          {urlData.domain}
        </h4>
      </div>

      {/* URL with Copy Button */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <code className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all flex-1">
            {urlData.url}
          </code>
          <button
            onClick={handleCopyUrl}
            className="btn-secondary text-xs py-1 px-2 flex-shrink-0"
            aria-label="Copy URL to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Open Graph Data or Fallback */}
      {urlData.title && urlData.title !== urlData.domain && (
        <div className="space-y-3">
          <h5 className="font-semibold text-gray-900 dark:text-white">
            {urlData.title}
          </h5>
          {urlData.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {urlData.description}
            </p>
          )}
          {urlData.image && !imageError && (
            <img
              src={urlData.image}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg"
              onError={handleImageError}
            />
          )}
        </div>
      )}

      {/* CORS Notice */}
      {corsBlocked && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Limited Preview:</strong> Couldn't load full preview due to site restrictions. 
                The URL is valid and ready to use.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlPreview;
