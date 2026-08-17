
        // --- Impor Firebase ---
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


        document.addEventListener('DOMContentLoaded', () => {
            let selectedStyle = null, uploadedFiles = {}, generatedContent = { masterScene: null, images: [], audio: null, shotPrompts: [] };
            let selectedAspectRatio = null;
            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            const LIBRARY_MAX_FILE_SIZE = 500 * 1024;

            // --- Variabel Firebase ---
            let db, auth, userId, appId;
            let currentAssetTargetInput = null;
            let assetUnsubscribe = null;

            const dom = {
                mainGrid: document.getElementById('ka-main-grid'),
                col3Container: document.getElementById('ka-col-3-container'),
                col3Content: document.getElementById('ka-col-3-content'),

                categoryCards: document.querySelectorAll('#content-konten-affiliator .category-card'),
                styleSelection: document.getElementById('ka-style-selection'),
                styleSelectionDesc: document.getElementById('ka-style-selection-desc'),
                videoStylesContainer: document.getElementById('ka-video-styles-container'),
                imageStylesContainer: document.getElementById('ka-image-styles-container'),
                styleCards: document.querySelectorAll('#content-konten-affiliator .style-card'),
                inputForm: document.getElementById('ka-input-form'),
                inputFormContainer: document.querySelector('#ka-input-form .space-y-6'),
                generateBtn: document.getElementById('ka-generate-btn'),
                loadingOverlay: document.getElementById('ka-loading-overlay'),
                loadingMessage: document.getElementById('ka-loading-message'),
                toastContainer: document.getElementById('ka-toast-container'),
                // Modal rasio aspek
                ratioModalOverlay: document.getElementById('ka-ratio-modal-overlay'),
                ratioSelectBtns: document.querySelectorAll('#content-konten-affiliator .ratio-select-btn'),
                cancelRatioBtn: document.getElementById('ka-cancel-ratio-btn'),
                confirmGenerateBtn: document.getElementById('ka-confirm-generate-btn'),
                // Placeholder
                placeholderOutput: document.getElementById('ka-placeholder-output'),
                scriptPlaceholderOutput: document.getElementById('ka-script-placeholder-output'),
                // Sections
                visualSection: document.getElementById('ka-visual-section'),
                scriptSection: document.getElementById('ka-script-section'),
                scriptAudioSection: document.getElementById('ka-script-audio-section'),

                generatedScriptEl: document.getElementById('generated-script'),
                ttsBtn: document.getElementById('ka-tts-btn'),
                ttsVoiceSelect: document.getElementById('ka-tts-voice'),
                audioPlayer: document.getElementById('ka-audio-player'),
                audioPlayerControls: document.getElementById('ka-audio-player-controls'),
                imageGrid: document.getElementById('ka-image-grid'),
                downloadBtn: document.getElementById('ka-download-btn'),
                playAudioBtn: document.getElementById('ka-play-audio-btn'),
                playIcon: document.getElementById('ka-play-icon'),
                pauseIcon: document.getElementById('ka-pause-icon'),
                downloadAudioBtn: document.getElementById('ka-download-audio-btn'),
                downloadPromptsBtn: document.getElementById('ka-download-prompts-btn'),

                // --- DOM Pustaka Aset ---
                openLibraryBtn: document.getElementById('ka-open-library-btn'),
                libraryModalOverlay: document.getElementById('ka-library-modal-overlay'),
                closeLibraryBtn: document.getElementById('ka-close-library-btn'),
                libraryTabs: document.getElementById('ka-asset-library-tabs'),
                libraryContent: document.getElementById('ka-library-content'),
                libraryGrid: document.getElementById('ka-library-grid'),
                libraryPlaceholder: document.getElementById('ka-library-placeholder'),
                libraryUploadBtn: document.getElementById('ka-library-upload-btn'),
                libraryUploadInput: document.getElementById('ka-library-upload-input'),
            };

            // --- Backend Proxy URL (API Key disimpan di server) ---
            const PROXY_URL = "https://script.google.com/macros/s/AKfycbxsbYlUXRsOUtrLzYHWM6n8peKekiHIVLVm0UJGMcaks2UK5iL4gk45e9ncbQ8HsuGk/exec";

            const ttsVoices = [
                { id: 'Puck', name: 'Wanita - Ceria' }, { id: 'Leda', name: 'Wanita - Dewasa' }, { id: 'Aoede', name: 'Wanita - Santai' },
                { id: 'Orus', name: 'Pria - Tegas' }, { id: 'Charon', name: 'Pria - Ramah' }, { id: 'Fenrir', name: 'Pria - Bersemangat' }
            ];

            const storyFlows = {
                'live-showcase': [
                    { id: 'problem', label: 'The Problem: Visualisasi masalah (tanpa produk utama).' },
                    { id: 'reveal', label: 'The Product Reveal: Bidikan sinematik yang memperkenalkan produk.' },
                    { id: 'action', label: 'The Solution in Action: Model menggunakan produk untuk mengatasi masalah.' },
                    { id: 'result', label: 'The Positive Result: Model terlihat puas dengan hasil dari produk.' },
                    { id: 'presenter', label: 'The Presenter: Model menatap langsung ke kamera, seolah-olah berbicara kepada penonton.' }
                ],
                'quick-insight': [
                    { id: 'hook', label: 'Cinematic Hook: Bidikan lebar yang indah dari produk di lingkungannya.' },
                    { id: 'closeup', label: 'Feature Close-Up: Bidikan close-up pada detail terbaik dari produk.' },
                    { id: 'solution1', label: 'Solution Part 1: Model menggunakan produk dari satu sudut.' },
                    { id: 'solution2', label: 'Solution Part 2: Model menggunakan produk dari sudut lain, menunjukkan fungsi yang berbeda.' },
                    { id: 'result', label: 'The Satisfying Result: Hasil akhir yang memuaskan setelah menggunakan produk.' }
                ],
                'editorial-shots': [
                    { id: 'fisheye', label: 'Fisheye High Angle: Tampilan artistik dari atas.' },
                    { id: 'coolpose', label: 'Normal Angle - Cool Pose: Pose keren dari depan.' },
                    { id: 'seated', label: 'Seated Studio Pose: Pose duduk yang stylis.' },
                    { id: 'halfbody', label: 'Half Body Close-Up: Fokus pada detail pakaian bagian atas.' },
                    { id: 'fabric', label: 'Interacting with Fabric: Pose yang menunjukkan tekstur bahan.' }
                ],
                'focus-produk': [
                    { id: 'wide', label: 'Wide Shot: Produk di lingkungannya (misal: di atas meja).' },
                    { id: 'closeup', label: 'Extreme Close-Up: Fokus pada tekstur atau detail terbaik produk.' },
                    { id: 'top-down', label: 'Top-Down / Flatlay: Bidikan lurus dari atas.' },
                    { id: 'dynamic-angle', label: 'Dynamic Angle: Bidikan 45 derajat yang menonjolkan bentuk produk.' },
                    { id: 'hero-shot', label: 'Hero Shot: Bidikan sinematik yang menampilkan produk secara utuh.' }
                ]
            };

            const showToast = (message, isError = false) => {
                const toast = document.createElement('div');
                toast.className = `toast p-4 rounded-lg shadow-lg text-white ${isError ? 'bg-red-600' : 'bg-green-600'}`;
                toast.textContent = message;
                dom.toastContainer.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
            };

            const showLoading = (message) => {
                dom.loadingMessage.textContent = message;
                dom.loadingOverlay.classList.remove('hidden');
            };

            const hideLoading = () => {
                dom.loadingOverlay.classList.add('hidden');
            };

            // Logika Pemilihan Kategori Utama
            dom.categoryCards.forEach(card => {
                card.addEventListener('click', () => {
                    dom.categoryCards.forEach(c => {
                        c.classList.remove('selected-video', 'selected-image');
                        c.classList.add('border-gray-200');
                    });

                    const category = card.dataset.category;
                    card.classList.remove('border-gray-200');

                    if (category === 'video') {
                        card.classList.add('selected-video');
                        dom.videoStylesContainer.classList.remove('hidden');
                        dom.imageStylesContainer.classList.add('hidden');
                        dom.styleSelectionDesc.textContent = "Pilih template alur cerita untuk video Anda.";

                        dom.mainGrid.classList.remove('lg:grid-cols-2');
                        dom.mainGrid.classList.add('lg:grid-cols-3');
                        dom.col3Container.classList.remove('hidden');
                    } else {
                        card.classList.add('selected-image');
                        dom.videoStylesContainer.classList.add('hidden');
                        dom.imageStylesContainer.classList.remove('hidden');
                        dom.styleSelectionDesc.textContent = "Pilih tool AI untuk mengedit dan memodifikasi gambar produk.";

                        dom.mainGrid.classList.remove('lg:grid-cols-3');
                        dom.mainGrid.classList.add('lg:grid-cols-2');
                        dom.col3Container.classList.add('hidden');
                    }

                    dom.styleSelection.classList.remove('hidden');
                    selectedStyle = null;
                    dom.styleCards.forEach(sc => sc.classList.remove('selected'));
                    dom.inputForm.classList.add('hidden');
                });
            });

            const updateUIForStyle = (style) => {
                selectedStyle = style;
                dom.styleCards.forEach(card => card.classList.toggle('selected', card.dataset.style === style));
                dom.inputFormContainer.innerHTML = '';
                uploadedFiles = {};
                const isFashion = style === 'runway-mode' || style === 'editorial-shots';
                const isImageEditMode = ['foto-produk', 'virtual-try-on', 'pov-tangan'].includes(style);

                const createFileInput = (id, label, required = false, multiple = false) => {
                    let assetType = id;
                    if (id === 'fashionItems' || id === 'productImage') assetType = 'product';
                    if (id === 'modelImage') assetType = 'model';
                    if (id === 'backgroundImage') assetType = 'background';

                    const showChooseButton = !multiple;

                    return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">${label}${required ? '<span class="text-red-400">*</span>' : ''}</label>
                <div class="flex gap-2">
                    <div id="upload-area-${id}" class="file-upload-area rounded-lg p-4 text-center cursor-pointer flex-grow">
                        <input type="file" id="${id}" class="hidden" accept="image/*" ${multiple ? 'multiple' : ''}>
                        <div id="preview-${id}" class="flex justify-center items-center flex-wrap gap-2">
                            <span class="text-gray-500">Klik atau jatuhkan file</span>
                        </div>
                    </div>
                    ${showChooseButton ? `
                    <button id="lib-btn-${id}" data-asset-type="${assetType}" class="choose-from-lib-btn bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-300 flex-shrink-0">
                        Pilih dari Pustaka
                    </button>
                    ` : ''}
                </div>
            </div>`;
                };
                const createTextInput = (id, label, placeholder) => `<div><label for="${id}" class="block text-sm font-medium text-gray-700">${label}<span class="text-red-400">*</span></label><textarea id="${id}" rows="3" class="mt-2 block w-full rounded-md bg-gray-100 border-gray-300 text-gray-900" placeholder="${placeholder}"></textarea></div>`;

                let formHtml = '';
                if (isImageEditMode) {
                    formHtml += createFileInput('productImage', 'Unggah Gambar Produk', true);
                    if (style === 'foto-produk') {
                        formHtml += createTextInput('settingInput', 'Setting / Latar Belakang (Setting)', 'Contoh: meja marmer dengan tanaman hias');
                    } else if (style === 'virtual-try-on') {
                        formHtml += createTextInput('promptInput', 'Deskripsi Model & Pose (Prompt)', 'Contoh: Wanita Asia, pose berjalan di taman, gaya busana casual');
                    } else if (style === 'pov-tangan') {
                        formHtml += createTextInput('settingInput', 'Setting / Lokasi Latar Belakang', 'Contoh: di dalam kafe atau di depan pantai');
                    }
                } else if (isFashion) {
                    if (style === 'runway-mode') {
                        formHtml += createFileInput('fashionItems', 'Unggah Fashion Items (Maks 6)', true, true);
                    } else {
                        formHtml += createFileInput('productImage', 'Unggah Gambar Produk', true);
                    }
                    formHtml += createFileInput('backgroundImage', 'Unggah Gambar Latar', true);
                    formHtml += createFileInput('modelImage', 'Unggah Foto Model (Opsional)');
                } else {
                    formHtml += createFileInput('productImage', 'Unggah Gambar Produk', true);
                    formHtml += createFileInput('modelImage', 'Unggah Foto Model (Opsional)');
                    formHtml += createTextInput('productDescription', 'Deskripsi Produk/Masalah', 'Contoh: Tas trendy berwarna wani dengan gaya kekinian dan harga terjangkau');
                }

                dom.inputFormContainer.innerHTML = formHtml;

                dom.inputFormContainer.querySelectorAll('input[type="file"]').forEach(input => {
                    input.addEventListener('change', handleFileSelect);
                    const dropArea = document.getElementById(`upload-area-${input.id}`);
                    if (dropArea) {
                        dropArea.addEventListener('click', () => input.click());

                        dropArea.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            dropArea.classList.add('border-blue-500', 'bg-blue-500/10');
                        });
                        dropArea.addEventListener('dragleave', () => {
                            dropArea.classList.remove('border-blue-500', 'bg-blue-500/10');
                        });
                        dropArea.addEventListener('drop', (e) => {
                            e.preventDefault();
                            dropArea.classList.remove('border-blue-500', 'bg-blue-500/10');
                            input.files = e.dataTransfer.files;
                            handleFileSelect({ target: input });
                        });
                    }
                });

                document.querySelectorAll('#content-konten-affiliator .choose-from-lib-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const inputId = btn.id.replace('lib-btn-', '');
                        openLibraryModal(inputId, btn.dataset.assetType);
                    });
                });

                dom.inputForm.classList.remove('hidden');
            };

            const handleFileSelect = async (event) => {
                const input = event.target;
                const files = input.files;
                if (!files || files.length === 0) return;

                if (input.id === 'fashionItems' && files.length > 6) {
                    showToast('Maksimal 6 gambar fashion items.', true);
                    input.value = '';
                    return;
                }

                try {
                    const previewEl = document.getElementById(`preview-${input.id}`);
                    previewEl.innerHTML = '';
                    if (input.multiple) {
                        uploadedFiles[input.id] = [];
                        for (const file of files) {
                            const dataUrl = await fileToDataURL(file);
                            uploadedFiles[input.id].push({ name: file.name, type: file.type, base64: dataUrl.split(',')[1] });
                            previewEl.innerHTML += `<img src="${dataUrl}" class="file-preview rounded-md">`;
                        }
                    } else {
                        const dataUrl = await fileToDataURL(files[0]);
                        uploadedFiles[input.id] = { name: files[0].name, type: files[0].type, base64: dataUrl.split(',')[1] };
                        previewEl.innerHTML = `<img src="${dataUrl}" class="file-preview rounded-md">`;
                    }
                } catch (error) { showToast(error.message, true); }
            };

            const fileToDataURL = (file, maxSize = MAX_FILE_SIZE) => new Promise((resolve, reject) => {
                if (file.size > maxSize) {
                    const limit = (maxSize / 1024 / 1024).toFixed(1);
                    return reject(new Error(`File terlalu besar (maks ${limit}MB).`));
                }
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            const cropImageToRatio = (base64Data, targetRatioString) => new Promise((resolve, reject) => {
                const [targetW, targetH] = targetRatioString.split(':').map(Number);
                const targetRatio = targetW / targetH;

                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    const originalRatio = originalWidth / originalHeight;

                    if (Math.abs(originalRatio - targetRatio) < 0.01) {
                        resolve(base64Data);
                        return;
                    }

                    let newWidth, newHeight, startX, startY;

                    if (originalRatio > targetRatio) {
                        newHeight = originalHeight;
                        newWidth = newHeight * targetRatio;
                        startX = (originalWidth - newWidth) / 2;
                        startY = 0;
                    } else {
                        newWidth = originalWidth;
                        newHeight = newWidth / targetRatio;
                        startX = 0;
                        startY = (originalHeight - newHeight) / 2;
                    }

                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    ctx.drawImage(img, startX, startY, newWidth, newHeight, 0, 0, newWidth, newHeight);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = (err) => {
                    console.error("Gagal memuat gambar untuk di-crop:", err);
                    reject(new Error("Gagal memuat gambar base64 untuk cropping."));
                };
                img.src = base64Data;
            });

            const apiCall = async (action, payload) => {
                let response;
                let delay = 1000;
                const proxyData = JSON.stringify({ action: action, payload: payload });

                for (let i = 0; i < 5; i++) {
                    try {
                        // POST ke GAS — Content-Type text/plain supaya tidak kena CORS preflight
                        response = await fetch(PROXY_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: proxyData,
                            redirect: 'follow'
                        });
                    } catch (networkError) {
                        console.error(`[Proxy] Network error on attempt ${i + 1}:`, networkError);
                        if (i < 4) { await new Promise(res => setTimeout(res, delay)); delay *= 2; continue; }
                        throw new Error('Gagal menghubungi server proxy. Periksa koneksi internet.');
                    }

                    if (response.ok) break;

                    if (response.status === 429 || response.status >= 500) {
                        console.warn(`[Proxy] Status ${response.status} on attempt ${i + 1}. Retrying in ${delay}ms...`);
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2;
                    } else {
                        break;
                    }
                }

                const responseText = await response.text();
                console.log(`[Proxy] Raw response (first 500 chars):`, responseText.substring(0, 500));

                if (!responseText || responseText.trim() === '') {
                    throw new Error('Server proxy mengembalikan respons kosong.');
                }

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    console.error("[Proxy] Gagal parsing JSON. Response:", responseText.substring(0, 1000));
                    throw new Error("Respons dari proxy bukan JSON valid. Kemungkinan ada error di Google Apps Script.");
                }

                // Cek apakah ini error dari proxy itu sendiri
                if (data?.status === 'error') {
                    console.error("[Proxy] Server error:", data);
                    throw new Error(`Proxy Error: ${data.message || 'Unknown proxy error'}`);
                }

                // Cek apakah ini error dari Gemini API
                if (data?.error) {
                    console.error("[Proxy] Gemini API Error:", data);
                    throw new Error(`API Error: ${data.error.message || data.error || 'Unknown API error'}`);
                }

                return data;
            };

            const getCreativePlan = async () => {
                const description = document.getElementById('productDescription')?.value || 'Produk';
                const isFashion = selectedStyle === 'runway-mode' || selectedStyle === 'editorial-shots';
                const storyFlow = storyFlows[selectedStyle] || [];
                const storyFlowString = JSON.stringify(storyFlow.map(s => s.label));

                let locationInstruction = "Deskripsi satu lokasi/latar yang spesifik dan konsisten (contoh: 'di dalam dapur modern yang terang dengan kabinet putih').";
                if (isFashion && uploadedFiles.backgroundImage) {
                    locationInstruction = "Gunakan gambar latar yang diunggah sebagai dasar untuk deskripsi lokasi. Deskripsikan adegan seolah-olah model berada di dalam lokasi tersebut (photocompositing).";
                }

                const fashionShowInstruction = selectedStyle === 'runway-mode'
                    ? `Untuk prompt Runway Mode, RANCANG HANYA SATU PROMPT DASAR. Prompt ini harus mendeskripsikan model yang mengenakan pakaian dasar netral (seperti celana hitam), berjalan di atas treadmill datar dengan latar belakang sesuai 'Master Scene'. Kamera harus statis seolah-olah di tripod. Aksi model hanya 'berjalan perlahan di atas treadmill ke arah kamera'. Prompt ini akan digunakan untuk semua gambar pakaian.`
                    : 'Berdasarkan "Master Scene" dan alur cerita, tulis LIMA prompt gambar yang siap pakai. Setiap prompt harus deskriptif, naratif, dan menggabungkan semua detail dari Master Scene untuk konsistensi.';

                const promptText = `
        Anda adalah seorang sutradara dan penulis naskah AI. Tugas Anda adalah membuat rencana kreatif lengkap untuk sebuah video iklan pendek.
        INPUT:
        - Gaya Video: "${selectedStyle}"
        - Deskripsi Produk: "${description}"
        - Alur Cerita yang Diinginkan: ${storyFlowString}

        TUGAS:
        1.  **Buat Master Scene:** Deskripsikan SATU "Master Scene" yang akan menjadi dasar konsistensi. Deskripsinya harus SANGAT DETAIL dan mencakup:
            - **Karakter:** Deskripsi detail satu karakter (wajah, rambut, etnis, usia).
            - **Pakaian (WAJIB):** Deskripsikan SATU set pakaian spesifik yang akan ia kenakan di semua adegan (contoh: 'mengenakan kemeja biru tua dan celana chino khaki'). Untuk Fashion Show, pakaian dasar adalah 'mengenakan celana hitam polos'.
            - **Lokasi:** ${locationInstruction}
        2.  **Buat Naskah Video:** Tulis naskah TikTok **tepat 50 kata**. Biarkan kosong jika ini mode fashion.
        3.  **Rancang Prompt Gambar (PALING PENTING):** ${fashionShowInstruction} Pastikan setiap prompt menyertakan perintah teknis: 'ultra-realistic, hyper-detailed 4K photo, professional camera shot, 9:16 portrait'. Pastikan produk utama (dari gambar yang diunggah) ditampilkan dengan jelas, kecuali adegan "The Problem". Untuk Runway Mode, AI harus dengan jelas "memakaikan" pakaian dari gambar referensi ke model, tanpa menambahkan item lain seperti jaket atau luaran.

        OUTPUT (HANYA FORMAT JSON YANG VALID):
        {
          "masterScene": { "character": "...", "outfit": "...", "location": "..." },
          "tiktokScript": "${isFashion ? "" : "Naskah video lengkap di sini..."}",
          "shotPrompts": [ "Prompt 1...", "Prompt 2...", "Prompt 3...", "Prompt 4...", "Prompt 5..." ]
        }`;

                const payload = { contents: [{ parts: [{ text: promptText }] }] };
                if (uploadedFiles.productImage) payload.contents[0].parts.push({ inlineData: { mimeType: uploadedFiles.productImage.type, data: uploadedFiles.productImage.base64 } });
                if (uploadedFiles.modelImage) payload.contents[0].parts.push({ inlineData: { mimeType: uploadedFiles.modelImage.type, data: uploadedFiles.modelImage.base64 } });
                if (isFashion && uploadedFiles.backgroundImage) payload.contents[0].parts.push({ inlineData: { mimeType: uploadedFiles.backgroundImage.type, data: uploadedFiles.backgroundImage.base64 } });

                try {
                    const result = await apiCall('text', payload);
                    const textResponse = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const jsonResponse = JSON.parse(textResponse);
                    if (!jsonResponse.masterScene || !jsonResponse.shotPrompts || jsonResponse.shotPrompts.length === 0) throw new Error("Struktur Rencana Kreatif dari AI tidak valid.");
                    generatedContent.masterScene = jsonResponse.masterScene;
                    generatedContent.masterScene.tiktokScript = jsonResponse.tiktokScript;
                    generatedContent.shotPrompts = jsonResponse.shotPrompts;
                } catch (e) {
                    console.error("Gagal memproses Rencana Kreatif dari AI:", e);
                    throw new Error("Gagal membuat rencana kreatif dari AI. Coba lagi.");
                }
            };

            const getAnimationPrompt = async (generatedImage) => {
                if (!generatedImage || !generatedImage.success) return null;
                const promptText = `Lihat gambar ini. Buat satu saran prompt video yang menggabungkan SATU gerakan kamera (contoh: 'Kamera dolly in') DENGAN SATU gerakan objek/karakter (contoh: 'karakter tersenyum'). Jaga agar tetap singkat dan to the point. OUTPUT (HANYA FORMAT JSON YANG VALID): {"videoPrompt": "..."}`;
                const payload = { contents: [{ parts: [{ text: promptText }, { inlineData: { mimeType: 'image/png', data: generatedImage.base64.split(',')[1] } }] }] };
                try {
                    const result = await apiCall('text', payload);
                    const textResponse = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(textResponse).videoPrompt;
                } catch (error) {
                    console.error("Gagal membuat saran animasi:", error);
                    return "Kamera dolly in, karakter tersenyum.";
                }
            };

            const displayResults = () => {
                const isFashion = selectedStyle === 'runway-mode' || selectedStyle === 'editorial-shots';
                const isImageEditMode = ['foto-produk', 'virtual-try-on', 'pov-tangan'].includes(selectedStyle);

                dom.placeholderOutput.classList.add('hidden');
                dom.visualSection.classList.remove('hidden');

                if (!isImageEditMode) {
                    dom.scriptPlaceholderOutput.classList.add('hidden');
                    dom.col3Content.classList.remove('hidden');

                    dom.scriptSection.classList.toggle('hidden', isFashion);
                    dom.scriptAudioSection.classList.toggle('hidden', isFashion);

                    if (!isFashion) {
                        dom.generatedScriptEl.value = generatedContent.masterScene?.tiktokScript || "";
                    }
                }

                dom.imageGrid.innerHTML = '';
                const successfulImages = generatedContent.images.filter(img => img.success);

                if (successfulImages.length === 0) {
                    showToast('Tidak ada gambar yang berhasil dibuat.', true);
                    dom.visualSection.classList.add('hidden');
                } else {
                    showToast(`Berhasil membuat ${successfulImages.length} gambar!`);
                }

                const aspectClassMap = {
                    "9:16": "aspect-[9/16]",
                    "1:1": "aspect-[1/1]",
                    "16:9": "aspect-[16/9]"
                };
                const aspectClass = aspectClassMap[selectedAspectRatio] || "aspect-[9/16]";

                successfulImages.forEach((img, i) => {
                    const itemWrapper = document.createElement('div');
                    itemWrapper.className = "relative group";
                    const downloadFilename = `gambar_${selectedAspectRatio.replace(':', 'x')}_${i + 1}.png`;
                    itemWrapper.innerHTML = `
                <div class="bg-gray-100 rounded-lg overflow-hidden ${aspectClass} border border-gray-200"> 
                    <img src="${img.base64}" class="w-full h-full object-cover">
                </div>
                <a href="${img.base64}" download="${downloadFilename}" class="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80" title="Unduh Gambar ${selectedAspectRatio}">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
                <p class="text-xs text-gray-500 mt-2 text-center truncate px-1" title="${img.videoPrompt || ''}">${img.videoPrompt || ''}</p>
            `;
                    dom.imageGrid.appendChild(itemWrapper);
                });
            };

            const generateStoryImages = async () => {
                const images = [];
                let prompts;

                if (selectedStyle === 'runway-mode') {
                    if (!uploadedFiles.fashionItems || uploadedFiles.fashionItems.length === 0) throw new Error("Unggah setidaknya satu fashion item.");
                    const basePrompt = generatedContent.shotPrompts[0];
                    prompts = uploadedFiles.fashionItems.map(item => `${basePrompt} Model sekarang mengenakan pakaian utama (kaos, kemeja, dll) dari gambar referensi, dan HANYA pakaian itu, tanpa tambahan luaran atau jaket.`);
                } else {
                    prompts = generatedContent.shotPrompts;
                }

                generatedContent.images = [];

                for (let i = 0; i < prompts.length; i++) {
                    const item = (selectedStyle === 'runway-mode') ? uploadedFiles.fashionItems[i] : null;
                    const imageResult = await generateSingleImage(prompts[i], i + 1, prompts.length, item);

                    if (imageResult.success && selectedStyle !== 'runway-mode') {
                        imageResult.videoPrompt = await getAnimationPrompt(imageResult);
                    } else if (imageResult.success && selectedStyle === 'runway-mode') {
                        imageResult.videoPrompt = "Kamera statis, model berjalan di treadmill.";
                    }
                    generatedContent.images.push(imageResult);
                }
            };

            const generateSingleImage = async (prompt, index, total, fashionItem = null) => {
                const maxRetries = 3;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        showLoading(`Membuat gambar ${index}/${total} (Percobaan ${attempt})...`);
                        console.log(`Executing prompt for image ${index} (Attempt ${attempt}):`, prompt);

                        const payload = {
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                responseModalities: ['TEXT', 'IMAGE'],
                            }
                        };
                        const parts = payload.contents[0].parts;

                        const isProblemShot = (storyFlows[selectedStyle] && storyFlows[selectedStyle][index - 1]?.id === 'problem');

                        if (uploadedFiles.modelImage) parts.push({ inlineData: { mimeType: uploadedFiles.modelImage.type, data: uploadedFiles.modelImage.base64 } });

                        if (fashionItem) {
                            parts.push({ inlineData: { mimeType: fashionItem.type, data: fashionItem.base64 } });
                        } else if (!isProblemShot && uploadedFiles.productImage) {
                            parts.push({ inlineData: { mimeType: uploadedFiles.productImage.type, data: uploadedFiles.productImage.base64 } });
                        }

                        const result = await apiCall('image', payload);
                        const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

                        if (!imagePart || !imagePart.inlineData.data) {
                            console.warn(`Percobaan ${attempt} untuk gambar ${index} tidak menghasilkan data gambar. Respon:`, result);
                            throw new Error('API tidak mengembalikan data gambar.');
                        }

                        const originalBase64Data = `data:image/png;base64,${imagePart.inlineData.data}`;

                        showLoading(`Memproses & memotong gambar ${index}/${total} ke ${selectedAspectRatio}...`);
                        const croppedBase64Data = await cropImageToRatio(originalBase64Data, selectedAspectRatio);

                        return { base64: croppedBase64Data, success: true, label: `Adegan ${index}` };

                    } catch (error) {
                        console.error(`Gagal membuat gambar ${index} percobaan ${attempt}/${maxRetries}:`, error);

                        if (attempt === maxRetries) {
                            showToast(`Gagal total membuat gambar ${index}.`, true);
                            return { base64: null, success: false, error: `Gagal total membuat gambar ${index}.`, label: `Adegan ${index}` };
                        }
                        console.warn(`Gagal membuat gambar ${index}, mencoba lagi...`);
                    }
                }
                return { base64: null, success: false, error: `Gagal total membuat gambar ${index}.`, label: `Adegan ${index}` };
            };

            const startGenerationProcess = async () => {
                if (!selectedAspectRatio) {
                    showToast('Pilih rasio aspek terlebih dahulu.', true);
                    return;
                }

                dom.ratioModalOverlay.classList.add('hidden');

                dom.visualSection.classList.add('hidden');
                if (dom.col3Content) dom.col3Content.classList.add('hidden');
                dom.placeholderOutput.classList.remove('hidden');
                dom.scriptPlaceholderOutput.classList.remove('hidden');

                generatedContent = { masterScene: null, images: [], audio: null, shotPrompts: [] };
                const isImageEditMode = ['foto-produk', 'virtual-try-on', 'pov-tangan'].includes(selectedStyle);

                try {
                    if (isImageEditMode) {
                        showLoading('Memproses gambar dengan AI...');

                        let basePrompt = "";
                        if (selectedStyle === 'foto-produk') {
                            const setting = document.getElementById('settingInput')?.value || "studio netral";
                            basePrompt = `Professional product photography of this product. Setting: ${setting}. High quality, 8k, cinematic lighting. Ensure variety in angles and composition for each generated image.`;
                        } else if (selectedStyle === 'virtual-try-on') {
                            const promptVal = document.getElementById('promptInput')?.value || "model studio";
                            basePrompt = `Model wearing this product. ${promptVal}`;
                        } else if (selectedStyle === 'pov-tangan') {
                            const setting = document.getElementById('settingInput')?.value || "latar buram";
                            basePrompt = `POV shot of a hand holding this product. ${setting}. Realistic.`;
                        }

                        generatedContent.shotPrompts = [
                            basePrompt + " (Variation 1, angle 1)",
                            basePrompt + " (Variation 2, angle 2)",
                            basePrompt + " (Variation 3, angle 3)",
                            basePrompt + " (Variation 4, close up)"
                        ];

                        await generateStoryImages();
                        displayResults();

                    } else {
                        showLoading('Menganalisis & merancang rencana kreatif...');
                        await getCreativePlan();

                        showLoading('Membuat alur cerita visual...');
                        await generateStoryImages();

                        displayResults();
                    }
                } catch (error) {
                    showToast(`Proses gagal: ${error.message}`, true);
                } finally {
                    hideLoading();
                }
            };

            dom.generateBtn.addEventListener('click', () => {
                if (!selectedStyle) {
                    showToast('Pilih gaya konten terlebih dahulu.', true);
                    return;
                }

                selectedAspectRatio = null;
                dom.ratioSelectBtns.forEach(btn => btn.classList.remove('selected'));
                dom.confirmGenerateBtn.classList.add('hidden');
                dom.ratioModalOverlay.classList.remove('hidden');
            });

            dom.ratioSelectBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedAspectRatio = btn.dataset.ratio;
                    dom.ratioSelectBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    dom.confirmGenerateBtn.classList.remove('hidden');
                });
            });

            dom.cancelRatioBtn.addEventListener('click', () => {
                dom.ratioModalOverlay.classList.add('hidden');
            });

            dom.confirmGenerateBtn.addEventListener('click', startGenerationProcess);

            dom.ttsBtn.addEventListener('click', async () => {
                const script = dom.generatedScriptEl.value;
                if (!script) { showToast('Naskah kosong.', true); return; }

                dom.ttsBtn.disabled = true;
                dom.ttsBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Membuat Audio...`;
                dom.ttsBtn.classList.add('inline-flex', 'items-center', 'justify-center');
                dom.audioPlayerControls.classList.add('hidden');

                try {
                    const payload = { contents: [{ parts: [{ text: `Ucapkan dengan gaya natural, hangat, dan antusias: "${script}"` }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: dom.ttsVoiceSelect.value } } } }, model: "gemini-2.5-flash-preview-tts" };
                    const result = await apiCall('tts', payload);
                    const audioPart = result?.candidates?.[0]?.content?.parts?.[0];
                    if (audioPart?.inlineData?.data) {
                        const sampleRate = parseInt(audioPart.inlineData.mimeType.match(/rate=(\d+)/)[1], 10);
                        const pcmData = base64ToArrayBuffer(audioPart.inlineData.data);
                        const wavBlob = pcmToWav(new Int16Array(pcmData), 1, sampleRate);
                        const audioUrl = URL.createObjectURL(wavBlob);
                        generatedContent.audio = { blob: wavBlob };
                        dom.audioPlayer.src = audioUrl;
                        dom.audioPlayerControls.classList.remove('hidden');
                        dom.downloadAudioBtn.classList.remove('hidden');
                    } else throw new Error('Data audio tidak valid.');
                } catch (error) { showToast(`Gagal membuat audio: ${error.message}`, true); }
                finally {
                    dom.ttsBtn.disabled = false;
                    dom.ttsBtn.innerHTML = 'Buat Audio';
                    dom.ttsBtn.classList.remove('inline-flex', 'items-center', 'justify-center');
                }
            });

            dom.playAudioBtn.addEventListener('click', () => {
                if (dom.audioPlayer.paused) {
                    dom.audioPlayer.play();
                    dom.playIcon.classList.add('hidden');
                    dom.pauseIcon.classList.remove('hidden');
                } else {
                    dom.audioPlayer.pause();
                    dom.playIcon.classList.remove('hidden');
                    dom.pauseIcon.classList.add('hidden');
                }
            });
            dom.audioPlayer.onended = () => {
                dom.playIcon.classList.remove('hidden');
                dom.pauseIcon.classList.add('hidden');
            };

            dom.downloadAudioBtn.addEventListener('click', () => {
                if (!generatedContent.audio || !generatedContent.audio.blob) {
                    return showToast('Audio belum dibuat.', true);
                }
                const link = document.createElement('a');
                link.href = URL.createObjectURL(generatedContent.audio.blob);
                link.download = "audio.wav";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            dom.downloadBtn.addEventListener('click', () => {
                const successfulImages = generatedContent.images.filter(img => img.success);
                if (successfulImages.length === 0) {
                    return showToast('Tidak ada gambar untuk diunduh.', true);
                }

                successfulImages.forEach((img, i) => {
                    const link = document.createElement('a');
                    link.href = img.base64;
                    link.download = `adegan_${selectedAspectRatio.replace(':', 'x')}_${i + 1}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            });

            dom.downloadPromptsBtn.addEventListener('click', () => {
                if (generatedContent.shotPrompts.length === 0) {
                    return showToast('Tidak ada prompt untuk diunduh.', true);
                }

                let textContent = `--- PROMPT MASTER ---\n`;
                textContent += `Karakter: ${generatedContent.masterScene?.character || 'N/A'}\n`;
                textContent += `Pakaian: ${generatedContent.masterScene?.outfit || 'N/A'}\n`;
                textContent += `Lokasi: ${generatedContent.masterScene?.location || 'N/A'}\n\n`;

                textContent += `--- NASKAH VIDEO ---\n`;
                textContent += `${generatedContent.masterScene?.tiktokScript || 'N/A'}\n\n`;

                textContent += `--- PROMPT ADEGAN ---\n`;
                generatedContent.shotPrompts.forEach((prompt, i) => {
                    textContent += `Adegan ${i + 1}:\n${prompt}\n\n`;
                });

                textContent += `--- SARAN PROMPT VIDEO (Animasi) ---\n`;
                generatedContent.images.filter(img => img.success && img.videoPrompt).forEach((img, i) => {
                    textContent += `Adegan ${i + 1}: ${img.videoPrompt}\n`;
                });

                const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = "prompts_konten.txt";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            dom.styleCards.forEach(card => {
                card.addEventListener('click', () => {
                    updateUIForStyle(card.dataset.style);
                });
            });

            function base64ToArrayBuffer(base64) {
                const binary_string = atob(base64);
                const len = binary_string.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binary_string.charCodeAt(i);
                }
                return bytes.buffer;
            }

            function pcmToWav(pcmData, numChannels, sampleRate) {
                const buffer = new ArrayBuffer(44 + pcmData.byteLength);
                const view = new DataView(buffer);
                const writeString = (v, o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
                const blockAlign = numChannels * 2;
                writeString(view, 0, 'RIFF');
                view.setUint32(4, 36 + pcmData.byteLength, true);
                writeString(view, 8, 'WAVE');
                writeString(view, 12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                view.setUint16(22, numChannels, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * blockAlign, true);
                view.setUint16(32, blockAlign, true);
                view.setUint16(34, 16, true);
                writeString(view, 36, 'data');
                view.setUint32(40, pcmData.byteLength, true);
                new Int16Array(buffer, 44).set(pcmData);
                return new Blob([view], { type: 'audio/wav' });
            }

            const getAssetCollectionRef = () => {
                if (!db || !userId) return null;
                return collection(db, 'artifacts', appId, 'users', userId, 'assets');
            };

            const openLibraryModal = (targetInputId, assetType) => {
                currentAssetTargetInput = targetInputId;

                dom.libraryTabs.querySelectorAll('button').forEach(tab => {
                    tab.classList.toggle('selected', tab.dataset.assetType === assetType);
                });

                dom.libraryModalOverlay.classList.remove('hidden');
                loadAssetLibrary();
            };

            const loadAssetLibrary = () => {
                if (!userId) return;

                if (assetUnsubscribe) assetUnsubscribe();

                const activeTab = dom.libraryTabs.querySelector('button.selected');
                const assetType = activeTab ? activeTab.dataset.assetType : 'product';

                dom.libraryGrid.innerHTML = '';
                dom.libraryPlaceholder.classList.remove('hidden');

                const colRef = getAssetCollectionRef();
                if (!colRef) return;

                const q = query(colRef);

                assetUnsubscribe = onSnapshot(q, (snapshot) => {
                    const assets = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.type === assetType) {
                            assets.push({ id: doc.id, ...data });
                        }
                    });

                    if (assets.length > 0) {
                        dom.libraryPlaceholder.classList.add('hidden');
                        dom.libraryGrid.innerHTML = assets.map(asset => `
                    <div class="asset-card bg-gray-100 rounded-lg overflow-hidden cursor-pointer aspect-[1/1]" 
                         data-base64="${asset.base64}" 
                         data-name="${asset.name}">
                        <img src="${asset.base64}" class="w-full h-full object-cover" alt="${asset.name}">
                    </div>
                `).join('');

                        dom.libraryGrid.querySelectorAll('.asset-card').forEach(card => {
                            card.addEventListener('click', selectAssetFromLibrary);
                        });

                    } else {
                        dom.libraryPlaceholder.classList.remove('hidden');
                        dom.libraryGrid.innerHTML = '';
                    }
                }, (error) => {
                    console.error("Error loading assets: ", error);
                    showToast("Gagal memuat pustaka aset.", true);
                });
            };

            const selectAssetFromLibrary = (event) => {
                const card = event.currentTarget;
                const dataUrl = card.dataset.base64;
                const name = card.dataset.name;

                if (!dataUrl || !currentAssetTargetInput) return;

                const base64Data = dataUrl.split(',')[1];
                const mimeTypeMatch = dataUrl.match(/data:(.*?);/);
                const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

                uploadedFiles[currentAssetTargetInput] = { name: name, type: mimeType, base64: base64Data };

                const previewEl = document.getElementById(`preview-${currentAssetTargetInput}`);
                if (previewEl) {
                    previewEl.innerHTML = `<img src="${dataUrl}" class="file-preview rounded-md">`;
                }

                dom.libraryModalOverlay.classList.add('hidden');
                currentAssetTargetInput = null;
            };

            const handleUploadToLibrary = async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const activeTab = dom.libraryTabs.querySelector('button.selected');
                const assetType = activeTab ? activeTab.dataset.assetType : 'product';

                showLoading("Mengunggah ke pustaka...");
                try {
                    const dataUrl = await fileToDataURL(file, LIBRARY_MAX_FILE_SIZE);

                    const colRef = getAssetCollectionRef();
                    if (!colRef) throw new Error("Koneksi database belum siap.");

                    await addDoc(colRef, {
                        type: assetType,
                        name: file.name,
                        base64: dataUrl,
                        createdAt: serverTimestamp()
                    });

                    showToast("Aset berhasil disimpan!");

                } catch (error) {
                    showToast(`Gagal menyimpan: ${error.message}`, true);
                } finally {
                    hideLoading();
                    event.target.value = null;
                }
            };

            dom.openLibraryBtn.addEventListener('click', () => {
                openLibraryModal(null, 'product');
            });
            dom.closeLibraryBtn.addEventListener('click', () => {
                dom.libraryModalOverlay.classList.add('hidden');
                if (assetUnsubscribe) assetUnsubscribe();
            });
            dom.libraryUploadBtn.addEventListener('click', () => {
                dom.libraryUploadInput.click();
            });
            dom.libraryUploadInput.addEventListener('change', handleUploadToLibrary);
            dom.libraryTabs.querySelectorAll('button').forEach(tab => {
                tab.addEventListener('click', () => {
                    dom.libraryTabs.querySelectorAll('button').forEach(t => t.classList.remove('selected'));
                    tab.classList.add('selected');
                    loadAssetLibrary();
                });
            });

            const initializeFirebase = async () => {
                try {
                    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
                    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

                    if (!firebaseConfig.apiKey) {
                        console.error("Firebase config not found.");
                        showToast("Gagal terhubung ke database.", true);
                        return;
                    }

                    const app = initializeApp(firebaseConfig);
                    db = getFirestore(app);
                    auth = getAuth(app);
                    setLogLevel('Debug');

                    onAuthStateChanged(auth, (user) => {
                        if (user) {
                            console.log("User authenticated:", user.uid);
                            userId = user.uid;
                        } else {
                            console.log("No user signed in.");
                            userId = null;
                        }
                    });

                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                        console.log("Signed in with custom token.");
                    } else {
                        await signInAnonymously(auth);
                        console.log("Signed in anonymously.");
                    }

                } catch (error) {
                    console.error("Firebase Initialization Error:", error);
                    showToast(`Error koneksi database: ${error.message}`, true);
                }
            };

            dom.ttsVoiceSelect.innerHTML = ttsVoices.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
            initializeFirebase();
        });
    