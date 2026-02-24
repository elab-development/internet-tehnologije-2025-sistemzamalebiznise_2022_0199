import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Proizvod } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, Search, Loader2, Package } from 'lucide-react';

const emptyForm = {
  naziv: '',
  sifra: '',
  nabavna_cena: '',
  prodajna_cena: '',
  kolicina_na_lageru: '',
  jedinica_mere: '',
};

export default function Proizvodi() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isVlasnik = user?.uloga === 'VLASNIK';

  const [proizvodi, setProizvodi] = useState<Proizvod[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'naziv' | 'sifra'>('naziv');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProizvodi = async () => {
    try {
      const data = await api.get<Proizvod[]>('/api/proizvodi');
      setProizvodi(data);
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška pri učitavanju.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProizvodi();
  }, []);

  const filtered = proizvodi
    .filter(
      (p) =>
        p.naziv.toLowerCase().includes(search.toLowerCase()) ||
        p.sifra.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortBy].toLowerCase();
      const valB = b[sortBy].toLowerCase();
      return sortDir === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

  const handleSort = (col: 'naziv' | 'sifra') => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Proizvod) => {
    setEditId(p.id_proizvod);
    setForm({
      naziv: p.naziv,
      sifra: p.sifra,
      nabavna_cena: String(p.nabavna_cena),
      prodajna_cena: String(p.prodajna_cena),
      kolicina_na_lageru: String(p.kolicina_na_lageru),
      jedinica_mere: p.jedinica_mere,
    });
    setDialogOpen(true);
  };

  const cenaGreska =
    form.nabavna_cena !== '' &&
    form.prodajna_cena !== '' &&
    Number(form.prodajna_cena) <= Number(form.nabavna_cena)
      ? 'Prodajna cena mora biti veća od nabavne'
      : '';

  const handleSave = async () => {
    if (!form.naziv.trim() || !form.sifra.trim() || !form.nabavna_cena || !form.prodajna_cena || !form.jedinica_mere.trim()) {
      toast({
        title: 'Greška',
        description: 'Popunite sva obavezna polja.',
        variant: 'destructive',
      });
      return;
    }

    if (cenaGreska) {
      toast({
        title: 'Greška',
        description: cenaGreska,
        variant: 'destructive',
      });
      return;
    }

    const body = {
      naziv: form.naziv.trim(),
      sifra: form.sifra.trim(),
      nabavna_cena: Number(form.nabavna_cena),
      prodajna_cena: Number(form.prodajna_cena),
      kolicina_na_lageru: Number(form.kolicina_na_lageru) || 0,
      jedinica_mere: form.jedinica_mere.trim(),
    };

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/api/proizvodi/${editId}`, body);
        toast({ title: 'Uspešno', description: 'Proizvod je ažuriran.' });
      } else {
        await api.post('/api/proizvodi', body);
        toast({ title: 'Uspešno', description: 'Proizvod je dodat.' });
      }
      setDialogOpen(false);
      fetchProizvodi();
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška pri čuvanju.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/proizvodi/${deleteId}`);
      toast({ title: 'Uspešno', description: 'Proizvod je obrisan.' });
      setDeleteId(null);
      fetchProizvodi();
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška pri brisanju.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Proizvodi</h1>
        {isVlasnik && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj proizvod
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraži po nazivu ili šifri…"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-2" />
              <p>Nema proizvoda za prikaz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('naziv')}
                    >
                      Naziv {sortBy === 'naziv' && (sortDir === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('sifra')}
                    >
                      Šifra {sortBy === 'sifra' && (sortDir === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Nabavna cena</TableHead>
                    <TableHead className="text-right">Prodajna cena</TableHead>
                    <TableHead className="text-right">Na lageru</TableHead>
                    <TableHead>Jed. mere</TableHead>
                    {isVlasnik && <TableHead className="text-right">Akcije</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id_proizvod}>
                      <TableCell className="font-medium">{p.naziv}</TableCell>
                      <TableCell>{p.sifra}</TableCell>
                      <TableCell className="text-right">
                        {p.nabavna_cena.toLocaleString('sr-RS', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.prodajna_cena.toLocaleString('sr-RS', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">{p.kolicina_na_lageru}</TableCell>
                      <TableCell>{p.jedinica_mere}</TableCell>
                      {isVlasnik && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(p.id_proizvod)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Izmeni proizvod' : 'Dodaj proizvod'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv *</Label>
              <Input
                value={form.naziv}
                onChange={(e) => setForm({ ...form, naziv: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Šifra *</Label>
              <Input
                value={form.sifra}
                onChange={(e) => setForm({ ...form, sifra: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nabavna cena *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.nabavna_cena}
                  onChange={(e) => setForm({ ...form, nabavna_cena: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prodajna cena *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.prodajna_cena}
                  onChange={(e) => setForm({ ...form, prodajna_cena: e.target.value })}
                />
              </div>
            </div>
            {cenaGreska && (
              <p className="text-sm text-destructive">{cenaGreska}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Količina na lageru</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.kolicina_na_lageru}
                  onChange={(e) =>
                    setForm({ ...form, kolicina_na_lageru: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Jedinica mere *</Label>
              <Input
                value={form.jedinica_mere}
                onChange={(e) =>
                  setForm({ ...form, jedinica_mere: e.target.value })
                }
                placeholder="kom, kg, l…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleSave} disabled={saving || !!cenaGreska}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? 'Sačuvaj' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši proizvod?</AlertDialogTitle>
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
