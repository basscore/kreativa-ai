const fs = require('fs');

const files = [
    'bundle-classic.js',
    'bundle-module.js',
    'kreativa-ai-v2-injected.html'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Remove adblock and ruangsaku / ads promotional translations
    if (file === 'bundle-classic.js') {
        const lines = content.split('\n');
        const newLines = lines.filter(line => {
            // Check if line defines an ads/rs/adblock property
            if (line.match(/^\s*'(ads\.|rs\.|nav\.ruangsaku|adblock\.)/)) {
                return false;
            }
            return true;
        });
        content = newLines.join('\n');
    }

    // Storage keys and file prefixes
    content = content.replace(/affiliatego_/gi, 'kreativa_');
    
    // Replace all other occurrences of AffiliateGo / Affiliate Go / Affiliate GO
    content = content.replace(/Affiliate\s*Go/gi, 'Kreativa AI');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
}
