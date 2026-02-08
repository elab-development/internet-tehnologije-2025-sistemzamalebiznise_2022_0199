-- Seed data for testing
-- Insert test user (password: "lozinka123" hashed with bcrypt)
INSERT INTO korisnik (username, email, lozinka_hash, uloga) VALUES
('admin', 'admin@example.com', '$2a$10$YIjlrVyB.vY.LwYYY.YYYeYYYeYYYeYYYeYYYeYYYeYYYeYYYeYYYe', 'ADMIN'),
('employee1', 'employee@example.com', '$2a$10$YIjlrVyB.vY.LwYYY.YYYeYYYeYYYeYYYeYYYeYYYeYYYeYYYeYYYe', 'EMPLOYEE');

-- Insert categories
INSERT INTO kategorija (naziv, opis) VALUES
('Elektronika', 'Računarska oprema i elektronički uređaji'),
('Odeća', 'Odela, majice, pantalone'),
('Namirnice', 'Hrana i piće'),
('Materijali za gradnju', 'Cigle, cement, drvo');

-- Insert suppliers
INSERT INTO dobavljac (naziv, email, telefon, adresa) VALUES
('Distributor A', 'contact@distributora.com', '+381112345678', 'Beograd, Serbia'),
('Distributor B', 'info@distributorb.rs', '+381113456789', 'Novi Sad, Serbia'),
('Distributor C', 'hello@distributorc.com', '+381114567890', 'Niš, Serbia');

-- Insert products
INSERT INTO proizvod (naziv, opis, sifra, cena_nabavke, cena_prodaje, kolicina_na_lageru, minimalna_kolicina, id_kategorija, id_dobavljac) VALUES
('Laptop HP', 'HP Pavilion 15 Laptop', 'LAP-001', 35000.00, 45000.00, 5, 2, 1, 1),
('Monitor Dell', 'Dell 24 inch Monitor', 'MON-001', 8000.00, 11000.00, 8, 3, 1, 2),
('Tastatura Mehanička', 'RGB Mechanical Keyboard', 'KEY-001', 2500.00, 3500.00, 2, 5, 1, 1),
('Miš Logitech', 'Wireless Mouse', 'MOU-001', 1500.00, 2200.00, 15, 5, 1, 3),
('T-shirt Pamuk', 'Muška pamučna majica', 'TSH-001', 300.00, 600.00, 50, 10, 2, 2),
('Cement 50kg', 'Cement za gradnju', 'CEM-001', 200.00, 300.00, 100, 20, 4, 3);
