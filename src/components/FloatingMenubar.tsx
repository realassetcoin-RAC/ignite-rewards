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
import { 
  Home, 
  User, 
  Settings, 
  Shield, 
  Store, 
  LogIn,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMenubarProps {
  className?: string;
}

const FloatingMenubar: React.FC<FloatingMenubarProps> = ({ className }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: location.pathname === "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: User,
      isActive: location.pathname === "/dashboard",
    },
    {
      label: "Merchant",
      href: "/merchant",
      icon: Store,
      isActive: location.pathname === "/merchant",
    },
    {
      label: "Admin",
      href: "/admin-panel",
      icon: Shield,
      isActive: location.pathname === "/admin-panel",
    },
    {
      label: "Partners",
      href: "/partners",
      icon: Settings,
      isActive: location.pathname === "/partners",
    },
  ];

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
      "backdrop-blur-md bg-white/10 border border-white/20",
      "rounded-full shadow-lg transition-all duration-300",
      "hover:bg-white/20 hover:shadow-xl",
      className
    )}>
      {/* Desktop Menu */}
      <div className="hidden md:block">
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
              <MenubarItem asChild>
                <Link
                  to="/auth"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
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
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/20 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingMenubar;