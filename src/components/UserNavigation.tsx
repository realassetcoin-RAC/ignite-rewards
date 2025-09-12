import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import {
  User,
  Building2,
  Store,
  Shield,
  Vote,
  LogOut,
  LayoutDashboard,
  Settings
} from 'lucide-react';

interface UserNavigationProps {
  className?: string;
}

const UserNavigation: React.FC<UserNavigationProps> = ({ className = '' }) => {
  const { user, profile, isAdmin, signOut } = useSecureAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use React Router navigation to prevent page reload
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still redirect even if there's an error, but use React Router
      navigate('/', { replace: true });
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDashboardUrl = () => {
    if (isAdmin) return '/admin-panel';
    return '/dashboard';
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Admin Badge */}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
          onClick={() => navigate('/admin-panel')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin
        </Button>
      )}

      {/* User Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full border-2 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 transition-all duration-200"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-teal-500 text-white text-sm font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-64 bg-slate-900/95 backdrop-blur-sm border-slate-700/50 text-white"
          align="end"
          forceMount
        >
          {/* User Info */}
          <div className="flex items-center justify-start gap-3 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-teal-500 text-white text-sm font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 leading-none min-w-0">
              <p className="font-semibold text-sm truncate">
                {profile?.full_name || user.email?.split('@')[0] || 'User'}
              </p>
              <p className="truncate text-xs text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-gray-600" />
          
          {/* Navigation Items */}
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
            onClick={() => navigate(getDashboardUrl())}
          >
            <LayoutDashboard className="mr-3 h-4 w-4" />
            My Dashboard
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
            onClick={() => navigate('/marketplace')}
          >
            <Building2 className="mr-3 h-4 w-4" />
            Marketplace
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
            onClick={() => navigate('/user')}
          >
            <User className="mr-3 h-4 w-4" />
            User Dashboard
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
            onClick={() => navigate('/merchant')}
          >
            <Store className="mr-3 h-4 w-4" />
            Merchant Dashboard
          </DropdownMenuItem>
          
          {isAdmin && (
            <DropdownMenuItem 
              className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
              onClick={() => navigate('/admin-panel')}
            >
              <Shield className="mr-3 h-4 w-4" />
              Admin Panel
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
            onClick={() => navigate('/dao-voting')}
          >
            <Vote className="mr-3 h-4 w-4" />
            DAO Voting
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-600" />
          
          {/* Sign Out */}
          <DropdownMenuItem 
            className="cursor-pointer text-white hover:bg-slate-800/50 focus:bg-slate-800/50"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserNavigation;
