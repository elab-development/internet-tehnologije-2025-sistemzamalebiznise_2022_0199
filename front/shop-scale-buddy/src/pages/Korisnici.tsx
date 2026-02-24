import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Korisnik, Uloga } from '@/lib/types';
import { ULOGA_LABELS } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';

const ulogaColors: Record<Uloga, string> = {
  VLASNIK: 'bg-primary/15 text-primary border-primary/30',
  RADNIK: 'bg-info/15 text-info border-info/30',
  DOSTAVLJAC: 'bg-warning/15 text-warning border-warning/30',
};

export default function Korisnici() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [korisnici, setKorisnici] = useState<Korisnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUloga, setFilterUloga] = useState<string>('SVE');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Redirect non-VLASNIK
  useEffect(() => {
    if (user && user.uloga !== 'VLASNIK') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchKorisnici = async () => {
    try {
      const data = await api.get<{ korisnici: Korisnik[] }>('/api/korisnici');
      setKorisnici(data.korisnici);
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKorisnici();
  }, []);

  const filtered =
    filterUloga === 'SVE'
      ? korisnici
      : korisnici.filter((k) => k.uloga === filterUloga);

  const handleChangeRole = async (korisnikId: number, novaUloga: Uloga) => {
    if (korisnikId === user?.userId) {
      toast({
        title: 'Greška',
        description: 'Ne možete promeniti sopstvenu ulogu.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingId(korisnikId);
    try {
      await api.patch(`/api/korisnici/${korisnikId}`, { uloga: novaUloga });
      toast({ title: 'Uspešno', description: 'Uloga je promenjena.' });
      fetchKorisnici();
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Korisnici</h1>

      {/* Filter */}
      <div className="max-w-xs">
        <Select value={filterUloga} onValueChange={setFilterUloga}>
          <SelectTrigger>
            <SelectValue placeholder="Filtriraj po ulozi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SVE">Svi</SelectItem>
            <SelectItem value="VLASNIK">Vlasnik</SelectItem>
            <SelectItem value="RADNIK">Radnik</SelectItem>
            <SelectItem value="DOSTAVLJAC">Dostavljač</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-2" />
              <p>Nema korisnika za prikaz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Ime</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Uloga</TableHead>
                    <TableHead>Promeni ulogu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((k) => {
                    const isSelf = k.id_korisnik === user?.userId;
                    return (
                      <TableRow key={k.id_korisnik}>
                        <TableCell>{k.id_korisnik}</TableCell>
                        <TableCell className="font-medium">
                          {k.ime} {k.prezime}
                        </TableCell>
                        <TableCell>{k.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${ulogaColors[k.uloga]} border`}
                            variant="outline"
                          >
                            {ULOGA_LABELS[k.uloga]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground">
                              Sopstveni nalog
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Select
                                value={k.uloga}
                                onValueChange={(v) =>
                                  handleChangeRole(
                                    k.id_korisnik,
                                    v as Uloga
                                  )
                                }
                                disabled={updatingId === k.id_korisnik}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="VLASNIK">
                                    Vlasnik
                                  </SelectItem>
                                  <SelectItem value="RADNIK">
                                    Radnik
                                  </SelectItem>
                                  <SelectItem value="DOSTAVLJAC">
                                    Dostavljač
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {updatingId === k.id_korisnik && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
