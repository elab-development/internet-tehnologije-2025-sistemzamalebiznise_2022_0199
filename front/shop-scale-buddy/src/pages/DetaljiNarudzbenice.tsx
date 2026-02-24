import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type {
  NarudzbenicaDetalji,
  StatusNarudzbenice,
  Korisnik,
} from '@/lib/types';
import { STATUS_LABELS, VALID_TRANSITIONS, getTransitionsForType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Trash2, FileText, Download } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/config';

const statusColors: Record<StatusNarudzbenice, string> = {
  KREIRANA: 'bg-muted text-muted-foreground',
  POSLATA: 'bg-info/15 text-info border-info/30',
  U_TRANSPORTU: 'bg-warning/15 text-warning border-warning/30',
  PRIMLJENA: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  ZAVRSENA: 'bg-primary/15 text-primary border-primary/30',
  OTKAZANA: 'bg-destructive/15 text-destructive border-destructive/30',
  STORNIRANA: 'bg-red-100 text-red-700 border-red-300',
};

export default function DetaljiNarudzbenice() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [narudzbenica, setNarudzbenica] =
    useState<NarudzbenicaDetalji | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [dostavljaci, setDostavljaci] = useState<Korisnik[]>([]);
  const [selectedDostavljac, setSelectedDostavljac] = useState<string>('');
  const [assigningDostavljac, setAssigningDostavljac] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isVlasnik = user?.uloga === 'VLASNIK';
  const isDostavljac = user?.uloga === 'DOSTAVLJAC';
  const isRadnik = user?.uloga === 'RADNIK';
  const canChangeStatus = isVlasnik || isDostavljac || isRadnik;

  const fetchNarudzbenica = async () => {
    try {
      const data = await api.get<NarudzbenicaDetalji>(
        `/api/narudzbenice/${id}`
      );
      setNarudzbenica(data);
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
    fetchNarudzbenica();
    if (isVlasnik) {
      api
        .get<{ korisnici: Korisnik[] }>('/api/korisnici')
        .then((data) => {
          setDostavljaci(
            data.korisnici.filter((k) => k.uloga === 'DOSTAVLJAC')
          );
        })
        .catch(() => {});
    }
  }, [id, isVlasnik]);

  const handleStatusChange = async () => {
    if (!newStatus || !narudzbenica) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/narudzbenice/${id}`, { status: newStatus });
      toast({ title: 'Uspešno', description: 'Status je promenjen.' });
      setNewStatus('');
      fetchNarudzbenica();
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignDostavljac = async () => {
    if (!selectedDostavljac || !narudzbenica) return;
    setAssigningDostavljac(true);
    try {
      await api.patch(`/api/narudzbenice/${id}`, {
        status: narudzbenica.status,
        dostavljac_id: Number(selectedDostavljac),
      });
      toast({ title: 'Uspešno', description: 'Dostavljač je dodeljen.' });
      setSelectedDostavljac('');
      fetchNarudzbenica();
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška.',
        variant: 'destructive',
      });
    } finally {
      setAssigningDostavljac(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/narudzbenice/${id}`);
      toast({ title: 'Uspešno', description: 'Narudžbenica je obrisana.' });
      navigate('/narudzbenice');
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!narudzbenica) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Narudžbenica nije pronađena.
      </div>
    );
  }

  const tipTransitions = narudzbenica ? getTransitionsForType(narudzbenica.tip) : VALID_TRANSITIONS;
  // RADNIK moze samo PRODAJU da menja
  const validStatuses = isRadnik && narudzbenica.tip !== 'PRODAJA'
    ? []
    : (tipTransitions[narudzbenica.status] || []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Narudžbenica #{narudzbenica.id_narudzbenica}
        </h1>
      </div>

      {/* Header Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Datum</p>
              <p className="font-medium">
                {new Date(narudzbenica.datum).toLocaleDateString('sr-RS')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tip</p>
              <Badge variant="outline">
                {narudzbenica.tip === 'NABAVKA' ? 'Nabavka' : 'Prodaja'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                className={`${statusColors[narudzbenica.status]} border`}
                variant="outline"
              >
                {STATUS_LABELS[narudzbenica.status]}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ukupna vrednost</p>
              <p className="font-bold text-lg">
                {narudzbenica.ukupna_vrednost?.toLocaleString('sr-RS', {
                  minimumFractionDigits: 2,
                }) ?? '—'}{' '}
                RSD
              </p>
            </div>
            {narudzbenica.dobavljac_naziv && (
              <div>
                <p className="text-xs text-muted-foreground">Dobavljač</p>
                <p className="font-medium">{narudzbenica.dobavljac_naziv}</p>
              </div>
            )}
            {narudzbenica.dostavljac_id && (
              <div>
                <p className="text-xs text-muted-foreground">Dostavljač ID</p>
                <p className="font-medium">#{narudzbenica.dostavljac_id}</p>
              </div>
            )}
            {narudzbenica.napomena && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Napomena</p>
                <p>{narudzbenica.napomena}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stavke */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stavke</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proizvod</TableHead>
                  <TableHead>Šifra</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                  <TableHead className="text-right">Količina</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {narudzbenica.stavke?.map((s) => (
                  <TableRow key={s.id_stavka}>
                    <TableCell className="font-medium">
                      {s.proizvod_naziv}
                    </TableCell>
                    <TableCell>{s.proizvod_sifra}</TableCell>
                    <TableCell className="text-right">
                      {s.proizvod_cena?.toLocaleString('sr-RS', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">{s.kolicina}</TableCell>
                    <TableCell className="text-right font-medium">
                      {s.ukupna_cena?.toLocaleString('sr-RS', {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PDF Racun - VLASNIK i RADNIK mogu za zavrsenu PRODAJU */}
      {narudzbenica.tip === 'PRODAJA' && narudzbenica.status === 'ZAVRSENA' && (isVlasnik || isRadnik) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Račun</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  const url = `${getApiBaseUrl()}/api/narudzbenice/${narudzbenica.id_narudzbenica}/racun`;
                  window.open(url, '_blank');
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Otvori PDF račun
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const url = `${getApiBaseUrl()}/api/narudzbenice/${narudzbenica.id_narudzbenica}/racun`;
                    const res = await fetch(url, { credentials: 'include' });
                    if (!res.ok) throw new Error('Greška pri preuzimanju');
                    const blob = await res.blob();
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `racun_${narudzbenica.id_narudzbenica}.pdf`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                  } catch {
                    toast({ title: 'Greška', description: 'Nije moguće preuzeti PDF.', variant: 'destructive' });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {canChangeStatus && validStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promeni status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="sm:w-64">
                  <SelectValue placeholder="Izaberite novi status" />
                </SelectTrigger>
                <SelectContent>
                  {validStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleStatusChange}
                disabled={!newStatus || updatingStatus}
              >
                {updatingStatus && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Promeni
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Dostavljac - VLASNIK only */}
      {isVlasnik && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dodeli dostavljača</CardTitle>
          </CardHeader>
          <CardContent>
            {dostavljaci.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nema dostupnih dostavljača.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedDostavljac}
                  onValueChange={setSelectedDostavljac}
                >
                  <SelectTrigger className="sm:w-64">
                    <SelectValue placeholder="Izaberite dostavljača" />
                  </SelectTrigger>
                  <SelectContent>
                    {dostavljaci.map((d) => (
                      <SelectItem
                        key={d.id_korisnik}
                        value={String(d.id_korisnik)}
                      >
                        {d.ime} {d.prezime} ({d.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignDostavljac}
                  disabled={!selectedDostavljac || assigningDostavljac}
                >
                  {assigningDostavljac && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Dodeli
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete - VLASNIK + KREIRANA only */}
      {isVlasnik && narudzbenica.status === 'KREIRANA' && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Obriši narudžbenicu
          </Button>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši narudžbenicu?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija je nepovratna. Da li ste sigurni?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
