# BPKAD Pajak DTHRTH - Project Context

## Ringkasan Aplikasi
Aplikasi untuk **BPKAD (Badan Pengelolaan Keuangan dan Aset Daerah)** Kabupaten untuk merekap data **DTHRTH** dari seluruh SKPD.

## Entitas Utama

### SKPD (Satuan Kerja Perangkat Daerah)
Organisasi perangkat daerah yang mengisi form DTHRTH. Contoh:
- Dinas Pendidikan
- Dinas Kesehatan
- Dinas Pekerjaan Umum
- Kecamatan-kecamatan
- dll.

### DTHRTH (Daftar Target dan Harga Rata-rata Tertinggi Harian)
Form yang diisi tiap SKPD untuk melaporkan data pajak/retribusi. Data mencakup:
- Target penerimaan
- Harga rata-rata
- Realisasi
- Periode pelaporan

### BPKAD (Admin)
Role yang bisa:
- Melihat rekap semua data DTHRTH dari semua SKPD
- Export/download laporan
- Monitoring status pengisian per SKPD
- Dashboard summary seluruh kabupaten

---

## Tech Stack
- **Frontend**: Angular 21 (standalone components, signals)
- **UI Library**: PrimeNG 21 dengan Aura theme
- **State**: Angular signals
- **Styling**: Vanilla CSS dengan PrimeNG CSS variables

---

## Struktur Aplikasi (Saat Ini)

```
src/app/
├── layout/              # Layout dengan sidebar responsive
├── pages/
│   ├── dashboard/       # Dashboard summary (stat cards)
│   └── sample-crud/     # Template CRUD (ganti ke DTHRTH nanti)
├── app.routes.ts        # Routing configuration
├── app.config.ts        # PrimeNG & providers setup
└── app.ts               # Root component
```

---

## Rencana Pengembangan Selanjutnya

### Phase 1: Data Model
- [ ] Buat model SKPD (id, nama, alamat, kontak)
- [ ] Buat model DTHRTH (periode, target, realisasi, status, skpd_id)
- [ ] Setup service untuk mock data / API integration

### Phase 2: Halaman SKPD
- [ ] List semua SKPD di kabupaten
- [ ] CRUD SKPD (tambah, edit, hapus)
- [ ] Filter dan search

### Phase 3: Halaman DTHRTH
- [ ] List DTHRTH per periode
- [ ] Form input DTHRTH
- [ ] Filter by SKPD, periode, status
- [ ] Rekap/summary per SKPD

### Phase 4: Dashboard & Reporting
- [ ] Summary statistik kabupaten
- [ ] Chart/grafik progress
- [ ] Export ke Excel/PDF
- [ ] Monitoring status pengisian

### Phase 5: (Optional) Multi-user
- [ ] Login system
- [ ] Role: BPKAD admin vs SKPD user
- [ ] Audit trail

---

## Konvensi Kode

### Angular
- Standalone components (no NgModules)
- `ChangeDetectionStrategy.OnPush` selalu
- Signals untuk state (`signal()`, `computed()`)
- `input()` dan `output()` instead of decorators
- Native control flow (`@if`, `@for`, `@switch`)

### Styling
- CSS variables dari PrimeNG (`--p-*`)
- Mobile-first responsive design
- Breakpoint: 992px untuk desktop sidebar

### File Naming
- Component: `nama-component.ts`, `nama-component.html`, `nama-component.css`
- Folder per feature di `src/app/pages/`
