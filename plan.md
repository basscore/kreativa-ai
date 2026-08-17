# Plan: Pangkas kreativa-ai-v2-injected.html

**Tujuan:** file 3,8 MB / 49.490 baris ini kewalahan dibuka/diedit agent karena
~38%-nya (≈1,47 MB) adalah kode JS mati/duplikat. Pangkas itu tanpa mengubah
satu pun markup — file harus tetap bisa ditempel utuh ke Gemini Canvas (itu
satu-satunya cara user generate tanpa API key sendiri), jadi HTML tetap satu
file, cuma JS-nya yang dipindah/dihapus.

Baca seluruh bagian **Konteks** sebelum ambil task manapun — semua nomor baris
di bawah dicek langsung dari file per 2026-08-17, tapi bisa bergeser kalau ada
task lain yang sudah mendarat duluan. Selalu `grep -n` ulang penanda yang
disebut (nama komentar, `data-tab="..."`, nama fungsi) sebelum edit, jangan
percaya buta ke nomor baris.

## Konteks (wajib dibaca, agent lain tidak akan mengulang investigasi ini)

- **106 tool total** = jumlah unik atribut `data-tab="..."` di sidebar.
- **Dua bundle JS sudah eksternal**, dimuat via jsDelivr yang di-pin ke commit
  SHA GitHub (`basscore/kreativa-ai@adc446295...`), BUKAN `@master` (jsDelivr
  cache `@master` bisa basi berjam-jam — lihat komentar di baris ~48992):
  - `bundle-module.js` (2,5 MB / 47.729 baris, tidak diminify, `type="module"`)
  - `bundle-classic.js` (565 KB, gerbang iklan — sistem iklan **sudah dimatikan
    permanen**, commit `adc4462`)
  - **Setiap kali salah satu file ini diubah**: commit → push → ganti SHA di
    KEDUA tag `<script src="...@SHA...">` di HTML (baris ~48934 dan ~48999) →
    jalankan `./cek-bundle.sh` untuk pastikan CDN = repo dan lolos parse.
- **Blok besar yang jadi target utama**, dalam kreativa-ai-v2-injected.html:
  - **Baris 35877**: script obfuscated satu-baris (~23 KB) = **login/session**
    (`handleLogin`, `startSessionVerification`, dst). Tidak berhubungan dengan
    duplikasi tool. **Jangan disentuh.**
  - **Baris 35909–47876** (~12.000 baris, ~1,47 MB, ~38% dari seluruh file):
    "LOGIKA APLIKASI — versi terbaca (sebelumnya terobfuskasi)" — nama variabel
    masih `_0x...` tapi string prompt AI sudah plain text. Berisi:
    - Implementasi lama dari **44 tool** yang SUDAH punya
      versi identik-fungsi di `bundle-module.js` (daftar resminya ada di
      `KAI_DUP_PANELS`, baris 48947–48962 — 44 id `content-*`).
    - Implementasi **SATU-SATUNYA** (tidak ada di bundle-module.js) untuk 2
      tool: `face-swap` (sekitar baris 44279–44370) dan `profesi-anak`
      (mulai baris ~38713, lacak ke depan untuk cari batas fungsinya).
  - **Baris 47906–48930** (~1024 baris): modul `<!-- KONTEN AFFILIATOR LOGIC -->`,
    berbasis Firebase, **satu-satunya** implementasi tool `konten-affiliator`.
    Sudah ada salinannya di `temp_script.js` (root repo) — pakai itu sebagai
    titik awal baca, jangan baca ulang dari HTML.
  - **Hack dedup** yang menjaga 44 tool di atas supaya tidak generate 2x
    (klik Generate = 1x panggilan API): perekam listener di baris 35889–35901
    (tepat sebelum blok 35909) dan pelepas listener di baris 48935–48991
    (tepat sebelum bundle-module.js dimuat). Keduanya jadi kode mati begitu
    44 tool itu benar-benar dihapus dari HTML — hapus juga di Fase 3.
  - Tool `feedbranding` dipegang `bundle-classic.js` (sistem iklan) — karena
    iklan sudah dimatikan permanen, tool ini kemungkinan sudah tidak
    fungsional. Di luar scope pemangkasan ini, cuma dicatat di sini.
  - Sisanya: **106 − 44 − 2 − 1(konten-affiliator) − 1(feedbranding) = 58
    tool** tidak disebut sama sekali oleh dedup lama → asumsi sementara:
    sudah native di bundle-module.js sejak awal, atau cuma `<iframe>`
    (contoh: `veo` → veogenerator-rho.vercel.app, `opal` → opal.google, tidak
    butuh JS apa pun). **Belum diverifikasi satu-satu — itu Fase 0.**
- `graphify-out/` sudah berisi knowledge graph repo ini. Pakai
  `graphify query "..."` atau `graphify explain "<node>"` dulu sebelum grep
  manual — banyak yang sudah kepetakan (mis. node
  `KAI_DUP_PANELS List (44 Panel IDs)`, `Readable App-Logic Module`).

## Aturan main untuk kerja paralel

1. **Satu agent = satu git worktree/branch.** Jangan dua agent edit
   `kreativa-ai-v2-injected.html` di branch yang sama secara bersamaan — file
   ini satu blob raksasa, konflik merge nyaris pasti kalau tumpang tindih.
2. **Fase berurutan secara data, task dalam satu fase paralel bebas:**
   Fase 2 (porting 3 tool) **harus selesai + terverifikasi** sebelum Fase 3
   (hapus blok 35909–47876) dijalankan — kalau tidak, `face-swap`,
   `profesi-anak`, `konten-affiliator` akan mati total.
3. Setiap task **wajib** ditutup dengan tes manual di browser (pakai skill
   `run` kalau tersedia): buka tab tool yang disentuh, upload contoh gambar
   kalau relevan, klik Generate, pastikan cuma **1x** panggilan API (cek tab
   Network) dan hasil tampil.
4. Setelah task apa pun mengubah `bundle-module.js`/`bundle-classic.js`:
   update SHA di HTML (2 tempat) + jalankan `cek-bundle.sh`.
5. Jangan sentuh baris 35877 (login) atau blok paling akhir file
   (`kreativa-login-fx`, `kreativa-sidebar-controller`, baris ≥49326) — di
   luar scope masalah duplikasi ini.

---

## Fase 0 — Audit ground-truth (1 agent, sekuensial, ~30–60 menit)

Prasyarat untuk Fase 2/3 — jangan dilewati meski task lain tampak bisa jalan
tanpanya, karena Fase 3 butuh kepastian sebelum menghapus.

- **Task 0.1**: Untuk 44 id di `KAI_DUP_PANELS`, verifikasi satu-satu bahwa
  `bundle-module.js` benar-benar punya alur lengkap (bukan cuma nama id yang
  kebetulan cocok) klik-tombol → panggil API → render hasil. Tulis hasilnya
  ke `audit.md`: tabel `tab-id | fungsi di bundle-module.js | baris`. Tandai
  kalau ada yang ternyata TIDAK benar-benar tercover.
- **Task 0.2**: Klasifikasikan 58 tool yang tidak disebut dedup lama, salah
  satu dari: (a) native di bundle-module.js sejak awal, (b) cuma `<iframe>`/
  link eksternal, (c) panel statis tanpa JS, (d) belum jelas → tandai untuk
  dicek manual. Heuristik cepat: `grep` id panel/form-nya di
  `bundle-module.js`; kalau ada `<iframe` di panelnya → (b).

## Fase 1 — Beres-beres murah (paralel, tidak bergantung Fase 0)

- **Task 1.1**: `add_events.txt`, `extracted_vars.txt` di root repo adalah
  sisa analisis sesi sebelumnya — cek dulu apakah masih dipakai referensi
  oleh task lain sebelum hapus. `temp_script.js`: bandingkan dengan blok
  47906–48930 di HTML — kalau identik, itu memang cuma salinan kerja (aman
  dipakai sebagai bahan baca di Task 2.C); kalau berbeda, berarti
  `temp_script.js` versi lebih baru → rekonsiliasi dulu, jangan main hapus.
- **Task 1.2**: `git status` menunjukkan `kreativa-ai-v2.html` dan
  `kreativa-ai-v2.BACKUP-obfuscated.html` sudah dihapus di working tree tapi
  belum di-commit. Konfirmasi ke user, lalu commit, supaya working tree
  bersih sebelum branch Fase 2/3 dibuat dari sini.

## Fase 2 — Porting 3 tool yatim ke bundle-module.js (paralel per task, MENGUNCI Fase 3)

Masing-masing task di branch sendiri, dan **wajib selesai + teruji** sebelum
siapa pun mulai Fase 3.

- **Task 2.A — `face-swap`**: sumber di HTML baris ~44279–44370 (nama
  variabel `_0x...`, telusuri manual, tidak perlu tool deobfuscator formal).
  Tulis ulang jadi fungsi baru di `bundle-module.js`, ikuti pola tool sejenis
  yang sudah ada di sana (contoh: `generateSinglePhoto()` baris 18802 atau
  `handleRegenerateImage()` baris 5300 — pola upload gambar → generate).
  Pasang wiring dengan cara yang sama seperti 44 tool lain (DOMContentLoaded,
  target panel `content-face-swap`).
- **Task 2.B — `profesi-anak`**: sumber mulai baris ~38713, telusuri ke depan
  untuk menemukan batas fungsinya. Pola porting sama seperti 2.A.
- **Task 2.C — `konten-affiliator`**: sumber = `temp_script.js` (root repo,
  1024 baris, sudah identik dengan blok 47906–48930 di HTML — mulai dari
  sini, bukan dari HTML). Berbasis Firebase — `bundle-module.js` **sudah**
  punya import + pola Firebase untuk tab `family` (lihat baris 1–5 dan
  fungsi-fungsi `family-*` mulai baris 4633) — pakai instance Firebase app
  yang sama, jangan inisialisasi Firebase app kedua.

Tiap task ditutup: push `bundle-module.js` → update SHA di HTML (2 tempat) →
`cek-bundle.sh` → tes manual di browser.

## Fase 3 — SELESAI (branch `fase-3-hapus-legacy`, 2026-08-17)

Hasil nyata: 49.495 → 36.664 baris, 3,8 MB → 2,3 MB. Semua 101 panel diuji
otomatis (Playwright, klik tiap `.main-tab-btn`): tampil semua, nol
`pageerror`. Dua yatim tambahan temuan `audit.md` (`pose-fashion`,
`beranda-search`) diselamatkan dulu sebelum penghapusan — `pose-fashion`
cukup diselaraskan id markup-nya ke skema bundle, pencarian + klik kartu
beranda diport ke `bundle-module.js`. Sisa yang sengaja dibiarkan: markup
mati (modal `poses-*` di `content-pov-tangan`, id lama `umrah-*`/`tryon-*`)
— sudah mati sejak dedup, pembersihannya di luar scope plan ini.

<details><summary>Rencana asli</summary>

- **Task 3.1**: Hapus baris 35909–47876 (seluruh blok "LOGIKA APLIKASI versi
  terbaca") — di titik ini semua yang berharga di dalamnya sudah dipindah
  keluar di Fase 2. Cek ulang ke `audit.md` (hasil Task 0.1) bahwa 44 tool +
  2 tool hasil porting benar-benar sudah punya rumah lain sebelum menghapus.
- **Task 3.2**: Hapus hack dedup: perekam (baris 35889–35901 + komentar
  sebelumnya) dan pelepas (baris 48935–48991, termasuk array
  `KAI_DUP_PANELS` + komentarnya) — keduanya jadi kode mati setelah 3.1.
- **Task 3.3**: Hapus blok `<!-- KONTEN AFFILIATOR LOGIC -->` (baris
  47906–48930) — sudah dipindah di Task 2.C.
- **Task 3.4**: Regresi penuh — klik semua 106 tab satu-satu, pastikan yang
  seharusnya berfungsi masih berfungsi (silang-cek ke hasil klasifikasi
  Task 0.2).

</details>

**Hasil yang diharapkan:** file turun dari ~3,8 MB/49.490 baris ke kira-kira
~2,3 MB/37.000 baris (buang ~1,5 MB kode mati/duplikat), tetap satu file utuh
yang bisa ditempel ke Gemini Canvas dan berperilaku identik.

## Eksplisit di luar scope plan ini

- Memecah `bundle-module.js` (47k baris) jadi beberapa file — baru
  dipertimbangkan kalau hasil Fase 3 masih terlalu besar untuk diedit
  nyaman.
- Script login obfuscated di baris 35877 — concern terpisah, tidak
  terduplikasi, jangan diutak-atik di plan ini.
- Tab `feedbranding`/`bundle-classic.js` — sistem iklan sudah mati permanen,
  butuh keputusan terpisah (hapus tab-nya atau biarkan dorman), bukan bagian
  dari pemangkasan ukuran file ini.
