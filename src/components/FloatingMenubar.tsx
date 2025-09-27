import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  User, 
  Settings, 
  Shield, 
  Store, 
  LogIn,
  LogOut,
  Menu,
  X,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import LoginPopup from "@/components/LoginPopup";
import SignupPopup from "@/components/SignupPopup";

interface FloatingMenubarProps {
  className?: string;
}

const FloatingMenubar: React.FC<FloatingMenubarProps> = ({ className }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [signupModalOpen, setSignupModalOpen] = React.useState(false);
  const { user, profile, isAdmin, signOut } = useSecureAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const menuItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: location.pathname === "/",
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      label: "Marketplace",
      href: "/marketplace",
      icon: Building2,
      isActive: location.pathname === "/marketplace",
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: User,
      isActive: location.pathname === "/dashboard",
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      label: "Merchant",
      href: "/merchant",
      icon: Store,
      isActive: location.pathname === "/merchant",
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      label: "Admin",
      href: "/admin-panel",
      icon: Shield,
      isActive: location.pathname === "/admin-panel",
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      label: "Partners",
      href: "/partners",
      icon: Settings,
      isActive: location.pathname === "/partners",
      requiresAuth: false,
      requiresAdmin: false,
    },
  ].filter(item => {
    // Filter out items based on authentication and admin requirements
    if (item.requiresAuth && !user) return false;
    if (item.requiresAdmin && !isAdmin && user?.email !== 'realassetcoin@gmail.com') return false;
    return true;
  });

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
      "backdrop-blur-md bg-white/20 border border-white/30",
      "rounded-full shadow-lg transition-all duration-300",
      "hover:bg-white/30 hover:shadow-xl",
      className
    )}>
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center">
        <Menubar className="bg-transparent border-none p-2">
          <MenubarMenu>
            <MenubarTrigger className="bg-transparent hover:bg-white/20 border-none text-white font-medium">
              <Menu className="h-4 w-4 mr-2" />
              Menu
            </MenubarTrigger>
            <MenubarContent className="backdrop-blur-md bg-white/10 border-white/20 text-white">
              {menuItems.map((item) => (
                <MenubarItem key={item.href} asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      item.isActive && "bg-white/20"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </MenubarItem>
              ))}
              <MenubarSeparator className="bg-white/20" />
              {user ? (
                <>
                  <MenubarItem className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    {profile?.full_name || user.email}
                    {isAdmin && <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>}
                  </MenubarItem>
                  <MenubarItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </MenubarItem>
                </>
              ) : (
                <MenubarItem onClick={() => setLoginModalOpen(true)} className="cursor-pointer">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </MenubarItem>
              )}
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        
        {/* User Info / Sign In Button */}
        <div className="ml-4">
          {user ? (
            <div className="flex items-center gap-2 text-white text-sm">
              <User className="h-4 w-4" />
              <span>{profile?.full_name || user.email?.split('@')[0]}</span>
              {isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white bg-white/10 hover:bg-white/20"
              onClick={() => setLoginModalOpen(true)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-transparent hover:bg-white/20 border-none text-white p-3"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-lg">
            <div className="p-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/20 transition-colors",
                    item.isActive && "bg-white/20"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-white/20 my-2" />
              {user ? (
                <>
                  <div className="px-3 py-2 text-white text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {profile?.full_name || user.email}
                    {isAdmin && <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>}
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/20 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/20 transition-colors w-full text-left"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <LoginPopup 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setLoginModalOpen(false);
          setSignupModalOpen(true);
        }}
      />
      <SignupPopup 
        isOpen={signupModalOpen} 
        onClose={() => setSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setSignupModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </div>
  );
};

export default FloatingMenubar;