import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Narudzbenica, StatusNarudzbenice } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
import { Plus, Loader2, FileText } from 'lucide-react';

const statusColors: Record<StatusNarudzbenice, string> = {
  KREIRANA: 'bg-muted text-muted-foreground',
  POSLATA: 'bg-info/15 text-info border-info/30',
  U_TRANSPORTU: 'bg-warning/15 text-warning border-warning/30',
  PRIMLJENA: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  ZAVRSENA: 'bg-primary/15 text-primary border-primary/30',
  OTKAZANA: 'bg-destructive/15 text-destructive border-destructive/30',
  STORNIRANA: 'bg-red-100 text-red-700 border-red-300',
};

export default function Narudzbenice() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [narudzbenice, setNarudzbenice] = useState<Narudzbenica[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('SVE');

  const fetchNarudzbenice = async () => {
    try {
      const endpoint =
        statusFilter && statusFilter !== 'SVE'
          ? `/api/narudzbenice?status=${statusFilter}`
          : '/api/narudzbenice';
      const data = await api.get<Narudzbenica[]>(endpoint);
      setNarudzbenice(data);
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
    setLoading(true);
    fetchNarudzbenice();
  }, [statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Narudžbenice</h1>
        <Button asChild>
          <Link to="/narudzbenice/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova narudžbenica
          </Link>
        </Button>
      </div>

      {/* Status Filter */}
      <div className="max-w-xs">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtriraj po statusu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SVE">Sve</SelectItem>
            {(Object.keys(STATUS_LABELS) as StatusNarudzbenice[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : narudzbenice.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2" />
              <p>Nema narudžbenica za prikaz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ukupno</TableHead>
                    <TableHead>Dobavljač</TableHead>
                    <TableHead>Dostavljač</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {narudzbenice.map((n) => (
                    <TableRow
                      key={n.id_narudzbenica}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/narudzbenice/${n.id_narudzbenica}`)
                      }
                    >
                      <TableCell className="font-medium">
                        #{n.id_narudzbenica}
                      </TableCell>
                      <TableCell>
                        {new Date(n.datum).toLocaleDateString('sr-RS')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {n.tip === 'NABAVKA' ? 'Nabavka' : 'Prodaja'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${statusColors[n.status]} border`}
                          variant="outline"
                        >
                          {STATUS_LABELS[n.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {n.ukupna_vrednost?.toLocaleString('sr-RS', {
                          minimumFractionDigits: 2,
                        }) ?? '—'}
                      </TableCell>
                      <TableCell>{n.dobavljac_naziv || '—'}</TableCell>
                      <TableCell>
                        {n.dostavljac_id ? `#${n.dostavljac_id}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
