# SIPRO — Property Development OS (PRD)

Aplikasi manajemen properti & konstruksi (React + FastAPI + MongoDB) dengan RBAC ketat,
keuangan/GL, konstruksi berbukti, portal pembeli, dan dokumen PDF ber-kop.
Bahasa produk & komunikasi: **Indonesia**.

## Aturan kerja yang tidak boleh dilanggar
- `bash scripts/run_all_gates.sh` adalah nyawa proyek. Semua gate harus PASS (sekarang **59 gate**).
- Batas ukuran berkas: Python < 800 baris, JS < 500 baris (`validate_compliance.py`).
- Form: tidak boleh `<Input>` bebas untuk nilai enum/relasi (`audit_forms_deep.py`); setiap
  `<Input>` wajib punya label/placeholder/aria-label.
- Kosakata enum hanya dari SSOT `/api/reference` (`reference_groups.py` + `reference_p<NN>.py`).
- Kredensial uji: `/app/memory/test_credentials.md` (sandi demo `Sipro#2026`).

## Riwayat implementasi (terbaru di atas)
### 29 Agu 2026 (lanjutan) — filter proyek & tanggal kustom BI + kartu lebih besar/interaktif
- Filter bar lintas tab di `/bi`: rentang cepat + filter **Proyek** (select) dan **Tanggal
  kustom** (daterange, menang atas rentang cepat sesuai `resolve_range` server) memakai pola
  `FilterBar` (`bi-filter-bar`). Filter proyek hanya dikirim ke Eksekutif/Penjualan/Proyek;
  saat aktif, hint `bi-project-hint` menjelaskan Marketing & Tim tidak per-proyek.
- Grid kartu 4 kolom → maks 3 (`md:grid-cols-2 xl:grid-cols-3`, md agar tidak sempit di
  tablet); sparkline lebih tinggi (h-16) dan interaktif (hover = periode+nilai), bilah persen
  berlabel "% tercapai", bilah kategori top-4 + hint "+n kategori lain".
- Diverifikasi testing agent (iteration_106): 100% skenario lulus, 0 error konsol.

### 29 Agu 2026 — visualisasi mini di kartu BI + desain grafik lanjutan
- Kartu metrik `/bi` kini memuat visualisasi mini (`MetricSpark.js`): sparkline area
  bergradien untuk deret waktu (pakai `cumulative` bila ada, domain diberi napas agar deret
  datar tidak jadi balok), bilah progres gradien untuk metrik persen, bilah proporsi top-3
  untuk rincian kategori; plus badge tren naik/turun vs periode sebelumnya
  (`bi-metric-spark`, `bi-metric-trend`). Aturan kejujuran tetap: metrik `kosong` tidak digambar.
- `MetricChart.js` didesain ulang: warna token tema `--chart-1..5` (mode gelap ikut benar),
  fill gradien, tooltip kaca buram kustom (`ChartTip`), donat dengan total di tengah,
  opasitas bar mengikuti nilainya, sumbu tanpa garis. Angka besar diringkas via
  `formatCompact` ("2,3 M", "212,5 jt") di sumbu & bilah mini.
- Kartu diberi hover lift + garis aksen gradien. Diverifikasi testing agent (5 hub, 0 error
  konsol) + 3 temuan visual (angka terpotong, sumbu Y terpotong, sparkline balok) diperbaiki.

### 28 Agu 2026 (lanjutan) — sidebar bisa di-collapse/expand
- Tombol ciut/perlebar di kepala sidebar (`sidebar-collapse-toggle`, ikon PanelLeft):
  mode ciut = 64px ikon-saja dengan `title` tooltip per menu, grup dipisah garis tipis;
  mode lebar = 256px seperti semula. Pilihan tersimpan di
  `localStorage["sipro.sidebar.collapsed"]` dan bertahan antar sesi.
- Drawer mobile tetap selalu tampil penuh. Diverifikasi browser: collapse 64px →
  reload tetap ciut → expand 256px; 0 error konsol.

### 28 Agu 2026 (lanjutan) — warna ikon kategori di pusat notifikasi
- `CATEGORY_TONE` (kelas LITERAL, bukan dirakit dinamis — pelajaran regresi pill) di
  `NotificationRows.js`: tugas amber, keuangan emerald, penjualan sky, proyek oranye,
  layanan violet, sebutan pink, sistem slate. Baris yang sudah dibaca memudar (opacity),
  bukan kehilangan warnanya.
- Dipakai di 3 tempat: lingkaran ikon baris notifikasi, chip filter kategori
  (NotificationsPage), dan baris dialog Preferensi. Diverifikasi visual: computed bg
  per kategori benar, tanpa error konsol.

### 28 Agu 2026 (perbaikan) — regresi Fase 67: warna status pill hilang (flat abu)
- Akar masalah: blok `.status-*` di `index.css` dipindah ke dalam `@layer components`,
  padahal kelasnya dirakit DINAMIS oleh `StatusPill` (`status-${tone}`) — isi @layer
  di-tree-shake Tailwind berdasarkan kelas literal di sumber, jadi SEMUA warna status
  terbuang saat build dan pill tampil putih/abu seragam.
- Perbaikan: blok `.status-pill` + seluruh `.status-*` dikeluarkan dari `@layer` (CSS polos
  selalu terkompilasi) + komentar penjaga agar tidak dipindah kembali. ATURAN: kelas yang
  dirakit dinamis TIDAK boleh berada di dalam `@layer`.
- Verifikasi: iterasi 104 (frontend 100%) — /leads, AR, kas bon, subcon, tasks, agenda
  semuanya berwarna semantik lagi; dot ::before tetap; 0 error console; gaya Fase 67 utuh.

### 28 Agu 2026 (lanjutan) — Fase 68: denda terjadwal + pengingat tunggakan pra-SP (gate 59)
- **Denda otomatis terjadwal** (`late_fee_auto.py` + `scheduler_p68.py`, cron 09:30 WIB):
  opsi per organisasi `payment.late.auto_apply` (bawaan MATI — keputusan bisnis) + dua rem
  `payment.late.auto_min_days` & `payment.late.auto_min_amount`. Tidak ada mesin kedua:
  yang menagihkan tetap `late_fee_engine.apply` (berjurnal, idempoten per termin/bulan).
  Panel di Keuangan → Penagihan: status, aturan, pratinjau (siap vs ditahan + sebab),
  riwayat putaran, "Jalankan sekarang" (`late_fee:create`).
  Endpoint: `GET/POST /api/finance/late-fee-auto[/run]`.
- **Pengingat tunggakan pra-SP** (`wa_reminder_engine` jenis baru `arrears_warning`):
  pesan WA disiapkan otomatis begitu tunggakan MELEWATI TOLERANSI kontrak (hitungan bulan
  = mesin SP/arrears yang sama), menyebut keadaan SP ("SEBELUM SP1"). Nominal & aturan
  bisa disetel: `reminder.arrears_enabled/min_amount/min_months/every_days/template_arrears`.
  Tiap kandidat membawa tautan `wa.me` siap kirim (tombol "Kirim manual" di panel
  pengingat); kirim otomatis tetap jujur `simulasi` tanpa kredensial WhatsApp.
- **Bug laten ditutup:** `scheduler_p59` diimpor tetapi tidak pernah `register()` —
  tugas peninjauan tunggakan harian tidak pernah terjadwal. Kini terdaftar.
- Gate baru `scripts/verify_p68.py` (gate 59, 39 pemeriksaan) HIJAU.

### 28 Agu 2026 — Fase 67: kedalaman & konsistensi tampilan / anti-flat (gate 58) + pemulihan lingkungan
- Lingkungan dipulihkan dari repo `akahdbeben/sipro` di container baru: `backend/.env`
  dibuat ulang (`JWT_SECRET`, `DEFAULT_ORG_ID=org-sipro`, `PORTAL_MASTER_OTP=000000` —
  gate memakai OTP master `000000`), dependensi backend+frontend dipasang, seed jalan,
  login OK, `run_all_gates.sh` → **OVERALL PASS (58 gates)**.
- **Fase 67 dirampungkan** (kode sudah ada saat sesi terputus, sisanya ditutup sekarang):
  token kedalaman di `index.css` (kanvas vs kartu, bayangan token, aksen teal + hover),
  primitif ui (button/input/select/card/tabs/table) membawa kedalaman & fokus 2px,
  `page-title`/`page-desc`/`section-title` menyeragamkan tulisan antar halaman,
  `SearchInput` ber-ikon, status pill bertitik warna, KPI bergaris aksen.
- **Temuan uji iterasi 102 ditutup**: kolom AKSI kini STICKY kanan saat tabel digulir
  mendatar — `.col-actions`/`.col-actions-head` di ~20 tabel + dukungan `sticky: true`
  pada kolom `DataTable` (AR, Deals, Dokumen, Agenda, Mitra, Bank Rekonsiliasi, Config,
  CAPI); header sticky dilengkapi di FakturPanel/VendorsPanel/CancellationsPanel/
  ArrearsCandidatesPanel; diverifikasi visual di 1366px (tombol Detail/Pertanggungjawaban
  terlihat tanpa menggulir). Empty-state pencarian notifikasi, testId SearchInput, dan
  skip-link/a11y sudah dikerjakan sebelumnya.
- Gate `scripts/verify_p67.py` (gate 58, 32 pemeriksaan) HIJAU.

### 27 Jun 2026 (lanjutan) — Fase 66: Template Dokumen disatukan (gate 57)
- **Satu layar per jenis dokumen**: dua sub-tab lama ("Isi template" vs "Tampilan & kop
  surat") dihapus; naskah, kop/kertas, baris biaya, GAYA TABEL, dan tanda tangan disetel
  berdampingan dengan pratinjau yang memakai naskah yang sedang disunting.
- **Naskah per jenis dokumen** (`backend/doc_script.py`, `GET/PUT /api/doc-layouts/{code}/script`):
  placeholder diturunkan dari konteks mesin penerbit sungguhan, token asing ditolak 400 +
  diperingatkan saat mengetik. Naskah tersimpan di `document_templates` sehingga benar-benar
  tercetak; dokumen yang dirakit sistem (SPK/PO/SP/BA) memakainya sebagai pembuka.
- **Gaya tabel bisa dikonfigurasi**: `layout.table` (garis penuh/mendatar/TRANSPARAN, nama
  kolom bisa disembunyikan, zebra, sorot total, ukuran huruf, warna garis) berlaku pada semua
  tabel dokumen. Naskah resmi butuh izin `settings:update`.
- Gate baru `scripts/verify_p66.py` (57 gate, 53 pemeriksaan — memeriksa ISI PDF) +
  `backend/tests/test_doc_p66.py` (17 uji).

### 27 Jun 2026 (lanjutan) — Fase 65: notifikasi kembar berkelompok & preferensi (gate 56)
- **Pengelompokan kembar**: `notif_center.group_key()` (jenis + entitas + judul yang
  dinormalkan — nomor dokumen/kode jadi `#`) + `group_rows()`; `GET /api/notifications?group=true`
  mengirim wakil terbaru + `group_count/group_unread/group_ids/group_members/group_oldest_at`.
  Aksi kelompok: `POST /api/notifications/group/read|dismiss` (dari kunci, bukan daftar id).
- **Preferensi per pemakai** (`notif_prefs.py`, koleksi `notification_prefs`): tiga saluran
  `inapp`/`push`/`wa` per kategori. Ditegakkan di SATU pintu (`engine.create_notification`)
  sehingga ~30 pemanggil lama ikut patuh. Notifikasi yang MENUNTUT TINDAKAN tidak bisa
  dibungkam dari daftar; yang dibungkam ditandai `muted_at` + `muted_reason` (tidak dihapus).
- **Ringkasan WhatsApp manual** (`GET /api/notifications/wa-digest`): teks + tautan `wa.me`,
  dikirim manusia (tidak ada kredensial WhatsApp yang diklaim sistem).
- UI: baris kelompok berjumlah "5×" yang bisa dibuka + `NotificationPrefsDialog`; pilihan
  pengelompokan hidup di URL. Gate baru `scripts/verify_p65.py` (56 gate, 59 pemeriksaan) +
  `backend/tests/test_notif_p65.py` (12 uji).

### 27 Jun 2026 — Fase 61: cetak SPK & PO (SELESAI, gate 52 hijau)
- `backend/docgen_p61.py`: isi SPK (identitas pihak, nilai kontrak, retensi, masa
  pemeliharaan, rincian lingkup dari `spk_scope_items`, 5 ketentuan) & PO (penyedia, jenis,
  jatuh tempo, rincian item + total, 4 ketentuan). Dokumen berstatus `draft` DIPAKSA
  bertanda watermark DRAFT. Nama pihak kedua = subkontraktor/vendor (bukan "Pemesan").
- `pdf_layout.render_letter(..., item_table=...)` + helper `_grid` (dipakai bersama laporan).
- Endpoint: `GET /api/subcon/spk/{id}/pdf`, `GET /api/procurement/pos/{id}/pdf`.
- UI: `patterns/PrintDocButton.js` dipakai di `SPKDetailSheet` & `PODetailSheet`
  (testId `spk-print-pdf`, `po-print-pdf`).
- Target layout baru di Pusat Konfigurasi Dokumen: `SPK`, `PO`.
- Gate baru `scripts/verify_p61.py` (24 pemeriksaan). Uji UI: iteration_97 (bersih).
- PDF diperiksa visual (render PNG): kop, rincian, ketentuan, dua kolom tanda tangan OK.

### 27 Jun 2026 (lanjutan) — Fase 64: pusat notifikasi yang bisa habis (SELESAI, gate 55)
- Keluhan pemakai: kartu notifikasi besar, daftar memanjang tanpa akhir, tanpa kategori,
  tanpa jalan ke pekerjaannya, dan notifikasi tetap berdiri walau tindakannya sudah selesai.
- **Baris padat** (`components/notifications/NotificationRows.js`): satu notifikasi = satu
  baris (~52px) dengan ikon kategori, judul, isi terpangkas, waktu, tombol buka/tandai/
  sembunyikan; penanda **PERLU TINDAKAN** dan **sudah ditangani**.
- **Kategori & keadaan** (`backend/notif_center.py`): kategori (tugas, keuangan, penjualan,
  proyek, layanan, sebutan, sistem) & penanda `needs_action` **diturunkan dari data yang
  sudah ada** (`type` + `related_entity_type`) sehingga ~300 notifikasi lama ikut
  berkategori tanpa migrasi. Tab keadaan: Perlu tindakan · Belum dibaca · Sudah dilihat ·
  Semua (label dari SSOT `reference_p64.notification_state`).
- **Navigasi**: `link_of()` — SATU peta entitas/jenis → rute; notifikasi tugas selalu ke
  papan tugas (`TYPE_LINK_WINS`).
- **Auto-cabut**: `resolve_done()` mencabut notifikasi yang tindakannya sudah dilakukan
  (tugas ditutup, kas bon/PO/termin/klaim diputus, tagihan dibayar, temuan selesai, fee
  diputus, entitas hilang) — ditandai `resolved_at` + alasan, TIDAK dihapus.
- **Endpoint**: `GET /api/notifications?state=&category=&q=` (kirim `summary` + `auto_resolved`),
  `POST /notifications/{id}/dismiss`, `POST /notifications/clear-read`,
  `POST /notifications/read-all?category=`; kontrak lama `unread_only` (lonceng TopBar) utuh.
- Gate baru `scripts/verify_p64.py` (45 pemeriksaan) → **OVERALL PASS (55 gates)**. Uji:
  iteration_100 (12/12 pytest + UI 1440×900 & 390×844, 0 isu) — berkas uji
  `backend/tests/test_notif_p64.py` men-snapshot & memulihkan data.

### 27 Jun 2026 (lanjutan) — Fase 63: agenda kerja lengkap (SELESAI, gate 54 hijau)
- Halaman **Agenda & Survey** dulu hanya kalender + daftar SATU hari (dua pertiga layar kosong,
  agenda minggu depan hanya bisa ditemukan dengan menebak tanggal). Sekarang: kalender +
  agenda hari terpilih + **TABEL agenda** (`AgendaTable.js`, pola DataTable+FilterBar) dengan
  cari, filter (rentang 7/30 hari & riwayat, golongan, jenis, status), urut & paginasi
  **server-side**, ekspor CSV, dan seluruh filter hidup di URL (`useListQuery`).
- **Buat/ubah agenda dari halaman ini** (`AgendaFormDialog.js`): golongan `sales` (wajib
  menyebut lead, dicari bukan digulir) vs `internal` (TANPA lead) + peserta dipilih dari
  `GET /api/appointments/staff`.
- Jenis agenda non-penjualan masuk SSOT (`reference_p63.py`): rapat internal, kunjungan
  proyek, rapat vendor/subkontraktor, lain-lain + grup `agenda_kind`.
- Backend (`routers/leads_router.py`): `GET /api/appointments` menerima
  `q/status/type/kind/assigned_to/date_from/date_to/sort/direction`; `POST` menerima
  `lead_id` OPSIONAL (agenda internal tidak menaikkan tahap lead & tidak menerbitkan tugas
  survei); `PUT /api/appointments/{id}` (agenda `done`/`cancelled` **tidak bisa diubah**);
  peserta wajib pengguna nyata; `_appt_scope()` membuat staf yang **diundang** melihat
  agendanya.
- RBAC: `project_manager` & `site_engineer` kini boleh melihat/membuat agenda (rapat &
  kunjungan proyek); agenda yang MENYEBUT LEAD tetap ditolak untuk peran tanpa `leads:view`;
  keuangan tetap **hanya membaca** (SoD Fase 52 utuh).
- Gate baru `scripts/verify_p63.py` (44 pemeriksaan) → `run_all_gates.sh` **OVERALL PASS (54
  gates)**. Uji UI: iteration_99 (semua alur PASS). Perbaikan dari temuan uji: sheet detail
  tidak lagi menawarkan "Mulai Survey" pada agenda internal; pencarian lead diberi debounce.

### 27 Jun 2026 (lanjutan) — Fase 62: dokumen penagihan & lapangan (SELESAI, gate 53 hijau)
- **Surat Peringatan SP1/SP2/SP3** (`warning_letters.py` + `docgen_p62.sp_pdf`): angka & termin
  dari mesin denda (`late_fee_engine` via `arrears_engine.months_in_arrears`), tingkat TIDAK
  boleh melompat, SP3 hanya sah setelah tunggakan mencapai `payment.staged.arrears_months_to_cancel`,
  nomor atomik `SP{n}/TAHUN/URUT`, idempoten per (kontrak, tingkat, bulan) + indeks unik.
  Endpoint: `GET/POST /api/docs/warning-letters`, `GET /api/docs/warning-letters/state`,
  `GET /api/docs/warning-letters/{id}/pdf`. Terbit = `late_fee:create` (Keuangan); baca =
  `late_fee:view` (sales ber-scope hanya transaksinya). Surat MEMPERINGATKAN, tidak membatalkan.
- **Berita Acara Opname** (`GET /api/subcon/claims/{id}/pdf`): rincian dari BARIS TERMIN yang sama
  dengan tagihan AP, pekerjaan yang DIKELUARKAN opname tercetak beserta alasannya, retensi &
  netto disebut, termin yang belum di-opname dipaksa bertanda DRAFT.
- **Berita Acara Punch List** (`GET /api/field/punchlist/pdf`): lingkup = filter yang sedang
  dilihat (proyek/kavling/status), kolom bukti perbaikan, 3 ketentuan lapangan.
- **Lampiran SPK**: `spk_attachments` + `GET/POST/DELETE /api/subcon/spk/{id}/attachments`
  (`subcon:update`); gambar/spesifikasi tercetak sebagai HALAMAN LAMPIRAN pada PDF SPK
  (`pdf_layout._attachment_flow`, gambar dirender apa adanya; berkas hilang tidak menggagalkan
  cetak).
- **Kirim dokumen ke pihak luar** (`doc_share.py`): tautan berbatas waktu (14 hari, token acak,
  bisa dicabut, pembukaan tercatat) + pesan `wa.me` siap kirim. `POST /api/docs/share`,
  `GET /api/public/docs/{token}` (tanpa login, satu token = satu dokumen, dirender ULANG dari
  data terkini). TIDAK memakai API Meta — manusia yang menekan kirim. Hak berbagi = hak atas
  dokumennya (`doc_share.PERMISSION`).
- Target layout baru: `SP`, `BA_OPNAME`, `PUNCHLIST`. Kamus SSOT baru: `warning_level`,
  `spk_attachment_kind` (`reference_p62.py`).
- Gate baru `scripts/verify_p62.py` (59 pemeriksaan) → `run_all_gates.sh` **OVERALL PASS (53
  gates)**. Uji UI: iteration_98 (10/10 alur bersih). Keempat PDF diperiksa visual per halaman.

### 27 Jun 2026 — Fase 60: konfigurasi tampilan dokumen (SELESAI, gate 51 hijau)
- Panel `Master Data → Template Dokumen → Tampilan & kop surat` (`DocLayoutPanel`) dengan
  pratinjau PDF BERDAMPINGAN yang dirender mesin cetak yang sama (`pdf_layout.py`).
- Kop/footer 2 mode (dirakit sistem / gambar desain), watermark, kertas & margin, baris
  biaya (urut, sembunyikan, sembunyikan bila Rp 0, baris manual), tanda tangan dinamis.
- Hak akses ubah = `settings:update` (identitas perusahaan = pengaturan organisasi);
  baca = `documents:view`.
- Bidang usaha jadi dropdown SSOT (`reference_p60.business_field`).
- Jalur cetak yang memakai layout: dokumen staf, **portal pembeli** (diperbaiki), kwitansi,
  penawaran, BAST.
- Gate baru `scripts/verify_p61.py`→(60) `scripts/verify_p60.py` (38 pemeriksaan). UI: iteration_96.
- Perbaikan gate lain: `audit_forms_deep.py` (tagline → dropdown; aria-label RowsForm &
  CostsDialog) dan `verify_analytics.py` (`analytics_engine.rebuild_snapshots` sekarang
  MEMPERBAIKI seluruh riwayat snapshot, bukan hanya hari ini).

### Sebelumnya
- Fase 59: laporan keringanan denda, kandidat tunggakan (2 bulan → usulan pembatalan), utang refund.
- Fase 58: toleransi & keringanan denda keterlambatan.
- Fase ≤57: CRM, kontrak & skema pembayaran, konstruksi berbukti, pengadaan 3-way match,
  subkon/opname/retensi, GL & pajak, portal pembeli, WA/omnichannel, analitik BI.

## Backlog
### P1
- ~~Surat Peringatan Tunggakan (SP1/SP2/SP3)~~ — SELESAI Fase 62.
- ~~Berita Acara Opname / Punch List PDF~~ — SELESAI Fase 62.
- ~~Lampiran gambar/spesifikasi pada SPK~~ — SELESAI Fase 62.
- Mutasi Fase 62 (`scripts/mutasi_62.py`) belum ada — gate 53 menjaga, ketangguhannya belum
  diuji dengan mutan.
### P2
- Pengingat WhatsApp untuk pembeli menunggak (kirim SP1 otomatis sesudah H+N lewat toleransi).
- Riwayat pengiriman dokumen di layar (data `GET /api/docs/share` sudah ada, panelnya belum).
- Agenda: pengingat WhatsApp H-1 ke peserta, tampilan minggu/bulan, dan ekspor .ics.
- Notifikasi: pengelompokan notifikasi kembar ("5× Persetujuan diskon penawaran") dan
  preferensi per pemakai (kategori mana yang boleh mengirim push).
- Peringatan dini tunggakan 1 bulan sebelum batas pembatalan kontrak.
- Ringkasan direksi: email digest laporan keringanan & utang refund setiap awal bulan.
