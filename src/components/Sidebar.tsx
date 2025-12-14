import { useNavigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import { Image, FolderOpen, Search, Sun, Moon, LogOut, Upload } from 'lucide-react';
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

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { uploadMultiplePhotos } = usePhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user: UserData = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { path: '/photos', label: 'Photos', icon: Image },
    { path: '/albums', label: 'Albums', icon: FolderOpen },
    { path: '/search', label: 'Search', icon: Search },
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
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border" role="complementary" aria-label="Main navigation">
      {/* Navigation */}
      <nav className="p-4 space-y-2" role="navigation" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-button flex items-center gap-3 ${
                isActive ? 'nav-button-active' : 'nav-button-inactive'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
         <Button 
            variant="upload" 
            size="default" 
            className="w-full"
            onClick={handleUploadClick}
            aria-label="Upload photos"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {/* Avatar & Info */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className={`w-12 h-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-lg`}
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
        <p className="text-primary font-medium mb-3" aria-label="Current plan">{user.plan || 'Free Plan'}</p>

        {/* Storage Stats */}
        <div className="space-y-2 mb-4" role="region" aria-label="Storage information">
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

        {/* Action Buttons */}
        <div className="space-y-2">
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
            className="w-full"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 mr-2" aria-hidden="true" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" aria-hidden="true" />
                Dark Mode
              </>
            )}
          </Button>
          
          <Button 
            variant="danger" 
            size="default" 
            className="w-full"
            onClick={handleSignOut}
            aria-label="Sign out of your account"
          >
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
