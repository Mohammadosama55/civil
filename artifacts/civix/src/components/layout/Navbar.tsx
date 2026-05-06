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
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const navLinks = [
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact Us", icon: Phone },
    { href: "/contributors", label: "Our contributors", icon: Users },
    { href: "/voting-system", label: "Voting System", icon: CheckSquare },
    { href: "/issue-map", label: "Issue Map", icon: MapIcon },
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
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary",
                location === link.href ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-foreground"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

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