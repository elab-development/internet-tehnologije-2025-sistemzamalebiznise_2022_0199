import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Proizvod, Dobavljac, TipNarudzbenice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface Stavka {
  proizvod_id: number;
  kolicina: number;
}

export default function NovaNarudzbenica() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tip, setTip] = useState<TipNarudzbenice>('PRODAJA');
  const [dobavljacId, setDobavljacId] = useState<string>('');
  const [napomena, setNapomena] = useState('');
  const [stavke, setStavke] = useState<Stavka[]>([]);
  const [saving, setSaving] = useState(false);

  const [proizvodi, setProizvodi] = useState<Proizvod[]>([]);
  const [dobavljaci, setDobavljaci] = useState<Dobavljac[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Proizvod[]>('/api/proizvodi').catch(() => []),
      api.get<Dobavljac[]>('/api/dobavljaci').catch(() => []),
    ]).then(([p, d]) => {
      setProizvodi(p);
      setDobavljaci(d);
      setLoadingData(false);
    });
  }, []);

  const addStavka = () => {
    setStavke([...stavke, { proizvod_id: 0, kolicina: 1 }]);
  };

  const removeStavka = (index: number) => {
    setStavke(stavke.filter((_, i) => i !== index));
  };

  const updateStavka = (index: number, field: keyof Stavka, value: number) => {
    const updated = [...stavke];
    updated[index] = { ...updated[index], [field]: value };
    setStavke(updated);
  };

  const getProizvod = (id: number) =>
    proizvodi.find((p) => p.id_proizvod === id);

  const getSubtotal = (s: Stavka) => {
    const p = getProizvod(s.proizvod_id);
    if (!p) return 0;
    const cena = tip === 'NABAVKA' ? p.nabavna_cena : p.prodajna_cena;
    return cena * s.kolicina;
  };

  const ukupno = stavke.reduce((sum, s) => sum + getSubtotal(s), 0);

  const handleSubmit = async () => {
    if (tip === 'NABAVKA' && !dobavljacId) {
      toast({
        title: 'Greška',
        description: 'Izaberite dobavljača za nabavku.',
        variant: 'destructive',
      });
      return;
    }

    if (stavke.length === 0) {
      toast({
        title: 'Greška',
        description: 'Dodajte bar jednu stavku.',
        variant: 'destructive',
      });
      return;
    }

    const invalidStavke = stavke.some(
      (s) => !s.proizvod_id || s.kolicina <= 0
    );
    if (invalidStavke) {
      toast({
        title: 'Greška',
        description: 'Sve stavke moraju imati proizvod i količinu.',
        variant: 'destructive',
      });
      return;
    }

    if (tip === 'PRODAJA') {
      const stavkaBezLagera = stavke.find((s) => {
        const proizvod = getProizvod(s.proizvod_id);
        if (!proizvod) return true;
        return s.kolicina > proizvod.kolicina_na_lageru;
      });

      if (stavkaBezLagera) {
        const proizvod = getProizvod(stavkaBezLagera.proizvod_id);
        if (!proizvod) {
          toast({
            title: 'Greška',
            description: 'Izabrani proizvod ne postoji.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Greška',
          description: `Nema dovoljan broj proizvoda "${proizvod.naziv}". Na lageru je ${proizvod.kolicina_na_lageru}, tražite ${stavkaBezLagera.kolicina}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const body = {
        tip,
        dobavljac_id: tip === 'NABAVKA' ? Number(dobavljacId) : null,
        napomena: napomena.trim() || null,
        stavke: stavke.map((s) => ({
          proizvod_id: s.proizvod_id,
          kolicina: s.kolicina,
        })),
      };

      const data = await api.post<{ id_narudzbenica?: number; id?: number }>(
        '/api/narudzbenice',
        body
      );
      const newId = data.id_narudzbenica || data.id;
      toast({ title: 'Uspešno', description: 'Narudžbenica je kreirana.' });
      navigate(`/narudzbenice/${newId}`);
    } catch (err: unknown) {
      toast({
        title: 'Greška',
        description:
          err instanceof Error ? err.message : 'Greška pri kreiranju.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="text-2xl font-bold">Nova narudžbenica</h1>

      {/* Type & Supplier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Osnovno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tip *</Label>
              <Select
                value={tip}
                onValueChange={(v) => setTip(v as TipNarudzbenice)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NABAVKA">Nabavka</SelectItem>
                  <SelectItem value="PRODAJA">Prodaja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tip === 'NABAVKA' && (
              <div className="space-y-2">
                <Label>Dobavljač *</Label>
                <Select value={dobavljacId} onValueChange={setDobavljacId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite dobavljača" />
                  </SelectTrigger>
                  <SelectContent>
                    {dobavljaci.map((d) => (
                      <SelectItem
                        key={d.id_dobavljac}
                        value={String(d.id_dobavljac)}
                      >
                        {d.naziv_firme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Napomena</Label>
            <Textarea
              value={napomena}
              onChange={(e) => setNapomena(e.target.value)}
              placeholder="Opciona napomena…"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Stavke</CardTitle>
          <Button variant="outline" size="sm" onClick={addStavka}>
            <Plus className="h-4 w-4 mr-1" />
            Dodaj stavku
          </Button>
        </CardHeader>
        <CardContent>
          {stavke.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Dodajte stavke klikom na dugme iznad.
            </p>
          ) : (
            <div className="space-y-3">
              {stavke.map((stavka, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex flex-row items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <Label className="text-xs">Proizvod</Label>
                      <Select
                        value={stavka.proizvod_id ? String(stavka.proizvod_id) : ''}
                        onValueChange={(v) =>
                          updateStavka(index, 'proizvod_id', Number(v))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite proizvod" />
                        </SelectTrigger>
                        <SelectContent>
                          {proizvodi.map((p) => (
                            <SelectItem
                              key={p.id_proizvod}
                              value={String(p.id_proizvod)}
                            >
                              {p.naziv} ({p.sifra}) — {tip === 'NABAVKA' ? p.nabavna_cena : p.prodajna_cena} RSD — lager: {p.kolicina_na_lageru}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28 shrink-0 space-y-1">
                      <Label className="text-xs">Količina</Label>
                      <Input
                        type="number"
                        min="1"
                        max={
                          tip === 'PRODAJA' && stavka.proizvod_id
                            ? getProizvod(stavka.proizvod_id)?.kolicina_na_lageru
                            : undefined
                        }
                        value={stavka.kolicina}
                        onChange={(e) =>
                          updateStavka(index, 'kolicina', Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="w-28 shrink-0 text-right mt-6">
                      <span className="text-sm font-medium">
                        {getSubtotal(stavka).toLocaleString('sr-RS', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        RSD
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 mt-5"
                      onClick={() => removeStavka(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {tip === 'PRODAJA' && stavka.proizvod_id ? (
                    <p className="text-xs text-muted-foreground mt-1 ml-0">
                      Na lageru: {getProizvod(stavka.proizvod_id)?.kolicina_na_lageru ?? 0}
                    </p>
                  ) : null}
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end border-t pt-3">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground mr-3">
                    Ukupno:
                  </span>
                  <span className="text-lg font-bold">
                    {ukupno.toLocaleString('sr-RS', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    RSD
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/narudzbenice')}>
          Otkaži
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kreiraj narudžbenicu
        </Button>
      </div>
    </div>
  );
}
