import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';
import { Chart } from 'react-google-charts';

interface AnaliticsData {
  profitPoDanima: any[];
  top5Proizvodi: any[];
  ukupniProfit: number;
  datumIzvestaja: string;
}

export default function Analitika() {
  const { user } = useAuth();
  const [data, setData] = useState<AnaliticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get<AnaliticsData>('/api/analitika/profit');
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Greška pri učitavanju analitike'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Ako korisnik nije vlasnik, ne prikaži stranicu
  if (user?.uloga !== 'VLASNIK') {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Pristup odbijen</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">
            Samo vlasnik može pristupiti analitici profita.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Greška</CardTitle>
          </CardHeader>
          <CardContent className="text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Nema podataka</CardTitle>
          </CardHeader>
          <CardContent>Nema dostupnih podataka za analitiku.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ukupni profit */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          <CardTitle className="text-sm font-medium">Ukupan profit</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-5xl font-extrabold text-green-700 tracking-tight">
            {data.ukupniProfit.toLocaleString('sr-RS', {
              style: 'currency',
              currency: 'RSD',
            })}
          </div>
          <p className="text-sm text-green-600 mt-3">
            Profit od svih završenih prodaja
          </p>
        </CardContent>
      </Card>

      {/* Top 5 proizvoda */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>
            Najprodavanijih 5 proizvoda po profitu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.top5Proizvodi.length > 1 ? (
            <div className="w-full h-96">
              <Chart
                chartType="BarChart"
                data={data.top5Proizvodi}
                options={{
                  title: 'Profit po proizvodu',
                  legend: { position: 'bottom' },
                  hAxis: {
                    title: 'Profit (RSD)',
                  },
                  vAxis: {
                    title: 'Proizvod',
                  },
                  colors: ['#10b981'],
                  backgroundColor: 'transparent',
                }}
                width="100%"
                height="100%"
              />
            </div>
          ) : (
            <p className="text-gray-500">Nema podataka za prikaz</p>
          )}
        </CardContent>
      </Card>

      {/* Profit po danima */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Profit po danima</CardTitle>
        </CardHeader>
        <CardContent>
          {data.profitPoDanima.length > 1 ? (
            <div className="w-full h-96">
              <Chart
                chartType="LineChart"
                data={data.profitPoDanima}
                options={{
                  title: 'Dnevni profit',
                  legend: { position: 'bottom' },
                  hAxis: {
                    title: 'Datum',
                  },
                  vAxis: {
                    title: 'Profit (RSD)',
                  },
                  colors: ['#3b82f6'],
                  backgroundColor: 'transparent',
                  pointSize: 5,
                  lineWidth: 2,
                }}
                width="100%"
                height="100%"
              />
            </div>
          ) : (
            <p className="text-gray-500">Nema podataka za prikaz</p>
          )}
        </CardContent>
      </Card>

      {/* Datum izveštaja */}
      <div className="text-xs text-gray-500 text-center">
        Izveštaj generisan: {new Date(data.datumIzvestaja).toLocaleString('sr-RS')}
      </div>
    </div>
  );
}
