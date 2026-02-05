"use client";
import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";

export default function NoviProizvodPage() {
  const [forma, setForma] = useState({
    naziv: "",
    sifra: "",
    cena: 0,
    kolicina: 0
  });

  const spasiProizvod = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await fetch("/api/proizvodi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(forma),
  });

  if (res.ok) {
    alert("Proizvod uspešno dodat!");
    setForma({ naziv: "", sifra: "", cena: 0, kolicina: 0 });
  } else {
    const errorData = await res.json();
    alert("Greška: " + errorData.error);
  }
};

  return (
    <div className="p-10 max-w-lg mx-auto bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-black">Novi Proizvod</h1>
      <form onSubmit={spasiProizvod}>
        <Input label="Naziv" type="text" placeholder="npr. Laptop" value={forma.naziv} 
               onChange={(e) => setForma({...forma, naziv: e.target.value})} />
        
        <Input label="Šifra" type="text" placeholder="npr. LPT-001" value={forma.sifra} 
               onChange={(e) => setForma({...forma, sifra: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
        <Input 
              label="Cena (RSD)" 
              type="number" 
              placeholder="0.00" 
              value={forma.cena} 
              onChange={(e) => setForma({...forma, cena: parseFloat(e.target.value) || 0})}/>
        <Input 
              label="Količina" 
              type="number" 
              placeholder="0" 
              value={forma.kolicina} 
              onChange={(e) => setForma({...forma, kolicina: parseInt(e.target.value) || 0})}/>
</div>

        <Button label="Sačuvaj proizvod" type="submit" />
      </form>
    </div>
  );
}