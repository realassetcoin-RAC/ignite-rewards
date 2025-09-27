"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Settings, CreditCard, FileText, LogOut, User, Camera, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Gemini from "./icons/gemini";

interface Profile {
    name: string;
    email: string;
    avatar: string;
    subscription?: string;
    model?: string;
}

interface MenuItem {
    label: string;
    value?: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
}

// Modern anime avatar options
const ANIME_AVATARS = [
    {
        id: 1,
        name: "Sakura",
        url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
        description: "Cherry blossom themed"
    },
    {
        id: 2,
        name: "Kai",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
        description: "Ocean blue style"
    },
    {
        id: 3,
        name: "Luna",
        url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
        description: "Moonlight silver"
    },
    {
        id: 4,
        name: "Ryuu",
        url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
        description: "Dragon warrior"
    },
    {
        id: 5,
        name: "Yuki",
        url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
        description: "Snow white theme"
    },
    {
        id: 6,
        name: "Akira",
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
        description: "Cyberpunk neon"
    }
];

const SAMPLE_PROFILE_DATA: Profile = {
    name: "Eugene An",
    email: "eugene@kokonutui.com",
    avatar: ANIME_AVATARS[0]?.url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    subscription: "PRO",
    model: "Gemini 2.0 Flash",
};

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: Profile;
    showTopbar?: boolean;
    onSignOut?: () => void;
    menuItems?: MenuItem[];
    onAvatarChange?: (newAvatarUrl: string) => void;
}

export default function ProfileDropdown({
    data = SAMPLE_PROFILE_DATA,
    className,
    onSignOut,
    menuItems: customMenuItems,
    onAvatarChange,
    ...props
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentAvatar, setCurrentAvatar] = React.useState(data.avatar);
    const [showAvatarModal, setShowAvatarModal] = React.useState(false);
    const defaultMenuItems: MenuItem[] = [
        {
            label: "Profile",
            href: "#",
            icon: <User className="w-4 h-4" />,
        },
        {
            label: "Change Avatar",
            href: "#",
            icon: <Camera className="w-4 h-4" />,
        },
        {
            label: "Model",
            ...(data.model && { value: data.model }),
            href: "#",
            icon: <Gemini className="w-4 h-4" />,
        },
        {
            label: "Subscription",
            ...(data.subscription && { value: data.subscription }),
            href: "#",
            icon: <CreditCard className="w-4 h-4" />,
        },
        {
            label: "Settings",
            href: "#",
            icon: <Settings className="w-4 h-4" />,
        },
        {
            label: "Terms & Policies",
            href: "#",
            icon: <FileText className="w-4 h-4" />,
            external: true,
        },
    ];
    
    const menuItems = customMenuItems || defaultMenuItems;

    // Update avatar when data changes
    React.useEffect(() => {
        setCurrentAvatar(data.avatar);
    }, [data.avatar]);

    const handleAvatarClick = () => {
        setShowAvatarModal(true);
    };

    const handleAvatarSelect = (avatarUrl: string) => {
        setCurrentAvatar(avatarUrl);
        setShowAvatarModal(false);
        onAvatarChange?.(avatarUrl);
    };

    return (
        <div className={cn("relative", className)} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-16 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 hover:shadow-sm transition-all duration-200 focus:outline-none"
                        >
                            <div className="text-left flex-1">
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
                                    {data.name}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 tracking-tight leading-tight">
                                    {data.email}
                                </div>
                            </div>
                            <div className="relative">
                                <div 
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5 cursor-pointer hover:scale-105 transition-transform duration-200"
                                    onClick={handleAvatarClick}
                                    title="Click to change avatar"
                                >
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-zinc-900">
                                        <img
                                            src={currentAvatar}
                                            alt={data.name}
                                            width={36}
                                            height={36}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Bending line indicator on the right */}
                    <div
                        className={cn(
                            "absolute -right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
                            isOpen
                                ? "opacity-100"
                                : "opacity-60 group-hover:opacity-100"
                        )}
                    >
                        <svg
                            width="12"
                            height="24"
                            viewBox="0 0 12 24"
                            fill="none"
                            className={cn(
                                "transition-all duration-200",
                                isOpen
                                    ? "text-blue-500 dark:text-blue-400 scale-110"
                                    : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                            )}
                            aria-hidden="true"
                        >
                            <path
                                d="M2 4C6 8 6 16 2 20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-64 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-900/10 dark:shadow-zinc-950/30 
                    data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right"
                    >
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    {item.label === "Change Avatar" ? (
                                        <button
                                            onClick={handleAvatarClick}
                                            className="w-full flex items-center p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                {item.icon}
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight whitespace-nowrap group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                                                    {item.label}
                                                </span>
                                            </div>
                                        </button>
                                    ) : (
                                        <Link
                                            to={item.href}
                                            className="flex items-center p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                {item.icon}
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight whitespace-nowrap group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <div className="flex-shrink-0 ml-auto">
                                                {item.value && (
                                                    <span
                                                        className={cn(
                                                            "text-xs font-medium rounded-md py-1 px-2 tracking-tight",
                                                            item.label === "Model"
                                                                ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 border border-blue-500/10"
                                                                : "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/10 border border-purple-500/10"
                                                        )}
                                                    >
                                                        {item.value}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={onSignOut}
                                className="w-full flex items-center gap-3 p-3 duration-200 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800 hover:shadow-sm transition-all group"
                            >
                                <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                                <span className="text-sm font-medium text-red-500 group-hover:text-red-600">
                                    Sign Out
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div 
                    className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        width: '100vw', 
                        height: '100vh', 
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setShowAvatarModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                        style={{ 
                            maxHeight: '90vh', 
                            overflow: 'auto',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                Choose Your Avatar
                            </h3>
                            <button
                                onClick={() => setShowAvatarModal(false)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {ANIME_AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleAvatarSelect(avatar.url)}
                                    className={cn(
                                        "group relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 border-2",
                                        currentAvatar === avatar.url 
                                            ? "border-purple-500 ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900" 
                                            : "border-transparent hover:border-purple-300"
                                    )}
                                >
                                    <img
                                        src={avatar.url}
                                        alt={avatar.name}
                                        className="w-full h-16 object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/150x150/6366f1/ffffff?text=' + avatar.name;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="absolute bottom-1 left-1 right-1">
                                            <p className="text-xs text-white font-medium truncate">
                                                {avatar.name}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="text-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Select an avatar to personalize your profile
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
