import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  FileText,
  Users,
  Plus,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  proizvodi: number;
  dobavljaci: number;
  narudzbenice: number;
  korisnici: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    proizvodi: 0,
    dobavljaci: 0,
    narudzbenice: 0,
    korisnici: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<{
          counts?: DashboardStats;
          proizvodi?: number;
          dobavljaci?: number;
          narudzbenice?: number | { po_tipu: unknown; po_statusu: unknown; recent: unknown };
          korisnici?: number;
        }>('/api/dashboard');

        if (data.counts) {
          setStats(data.counts);
        } else {
          setStats({
            proizvodi: typeof data.proizvodi === 'number' ? data.proizvodi : 0,
            dobavljaci: typeof data.dobavljaci === 'number' ? data.dobavljaci : 0,
            narudzbenice: typeof data.narudzbenice === 'number' ? data.narudzbenice : 0,
            korisnici: typeof data.korisnici === 'number' ? data.korisnici : 0,
          });
        }
      } catch {
        try {
          const [proizvodi, dobavljaci, narudzbenice] = await Promise.all([
            api.get<unknown[]>('/api/proizvodi').catch(() => []),
            api.get<unknown[]>('/api/dobavljaci').catch(() => []),
            api.get<unknown[]>('/api/narudzbenice').catch(() => []),
          ]);
          let korisnici: unknown[] = [];
          if (user?.uloga === 'VLASNIK') {
            korisnici = await api
              .get<{ korisnici: unknown[] }>('/api/korisnici')
              .then((d) => d.korisnici)
              .catch(() => []);
          }
          setStats({
            proizvodi: proizvodi.length,
            dobavljaci: dobavljaci.length,
            narudzbenice: narudzbenice.length,
            korisnici: korisnici.length,
          });
        } catch {
          /* leave defaults */
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const statCards = [
    {
      label: 'Proizvodi',
      value: stats.proizvodi,
      icon: Package,
      to: '/proizvodi',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Dobavljači',
      value: stats.dobavljaci,
      icon: Truck,
      to: '/dobavljaci',
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: 'Narudžbenice',
      value: stats.narudzbenice,
      icon: FileText,
      to: '/narudzbenice',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    ...(user?.uloga === 'VLASNIK'
      ? [
          {
            label: 'Korisnici',
            value: stats.korisnici,
            icon: Users,
            to: '/korisnici',
            color: 'text-success',
            bg: 'bg-success/10',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Dobrodošli nazad{user?.email ? `, ${user.email}` : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Link key={card.to} to={card.to}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brze akcije</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {user?.uloga === 'VLASNIK' && (
                <Button asChild variant="outline">
                  <Link to="/proizvodi" state={{ openAdd: true }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novi proizvod
                  </Link>
                </Button>
              )}
              <Button asChild>
                <Link to="/narudzbenice/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova narudžbenica
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
