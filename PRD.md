# Kopickup PRD

**Versi Dokumen:** v1.0
**Tanggal Pembaruan Terakhir:** 2026-06-01
**Status:** Draft

## Rekomendasi Scope Awal

**Fase MVP yang disarankan:**

- 1 outlet, 1 sistem POS, 1 atau lebih akun kasir/barista
- Transaksi in-store saja
- Pembayaran cash dan non-cash dicatat manual dulu
- Menu, harga, dan stok sederhana
- Dashboard operasional dasar untuk owner/manajemen
- Tidak ada customer app, delivery, loyalty, atau integrasi kompleks pada fase pertama

**Batasan bisnis dan regulasi yang disarankan:**

- Kumpulkan data seminimal mungkin
- Jangan simpan data kartu pembayaran
- Setiap user wajib punya akun unik dan role jelas
- Audit log aktif untuk transaksi, perubahan harga, stok, dan user
- Data pribadi dan akses sistem mengikuti prinsip pelindungan data dan keamanan sistem elektronik.

---

## 1. Executive Summary & Objectives

### Product Vision

Kopickup adalah sistem operasional dan POS sederhana untuk coffee pickup style berbasis mobil pickup yang membantu UMKM menjalankan penjualan harian dengan cepat, rapi, dan mudah dipantau oleh owner maupun manajemen.

### Business Goals

1. Mempercepat proses order dan pembayaran di outlet.
2. Mengurangi kesalahan input transaksi dan perhitungan kas.
3. Memberi visibilitas penjualan harian, menu terlaris, dan jam ramai.
4. Menyediakan dasar validasi pasar untuk model bisnis coffee pickup.
5. Menyiapkan fondasi untuk ekspansi outlet dan integrasi yang lebih kompleks.

### Success Metrics (KPIs)

| KPI                                                      | Target MVP | Catatan                            |
| -------------------------------------------------------- | ---------: | ---------------------------------- |
| Waktu input transaksi dari pilih item sampai tersimpan   |  < 2 menit | Pada perangkat operasional standar |
| Waktu simpan transaksi                                   |  < 2 detik | Pada koneksi stabil                |
| Akurasi total transaksi                                  |    > 99.5% | Dibandingkan hasil manual          |
| Error transaksi akibat user input                        |       < 2% | Per minggu                         |
| Ketersediaan sistem                                      |      99.5% | Selama jam operasional             |
| Audit log tersedia                                       |       100% | Untuk aksi kritikal                |
| Zero data breach                                         |  0 insiden | Target keamanan                    |
| Dashboard harian siap sebelum jam operasional berikutnya |       100% | Owner dapat cek penjualan cepat    |

---

## 2. User Personas & Role Matrix

### Definisi Role Pengguna

| Role                 | Deskripsi                                    | Tujuan Utama                                              |
| -------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Owner                | Pemilik bisnis dan pengambil keputusan       | Pantau performa bisnis, margin, kesehatan operasional, dan kelola sistem |
| Kasir / Barista      | Petugas yang melayani order dan pembayaran   | Input order cepat, akurat, dan menutup transaksi          |

### Tabel Akses Fitur

| Fitur                   | Owner | Kasir / Barista |
| ----------------------- | ----- | --------------- |
| Login / Logout          | ✅    | ✅              |
| Lihat dashboard ringkas | ✅    | ✅ (terbatas)   |
| Lihat dashboard lengkap | ✅    | ❌              |
| Buat transaksi          | ✅    | ✅              |
| Ubah / void transaksi   | ✅    | ❌              |
| Proses pembayaran       | ✅    | ✅              |
| Buka / tutup shift      | ✅    | ✅              |
| Kelola menu / harga     | ✅    | ❌              |
| Kelola stok             | ✅    | ❌              |
| Kelola user & role      | ✅    | ❌              |
| Ekspor laporan          | ✅    | ❌              |
| Lihat audit log         | ✅    | ❌              |

---

## 3. Functional Requirements & Feature Scope

### Modul A. Autentikasi, Otorisasi, dan Session

| ID    | User Story                                                                                                            | Acceptance Criteria                                                                                                           | Priority    |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-01 | Sebagai pengguna, saya ingin login menggunakan akun resmi, sehingga saya hanya bisa mengakses fitur sesuai role saya. | Username/password divalidasi; akun nonaktif ditolak; role menentukan menu yang tampil; session dibuat setelah login berhasil. | Must Have   |
| FR-02 | Sebagai sistem, saya ingin membatasi akses berdasarkan role, sehingga data dan aksi sensitif terlindungi.             | User hanya bisa membuka halaman yang diizinkan; direct URL ke halaman terlarang ditolak; aksi backend juga divalidasi.        | Must Have   |
| FR-03 | Sebagai pengguna, saya ingin logout dengan aman, sehingga session saya berakhir.                                      | Token session dihapus; user diarahkan ke halaman login; session lama tidak bisa dipakai lagi.                                 | Must Have   |
| FR-04 | Sebagai owner, saya ingin menonaktifkan akun, sehingga akses user bermasalah bisa dihentikan segera.                  | Akun nonaktif tidak dapat login; riwayat tetap tersimpan; alasan nonaktif dicatat.                                            | Should Have |

### Modul B. Master Menu, Produk, dan Harga

| ID    | User Story                                                                                                                       | Acceptance Criteria                                                                                                              | Priority    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-05 | Sebagai owner, saya ingin membuat dan mengubah kategori menu, sehingga menu tertata rapi.                             | Kategori bisa dibuat, diubah, dinonaktifkan; nama kategori unik per outlet; kategori kosong tetap bisa disimpan.                 | Must Have   |
| FR-06 | Sebagai owner, saya ingin menambah produk minuman dan makanan ringan, sehingga kasir bisa menjual item yang tersedia. | Produk memiliki nama, harga, kategori, status aktif, dan satuan; harga tidak boleh negatif; produk nonaktif tidak muncul di POS. | Must Have   |
| FR-07 | Sebagai owner, saya ingin mengubah harga, sehingga penyesuaian bisnis bisa dilakukan cepat.                           | Perubahan harga dicatat di audit log; harga baru berlaku untuk transaksi berikutnya; transaksi lama tidak berubah.               | Must Have   |
| FR-08 | Sebagai owner, saya ingin menandai produk habis, sehingga item tidak lagi dijual sementara.                                    | Item habis tidak bisa dipilih pada POS; status bisa dikembalikan aktif; perubahan muncul real-time.                              | Should Have |

### Modul C. POS, Order, dan Keranjang Transaksi

| ID    | User Story                                                                                                                       | Acceptance Criteria                                                                                                              | Priority    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-09 | Sebagai kasir, saya ingin menambah item ke keranjang, sehingga pesanan pelanggan bisa dicatat cepat.                             | Item dapat ditambah, dikurangi, dan dihapus sebelum pembayaran; jumlah harus bilangan bulat positif; subtotal dihitung otomatis. | Must Have   |
| FR-10 | Sebagai kasir, saya ingin menambahkan catatan pesanan, sehingga permintaan khusus pelanggan tidak terlewat.                      | Catatan maksimal dibatasi; catatan kosong tidak wajib; catatan tampil di detail transaksi dan struk.                             | Should Have |
| FR-11 | Sebagai kasir, saya ingin mengubah isi pesanan sebelum pembayaran, sehingga koreksi bisa dilakukan tanpa membuat transaksi baru. | Item hanya bisa diubah sebelum pembayaran final; setelah paid, transaksi terkunci; perubahan dicatat.                            | Must Have   |
| FR-12 | Sebagai kasir, saya ingin membatalkan pesanan yang belum dibayar, sehingga antrian tetap bersih.                                 | Transaksi draft dapat dibatalkan; alasan batal wajib bila di atas ambang tertentu; nomor transaksi tetap unik.                   | Must Have   |

### Modul D. Pembayaran, Struk, dan Rekonsiliasi

| ID    | User Story                                                                                                                | Acceptance Criteria                                                                                                              | Priority    |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-13 | Sebagai kasir, saya ingin memilih metode pembayaran, sehingga transaksi bisa selesai sesuai cara bayar pelanggan.         | Minimal tersedia cash dan non-cash manual; metode tersimpan di transaksi; total bayar dan kembalian dihitung otomatis.           | Must Have   |
| FR-14 | Sebagai kasir, saya ingin menyimpan transaksi yang sudah dibayar, sehingga penjualan tercatat resmi.                      | Status berubah menjadi paid; transaksi masuk laporan harian; duplikasi submit dicegah.                                           | Must Have   |
| FR-15 | Sebagai kasir, saya ingin mencetak atau menampilkan struk, sehingga pelanggan menerima bukti transaksi.                   | Struk memuat nama outlet, waktu, item, total, metode bayar, dan nomor transaksi; format konsisten.                               | Should Have |
| FR-16 | Sebagai owner, saya ingin melakukan void atau refund terkontrol, sehingga koreksi transaksi bisa dilakukan dengan aman. | Aksi hanya untuk role berwenang; alasan wajib diisi; nilai refund tidak boleh melebihi nominal transaksi; tercatat di audit log. | Must Have   |

### Modul E. Shift, Kas Awal, dan Tutup Kas

| ID    | User Story                                                                                                 | Acceptance Criteria                                                                                             | Priority    |
| ----- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-17 | Sebagai kasir, saya ingin membuka shift dengan saldo awal, sehingga kas harian bisa dilacak.               | Shift tidak bisa dipakai jika belum dibuka; saldo awal tersimpan; waktu buka shift tercatat.                    | Must Have   |
| FR-18 | Sebagai kasir, saya ingin menutup shift dengan rekap kas, sehingga selisih dapat diketahui.                | Sistem menghitung total transaksi, cash in, cash out, dan selisih; tutup shift menghasilkan ringkasan final.    | Must Have   |
| FR-19 | Sebagai owner, saya ingin mencatat selisih kas dan alasannya, sehingga investigasi bisa dilakukan cepat. | Selisih wajib memiliki nominal dan alasan; data tersimpan di audit log; hanya role berwenang yang bisa menutup. | Should Have |

### Modul F. Inventory dan Waste Tracking

| ID    | User Story                                                                                                      | Acceptance Criteria                                                                                                        | Priority     |
| ----- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------ |
| FR-20 | Sebagai owner, saya ingin stok berkurang otomatis saat transaksi berhasil, sehingga jumlah stok lebih akurat. | Stok berkurang saat transaksi paid; bila stok tidak cukup, sistem memberi peringatan; tidak boleh minus tanpa izin khusus. | Should Have  |
| FR-21 | Sebagai owner, saya ingin melakukan penyesuaian stok manual, sehingga selisih fisik bisa diperbaiki.            | Alasan wajib diisi; sebelum-sesudah stok tersimpan; perubahan muncul di histori stok.                                      | Should Have  |
| FR-22 | Sebagai owner, saya ingin mencatat waste atau item rusak, sehingga laporan bahan terbuang terlihat.           | Kategori waste tersedia; nominal / jumlah tersimpan; tidak bercampur dengan transaksi penjualan.                           | Nice to Have |

### Modul G. Dashboard dan Laporan Manajemen

| ID    | User Story                                                                                                            | Acceptance Criteria                                                                                              | Priority    |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-23 | Sebagai owner, saya ingin melihat ringkasan penjualan harian, sehingga saya tahu kondisi bisnis hari ini.             | Dashboard menampilkan total order, omzet, transaksi paid, refund, dan gross margin sederhana jika data tersedia. | Must Have   |
| FR-24 | Sebagai owner, saya ingin melihat menu terlaris dan jam ramai, sehingga saya bisa mengatur stok dan shift.            | Tersedia top product, tren jam, dan metode pembayaran dominan; filter tanggal berfungsi.                         | Must Have   |
| FR-25 | Sebagai owner, saya ingin memfilter laporan berdasarkan shift, tanggal, dan outlet, sehingga analisis lebih akurat. | Filter bekerja konsisten; hasil sesuai range; data kosong tampil sebagai empty state.                            | Must Have   |
| FR-26 | Sebagai owner, saya ingin mengekspor ringkasan laporan, sehingga data bisa dibahas di luar sistem.                    | Ekspor CSV atau XLSX untuk laporan dasar tersedia; data yang diekspor sesuai filter aktif.                       | Should Have |

### Modul H. User Management dan Audit Log

| ID    | User Story                                                                                               | Acceptance Criteria                                                                                               | Priority  |
| ----- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| FR-27 | Sebagai owner, saya ingin membuat akun user baru, sehingga akses sistem bisa dikelola per orang.         | Setiap user punya username unik; role wajib dipilih; password awal mengikuti kebijakan keamanan.                  | Must Have |
| FR-28 | Sebagai owner, saya ingin mengubah role user, sehingga akses bisa disesuaikan dengan perubahan tugas.    | Perubahan role langsung berlaku; perubahan dicatat; role yang lebih tinggi hanya bisa diubah oleh role berwenang. | Must Have |
| FR-29 | Sebagai owner, saya ingin melihat audit log, sehingga saya tahu siapa mengubah apa dan kapan. | Log menampilkan user, waktu, aksi, objek yang diubah, dan nilai sebelum-sesudah bila relevan.                     | Must Have |
| FR-30 | Sebagai sistem, saya ingin menyimpan jejak aksi kritikal, sehingga investigasi insiden lebih mudah.      | Aksi login, logout, void, refund, ubah harga, ubah stok, dan ubah role wajib tercatat.                            | Must Have |

---

## 4. User Flows & Core Epics

### Flow 1. Operasional Harian Outlet

Login → pilih outlet/shift aktif → buka shift → cek menu dan stok → terima pesanan → input item ke keranjang → pilih metode bayar → simpan transaksi → struk tampil → lanjut transaksi berikutnya → tutup shift → lihat selisih kas

### Flow 2. Perubahan Menu dan Harga

Login sebagai owner → buka master menu → tambah atau ubah produk → atur harga → simpan → perubahan masuk audit log → menu baru tersedia di POS

### Flow 3. Rekap Manajemen Harian

Owner login → buka dashboard → pilih tanggal dan outlet → lihat omzet, order count, top product, jam ramai, refund rate → ekspor laporan → simpan untuk analisis bisnis

### Flow 4. Koreksi Transaksi

Kasir atau owner buka daftar transaksi → cari transaksi tertentu → validasi otorisasi → pilih void atau refund → isi alasan → sistem menyimpan perubahan → audit log terisi → laporan ikut terbarui

### Flow 5. Kontrol Stok

Transaksi paid tersimpan → stok terpotong otomatis → owner cek stok rendah → lakukan penyesuaian manual bila ada selisih fisik → alasan dicatat → histori stok terupdate

---

## 5. Data & Security Requirements

### Data Governance

| Klasifikasi    | Contoh Data                                                          | Aturan Akses                                           |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| Publik         | Nama brand, daftar menu promosi yang memang ingin dipublikasikan     | Boleh tampil di kanal publik bila nanti ada web menu   |
| Internal       | Transaksi penjualan, stok, shift, laporan harian, histori void       | Hanya user berhak melalui aplikasi                     |
| Rahasia        | Data user internal, role, nominal selisih kas, audit log detail      | Akses terbatas, wajib login                            |
| Sangat Rahasia | Password hash, token, API key, kredensial integrasi, backup database | Wajib enkripsi dan hanya untuk sistem / owner tertentu |

### Security Controls

- Password disimpan sebagai hash, bukan plain text.
- Session/token punya masa berlaku dan dapat dicabut.
- Semua aksi kritikal harus tercatat di audit log.
- Access control diterapkan di frontend dan backend.
- Tidak boleh ada indexing mesin pencari untuk area internal.
- Backup data wajib terenkripsi.
- Akses owner sebaiknya memakai izin lebih ketat daripada kasir.
- Bila data pribadi pelanggan disimpan, terapkan prinsip minimisasi data dan keamanan pemrosesan data pribadi.

### Compliance

- **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi** untuk setiap pemrosesan data pribadi karyawan, owner, atau pelanggan bila sistem menyimpannya. UU ini mengatur perlindungan data pribadi, kewajiban pengendali data, dan sanksi terkait pelanggaran.
- **PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik** untuk memastikan sistem elektronik dikelola dengan aspek keamanan, keandalan, dan operasi yang layak.
- Retensi log transaksi, stok, dan audit mengikuti kebijakan internal bisnis serta kebutuhan pembukuan atau perpajakan yang berlaku.
- Jika integrasi pembayaran pihak ketiga dipakai, penyimpanan data pembayaran mengikuti ketentuan penyedia payment gateway dan tidak menyimpan data kartu secara langsung.

---

## 6. Non-Functional Requirements (NFR)

| Kategori        | Parameter                  | Target MVP                                   | Catatan                                |
| --------------- | -------------------------- | -------------------------------------------- | -------------------------------------- |
| Availability    | Uptime layanan inti        | 99.5%                                        | Fokus pada jam operasional outlet      |
| Availability    | Recovery setelah gangguan  | < 4 jam                                      | Untuk layanan backend utama            |
| Performance     | Load halaman POS           | < 2 detik                                    | Pada perangkat operasional standar     |
| Performance     | Simpan transaksi           | < 2 detik p95                                | Jaringan stabil                        |
| Performance     | Dashboard ringkas          | < 3 detik p95                                | Filter tanggal kecil-menengah          |
| Security        | Enkripsi transport         | TLS aktif                                    | Semua komunikasi terenkripsi           |
| Security        | Token session              | Access token singkat, refresh token dibatasi | Wajib bisa dicabut                     |
| Security        | Akses internal             | Tidak boleh terindeks mesin pencari          | Area owner wajib private               |
| Security        | Auditability               | 100% aksi kritikal tercatat                  | Login, refund, void, harga, stok, role |
| Privacy         | Data minimization          | Hanya data yang diperlukan                   | Hindari PII berlebihan                 |
| Scalability     | Kapasitas awal             | 1 outlet, 5-20 user                          | Cocok untuk validasi awal              |
| Scalability     | Target pertumbuhan         | Siap dikembangkan ke multi-outlet            | Tanpa redesign total arsitektur        |
| Reliability     | Konsistensi data transaksi | Tinggi                                       | Transaksi tidak boleh duplikat         |
| Maintainability | Struktur modul             | Modular dan terpisah                         | Mudah ditambah fitur baru              |

---

## 7. Release Plan & Phasing (MVP Alignment)

### Fase 1 (MVP / Demo Scope)

Fitur yang wajib jadi untuk rilis terdekat:

- Login dan role-based access
- Master menu, kategori, dan harga
- POS order, keranjang, dan pembayaran manual
- Struk transaksi
- Buka dan tutup shift
- Dashboard penjualan harian dasar
- Audit log untuk aksi kritikal
- Penyesuaian stok sederhana

### Fase 2 (Post-Demo Scope)

Fitur yang ditunda setelah validasi awal:

- Integrasi payment gateway atau QRIS otomatis
- Split bill dan split payment
- Loyalty / membership customer
- Notifikasi email atau WhatsApp
- Export dokumen kompleks dan template custom
- Multi-outlet support penuh
- Offline mode dan sync conflict handling
- Forecast stok dan rekomendasi pembelian
- Integrasi akuntansi atau pembukuan pihak ketiga
- Report lanjutan untuk margin, waste, dan jam kerja staf

### Prioritas Eksekusi Teknis

1. Stabilkan transaksi, payment, dan shift control.
2. Pastikan dashboard ringkas akurat.
3. Kunci keamanan akses dan audit log.
4. Setelah data transaksi valid, lanjutkan ke stok, integrasi, dan otomasi.
