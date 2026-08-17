# Aturan Desain Antarmuka (UI/UX) Kreativa AI

Panduan ini diturunkan langsung dari CSS yang benar-benar dirender di halaman
Login, Beranda, dan Sidebar (bukan dari draf yang belum dipakai). Versi
sebelumnya dari dokumen ini mendeskripsikan tema kertas terang ("meja",
"kertas", "tinta") yang **tidak lagi dipakai** — itu draf redesain yang
ditinggalkan sebelum sempat menyentuh body/canvas utama. Tema yang benar-benar
tayang adalah tema gelap di bawah ini. Jangan gunakan variabel `--meja`,
`--kertas`, `--tinta`, dll. sebagai acuan visual; variabel itu masih ada di
`:root` tapi sudah vestigial (di-override oleh blok gelap dengan `!important`).

## 1. Tipografi
- **Font Utama:** `Archivo`, `ui-sans-serif`, `system-ui`, `-apple-system`, `sans-serif`

## 2. Kanvas & Permukaan (Tema Gelap "Cyber & Glassmorphism")
- **Kanvas dasar** (`html`, `body`, `.app-container`, `.main-content-wrapper`, `#main-tab-content`): `#0B0E17`, teks default putih.
- **Sidebar**: `#0E121E`, border kanan `rgba(255,255,255,.08)`.
- **Kartu kaca** (menu kategori sidebar, kartu konten, modal): `background: rgba(22,27,40, 0.45–0.85)` (semakin solid untuk modal), `backdrop-filter: blur(12–24px)`, `border: 1px solid rgba(255,255,255,.08–.16)`.
- **Panel/kartu yang lebih tipis** (sekunder, kotak input): `background: rgba(255,255,255,.04–.1)`, border serupa.
- **Border-radius**: kartu/modal besar ≈ `1–1.25rem`, tombol/pill ≈ `0.65–0.9rem`, badge ≈ `9999px` (pill penuh). Ini **bukan** sistem tajam 2px dari draf lama.

## 3. Warna & Aksen
Tidak ada palet "map arsip" akromatik. Aksen hidup dan dipakai luas:

- **Gradien utama (brand/shell)**: `#FF456A → #8A2BE2` — dipakai di tombol "Masuk" Login, state aktif Sidebar, badge "NEW", icon-badge header, radial glow Beranda.
- **Gradien CTA/primary-action** (khusus tombol generate/download di panel konten): `#FF3366 → #B829E6 → #6366F1` (3-stop, animasi `background-position` saat hover). Dipasang otomatis lewat selector `[id$="-generate-btn"]`, `[id$="-download-all-btn"]`, atau ID eksplisit — lihat §5.
- **Teks**: judul `#FFFFFF`; teks sekunder/muted `#94A3B8`; teks tersier `#64748B`; teks isi/readable di atas kartu gelap `#E2E8F0` atau `#F1F5F9`.
- **Border tipis**: `rgba(255,255,255,.05–.2)` — makin terang saat hover/aktif.
- **Aksen per kategori sidebar** (`[data-map="1"]`..`[data-map="9"]`, dipakai untuk ikon kategori di sidebar): 1 merah-pink `#FF456A`, 2 biru `#38BDF8`, 3 pink-magenta `#F472B6`, 4 oranye `#FB923C`, 5 hijau `#34D399`, 6 ungu `#A78BFA`, 7 teal `#2DD4BF`, 8/9 rose `#FB7185`.

## 4. Animasi & Transisi
- Hover kartu/tombol: `translateY(-1px..-4px)` + shadow ber-glow warna aksen (mis. `0 8px 25px rgba(255,69,106,.4)`), bukan shadow gelap generik.
- Easing umum: `cubic-bezier(.16,1,.3,1)` (masuk/keluar sidebar, kategori) dan `cubic-bezier(.34,1.56,.64,1)` (tombol pilihan, efek sedikit memantul).
- Gradien 3-stop pada tombol CTA bergerak (`background-position` 0%→100%) saat hover — beri kesan hidup, bukan flat.

## 5. Pola Retrofit Panel Konten — PENTING sebelum menambah/mengedit panel
Banyak panel `#content-*` (mis. `#content-affiliate`, `#content-affiliate-harga`,
`#content-affiliate-islami`, `#content-konten-affiliator`) masih ditulis dengan
markup Tailwind terang lama (`bg-white`, `text-gray-900`, `bg-gray-50`,
`bg-orange-600`, dst). Markup itu **otomatis** ditema-ulang gelap lewat blok
CSS bertanda `!important` yang di-scope per `#content-<id>` (cari komentar
"Permukaan kartu: kaca gelap", "Tombol utama: gradien khas login", dst. di
`kreativa-ai-v2-injected.html`). Pola yang dikenali generator ini:

- `[class*="bg-white"][class*="rounded"]` → jadi kartu kaca gelap otomatis.
- `[class*="bg-gray-50"]` / `[class*="bg-gray-100"]` → jadi kotak redup di dalam kartu.
- `:is(.text-gray-400..600, .text-slate-400..600)` → teks muted `#94A3B8`.
- `:is(.text-gray-700..900, .text-slate-700..900)` → teks isi `#E2E8F0`.
- `:is(input, textarea, select)` → field kaca gelap otomatis, fokus jadi glow `#FF456A`.
- ID yang berakhiran `-generate-btn` / `-download-all-btn`, atau ID eksplisit yang didaftarkan di blok itu → tombol gradien primer.
- Kelas `.category-card`, `.style-card`, `.ratio-select-btn`, `.library-tab`, `.loader`, `.toast`, `.modal-content`, `.file-upload-area` → semua sudah ada styling kaca gelap + state `.selected` bergradien.

**Saat menambah panel/tombol baru:** pakai kembali kosakata di atas (biar
otomatis ke-retrofit gratis) daripada menulis warna gelap manual dari nol.
Kalau memang perlu gaya khusus, tulis rule bar dengan `!important` di-scope
`#content-<id-panel>` agar konsisten menang di atas sisa styling lama.

**Jebakan yang harus dihindari:** ada rule lama global
`button[class*="text-white"], a[class*="text-white"] { background-color:
var(--map) !important; border-radius: var(--r) !important; ... }` (masih ada
di stylesheet). Ia mencocokkan substring, jadi kelas seperti
`hover:text-white` pun kena. Kalau tombol/link itu tidak dijangkau ID/kelas
override dark-theme yang lebih spesifik, ia akan diratakan jadi kotak biru
`var(--map)` bersudut 2px. Hindari literal `text-white` pada `<button>`/`<a>`
yang tidak masuk daftar override — pakai `text-slate-50` sebagai gantinya.

## 6. Perubahan pada halaman ini (Konten Affiliator)
- Header, 3 kartu kolom, form, dan kedua modal sudah disamakan ke kosakata
  retrofit di atas (`bg-white/…` + `rounded-*` untuk kartu kaca, `text-white`/
  `text-slate-200/400/500` untuk hierarki teks, ID asli `ka-generate-btn` dkk.
  dibiarkan apa adanya supaya tetap kena gradien primer otomatis).
- Blok CSS khusus `#content-konten-affiliator` (state hover/selected
  `.category-card`/`.style-card`/`.ratio-select-btn`/`.library-tab`, loader,
  file-upload) diselaraskan ke aksen `#FF456A` — sebelumnya memakai warna cyan
  (`rgba(0,186,226,…)`) dan hijau (`rgba(10,228,72,…)`) yang di luar palet aksen
  manapun di app ini.
