import { Link, useLocation } from "wouter";
import { 
  MapPin, 
  Info, 
  Phone, 
  Users, 
  CheckSquare, 
  Map as MapIcon, 
  MessageSquare, 
  AlertTriangle, 
  Moon, 
  Sun, 
  User,
  Shield,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/hooks/use-alerts";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: alerts, hasNew, dismiss } = useAlerts();

  const totalBadge = (alerts?.urgentOpen ?? 0) + (alerts?.escalatedThisWeek ?? 0);

  const navLinks = [
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact Us", icon: Phone },
    { href: "/contributors", label: "Our contributors", icon: Users },
    { href: "/voting-system", label: "Voting System", icon: CheckSquare },
    { href: "/issue-map", label: "Issue Map", icon: MapIcon, badge: alerts?.urgentOpen },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  const profileIncomplete = user && (!user.name || !user.location);

  return (
    <div className="w-full flex flex-col fixed top-0 z-50">
      <nav className="w-full bg-white dark:bg-slate-900 border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="link-home">
            <MapPin className="h-6 w-6 text-primary fill-primary/20" />
            <span className="font-bold text-xl tracking-tight text-foreground">CIVIX</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary relative",
                location === link.href ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
              {link.badge != null && link.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm animate-pulse">
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="destructive" 
            size="sm" 
            className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
            asChild
          >
            <Link href="/sos" data-testid="link-sos">
              <AlertTriangle className="h-4 w-4" />
              SOS
            </Link>
          </Button>

          {/* Notification bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground relative"
              onClick={dismiss}
              title={
                alerts
                  ? `${alerts.urgentOpen} urgent open · ${alerts.escalatedThisWeek} escalated this week`
                  : "Loading alerts…"
              }
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {totalBadge > 0 && (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow",
                    hasNew ? "bg-red-500 animate-bounce" : "bg-red-500"
                  )}
                >
                  {totalBadge > 99 ? "99+" : totalBadge}
                </span>
              )}
            </Button>

            {/* Tooltip panel on hover — pure CSS */}
            {alerts && totalBadge > 0 && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-xl p-3 text-xs space-y-2 z-[200] hidden group-hover:block pointer-events-none">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Alert Summary</p>
                {alerts.urgentOpen > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Urgent & open</span>
                    <span className="font-bold text-red-500">{alerts.urgentOpen}</span>
                  </div>
                )}
                {alerts.escalatedThisWeek > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Escalated this week</span>
                    <span className="font-bold text-amber-500">{alerts.escalatedThisWeek}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-foreground"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user?.role === "ward_admin" && (
            <Button variant="outline" size="sm" asChild className="hidden sm:flex gap-1.5 border-primary text-primary hover:bg-primary hover:text-white">
              <Link href="/admin"><Shield className="h-4 w-4" />Admin</Link>
            </Button>
          )}

          {user ? (
            <Link href="/profile" data-testid="link-profile">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login" data-testid="link-login">Login</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/register" data-testid="link-register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
      
      {profileIncomplete && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between text-sm">
          <p className="text-amber-800 dark:text-amber-200">
            Complete your profile to get the most out of Civix. Add your name, email, and location.
          </p>
          <Button variant="outline" size="sm" className="bg-white/50 dark:bg-black/50 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800" asChild>
            <Link href="/profile" data-testid="link-complete-profile">Complete Profile</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
