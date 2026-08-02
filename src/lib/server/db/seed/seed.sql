INSERT INTO tenants (nama_tenant, alamat) VALUES
   ('Terapi Mitra A', 'Jl. Contoh Alamat 1'),
   ('Terapi Mitra B', 'Jl. Contoh Alamat 2');

INSERT INTO outlets (outlet_hash, tenant_id, nama_outlet, alamat) VALUES
   ('absc', 1, 'Sehat Selalu', 'jl. Tentara Pelajar'),
   ('cbsa', 2, 'Selalu Sehat', 'Jl. Raya');
   
INSERT INTO devices (device_id, device_hash, tenant_id, status_aktif) VALUES
   ('2606-1', 'hash-2606-1', 1, 1),
   ('2606-2', 'hash-2606-2', 1, 1),
   ('2606-3', 'hash-2606-3', 2, 0),
   ('2607-1', 'hash-2607-1', 2, 1),
   ('2607-2', 'hash-2607-2', 2, 0);

INSERT INTO tenant_configs (tenant_id, harga_default, durasi_menit) VALUES
   (1, 60000, 40),
   (2, 75000, 40);

