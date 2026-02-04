import Button from "./Button";


interface ProductCardProps {
  naziv: string;
  cena: number;
  sifra: string;
}

export default function ProductCard({ naziv, cena, sifra }: ProductCardProps) {
  return (
    <div className="border p-4 rounded-lg shadow-sm bg-white text-black">
      <h3 className="text-xl font-bold">{naziv}</h3>
      <p className="text-gray-600">Šifra: {sifra}</p>
      <p className="text-lg font-semibold mt-2">{cena} RSD</p>
      
      <div className="mt-4">
        <Button 
          label="Detalji" 
          variant="primary" 
          onClick={() => alert(`Proizvod: ${naziv}`)} 
        />
      </div>
    </div>
  );
}