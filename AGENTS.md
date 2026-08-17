# Aturan Desain Antarmuka (UI/UX) Kreativa AI

Aplikasi ini bertema **gelap**, satu-satunya tema.

> **Sebelum menyentuh apa pun yang berhubungan dengan warna, baca
> [DESIGN.md](DESIGN.md).** Di sana ada sistemnya: apa yang mengatur warna,
> kelas mana yang aman, pola apa yang harus dihindari, dan cara mengaudit satu
> panel di browser.

Ringkasnya, satu aturan yang perlu diingat saat menambah panel atau fitur:

> **Tulis markup Tailwind konvensi TERANG** (`text-gray-800` untuk judul,
> `bg-white` untuk kartu, `border-gray-300` untuk garis). Paletnya yang
> membalik. **Tidak ada daftar selector yang perlu disentuh.**

## 1. Tipografi
- **Font antarmuka:** `Archivo`, `ui-sans-serif`, `system-ui`, `sans-serif`
- `Poppins` bukan font antarmuka — ia salah satu pilihan yang ditawarkan ke user
  di alat Bikin Carousel dan nilainya dikirim ke generator. Jangan dicabut.

## 2. Kanvas & permukaan
- **Kanvas dasar** (`html`, `body`, `.app-container`, `#main-tab-content`):
  `#0B0E17`, teks default putih.
- **Sidebar**: `#0E121E`, border kanan `rgba(255,255,255,.08)`.
- **Kartu kaca** (kartu konten, modal, kop): `rgba(22,27,40, .45–.95)`,
  `backdrop-filter: blur(12–24px)`, `border: 1px solid rgba(255,255,255,.08–.16)`.
- **Permukaan tipis** (panel sekunder, kotak input): `rgba(255,255,255,.04–.1)`.
- **Border-radius**: kartu/modal ≈ `1–1.25rem`, tombol/pill ≈ `0.65–0.9rem`,
  badge ≈ `9999px`.

## 3. Warna & aksen
- **Gradien brand** (shell: login, sidebar aktif, badge NEW, pendar beranda):
  `#FF456A → #8A2BE2`.
- **Gradien CTA** (tombol generate/download di panel konten): `#FF3366 →
  #B829E6 → #6366F1`, animasi `background-position` saat hover. Terpasang
  otomatis lewat ID berakhiran `-generate-btn` / `-generate-button` /
  `-download-all-btn`, atau kelas `.btn-primary`.
- **Teks**: judul `#FFFFFF`; isi `#E2E8F0`/`#F1F5F9`; sekunder `#A3B0C0`;
  tersier `#8695A8`.
- **Aksen per kategori** — `--map`, diwarisi dari `[data-map="1..9"]` yang
  dipasang otomatis oleh pendaftar berkas. Nilainya di DESIGN.md §3.

## 4. Animasi & transisi
- Hover kartu/tombol: `translateY(-1px..-4px)` + shadow ber-glow warna aksen
  (mis. `0 8px 25px rgba(255,69,106,.4)`), bukan shadow gelap generik.
- Easing: `cubic-bezier(.16,1,.3,1)` (sidebar, kategori) dan
  `cubic-bezier(.34,1.56,.64,1)` (tombol pilihan, sedikit memantul).

## 5. Menambah panel baru — yang perlu dilakukan

1. Tulis markup Tailwind **konvensi terang** seperti panel lain.
2. Pakai kembali kosakata kelas di [DESIGN.md §4](DESIGN.md) (`.card`,
   `.btn-secondary`, `.file-upload-area`, `.category-card`, `.loader`, dst.) —
   semuanya sudah bergaya.
3. Beri tombol generate ID berakhiran `-generate-btn`.
4. Daftarkan tombol alatnya di laci `<details>` sidebar. Itu saja: pendaftar
   berkas akan memasang `data-map` + header `.kop`, dan
   `<style id="tema-panel">` menjangkaunya otomatis.
5. Audit dengan skrip di [DESIGN.md §6](DESIGN.md) — harus mengembalikan array
   kosong.

**Tidak perlu** menambahkan ID panel ke daftar selector mana pun. Kalau Anda
merasa perlu, baca DESIGN.md §5 dulu — kemungkinan besar yang salah ada di
salah satu dari tiga lapisan tema, bukan di panelnya.

## 6. Catatan operasional
- `bundle-module.js` dimuat dari jsDelivr dengan SHA yang dipin di dekat akhir
  `kreativa-ai-v2-injected.html`. **Mengedit file lokalnya tidak berefek** ke
  halaman sampai bundle di-push dan SHA-nya dinaikkan (`git rev-parse master`).
  Markup yang disuntik bundle memakai konvensi terang yang sama, jadi ia ikut
  ditema-ulang palet tanpa perlu disentuh.
- Verifikasi di browser sungguhan: `python3 -m http.server 8971`, lalu
  `http://127.0.0.1:8971/kreativa-ai-v2-injected.html?v=N`. Akses `file://`
  diblokir sandbox browser, dan `?v=N` wajib karena file ini di-cache agresif.
