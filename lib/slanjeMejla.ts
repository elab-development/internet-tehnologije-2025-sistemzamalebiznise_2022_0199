import nodemailer from 'nodemailer';
import { query } from '@/lib/db';

interface LowStockProduct {
  id_proizvod: number;
  naziv: string;
  sifra: string;
  kolicina_na_lageru: number;
}

const LOW_STOCK_THRESHOLD = 5;

export async function getLowStockProducts(threshold = LOW_STOCK_THRESHOLD): Promise<LowStockProduct[]> {
  const result = await query(
    `
      SELECT id_proizvod, naziv, sifra, kolicina_na_lageru
      FROM proizvod
      WHERE kolicina_na_lageru <= $1
      ORDER BY kolicina_na_lageru ASC, naziv ASC
    `,
    [threshold]
  );

  return (result.rows || []).map((row) => ({
    id_proizvod: Number(row.id_proizvod),
    naziv: String(row.naziv),
    sifra: String(row.sifra),
    kolicina_na_lageru: Number(row.kolicina_na_lageru),
  }));
}

function validateSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `Sistem lagera <${user}>`;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP nije podešen. Potrebni su SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS i SMTP_FROM.');
  }

  return { host, port, user, pass, from };
}

function getVlasnikEmailFromEnv() {
  const vlasnikEmail = String(process.env.VLASNIK_EMAIL || '').trim();
  if (!vlasnikEmail) {
    throw new Error('VLASNIK_EMAIL nije podešen u .env fajlu.');
  }

  return vlasnikEmail;
}

export async function posaljiObavestenjeVlasniku(proizvodIme: string, trenutnaKolicina: number) {
  const smtp = validateSmtpConfig();
  const vlasnikEmail = getVlasnikEmailFromEnv();

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to: vlasnikEmail,
    subject: `Upozorenje: nizak lager za ${proizvodIme}`,
    text: `Proizvod "${proizvodIme}" ima ${trenutnaKolicina} komada na lageru. Potrebno je kreirati nabavku.`,
    html: `
      <h3>Upozorenje o niskom lageru</h3>
      <p>Proizvod <strong>${proizvodIme}</strong> ima <strong>${trenutnaKolicina}</strong> komada na lageru.</p>
      <p>Potrebno je kreirati NABAVKU.</p>
    `,
  });

  return {
    sent: true,
    recipient: vlasnikEmail,
    product: proizvodIme,
    quantity: trenutnaKolicina,
  };
}

export async function sendLowStockNotification(triggeredBy?: string) {
  const lowStockProducts = await getLowStockProducts();

  if (lowStockProducts.length === 0) {
    return {
      sent: false,
      reason: 'Nema proizvoda sa lagerom manjim ili jednakim 5.',
      lowStockCount: 0,
    };
  }

  const vlasnikEmail = getVlasnikEmailFromEnv();

  const smtp = validateSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const rowsHtml = lowStockProducts
    .map(
      (p) =>
        `<tr><td style="padding:6px 10px;border:1px solid #ddd;">${p.naziv}</td><td style="padding:6px 10px;border:1px solid #ddd;">${p.sifra}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${p.kolicina_na_lageru}</td></tr>`
    )
    .join('');

  const triggeredByText = triggeredBy ? `\nPokrenuo: ${triggeredBy}` : '';

  await transporter.sendMail({
    from: smtp.from,
    to: vlasnikEmail,
    subject: 'Upozorenje: Nizak lager proizvoda',
    text:
      `Sledeći proizvodi imaju 5 ili manje komada na lageru i potrebno je planirati novu NABAVKU:\n\n` +
      lowStockProducts.map((p) => `- ${p.naziv} (${p.sifra}): ${p.kolicina_na_lageru}`).join('\n') +
      triggeredByText,
    html: `
      <h3>Upozorenje: nizak lager proizvoda</h3>
      <p>Sledeći proizvodi imaju <strong>5 ili manje komada</strong> na lageru. Potrebno je planirati novu NABAVKU.</p>
      <table style="border-collapse:collapse;border:1px solid #ddd;">
        <thead>
          <tr>
            <th style="padding:6px 10px;border:1px solid #ddd;">Naziv</th>
            <th style="padding:6px 10px;border:1px solid #ddd;">Šifra</th>
            <th style="padding:6px 10px;border:1px solid #ddd;">Na lageru</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      ${triggeredBy ? `<p style="margin-top:12px;color:#666;">Pokrenuo: ${triggeredBy}</p>` : ''}
    `,
  });

  return {
    sent: true,
    lowStockCount: lowStockProducts.length,
    recipients: [vlasnikEmail],
    products: lowStockProducts,
  };
}
