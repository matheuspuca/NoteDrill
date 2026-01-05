import { LogOut, User, Bell, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

// ... imports

export function Header({ userEmail }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<any>(null)
    const { setTheme } = useTheme()

    // ... useEffect

    return (
        <header className="h-28 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <InstallPWA />
                <MobileSidebar />
                {/* Placeholder for future page title integration */}
            </div>

            {/* Right side: User & Actions */}
            <div className="flex items-center gap-6">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                            <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                            Claro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                            Escuro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                            Sistema
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                            <Bell className="h-7 w-7" />
                            <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </Button>
                    </PopoverTrigger>
                    {/* ... (Notifications content unchanged) ... */}
                </Popover>

                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-5 pl-3 pr-6 py-8 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 h-auto transition-all">
                            <Avatar className="h-14 w-14 border-[3px] border-white dark:border-slate-800 shadow-md">
                                <AvatarImage src={displayAvatar || "/avatars/01.png"} alt={displayName} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-extrabold text-xl">
                                    {displayName[0]?.toUpperCase() || <User className="h-7 w-7" />}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col items-start gap-1">
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-none">{displayName}</span>
                                <span className="text-base text-slate-500 dark:text-slate-400 font-medium">{userEmail || "Usuário"}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        {/* ... (Menu items unchanged) ... */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
