import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Dobavljac } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Truck } from 'lucide-react';

export default function Dobavljaci() {
  const { toast } = useToast();
  const [dobavljaci, setDobavljaci] = useState<Dobavljac[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    naziv_firme: '',
    telefon: '',
    email: '',
    adresa: '',
  });

  const fetchDobavljaci = async () => {
    try {
      const data = await api.get<Dobavljac[]>('/api/dobavljaci');
      setDobavljaci(data);
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
    fetchDobavljaci();
  }, []);

  const handleAdd = async () => {
    if (!form.naziv_firme.trim()) {
      toast({
        title: 'Greška',
        description: 'Naziv firme je obavezan.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/dobavljaci', {
        naziv_firme: form.naziv_firme.trim(),
        telefon: form.telefon.trim() || undefined,
        email: form.email.trim() || undefined,
        adresa: form.adresa.trim() || undefined,
      });
      toast({ title: 'Uspešno', description: 'Dobavljač je dodat.' });
      setDialogOpen(false);
      setForm({ naziv_firme: '', telefon: '', email: '', adresa: '' });
      fetchDobavljaci();
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description: err instanceof Error ? err.message : 'Greška pri dodavanju.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dobavljači</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj dobavljača
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : dobavljaci.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Truck className="h-10 w-10 mb-2" />
              <p>Nema dobavljača za prikaz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv firme</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Adresa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dobavljaci.map((d) => (
                    <TableRow key={d.id_dobavljac}>
                      <TableCell className="font-medium">
                        {d.naziv_firme}
                      </TableCell>
                      <TableCell>{d.telefon || '—'}</TableCell>
                      <TableCell>{d.email || '—'}</TableCell>
                      <TableCell>{d.adresa || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj dobavljača</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv firme *</Label>
              <Input
                value={form.naziv_firme}
                onChange={(e) =>
                  setForm({ ...form, naziv_firme: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresa</Label>
              <Input
                value={form.adresa}
                onChange={(e) => setForm({ ...form, adresa: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
