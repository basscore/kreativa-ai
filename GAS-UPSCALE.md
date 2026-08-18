# Kuota Upscale — kode Apps Script yang perlu ditambahkan

Sisi client sudah selesai. Yang kurang cuma dua `action` di **GAS Kreativa**
(deployment yang dipakai login, `AKfycbxTlJajelLY…`). Selama action ini belum
ada, GAS membalas HTML (HtmlService) — bukan JSON — sehingga browser menolaknya
sebagai error CORS dan user melihat *"Gagal connect ke server."*

## Kontrak yang dipanggil client

```
GET <APPS_SCRIPT_URL>?action=use_upscale&email=…&token=…&app_secret=…&product=…
GET <APPS_SCRIPT_URL>?action=refund_upscale&email=…&token=…&app_secret=…&product=…
```

Yang dibaca client ([bundle-module.js:17057](bundle-module.js#L17057)):

| Balasan                                        | Perilaku di aplikasi                     |
|------------------------------------------------|------------------------------------------|
| `{"status":"SUKSES"}`                           | lanjut upscale ke fal.ai                 |
| `{"status":"GAGAL","quota_exhausted":true}`     | alert "Kuota habis…"                     |
| `{"status":"GAGAL","message":"…"}`              | alert isi `message`                      |
| bukan JSON / CORS gagal                         | alert "Gagal connect ke server."         |

`app_secret` dan `product` ikut terkirim tapi boleh diabaikan — GAS Kreativa
tidak memakainya di `action=login`.

## Prasyarat di spreadsheet

Sheet user yang sama dengan yang dipakai `action=login` perlu satu kolom kuota.
Kode di bawah mencarinya lewat **nama header**, jadi cukup tambahkan header
`kuota_upscale` di baris 1 dan isi angkanya (mis. `200`) per user.

## Kode — tempel ke Code.gs

```javascript
// ==================== KUOTA UPSCALE ====================
// Nama sheet & header disesuaikan kalau di proyek Anda beda.
var UPSCALE_SHEET  = 'Users';          // sheet yang dibaca action=login
var UPSCALE_COL    = 'kuota_upscale';  // header kolom sisa kuota
var UPSCALE_EMAIL  = 'email';          // header kolom email
var UPSCALE_TOKEN  = 'token';          // header kolom sessionToken (ditulis saat login)

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// delta -1 = pakai kuota, +1 = kembalikan kuota.
// LockService wajib: dua klik berbarengan tanpa lock bisa memotong kuota dobel
// atau malah tidak memotong sama sekali (read-modify-write balapan).
function ubahKuotaUpscale(email, token, delta) {
  if (!email || !token) return { status: 'GAGAL', message: 'Sesi tidak valid. Silakan login ulang.' };

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return { status: 'GAGAL', message: 'Server sedang sibuk, coba lagi sebentar.' };
  }

  try {
    var sh = SpreadsheetApp.getActive().getSheetByName(UPSCALE_SHEET);
    if (!sh) return { status: 'GAGAL', message: 'Sheet user tidak ditemukan.' };

    var data = sh.getDataRange().getValues();
    var head = data[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var iEmail = head.indexOf(UPSCALE_EMAIL);
    var iToken = head.indexOf(UPSCALE_TOKEN);
    var iKuota = head.indexOf(UPSCALE_COL);
    if (iEmail < 0 || iToken < 0) return { status: 'GAGAL', message: 'Kolom email/token tidak ada di sheet.' };
    if (iKuota < 0) return { status: 'GAGAL', message: 'Kolom ' + UPSCALE_COL + ' belum dibuat di sheet.' };

    var target = String(email).trim().toLowerCase();
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][iEmail]).trim().toLowerCase() !== target) continue;

      // Token harus cocok — ini yang bikin kuota tidak bisa dipakai dari sesi lain.
      if (String(data[r][iToken]).trim() !== String(token).trim()) {
        return { status: 'GAGAL', message: 'Sesi tidak valid. Silakan login ulang.' };
      }

      var sisa = parseInt(data[r][iKuota], 10);
      if (isNaN(sisa)) sisa = 0;

      if (delta < 0 && sisa <= 0) {
        return { status: 'GAGAL', quota_exhausted: true, message: 'Kuota upscale habis.', sisa: 0 };
      }

      var baru = sisa + delta;
      if (baru < 0) baru = 0;
      sh.getRange(r + 1, iKuota + 1).setValue(baru);
      SpreadsheetApp.flush(); // tulis sebelum lock dilepas
      return { status: 'SUKSES', sisa: baru };
    }
    return { status: 'GAGAL', message: 'Email tidak terdaftar.' };
  } finally {
    lock.releaseLock();
  }
}
```

Lalu sambungkan di `doGet` yang sudah ada, sebelum fallback HtmlService:

```javascript
function doGet(e) {
  var action = e.parameter.action;

  if (action === 'use_upscale') {
    return jsonOut(ubahKuotaUpscale(e.parameter.email, e.parameter.token, -1));
  }
  if (action === 'refund_upscale') {
    return jsonOut(ubahKuotaUpscale(e.parameter.email, e.parameter.token, +1));
  }

  // ... action=login dan action=verify yang sudah ada ...
}
```

## Cek mandiri — jalankan di editor Apps Script

```javascript
function testKuotaUpscale() {
  var EMAIL = 'ISI_EMAIL_USER_TEST';
  var TOKEN = 'ISI_TOKEN_DI_SHEET_UNTUK_EMAIL_ITU';

  var a = ubahKuotaUpscale(EMAIL, TOKEN, -1);
  if (a.status !== 'SUKSES') throw new Error('pakai kuota gagal: ' + JSON.stringify(a));

  var b = ubahKuotaUpscale(EMAIL, TOKEN, +1);
  if (b.status !== 'SUKSES') throw new Error('refund gagal: ' + JSON.stringify(b));
  if (b.sisa !== a.sisa + 1) throw new Error('refund tidak mengembalikan angka: ' + a.sisa + ' -> ' + b.sisa);

  var c = ubahKuotaUpscale(EMAIL, 'token-ngawur', -1);
  if (c.status === 'SUKSES') throw new Error('token salah malah diterima!');

  Logger.log('OK — sisa kuota kembali ke ' + b.sisa);
}
```

## Deploy

**Deploy → Manage deployments → (deployment yang sudah ada) → ikon pensil →
Version: New version → Deploy.**

Pakai deployment yang sudah ada, jangan bikin baru — URL `/exec`-nya tetap sama,
jadi tidak ada yang perlu diubah di `kreativa-ai-v2-injected.html`.

Verifikasi dari terminal (ganti EMAIL/TOKEN dengan milik user test):

```bash
curl -sL "https://script.google.com/macros/s/AKfycbxTlJajelLYdtQLpU6X41n5S3VRR44cI6ZaJld6_An6vpZt8QBefThMN-lqcXHvHRDz/exec?action=use_upscale&email=EMAIL&token=TOKEN"
```

Harus balas JSON `{"status":"SUKSES","sisa":…}` — bukan HTML.
Kalau sudah JSON, tombol Upscale di aplikasi langsung jalan.
