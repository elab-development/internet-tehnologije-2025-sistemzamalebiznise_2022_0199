import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  Users,
  LogOut,
  Menu,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';
import { ULOGA_LABELS } from '@/lib/types';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proizvodi', label: 'Proizvodi', icon: Package },
  { to: '/dobavljaci', label: 'Dobavljači', icon: Truck },
  { to: '/narudzbenice', label: 'Narudžbenice', icon: FileText },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast({
        title: 'Greška',
        description: 'Greška pri odjavljivanju.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveConfig = () => {
    if (!apiUrl.trim()) return;
    setApiBaseUrl(apiUrl.trim());
    setConfigOpen(false);
    window.location.reload();
  };

  const allNavItems =
    user?.uloga === 'VLASNIK'
      ? [...navItems, { to: '/korisnici', label: 'Korisnici', icon: Users }]
      : navItems;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {allNavItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.to)
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Podešavanja servera</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="api-url">API Base URL</Label>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://vas-server.com"
            />
            <p className="text-xs text-muted-foreground">
              Unesite URL vašeg backend servera bez trailing slash-a.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleSaveConfig}>Sačuvaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SheetTitle className="mb-4 text-lg font-bold text-primary">
                  Meni
                </SheetTitle>
                <NavLinks onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link
              to="/dashboard"
              className="text-lg font-bold tracking-tight text-primary"
            >
              BiznisSistem
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfigOpen(true)}
              title="Podešavanja"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {user && (
              <>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {ULOGA_LABELS[user.uloga]}
                </Badge>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Odjavi se</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-sidebar min-h-[calc(100vh-4rem)] sticky top-16 flex-col p-4">
          <NavLinks />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
