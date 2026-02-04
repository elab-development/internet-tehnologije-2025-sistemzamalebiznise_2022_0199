import Button from "../components/Button";

interface ProductProps {
  naziv: string;
  sifra: string;
  cena: number;
  kolicina: number;
  jedinicaMere: string;
}

export const ProductCard = ({ naziv, sifra, cena, kolicina, jedinicaMere }: ProductProps) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold text-gray-800">{naziv}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase">{sifra}</span>
      </div>
      <div className="my-4">
        <p className="text-2xl font-semibold text-blue-600">{cena} RSD</p>
        <p className={`text-sm mt-1 ${kolicina > 5 ? 'text-green-600' : 'text-red-500'}`}>
          Na stanju: {kolicina} {jedinicaMere}
        </p>
      </div>
      <Button label="Detalji" variant="primary" />
    </div>
  );
};