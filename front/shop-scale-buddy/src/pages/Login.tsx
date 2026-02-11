import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, isApiConfigured } from '@/lib/config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(!isApiConfigured());
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSaveConfig = () => {
    if (!apiUrl.trim()) return;
    setApiBaseUrl(apiUrl.trim());
    setShowConfig(false);
    toast({ title: 'Uspešno', description: 'API URL je podešen.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !lozinka.trim()) {
      toast({
        title: 'Greška',
        description: 'Unesite email i lozinku.',
        variant: 'destructive',
      });
      return;
    }
    if (!isApiConfigured()) {
      toast({
        title: 'Greška',
        description: 'Prvo podesite API URL servera.',
        variant: 'destructive',
      });
      setShowConfig(true);
      return;
    }
    setLoading(true);
    try {
      await login(email, lozinka);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Greška pri prijavi.';
      toast({ title: 'Greška pri prijavi', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4 animate-fade-in">
        {/* Config Section */}
        {showConfig && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Podešavanja servera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Base URL</Label>
                <Input
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://vas-server.com"
                />
              </div>
              <Button onClick={handleSaveConfig} size="sm" className="w-full">
                Sačuvaj URL
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              BiznisSistem
            </CardTitle>
            <CardDescription>
              Prijavite se da pristupite sistemu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lozinka">Lozinka</Label>
                <Input
                  id="lozinka"
                  type="password"
                  value={lozinka}
                  onChange={(e) => setLozinka(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Prijavite se
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Nemate nalog?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Registrujte se
                </Link>
              </p>
              {!showConfig && (
                <button
                  type="button"
                  onClick={() => setShowConfig(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-3 w-3 inline mr-1" />
                  Server
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
