#!/bin/sh
# Cek bahwa bundle yang benar-benar dikirim CDN = bundle di repo, dan parse-nya lolos.
# Gagal di sini = 42 panel mati diam-diam di produksi (yang cuma ada di bundle-module).
# Jalankan setelah setiap push bundle.
set -e
cd "$(dirname "$0")"

gagal=0
for url in $(grep -o 'https://cdn.jsdelivr.net/gh/basscore/kreativa-ai@[^"]*' kreativa-ai-v2-injected.html); do
    f=$(basename "$url" | cut -d? -f1)
    # bundle-module dimuat sebagai type="module", jadi dicek sebagai ESM
    case "$f" in *module*) tmp=$(mktemp).mjs ;; *) tmp=$(mktemp).js ;; esac
    curl -fsS "$url" -o "$tmp"

    if [ "$(md5 -q "$tmp")" != "$(md5 -q "$f")" ]; then
        echo "BEDA: $f dari CDN tidak sama dengan yang di repo -> $url"
        gagal=1
    fi
    if ! node --check "$tmp" 2>/dev/null; then
        echo "SYNTAX ERROR: $f dari CDN gagal parse -> $url"
        gagal=1
    fi
    rm -f "$tmp"
done

[ "$gagal" = 0 ] && echo "OK: semua bundle di CDN cocok dengan repo dan lolos parse"
exit $gagal
