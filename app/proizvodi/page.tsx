type Proizvod = {
  id: number;
  naziv: string;
  sifra: string;
  cena: number;
  kolicinaNaLageru: number;
};

const mockProizvodi: Proizvod[] = [
  {
    id: 1,
    naziv: "Sok od narandže",
    sifra: "P-001",
    cena: 150,
    kolicinaNaLageru: 120,
  },
  {
    id: 2,
    naziv: "Voda 0.5L",
    sifra: "P-002",
    cena: 80,
    kolicinaNaLageru: 300,
  },
  {
    id: 3,
    naziv: "Energetsko piće",
    sifra: "P-003",
    cena: 220,
    kolicinaNaLageru: 45,
  },
];

export default function ProizvodiPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Proizvodi</h1>
        <a
    href="/narudzbenice/nova"
    style={{
        display: "inline-block",
        marginBottom: 16,
        padding: "8px 12px",
        backgroundColor: "#2563eb",
        color: "white",
        textDecoration: "none",
        borderRadius: 4,
    }}
    >
  Nova narudžbenica
</a>

      <table border={1} cellPadding={8} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th>Naziv</th>
            <th>Šifra</th>
            <th>Cena (RSD)</th>
            <th>Lager</th>
          </tr>
        </thead>
        <tbody>
          {mockProizvodi.map((p) => (
            <tr key={p.id}>
              <td>{p.naziv}</td>
              <td>{p.sifra}</td>
              <td>{p.cena}</td>
              <td>{p.kolicinaNaLageru}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
