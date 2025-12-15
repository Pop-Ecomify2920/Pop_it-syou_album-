import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload } from 'lucide-react';

export function PageLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    setShowSpinner(false);

    // Show image state first, then spinner after 200ms
    const spinnerTimer = setTimeout(() => {
      setShowSpinner(true);
    }, 200);

    // Hide loading after 800ms total
    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(hideTimer);
    };
  }, [location]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-immich-bg dark:bg-immich-dark-bg z-[9999]">
          {/* Centered Loading Container */}
          <div className="relative flex flex-col items-center justify-center">
            
            {!showSpinner ? (
              // Image Upload State - Display First
              <div className="flex flex-col items-center justify-center animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-32 h-32 bg-immich-card dark:bg-immich-dark-gray rounded-2xl flex items-center justify-center border-2 border-dashed border-immich-primary/30">
                    <div className="flex flex-col items-center">
                      <Upload className="w-16 h-16 text-immich-primary/60 mb-2" />
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-immich-fg dark:text-immich-dark-fg font-medium">
                  Preparing your photos
                </p>
              </div>
            ) : (
              // Animated Spinner - Display Second
              <div className="animate-fade-in">
                <div className="relative w-24 h-24">
                  {/* Outer rotating ring */}
                  <div
                    className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
                    style={{
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  
                  {/* Middle rotating ring */}
                  <div
                    className="absolute inset-2 border-4 border-transparent border-b-purple-500 border-l-blue-500 rounded-full"
                    style={{
                      animation: 'spin 1.5s linear infinite reverse',
                    }}
                  />

                  {/* Inner circle */}
                  <div className="absolute inset-4 border-2 border-blue-500/30 rounded-full" />
                  
                  {/* Center dot with glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-3 h-3 bg-blue-500 rounded-full"
                      style={{
                        boxShadow: '0 0 20px rgba(14, 165, 233, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)',
                      }}
                    />
                  </div>
                </div>

                {/* Loading Text */}
                <div className="mt-8 text-center">
                  <h3 className="text-immich-fg dark:text-immich-dark-fg text-lg font-semibold tracking-wide">
                    Loading
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2">Please wait...</p>
                </div>
              </div>
            )}
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            .animate-fade-in {
              animation: fadeIn 0.3s ease-in-out;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
