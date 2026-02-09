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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Uloga } from '@/lib/types';

export default function Register() {
  const [ime, setIme] = useState('');
  const [prezime, setPrezime] = useState('');
  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [uloga, setUloga] = useState<Uloga>('RADNIK');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ime.trim() || !prezime.trim() || !email.trim() || !lozinka.trim()) {
      toast({
        title: 'Greška',
        description: 'Sva polja su obavezna.',
        variant: 'destructive',
      });
      return;
    }

    if (lozinka.length < 6) {
      toast({
        title: 'Greška',
        description: 'Lozinka mora imati najmanje 6 karaktera.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await register({ ime, prezime, email, lozinka, uloga });
      toast({ title: 'Uspešno', description: 'Registracija uspešna! Prijavite se.' });
      navigate('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Greška pri registraciji.';
      toast({
        title: 'Greška pri registraciji',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Registracija
          </CardTitle>
          <CardDescription>Napravite novi nalog</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ime">Ime</Label>
                <Input
                  id="ime"
                  value={ime}
                  onChange={(e) => setIme(e.target.value)}
                  placeholder="Petar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prezime">Prezime</Label>
                <Input
                  id="prezime"
                  value={prezime}
                  onChange={(e) => setPrezime(e.target.value)}
                  placeholder="Petrović"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-lozinka">Lozinka</Label>
              <Input
                id="reg-lozinka"
                type="password"
                value={lozinka}
                onChange={(e) => setLozinka(e.target.value)}
                placeholder="Minimum 6 karaktera"
              />
            </div>
            <div className="space-y-2">
              <Label>Uloga</Label>
              <Select value={uloga} onValueChange={(v) => setUloga(v as Uloga)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VLASNIK">Vlasnik</SelectItem>
                  <SelectItem value="RADNIK">Radnik</SelectItem>
                  <SelectItem value="DOSTAVLJAC">Dostavljač</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrujte se
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Već imate nalog?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Prijavite se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
