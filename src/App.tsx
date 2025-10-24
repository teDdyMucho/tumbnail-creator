import React, { useState, useEffect } from 'react';
import { UrlForm, ThemeToggle, Toast } from './components';

export interface UrlData {
  url: string;
  domain: string;
  favicon?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<UrlData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [webhookImage, setWebhookImage] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookNote, setWebhookNote] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newIsDark);
  };

  const handleViewImage = () => {
    if (!webhookImage) return;
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => setIsImageModalOpen(false);

  useEffect(() => {
    if (!isImageModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isImageModalOpen]);

  const handleUrlSubmit = (urlData: UrlData) => {
    setSelectedUrl(urlData);
    console.log('FINAL_URL', urlData.url);

    const postWebhook = async () => {
      setWebhookLoading(true);
      setWebhookImage(null);
      setWebhookNote(null);
      try {
        const res = await fetch('https://primary-production-56087.up.railway.app/webhook/tumbnail-creator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlData.url }),
          mode: 'cors',
          keepalive: true,
        });
        if (res.ok) {
          // Handle various response types
          const contentType = res.headers.get('content-type') || '';

          // 1) Direct image blob
          if (contentType.startsWith('image/')) {
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            setWebhookImage(objectUrl);
            addToast('Preview received from webhook', 'success');
            return;
          }

          // 2) JSON response (possibly nested)
          if (contentType.includes('application/json')) {
            let data: any = null;
            try {
              data = await res.json();
            } catch (_) {}

            const looksLikeUrl = (s: string) => /^(data:image\/.+;base64,|https?:\/\/)/i.test(s);

            const findImageDeep = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              // Check common keys first
              const direct = obj.image ?? obj.imageUrl ?? obj.image_url ?? obj.thumbnail ?? obj.thumb ?? obj.url;
              if (typeof direct === 'string' && looksLikeUrl(direct)) return direct;
              // Recurse
              for (const key of Object.keys(obj)) {
                const val = obj[key];
                if (typeof val === 'string' && looksLikeUrl(val)) return val;
                if (val && typeof val === 'object') {
                  const found = findImageDeep(val);
                  if (found) return found;
                }
              }
              return null;
            };

            const found = findImageDeep(data);
            console.debug('Webhook JSON response', data, 'Found image:', found);
            if (found) {
              setWebhookImage(found);
              addToast('Preview received from webhook', 'success');
            } else {
              setWebhookNote('Webhook responded but no image field was found.');
              addToast('URL sent successfully', 'success');
            }
            return;
          }

          // 3) Text response (assume it might be a URL or data URL)
          const text = await res.text();
          console.debug('Webhook text response', text);
          if (text && /^(data:image\/.+;base64,|https?:\/\/)/i.test(text.trim())) {
            setWebhookImage(text.trim());
            addToast('Preview received from webhook', 'success');
          } else if (!text) {
            setWebhookNote('Webhook responded with no body.');
            addToast('URL sent successfully', 'success');
          } else {
            setWebhookNote('Webhook responded but no image field was found.');
            addToast('URL sent successfully', 'success');
          }
        } else {
          addToast('Webhook responded with an error', 'error');
          setWebhookNote('Webhook responded with an error.');
        }
      } catch (e) {
        addToast("Couldn't send URL due to site restrictions (CORS)", 'info');
        setWebhookNote("Couldn't load webhook response due to site restrictions (CORS). ");
      } finally {
        setWebhookLoading(false);
      }
    };

    postWebhook();
  };

  // Clear webhook state helper (if you need to manually reset somewhere else)
  const resetWebhookState = () => {
    setSelectedUrl(null);
    setWebhookImage(null);
    setWebhookLoading(false);
    setWebhookNote(null);
  };

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleDownloadImage = async () => {
    try {
      if (!webhookImage) return;

      const triggerDownload = (href: string, filename: string) => {
        const a = document.createElement('a');
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      const getFilename = (urlStr: string) => {
        try {
          if (urlStr.startsWith('data:image/')) return 'preview.png';
          const u = new URL(urlStr);
          const name = u.pathname.split('/').pop() || 'preview';
          return name.includes('.') ? name : name + '.png';
        } catch {
          return 'preview.png';
        }
      };

      if (webhookImage.startsWith('blob:') || webhookImage.startsWith('data:')) {
        triggerDownload(webhookImage, getFilename(webhookImage));
        addToast('Download started', 'success');
        return;
      }

      const resp = await fetch(webhookImage, { mode: 'cors' });
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl, getFilename(webhookImage));
      URL.revokeObjectURL(objectUrl);
      addToast('Download started', 'success');
    } catch (e) {
      addToast('Failed to download image', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                URL Collector
              </h1>
              <div className="flex-1 flex justify-end">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a URL to validate and preview
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-10">
            <UrlForm
              onSubmit={handleUrlSubmit}
              initialUrl={selectedUrl?.url}
            />

            {selectedUrl && (
              <></>
            )}

            {selectedUrl && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhook Response</h3>
                {webhookLoading ? (
                  <div
                    className="mt-3 flex flex-col items-center gap-3"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Waiting for webhook response...</p>
                    <div className="h-40 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" aria-hidden="true" />
                  </div>
                ) : webhookImage ? (
                  <div className="mt-3">
                    <img
                      src={webhookImage}
                      alt="Webhook image"
                      className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadImage}
                        className="btn-secondary"
                        aria-label="Download generated image"
                      >
                        Download Image
                      </button>
                      <button
                        type="button"
                        onClick={handleViewImage}
                        className="btn-primary"
                        aria-label="View image in new tab"
                      >
                        View Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {webhookNote ?? 'No webhook response yet.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>Enter any valid URL starting with http:// or https://</p>
            <p className="mt-1">Press Enter to submit or use the buttons provided</p>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Image Modal */}
      {isImageModalOpen && webhookImage && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closeImageModal}
          />
          <div className="relative z-50 max-w-5xl w-full px-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 id="image-modal-title" className="text-sm font-medium text-gray-