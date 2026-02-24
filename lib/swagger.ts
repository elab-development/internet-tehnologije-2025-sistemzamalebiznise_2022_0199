import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shop Scale Buddy API',
      version: '1.0.0',
      description:
        'REST API dokumentacija za sistem za upravljanje malim biznisima. Omogućava upravljanje proizvodima, narudžbenicama, dobavljačima, lagerom, korisnicima i analitikom.',
      contact: {
        name: 'ITEH Projekat 2022/0199',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token koji se postavlja kao HttpOnly cookie nakon uspešnog logina',
        },
      },
      schemas: {
        Proizvod: {
          type: 'object',
          properties: {
            id_proizvod: { type: 'integer', example: 1 },
            naziv: { type: 'string', example: 'Laptop Dell' },
            sifra: { type: 'string', example: 'LP-001' },
            cena: { type: 'number', format: 'float', example: 89999.99 },
            nabavna_cena: { type: 'number', format: 'float', example: 75000.0 },
            prodajna_cena: { type: 'number', format: 'float', example: 89999.99 },
            kolicina_na_lageru: { type: 'integer', example: 50 },
            minimalna_kolicina: { type: 'integer', nullable: true, example: 5 },
            jedinica_mere: { type: 'string', example: 'kom' },
            datum_kreiranja: { type: 'string', format: 'date-time' },
            datum_izmene: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Korisnik: {
          type: 'object',
          properties: {
            id_korisnik: { type: 'integer', example: 1 },
            ime: { type: 'string', example: 'Marko' },
            prezime: { type: 'string', example: 'Marković' },
            email: { type: 'string', format: 'email', example: 'marko@example.com' },
            uloga: { type: 'string', enum: ['VLASNIK', 'RADNIK', 'DOSTAVLJAC'], example: 'VLASNIK' },
          },
        },
        Dobavljac: {
          type: 'object',
          properties: {
            id_dobavljac: { type: 'integer', example: 1 },
            naziv_firme: { type: 'string', example: 'Tech Distributer d.o.o.' },
            telefon: { type: 'string', nullable: true, example: '+381601234567' },
            email: { type: 'string', nullable: true, example: 'info@techdist.rs' },
            adresa: { type: 'string', nullable: true, example: 'Bulevar Oslobođenja 10, Beograd' },
          },
        },
        Narudzbenica: {
          type: 'object',
          properties: {
            id_narudzbenica: { type: 'integer', example: 1 },
            datum_kreiranja: { type: 'string', format: 'date-time' },
            datum_izmene: { type: 'string', format: 'date-time', nullable: true },
            datum_zavrsetka: { type: 'string', format: 'date-time', nullable: true },
            tip: { type: 'string', enum: ['NABAVKA', 'PRODAJA'], example: 'PRODAJA' },
            status: { type: 'string', enum: ['KREIRANA', 'POSLATA', 'U_TRANSPORTU', 'PRIMLJENA', 'ZAVRSENA', 'OTKAZANA', 'STORNIRANA'], example: 'KREIRANA' },
            napomena: { type: 'string', nullable: true },
            ukupna_vrednost: { type: 'number', format: 'float', example: 179999.98 },
            kreirao_id: { type: 'integer' },
            dobavljac_id: { type: 'integer', nullable: true },
            dostavljac_id: { type: 'integer', nullable: true },
            stornirana: { type: 'boolean', example: false },
            datum_storniranja: { type: 'string', format: 'date-time', nullable: true },
            razlog_storniranja: { type: 'string', nullable: true },
            stornirao_id: { type: 'integer', nullable: true },
            dobavljac_naziv: { type: 'string', nullable: true },
            kreirao_email: { type: 'string', nullable: true },
          },
        },
        StavkaNarudzbenice: {
          type: 'object',
          properties: {
            id_stavka: { type: 'integer' },
            proizvod_id: { type: 'integer' },
            kolicina: { type: 'integer', example: 2 },
            ukupna_cena: { type: 'number', format: 'float' },
            prodajna_cena: { type: 'number', format: 'float' },
            proizvod_naziv: { type: 'string' },
            proizvod_sifra: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Greška' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./app/api/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
