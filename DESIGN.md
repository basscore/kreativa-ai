# Sistem Tema Kreativa AI

Aplikasi ini bertema **gelap**, satu-satunya tema. Dokumen ini menjelaskan apa
yang mengatur warna, kelas apa yang aman dipakai, dan pola apa yang merusak
sistem.

Aturan pentingnya cuma satu:

> **Tulis markup Tailwind konvensi TERANG. Paletnya yang membalik.**

Itu terdengar terbalik, dan memang. Alasannya ada di §2.

---

## 1. Tiga lapisan, tiga titik kendali

Warna di file ini datang dari tiga tempat. Jangan menambah tempat keempat.

| Lapisan | Tempat | Mengatur |
|---|---|---|
| **Palet** | `<script>` `tailwind.config` di `<head>` | Semua kelas utility Tailwind (~2.900 di markup + ~600 yang disuntik `bundle-module.js`) |
| **Tema panel** | `<style id="tema-panel">` (terakhir di `<head>`) | Kanvas panel, kop, kartu, formulir, tombol — berlaku ke SEMUA panel alat |
| **Komponen** | `<style>` pertama di `<head>` | Kelas khusus per alat (`.option-btn-*`, `.upload-box-*`, `.count-btn-grid`) |

Yang **tidak** boleh ditambah lagi: blok override yang mendaftar ID panel satu
per satu. Blok seperti itu (`custom-creative-affiliate`, 690 baris, 5 panel
di-hardcode di ~10 daftar terpisah) sudah dihapus. Kalau Anda merasa perlu
menulis `#content-alat-saya .sesuatu { ... }` untuk memperbaiki tampilan
umum — hampir pasti yang salah adalah salah satu dari tiga lapisan di atas.

---

## 2. Palet: kenapa tangga netral dibalik

101 panel dan seluruh markup yang disuntik bundle ditulis dengan konvensi tema
terang: `text-gray-800` untuk judul (623×), `text-gray-500` untuk keterangan
(316×), `border-gray-300` untuk garis (180×), `bg-gray-50` untuk kartu. Yang
ditulis konvensi gelap cuma ~82 kelas.

Menulis ulang ~2.900 kelas bukan pilihan: sebagian tinggal di
`bundle-module.js` yang disajikan dari jsDelivr dan tidak bisa diedit dari sini.

Jadi **tangga netralnya yang dibalik** — 50 jadi permukaan tergelap, 900 jadi
putih:

| Nada | Nilai | Peran di markup |
|---|---|---|
| 50 | `#0B0E17` | kanvas / permukaan tergelap |
| 100 | `#121826` | permukaan kartu |
| 200 | `#1A2130` | permukaan sekunder |
| 300 | `#29303F` | garis / border |
| 400 | `#8695A8` | teks tersier |
| 500 | `#A3B0C0` | teks sekunder / keterangan |
| 600 | `#CBD5E1` | teks isi |
| 700 | `#E2E8F0` | teks isi tegas |
| 800 | `#F1F5F9` | judul |
| 900 / 950 | `#FFFFFF` | judul tegas |

Berlaku untuk `gray`, `slate`, `zinc`, `neutral`, `stone` — kelimanya menunjuk
tangga yang sama.

### Keluarga hue

Tangga hue **tidak** dibalik (kalau dibalik, `bg-blue-600` jadi biru pucat).
Ia diturunkan dari `tailwind.colors` (palet stok Tailwind) dengan dua
penyesuaian:

- **Nada 50/100/200** jadi permukaan gelap bernuansa, bukan tint pucat. Di
  markup nada ini memang berperan sebagai permukaan (`bg-green-50` = kotak
  sukses, `border-red-200` = garis galat), dan peran itu tetap hidup di kanvas
  gelap.
- **Nada 600/700** ditarik ke stok 500, karena markup memakainya untuk teks
  aksen dan nada 600 asli terlalu pekat di atas `#0B0E17`.

`white` tetap `#FFFFFF` — `text-white` dan kaca `bg-white/5` bergantung
padanya. `black` jadi `#0B0E17`.

### Satu token, dua peran

Batas yang tidak bisa diselesaikan palet: markup memakai nada 600 untuk **dua**
peran sekaligus — latar tombol (`bg-*-600 text-white`, ~560×) dan teks aksen
(`text-*-600`, ~200×). Satu token tidak bisa bernilai dua.

Karena itu `<style id="tema-panel">` memisahkan peran yang palet tidak bisa:

- teks keluarga gelap (`blue`, `indigo`, `violet`, `purple`, `red`, `pink`,
  `rose`) dinaikkan satu langkah;
- latar keluarga terang (`cyan`, `sky`, `teal`, `green`, `emerald`, `lime`,
  `yellow`, `amber`, `orange`) diturunkan satu langkah.

Dua daftar itu **setingkat palet, bukan per panel** — tidak bertambah saat ada
panel baru.

---

## 3. Kait otomatis: `data-map` dan `.kop`

Skrip **"pendaftar berkas"** di dekat akhir file membaca laci `<details>` di
sidebar dan, untuk setiap tombol alat yang ditemukannya:

1. memasang `data-map="1..9"` pada panel `#content-<tab>` (nomor laci);
2. menyuntik header `.kop` (kategori · nama · nomor) di kepala panel;
3. menandai judul lama yang cuma mengulang nama alat dengan `data-kop-serap`.

`<style id="tema-panel">` memakai kait itu sebagai scope:

```css
[id^="content-"][data-map] { /* ... */ }
```

Konsekuensinya:

- **Panel baru ikut otomatis** begitu tombolnya masuk laci sidebar. Tidak ada
  daftar yang perlu disentuh.
- **`#content-beranda` tersaring keluar sendiri** — ia tidak terdaftar di laci
  mana pun, jadi tidak punya `data-map`, jadi tetap memakai gayanya sendiri.

### `--map`: aksen per kategori

`--map` diwarisi dari `[data-map="N"]` dan dipakai ~150× di seluruh stylesheet
(garis atas kop, border hover, ring fokus, kepala spinner):

| Laci | `--map` | | Laci | `--map` |
|---|---|---|---|---|
| 1 | `#FF456A` | | 6 | `#A78BFA` |
| 2 | `#38BDF8` | | 7 | `#2DD4BF` |
| 3 | `#F472B6` | | 8 | `#FB7185` |
| 4 | `#FB923C` | | 9 | `#FB7185` |
| 5 | `#34D399` | | | |

---

## 4. Kosakata: kelas yang otomatis bergaya

Pakai kembali nama-nama ini dan tampilannya gratis. Ini bukan daftar yang harus
Anda daftarkan — cukup pakai namanya.

| Pakai | Dapat |
|---|---|
| `.card`, `.bg-white` | kartu kaca gelap + border + bayangan |
| `.bg-gray-50` … `.bg-gray-300` | permukaan gelap bertingkat |
| `.text-gray-500` / `-600` / `-700` / `-800` | tangga teks redup → judul |
| `<input>`, `<textarea>`, `<select>` | bidang kaca gelap, fokus ber-glow `--map` |
| id berakhiran `-generate-btn`, `-generate-button`, `-download-all-btn` | tombol gradien brand |
| `.btn-primary` | sama seperti di atas |
| `.btn-secondary` | tombol kaca |
| `.file-input-label`, `.file-upload-area` | area unggah bergaris putus-putus |
| `.category-card`, `.style-card`, `.ratio-select-btn` | kartu pilihan + state `.selected` bergradien |
| `.modal-content`, `id$="-modal-overlay"` | modal kaca gelap + tirai buram |
| `.loader` | spinner, kepala berwarna `--map` |
| `.toast` | notifikasi kaca |
| `.result-card`, `.b-roll-card` | bingkai hasil |
| `.count-btn-grid > button` | grid pemilih jumlah, `.selected` bergradien |

**Menamai tombol generate**: beri ID berakhiran `-generate-btn`. Itu satu-satunya
syarat agar ia dapat gradien brand.

---

## 5. Yang harus dihindari

**Jangan tulis warna literal di markup.** Baik `style="color: #333"` maupun
`class="text-[#1e3a8a]"` melewati palet sepenuhnya, jadi ia tidak ikut berubah
saat tema disetel dan biasanya berakhir tak terbaca di kanvas gelap. Pakai kelas
palet.

**Jangan tulis gradien inline dengan warna kertas.** Gradien seperti
`linear-gradient(135deg, #F4F2EA, #F4F2EA)` — dua ujung warna yang sama — adalah
sisa perataan tema lama, bukan gradien. Untuk aksen brand pakai
`#FF3366 → #B829E6`.

**Jangan pakai konvensi gelap di markup.** `text-slate-200`, `bg-gray-800`,
`border-gray-700` akan terbalik arah oleh palet. Pasangannya: `text-slate-700`,
`bg-gray-200`, `border-gray-300`.

**Jangan pakai pencocokan substring `[class*="..."]` untuk menyapu tampilan.**
Ia mencocokkan potongan nama, jadi `hover:text-white` ikut kena oleh selector
yang mengincar `text-white`. Pakai kelas eksak.

**Jangan pakai `!important` untuk mengalahkan utility Tailwind.** Spesifisitas
`[id^="content-"][data-map] .kelas` (0,3,0) sudah menang atas utility (0,1,0).
`!important` mematikan kemampuan panel menyesuaikan diri, dan itulah yang bikin
sistem lama tak bisa ditambal selain dengan `!important` berikutnya.

**Jangan menolkan properti lewat kelas bersama.** `.main-content-panel
{ padding: 0 !important }` menyapu 101 panel padahal yang butuh tepi rata cuma
Beranda. Kalau cuma satu yang butuh, tulis di ID-nya.

---

## 6. Cara mengaudit satu panel

Buka `http://127.0.0.1:8971/kreativa-ai-v2-injected.html?v=N` (server:
`python3 -m http.server 8971`; `file://` diblokir sandbox browser, dan `?v=N`
wajib karena file ini di-cache agresif). Lalu jalankan di konsol:

```js
(function(){
function an(c){const m=(c||'').match(/[\d.]+/g);if(!m||m.length<3)return null;
 const r=+m[0],g=+m[1],b=+m[2],a=m[3]!==undefined?+m[3]:1;if(a<0.25)return null;
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
 return {l:(0.2126*r+0.7152*g+0.0722*b)/255, sat:mx?(mx-mn)/mx:0};}
const ps=document.querySelectorAll('[id^="content-"]');let out=[];
ps.forEach(p=>{const prev=p.style.display;p.style.display='block';
 p.querySelectorAll('*').forEach(el=>{const cs=getComputedStyle(el);
  if(cs.display==='none'||cs.visibility==='hidden')return;
  const b=an(cs.backgroundColor);
  if(b&&b.l>0.6&&b.sat<0.35) out.push('LATAR '+p.id+' '+el.className+' '+cs.backgroundColor);
  const t=an(cs.color);
  if(t&&t.l<0.35&&t.sat<0.6&&!el.children.length&&el.textContent.trim())
   out.push('TEKS '+p.id+' '+el.className+' '+cs.color);
  const bi=cs.backgroundImage;
  if(bi&&/gradient/.test(bi)){const st=(bi.match(/rgba?\([^)]*\)/g)||[]).map(an).filter(Boolean);
   if(st.length&&st.every(x=>x.l>0.6&&x.sat<0.35)) out.push('GRADIEN '+p.id+' '+el.className);}});
 p.style.display=prev;});
return out;})()
```

Harus mengembalikan array kosong. `p.style.display='block'` perlu karena panel
non-aktif ber-`display:none` dan `getComputedStyle` tidak melaporkan warna
sebenarnya dalam keadaan itu.

Ambang saturasi (`sat < 0.35` untuk latar, `< 0.6` untuk teks) dipakai supaya
aksen cerah yang memang disengaja — badge hijau, tombol merah — tidak ikut
terhitung sebagai kebocoran.

**Jangan mengandalkan screenshot saja.** Panel non-aktif tidak terlihat, dan
kebocoran warna sering ada di state yang belum dirender.
