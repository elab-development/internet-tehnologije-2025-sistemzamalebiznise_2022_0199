export default function NovaNarudzbenicaPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Nova narudžbenica</h1>

      <label>
        Tip narudžbenice:
        <select style={{ marginLeft: 8 }}>
          <option value="PRODAJA">Prodaja</option>
          <option value="NABAVKA">Nabavka</option>
        </select>
      </label>

      <p style={{ marginTop: 16 }}>
        Ovde će se dodavati stavke narudžbenice.
      </p>
    </main>
  );
}
