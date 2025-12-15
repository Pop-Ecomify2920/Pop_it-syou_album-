import { useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import { Image, FolderOpen, Sun, Moon, LogOut, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { usePhotos } from '@/hooks/usePhotos';
import { toast } from 'sonner';

interface UserData {
  name: string;
  phone: string;
  plan: string;
  diskSpace: { used: number; total: number };
  files: { used: number; total: number };
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { uploadMultiplePhotos } = usePhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user: UserData = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { path: '/photos', label: 'Photos', icon: Image },
    { path: '/albums', label: 'Albums', icon: FolderOpen },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const diskPercentage = (user.diskSpace?.used / user.diskSpace?.total) * 100 || 0;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Filter only image files
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    if (imageFiles.length !== files.length) {
      toast.warning(`Only ${imageFiles.length} of ${files.length} files are images`);
    }

    try {
      toast.loading(`Uploading ${imageFiles.length} photo(s)...`);
      await uploadMultiplePhotos(imageFiles);
      toast.success(`Successfully uploaded ${imageFiles.length} photo(s)!`);
      
      // Navigate to photos page if not already there
      if (location.pathname !== '/photos') {
        navigate('/photos');
      }
    } catch (error) {
      toast.error('Failed to upload photos: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate avatar color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-pink-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-orange-500',
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <aside className={`h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`} role="complementary" aria-label="Main navigation">
      {/* Header Section - Page Info with Collapse Button */}
      {isOpen && (
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div>
            {(() => {
              const currentPage = navItems.find(item => location.pathname === item.path);
              if (currentPage) {
                const Icon = currentPage.icon;
                
                const colorMap: Record<string, { bg: string; text: string }> = {
                  '/photos': { bg: 'bg-blue-500', text: 'text-white' },
                  '/albums': { bg: 'bg-purple-500', text: 'text-white' },
                };
                
                const colors = colorMap[currentPage.path] || { bg: 'bg-immich-primary', text: 'text-white' };
                
                return (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} aria-hidden="true" />
                    </div>
                    <h1 className="text-xl font-semibold text-sidebar-foreground">{currentPage.label}</h1>
                  </div>
                );
              }
            })()}
          </div>
          
          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-immich-fg dark:text-immich-dark-fg hover:bg-immich-primary/20 border border-immich-primary/40"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Collapsed Header with Expand Button */}
      {!isOpen && (
        <div className="p-2 flex items-center justify-center border-b border-sidebar-border" style={{ padding: '0.72rem' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-immich-fg dark:text-immich-dark-fg hover:bg-immich-primary/20 border border-immich-primary/40"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Top Section - Upload Button */}
      <div className={`${isOpen ? 'p-4' : 'p-2 mt-2'} transition-all duration-300`}>
        <Button 
          variant="default" 
          size="default" 
          className={`bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center rounded-lg ${isOpen ? 'w-full gap-2' : 'w-full h-10'}`}
          onClick={handleUploadClick}
          aria-label="Upload photos"
          title={!isOpen ? 'Upload' : undefined}
        >
          <Upload className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>Upload</span>}
        </Button>
      </div>

      {/* Navigation Section */}
      <nav className={`transition-all duration-300 ${isOpen ? 'p-4 space-y-2' : 'px-2 space-y-1'}`} role="navigation" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
            '/photos': { bg: 'bg-blue-500', text: 'text-white', icon: 'text-white' },
            '/albums': { bg: 'bg-purple-500', text: 'text-white', icon: 'text-white' },
          };
          
          const colors = colorMap[item.path] || { bg: 'bg-immich-primary', text: 'text-white', icon: 'text-white' };
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-button flex items-center justify-center rounded-lg transition-all ${isOpen ? 'gap-3 w-full px-3 py-2' : 'w-full h-10'} ${
                isActive 
                  ? `${colors.bg} ${colors.text}` 
                  : 'nav-button-inactive'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? colors.icon : ''}`} aria-hidden="true" />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Info Section - Only visible when expanded */}
      {isOpen && (
        <div className="p-4 border-t border-sidebar-border space-y-4">
          {/* Avatar & Info */}
          <div className="flex items-center gap-3">
            <div 
              className={`rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 w-12 h-12`}
              role="img"
              aria-label={`Avatar for ${user.name || 'User'}`}
            >
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sidebar-foreground truncate" aria-label="User name">
                {user.name || 'User'}
              </p>
              <p className="text-sm text-muted-foreground truncate" aria-label="User phone number">
                {user.phone || '+1234567890'}
              </p>
            </div>
          </div>

          {/* Plan */}
          <p className="text-primary font-medium" aria-label="Current plan">{user.plan || 'Free Plan'}</p>

          {/* Storage Stats */}
          <div className="space-y-2" role="region" aria-label="Storage information">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disk Space:</span>
              <span className="text-foreground" aria-live="polite">
                {user.diskSpace?.used?.toFixed(1) || 0} MiB / {((user.diskSpace?.total || 10240) / 1024).toFixed(0)} GiB
              </span>
            </div>
            <div 
              className="storage-bar"
              role="progressbar"
              aria-valuenow={Math.min(diskPercentage, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Disk space usage"
            >
              <div 
                className="storage-fill bg-gradient-to-r from-green-500 to-green-400"
                style={{ width: `${Math.min(diskPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Files:</span>
              <span className="text-foreground" aria-live="polite">
                {user.files?.used || 0} / {user.files?.total || 100}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className={`transition-all duration-300 ${isOpen ? 'p-4 border-t border-sidebar-border space-y-2' : 'p-2 space-y-1'}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload photos"
        />
        
        <Button 
          variant="secondary" 
          size="default" 
          className={`transition-all flex items-center justify-center rounded-lg ${isOpen ? 'w-full gap-2' : 'w-full h-10'}`}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={!isOpen ? `${theme === 'dark' ? 'Light' : 'Dark'} Mode` : undefined}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {isOpen && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {isOpen && <span>Dark Mode</span>}
            </>
          )}
        </Button>
        
        <Button 
          variant="danger" 
          size="default" 
          className={`transition-all flex items-center justify-center rounded-lg ${isOpen ? 'w-full gap-2' : 'w-full h-10'}`}
          onClick={handleSignOut}
          aria-label="Sign out of your account"
          title={!isOpen ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {isOpen && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
