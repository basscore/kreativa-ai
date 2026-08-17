# audit.md — Hasil Fase 0 (ground-truth) per 2026-08-17

Sumber kebenaran: `kreativa-ai-v2-injected.html` (49.491 baris) dan
`bundle-module.js` (47.729 baris) di working tree, bukan versi CDN.
Semua angka di bawah dihasilkan ulang dari file, bukan dari catatan lama.

## Ringkasan angka

| | |
|---|---|
| `data-tab="..."` unik | 106 |
| dikurangi sub-tab Brand Kit (`colors`, `logos`, `typography`, `visual`, `voice` — `class="brandkit-tab-btn"`, bukan alat) | −5 |
| **panel alat sesungguhnya** (`.main-content-panel`) | **101** |

101 panel terbagi habis:

| Kategori | Jml | Nasib di Fase 3 |
|---|---|---|
| A. 44 panel `KAI_DUP_PANELS` — sudah utuh di bundle-module.js | 44 | aman dihapus |
| B. Native bundle-module.js, tidak disentuh blok legacy sama sekali | 43 | aman |
| C. `<iframe>` eksternal (`veo`, `remove-bg`) | 2 | aman |
| D. Link eksternal, tanpa JS (`opal` → opal.google) | 1 | aman |
| E. `bundle-classic.js` / iklan mati (`feedbranding`) | 1 | di luar scope |
| F. Yatim — hanya blok `KONTEN AFFILIATOR LOGIC` | 1 | **butuh port (Task 2.C)** |
| G. **DOBEL tapi tidak terdaftar di dedup** | 5 | aman, malah memperbaiki bug |
| H. **Yatim — hanya blok legacy inline** | 4 | **mati kalau tidak diport** |

---

## KOREKSI PENTING terhadap plan.md

Empat hal di `plan.md` tidak cocok dengan file. Perbaiki dulu sebelum Fase 2/3.

### 1. Batas blok legacy salah: 35909–**47626**, bukan 47876

`grep -n '</script>'` pada rentang itu:

```
35901  </script>        <- akhir perekam dedup
35909  <script type="module">   <- awal blok "LOGIKA APLIKASI versi terbaca"
47626  </script>        <- AKHIR blok legacy
47877  <script>         <- helper mobile bottom nav (toggleMobileSidebar dll.)
47903  </script>
47906  <script type="module">   <- KONTEN AFFILIATOR LOGIC
```

Baris 47627–47903 adalah `<nav class="mobile-bottom-nav">` beserta
script helper-nya. **Menghapus 35909–47876 akan membuang navigasi bawah
mobile.** Task 3.1 harus memakai 35909–47626.

### 2. Bukan 2 tool yatim, tapi 4 (+1 fitur)

`pose-fashion` dan kotak pencarian `beranda` ikut yatim:

| tab | id panel dikenali bundle-module.js | keterangan |
|---|---|---|
| `face-swap` | **0 / 17** | tidak ada jejak `faceswap`/`face swap` di bundle sama sekali → port penuh |
| `profesi-anak` | 1 / 15 | bundle **punya** logikanya (`// ==== FOTO PROFESI ANAK ====`, baris 6861) tapi menargetkan id yang tidak ada di HTML |
| `pose-fashion` | 1 / 13 | bundle **punya** logikanya (`// ==== POSE FASHION ====`, baris 4303), id juga tidak ada di HTML |
| `beranda` | 0 / 2 | `beranda-search` (+`beranda-no-result`) hanya diwire blok legacy. Pencarian rail sidebar di baris ~49108 (`pasangCari`) adalah fitur berbeda dan tidak menggantikannya |

Konsekuensi bagus untuk Fase 2: **Task 2.B bukan porting JS.** Logika
`profesi-anak` dan `pose-fashion` sudah ada di bundle; yang tidak cocok
hanyalah id markup. Contoh `profesi-anak`:

| dicari bundle (L6865–6885) | ada di HTML? | id yang ada di panel |
|---|---|---|
| `profesi-child-upload` | tidak | `profesi-anak-image-upload` |
| `profesi-age-select` | tidak | `profesi-anak-age` |
| `profesi-theme-input` | tidak | `profesi-anak-theme` |
| `profesi-generate-btn` | tidak | `profesi-anak-generate-btn` |
| `profesi-ratio-options` | **ya** | — |
| `profesi-loading` / `profesi-progress-bar` / `profesi-empty-state` … | tidak | tidak ada padanan |

Jadi 2.B = selaraskan markup panel dengan yang diharapkan bundle
(rename + tambah beberapa elemen state), bukan tulis ulang fungsi.
Pola sama untuk `pose-fashion` (`poses-*` di HTML vs `pose-*` di bundle,
L4307–4316).

### 3. Lima tool DOBEL yang luput dari `KAI_DUP_PANELS` (bug hidup sekarang)

Panel ini punya implementasi di **kedua** tempat tapi tidak ada di daftar
44, jadi listener inline-nya tidak pernah dilepas → **satu klik Generate =
2 panggilan API hari ini.**

| tab | id dikenali bundle | id disentuh legacy | listener click legacy terlacak |
|---|---|---|---|
| `voice-over` | 32/32 | 32 | ya (`vo-generate-btn`) |
| `photo-editor` | 28/29 | 28 | (via helper) |
| `sticker` | 20/23 | 20 | ya (`sticker-generate-button`) |
| `hair-generator` | 16/17 | 16 | ya (`hair-generate-btn`) |
| `story-update` | 15/17 | 14 | (via helper) |

Fase 3 justru **memperbaiki** ini. Kalau butuh perbaikan cepat sebelum
Fase 3 selesai: tambahkan 5 id `content-*` ini ke `KAI_DUP_PANELS`.

### 4. Modal pemilih pose sudah rusak sekarang

Markup modal pose (`poses-poseModal`, `poses-generateBtn`,
`poses-cancelModalBtn`, `poses-poseListContainer`, `poses-selectionCounter`)
tinggal di dalam panel **`content-pov-tangan`**, tapi dipakai tombol
`poses-selectPoseBtn` di panel `pose-fashion`. Karena `content-pov-tangan`
ada di `KAI_DUP_PANELS`, dedup melepas listener modal itu, sedangkan
bundle tidak punya penggantinya (`poses-generateBtn` = 0 kemunculan di
bundle-module.js). Perlu dikonfirmasi di browser, lalu diperbaiki bersama
Task 2 `pose-fashion`.

---

## Task 0.1 — Verifikasi 44 panel `KAI_DUP_PANELS`

**Kesimpulan: 44/44 tercover.** Semua punya alur lengkap di
bundle-module.js: klaster `getElementById` untuk id panel → `addEventListener('click', …)`
→ pemanggilan API (`generateContent` / `callGeminiAPI` / `callImageGenerationAPI` / `fetch`)
→ render ke grid hasil. Tidak ada yang perlu ditandai gagal.

Kolom "baris" = rentang klaster `getElementById` milik panel itu di
`bundle-module.js`; "cov" = id panel yang direferensikan bundle / total id
di panel.

| tab-id | penanda di bundle-module.js | baris | cov |
|---|---|---|---|
| content-affiliate | `--- B-Roll (Foto Produk) Logic ---` | 2061–2096 | 23/24 |
| content-ai-beauty | `// ==== AI BEAUTY EDITOR ====` (29467) | 29472–29497 | 15/15 |
| content-bg-remover | `// ==== BACKGROUND REMOVER ====` (31027) | 31032–31063 | 15/15 |
| content-bikin-carousel | `BIKIN CAROUSEL` | 35280–35707 | 30/30 |
| content-cover-photo-generator | `DOM Elements` | 9982–10015 | 25/25 |
| content-desain-rumah | `DESAIN RUMAH` | 34548–34971 | 37/39 |
| content-deskripsi-produk | `1. GENERATOR DESKRIPSI PRODUK SEO` | 40164–40182 | 9/10 |
| content-expression-changer | `// ==== EXPRESSION CHANGER ====` (27879) | 27884–27908 | 15/15 |
| content-family | `--- FAMILY PHOTO LOGIC ---` | 4633–5128 | 15/15 |
| content-financial-forecast | `5. FINANCIAL FORECAST / SIMULATOR ANGGARAN` | 41369–41385 | 9/10 |
| content-food-selfie | `--- FOOD SELFIE LOGIC ---` | 5354–5406 | 19/20 |
| content-halu | `--- HALU IDOL LOGIC ---` | 1861–1875 | 15/16 |
| content-hr-assistant | `2. HR ASSISTANT` | 40951–40966 | 8/9 |
| content-ide-konten-tiktok | `2. GENERATOR IDE KONTEN TIKTOK` | 40347–40366 | 10/10 |
| content-karikatur | `// ==== KARIKATUR GENERATOR ====` (28197) | 28202–28232 | 19/19 |
| content-konten-marketing | `3. KONTEN MARKETING MULTI-PLATFORM` | 41075–41095 | 11/12 |
| content-logo-generator | `LOGO GENERATOR` | 36059–36086 | 19/19 |
| content-mascot-generator | `MASCOT GENERATOR` | 39773–39799 | 18/19 |
| content-miniature | `--- MINIATURE ME LOGIC ---` | 1667–1677 | 11/13 |
| content-mockup-studio | `=== MOCKUP STUDIO INITIALIZATION ===` (14981) | 14985–15182 | 29/29 |
| content-new-born | `--- NEW BORN STUDIO LOGIC ---` | 6173–6699 | 16/18 |
| content-object-remover | `// ==== OBJECT REMOVER ====` (41916) | 41919–41944 | 22/23 |
| content-passport-photo | `// ==== PAS FOTO WARNA ====` (26656) | 26658–26779 | 24/24 |
| content-photo-angle | `DOM Elements` | 8794–8810 | 15/16 |
| content-photo-booth | `// ==== PHOTO BOOTH ====` (26939) | 26944–26967 | 13/15 |
| content-photo-extender | `// ==== PHOTO EXTENDER ====` (31440) | 31445–31574 | 16/16 |
| content-photo-restoration | `DOM Elements` | 10489–10518 | 20/20 |
| content-poster-generator | `Elements` | 41537–41552 | 14/14 |
| content-pov-tangan | klaster `pov-*` | 13672–13862 | 31/36 |
| content-product-ads | `TAB: PRODUCT ADS GENERATOR` | 25368–25983 | 15/16 |
| content-product-review | `TAB: PRODUCT REVIEW GENERATOR` | 23049–23678 | 14/15 |
| content-professional-headshot | `// ==== PROFESSIONAL HEADSHOT ====` (33564) | 33569–33599 | 18/18 |
| content-rencana-bisnis | `1. RENCANA BISNIS & SWOT` | 40821–40837 | 9/10 |
| content-riset-pasar | `4. RISET PASAR & IDE PRODUK` | 41227–41242 | 8/9 |
| content-script-story-iklan | `3. GENERATOR SCRIPT STORY IKLAN` | 40675–40694 | 10/11 |
| content-sketsa-gambar | `SKETSA GAMBAR` | 35065–35184 | 16/16 |
| content-story-board | `// ==== STORY BOARD ====` (31808) | 31813–31827 | 13/13 |
| content-style-matcher | `DOM Elements` | 9106–9137 | 24/25 |
| content-thumbnail-generator | `DOM Elements` | 9525–9560 | 27/28 |
| content-twibon | `// ==== TWIBON ====` (32858) | 32863–32901 | 30/30 |
| content-umrah-haji | `// ==== FOTO UMRAH/HAJI ====` (26277) | 26281–26486 | 8/16 |
| content-video-analyzer | `DOM Elements` | 22646–22672 | 26/27 |
| content-virtual-tryon | `// ==== VIRTUAL TRY-ON PRO ====` (3930) | 3935–3973 | 10/18 |
| content-wedding | `// ==== WEDDING & PRE-WEDDING ====` (10950) | 10955–11000 | 11/13 |

### Kenapa "cov" tidak selalu penuh — dan kenapa itu bukan masalah

Tiga sebab, semuanya sudah dilacak:

1. **Tombol salin lewat helper.** Tujuh `*-copy-btn` (`desc-`, `ff-`, `hr-`,
   `km-`, `bp-`, `rm-`, `story-script-`) tidak muncul sebagai
   `getElementById`, tapi lewat `setupCopyButton('desc-copy-btn', 'desc-output')`
   (bundle L40340, 41524, 41071, 41223, 40947, 41365, 40813). Tercover.
2. **Markup sisa dari desain lama.** `umrah-haji` (8/16) dan `virtual-tryon`
   (10/18) paling menonjol: bundle memakai set id yang lebih baru
   (`umrah-file-input-area`, `umrah-add-photo-btn`, `umrah-count-selection-grid`;
   `tryon-results-grid`, `tryon-count-selection-grid`) sementara id lama
   (`umrah-upload-box`, `umrah-preview`, `tryon-result-image`, `tryon-loader`)
   hanya dipakai blok legacy. Elemen-elemen itu **sudah mati sekarang** karena
   dedup melepas listener-nya, jadi Fase 3 tidak mengubah perilaku apa pun.
   Sisa markup itu boleh dibersihkan menyusul, di luar scope plan ini.
3. **Elemen kosmetik** (`*-error-message`, `*-image-grid`, `*-count-selection-grid`)
   yang memang tidak dipegang JS.

Tombol yang benar-benar tidak punya rumah di bundle, dan sudah mati hari ini:
`photo-booth-remove-btn`, `umrah-remove-btn`, `tryon-download-btn`,
`poses-generateBtn`, `poses-cancelModalBtn`. Yang terakhir dua itu adalah
temuan #4 di atas.

---

## Task 0.2 — Klasifikasi 57 tool sisanya

101 − 44 = 57.

### (a) Native bundle-module.js sejak awal, blok legacy tidak menyentuhnya — 43

Nol id panel yang muncul di blok legacy 35909–47626, semua/hampir semua
muncul di bundle-module.js. Aman total terhadap Fase 3.

```
ab-testing            affiliate-harga       affiliate-islami      banner-generator
before-after          birthday-photo        brand-kit-generator   buat-model
caption-generator     content-calendar      desain-kamar          food-review
fotogenic             graduation-photo      image-analyzer        kartu-lebaran
maternity             mirror-selfie         packaging-design      podcast
pov-selfie            product-comparison    product-mockup        product-premium
roi-calculator        size-guide            sketch-catalog        skincare-review
sticker-pack-studio   studio-aesthetic      studio-profil         tattoo-editor
testimonial-generator timelapse-renovasi    touring               unboxing-scene
upscale               vehicle-modifier      video-frames          walking-pad
watch-together        wedding-design        worldcup
```

### (b) `<iframe>` / link eksternal, tanpa JS — 3

| tab | isi |
|---|---|
| `veo` | `<iframe src="https://veogenerator-rho.vercel.app/">` |
| `remove-bg` | `<iframe src="https://pixlr.com/id/remove-background/">` |
| `opal` | panel statis + `<a href="https://opal.google/?flow=…">`, nol `<button>` |

### (c) Panel statis tanpa JS — 0

Tidak ada. Semua panel non-iframe punya JS di salah satu tempat.

### (d) Perlu tindakan / cek manual — 11

| tab | status | tindakan |
|---|---|---|
| `face-swap` | yatim, 0 jejak di bundle | Task 2.A — port penuh |
| `profesi-anak` | logika ada di bundle L6861, markup tidak cocok | Task 2.B — selaraskan id markup |
| `pose-fashion` | logika ada di bundle L4303, markup tidak cocok | Task 2 baru (tidak ada di plan) |
| `beranda` | `beranda-search` yatim | Task 2 baru — pindahkan pencarian beranda |
| `konten-affiliator` | yatim, blok 47906–48930 / `temp_script.js` | Task 2.C |
| `voice-over` | dobel, 2× panggil API | tambah ke `KAI_DUP_PANELS` atau tunggu Fase 3 |
| `photo-editor` | dobel | idem |
| `sticker` | dobel | idem |
| `hair-generator` | dobel | idem |
| `story-update` | dobel | idem |
| `feedbranding` | `bundle-classic.js`, iklan mati permanen | di luar scope (sesuai plan) |

---

## Catatan mekanisme dedup (relevan untuk Fase 3)

- Perekam (35889–35901) menambal `EventTarget.prototype.addEventListener`
  dan hanya merekam saat `this instanceof Element` → listener di `document`
  dan `window` tidak pernah dilepas. Blok legacy tidak memasang keduanya
  (`document.addEventListener` di dalamnya hanya untuk `DOMContentLoaded`,
  baris 35951 dan 47306), jadi tidak ada efek samping tersembunyi di situ.
- Blok legacy tidak menulis satu pun `window.<nama> = …` dan tidak memakai
  `.onclick =`. Tidak ada global yang dikonsumsi bundle-module.js →
  menghapusnya tidak memutus bundle.
- Satu elemen di luar panel yang diwire kedua belah pihak:
  `toggle-sidebar-btn` (legacy **dan** bundle). Listener legacy-nya tidak
  dilepas dedup. Cek di browser apakah sidebar ter-toggle dua kali; kalau ya,
  itu hilang sendiri setelah Fase 3.
- Tabel string obfuscator blok legacy kosong (`function _0x3a31() { return []; }`)
  dan dekodernya (`_0x2d1e`) hanya dipakai sekali — semua akses DOM di sana
  memakai literal `document["getElementById"]("id-asli")`. Artinya blok itu
  bisa di-grep dengan nama id biasa, tidak perlu deobfuscator.

## Cara reproduksi angka di dokumen ini

```bash
# panel + id di dalamnya
grep -o 'data-tab="[^"]*"' kreativa-ai-v2-injected.html | sort -u
grep -o '<div [^>]*class="main-content-panel[^"]*"[^>]*>' kreativa-ai-v2-injected.html | wc -l

# batas blok legacy
awk 'NR>=35900 && NR<=47910 && (/<script/ || /<\/script>/) {print NR": "$0}' kreativa-ai-v2-injected.html

# cek satu id ada di mana
grep -c 'faceswap-generate-btn' bundle-module.js   # 0 = yatim
```

Pemetaan id→panel dan id→bundle dilakukan dengan memotong tiap
`.main-content-panel` jadi blok terpisah, mengumpulkan `id="..."` di
dalamnya, lalu mencocokkan ke `bundle-module.js`, `bundle-classic.js`,
blok legacy 35909–47626, dan blok affiliator 47906–48930.
