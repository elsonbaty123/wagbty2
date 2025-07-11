
"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import { Menu, UtensilsCrossed, User, LogOut, Settings, ShieldCheck, Bike } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationsPopover } from "../notifications-popover"
import { ThemeToggleButton } from "../theme-toggle-button"
import { LanguageSwitcher } from "../language-switcher"
import { useTranslation } from "react-i18next"

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout, loading } = useAuth()

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch(user.role) {
      case 'admin': return '/admin/dashboard';
      case 'chef': return '/chef/dashboard';
      case 'delivery': return '/delivery/dashboard';
      default: return '/profile';
    }
  }

  const getDashboardIcon = () => {
    if (!user) return <User className="me-2 h-4 w-4" />;
    switch(user.role) {
      case 'admin': return <ShieldCheck className="me-2 h-4 w-4" />;
      case 'chef': return <User className="me-2 h-4 w-4" />;
      case 'delivery': return <Bike className="me-2 h-4 w-4" />;
      default: return <User className="me-2 h-4 w-4" />;
    }
  };

  const getDashboardLabel = () => {
    if (!user) return t('my_orders_title');
    switch(user.role) {
      case 'admin': return t('admin_dashboard');
      case 'chef': return t('dashboard');
      case 'delivery': return t('delivery_dashboard', 'Delivery Dashboard');
      default: return t('my_orders_title');
    }
  };

  const sheetSide = i18n.dir() === 'rtl' ? 'right' : 'left';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t('toggle_nav')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={sheetSide}>
                <SheetHeader>
                    <SheetTitle className="sr-only">{t('toggle_nav')}</SheetTitle>
                    <SheetDescription className="sr-only">{i18n.language === 'ar' ? 'وجبتي' : 'Wagbty'}</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-6">
                    <SheetClose asChild>
                        <Link href="/" className="flex items-center gap-2">
                            <UtensilsCrossed className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold font-headline text-primary">{i18n.language === 'ar' ? 'وجبتي' : 'Wagbty'}</span>
                        </Link>
                    </SheetClose>
                  <div className="flex flex-col gap-2">
                      {loading ? (
                          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                      ) : user ? (
                          <>
                          {(user.role === 'chef' || user.role === 'admin' || user.role === 'delivery') && (
                            <SheetClose asChild>
                                <Button variant="ghost" asChild>
                                    <Link href={getDashboardLink()}>{getDashboardLabel()}</Link>
                                </Button>
                            </SheetClose>
                          )}
                          <SheetClose asChild>
                              <Button variant="ghost" asChild>
                                  <Link href="/settings">{t('nav_settings')}</Link>
                              </Button>
                          </SheetClose>
                          <SheetClose asChild>
                              <Button onClick={logout} variant="outline">{t('nav_logout')}</Button>
                          </SheetClose>
                          </>
                      ) : (
                          <>
                          <SheetClose asChild>
                              <Button variant="ghost" asChild>
                                  <Link href="/login">{t('login')}</Link>
                              </Button>
                          </SheetClose>
                          <SheetClose asChild>
                              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                  <Link href="/signup">{t('signup')}</Link>
                              </Button>
                          </SheetClose>
                          </>
                      )}
                  </div>
                  <div className="mt-6 flex justify-center gap-4 border-t pt-6">
                      <LanguageSwitcher />
                      <ThemeToggleButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline text-xl font-bold font-headline text-primary">{i18n.language === 'ar' ? 'وجبتي' : 'Wagbty'}</span>
          </Link>
        </div>

        {/* Centered Navigation */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-primary">
              {t('nav_home')}
            </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {loading && <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />}

          {!loading && user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 md:hidden">
                <NotificationsPopover />
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <NotificationsPopover />
                <ThemeToggleButton />
                <LanguageSwitcher />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:inline-flex">
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.imageUrl || `https://placehold.co/100x100.png`} alt={user.name} data-ai-hint="person avatar" />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>
                      {getDashboardIcon()}
                      <span>{getDashboardLabel()}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="me-2 h-4 w-4" />
                      <span>{t('nav_settings')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="me-2 h-4 w-4" />
                    <span>{t('nav_logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {!loading && !user && (
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggleButton />
              <Button variant="ghost" asChild>
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">{t('signup')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
