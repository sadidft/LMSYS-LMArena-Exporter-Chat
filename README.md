# Arena.ai Chat Exporter - Sebelumnya LMArena.ai

JavaScript utility untuk mengekspor percakapan chat dari [arena.ai](https://arena.ai) (sebelumnya LMArena) ke format Markdown yang rapi dan informatif. Script ini berjalan langsung di browser console, secara otomatis mendeteksi pesan user dan assistant (lengkap dengan nama model), mengekstrak bagian *thinking* jika ada, lalu menyalin hasilnya ke clipboard.

## ✨ Fitur Unggulan

- ✅ Mendukung **ketiga mode chat** arena.ai: **Direct**, **Battle**, dan **Side by Side**.
- ✅ **Deteksi cerdas** pesan user dan assistant berdasarkan struktur HTML terkini (bukan tebakan urutan).
- ✅ **Nama model** untuk setiap balasan assistant diambil langsung dari header pesan – tetap akurat meskipun model berganti di tengah percakapan.
- ✅ **Ekstraksi konten thinking** (bagian "Thought for …") jika tombolnya sudah diklik sebelumnya.
- ✅ **Pembersihan konten otomatis** (whitespace berlebih, line break, dll.) sehingga hasil Markdown tetap bersih.
- ✅ **Penyalinan otomatis ke clipboard** dengan fallback manual jika gagal.
- ✅ Urutan pesan **kronologis** (dari paling lama ke terbaru).
- ✅ Informasi tambahan: **mode chat**, **tanggal ekspor**, **total pesan**.
- ✅ **Mudah digunakan** – cukup paste di console browser.

## 🚀 Cara Penggunaan

### Langkah 1: Buka Chat di arena.ai
Navigasi ke percakapan yang ingin diekspor.  
**Pastikan semua pesan sudah termuat** (scroll ke atas untuk memuat pesan lama).  
Jika Anda ingin menyertakan konten *thinking*, **klik setiap tombol "Thought for …"** untuk memperluasnya.

### Langkah 2: Buka Browser Console
- **Chrome/Edge**: `F12` atau `Ctrl+Shift+I` → pilih tab **Console**
- **Firefox**: `F12` atau `Ctrl+Shift+K`
- **Safari**: `Cmd+Option+I` (aktifkan Developer Menu di Preferences)

### Langkah 3: Jalankan Script
Copy seluruh kode di bawah ini, paste ke console, lalu tekan **Enter**.

```
(function() {
    'use strict';

    console.log('🚀 arena.ai Chat Exporter — UNLIMITED Edition');

    function getMode() {
        const btn = document.querySelector('button[role="combobox"] p.text-base.font-normal');
        return btn ? btn.innerText.trim() : 'Unknown';
    }

    function extractThinking(container) {
        const thoughtBtn = Array.from(container.querySelectorAll('button')).find(b =>
            b.textContent.includes('Thought for')
        );
        if (!thoughtBtn) return null;
        const targetId = thoughtBtn.getAttribute('aria-controls');
        if (!targetId) return null;
        const contentDiv = document.getElementById(targetId);
        if (!contentDiv) return null;
        return contentDiv.innerText.trim().replace(/\n{3,}/g, '\n\n');
    }

    function getModelName(container) {
        const s = container.querySelector('span.truncate');
        return s ? s.innerText.trim() : 'Unknown Model';
    }

    function getMessageContent(container) {
        const prose = container.querySelector('.prose');
        if (!prose) return '';
        return prose.innerText.trim()
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/gm, '');
    }

    function buildMarkdown() {
        const assistantSel = 'div.bg-surface-primary';
        const userSel = 'div.bg-surface-raised';
        const containers = Array.from(document.querySelectorAll(`${assistantSel}, ${userSel}`));

        if (containers.length === 0) {
            alert('❌ Tidak ada pesan ditemukan.');
            return null;
        }

        containers.reverse();

        const messages = [];
        let uIdx = 1, aIdx = 1;

        containers.forEach(c => {
            const isAssistant = c.querySelector('.sticky.top-0') !== null;
            if (isAssistant) {
                messages.push({
                    role: 'assistant',
                    model: getModelName(c),
                    content: getMessageContent(c),
                    thinking: extractThinking(c),
                    index: aIdx++
                });
            } else {
                messages.push({
                    role: 'user',
                    content: getMessageContent(c),
                    index: uIdx++
                });
            }
        });

        const mode = getMode();
        const date = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const totalChars = messages.reduce((s, m) => s + (m.content || '').length + (m.thinking || '').length, 0);

        let md = `# Chat Export from arena.ai\n\n`;
        md += `**Mode:** ${mode}\n`;
        md += `**Export Date:** ${date}\n`;
        md += `**Total Messages:** ${messages.length}\n`;
        md += `**Total Characters:** ${totalChars.toLocaleString()}\n\n---\n\n`;

        messages.forEach(m => {
            if (m.role === 'user') {
                md += `## 👤 User (${m.index})\n\n${m.content}\n\n---\n\n`;
            } else {
                md += `## 🤖 Assistant (${m.index}) — **${m.model}**\n\n`;
                if (m.thinking) md += `**Thinking:**\n\n${m.thinking}\n\n`;
                md += `${m.content}\n\n---\n\n`;
            }
        });

        md += `*Exported with arena.ai Chat Exporter — UNLIMITED*`;

        console.log(`📦 ${messages.length} pesan, ${totalChars.toLocaleString()} karakter total`);
        return { markdown: md, count: messages.length, chars: totalChars };
    }

    // ============================================
    //  METODE 1: Clipboard API (tanpa batas)
    // ============================================
    async function copyViaClipboardAPI(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    }

    // ============================================
    //  METODE 2: Blob + ClipboardItem (tanpa batas)
    // ============================================
    async function copyViaBlob(text) {
        try {
            const blob = new Blob([text], { type: 'text/plain' });
            const item = new ClipboardItem({ 'text/plain': blob });
            await navigator.clipboard.write([item]);
            return true;
        } catch {
            return false;
        }
    }

    // ============================================
    //  METODE 3: Download sebagai file .md
    // ============================================
    function downloadAsFile(text, filename) {
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    }

    // ============================================
    //  METODE 4: Buka di tab baru (select all + copy manual)
    // ============================================
    function openInNewTab(text) {
        const w = window.open('', '_blank');
        if (!w) return false;
        w.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Chat Export</title>
                <style>
                    body {
                        background: #0d1117; color: #e6edf3;
                        font-family: 'Courier New', monospace;
                        padding: 20px; margin: 0;
                        white-space: pre-wrap; word-wrap: break-word;
                    }
                    .toolbar {
                        position: fixed; top: 0; left: 0; right: 0;
                        background: #161b22; padding: 12px 20px;
                        border-bottom: 1px solid #30363d;
                        display: flex; gap: 10px; align-items: center;
                        z-index: 9999;
                    }
                    .toolbar button {
                        background: #238636; color: white;
                        border: none; padding: 8px 16px;
                        border-radius: 6px; cursor: pointer;
                        font-size: 14px; font-weight: 600;
                    }
                    .toolbar button:hover { background: #2ea043; }
                    .toolbar button.secondary {
                        background: #30363d;
                    }
                    .toolbar button.secondary:hover { background: #484f58; }
                    .toolbar span { color: #8b949e; font-size: 13px; }
                    #content { margin-top: 60px; }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <button onclick="copyAll()">📋 Copy Semua</button>
                    <button class="secondary" onclick="selectAll()">🔍 Select All</button>
                    <button class="secondary" onclick="downloadMd()">💾 Download .md</button>
                    <span id="status"></span>
                </div>
                <div id="content"></div>
                <script>
                    const fullText = document.getElementById('content').innerText;

                    async function copyAll() {
                        try {
                            await navigator.clipboard.writeText(fullText);
                            document.getElementById('status').textContent = '✅ Berhasil dicopy!';
                        } catch(e) {
                            selectAll();
                            document.getElementById('status').textContent = '⚠️ Tekan Ctrl+C untuk copy';
                        }
                    }

                    function selectAll() {
                        const range = document.createRange();
                        range.selectNodeContents(document.getElementById('content'));
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }

                    function downloadMd() {
                        const blob = new Blob([fullText], {type:'text/markdown'});
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'chat-export.md';
                        a.click();
                    }
                <\/script>
            </body>
            </html>
        `);
        w.document.getElementById('content').textContent = text;
        w.document.close();
        return true;
    }

    // ============================================
    //  MAIN: Coba semua metode berurutan
    // ============================================
    async function exportChat() {
        const result = buildMarkdown();
        if (!result) return;

        const { markdown, count, chars } = result;
        const sizeMB = (new Blob([markdown]).size / 1024 / 1024).toFixed(2);

        console.log(`📄 Markdown: ${markdown.length.toLocaleString()} chars, ~${sizeMB} MB`);

        // Simpan ke window supaya bisa diakses manual dari console
        window.__CHAT_EXPORT__ = markdown;
        console.log('💡 Teks juga tersimpan di: window.__CHAT_EXPORT__');

        // Coba Metode 1: Clipboard API
        let copied = await copyViaClipboardAPI(markdown);
        if (copied) {
            alert(
                `✅ BERHASIL DICOPY KE CLIPBOARD!\n\n` +
                `📦 ${count} pesan\n` +
                `📝 ${chars.toLocaleString()} karakter\n` +
                `💾 ~${sizeMB} MB\n\n` +
                `Langsung Ctrl+V untuk paste.`
            );
            return;
        }

        // Coba Metode 2: Blob clipboard
        copied = await copyViaBlob(markdown);
        if (copied) {
            alert(
                `✅ BERHASIL DICOPY KE CLIPBOARD!\n\n` +
                `📦 ${count} pesan\n` +
                `📝 ${chars.toLocaleString()} karakter\n` +
                `💾 ~${sizeMB} MB`
            );
            return;
        }

        // Clipboard gagal — tawarkan alternatif
        console.warn('⚠️ Clipboard API tidak tersedia, membuka alternatif...');

        const choice = confirm(
            `⚠️ Clipboard tidak bisa diakses langsung.\n\n` +
            `📦 ${count} pesan, ${chars.toLocaleString()} karakter (~${sizeMB} MB)\n\n` +
            `Klik OK  → Buka di tab baru (bisa copy dari sana)\n` +
            `Klik Cancel → Download sebagai file .md`
        );

        if (choice) {
            const opened = openInNewTab(markdown);
            if (!opened) {
                alert('Pop-up diblokir! Mendownload sebagai file...');
                downloadAsFile(markdown, `chat-export-${Date.now()}.md`);
            }
        } else {
            downloadAsFile(markdown, `chat-export-${Date.now()}.md`);
            alert(`✅ File sedang didownload!\n\n📄 chat-export-${Date.now()}.md`);
        }
    }

    // ============================================
    //  START
    // ============================================
    if (confirm(
        '🚀 Export SEMUA chat dari arena.ai?\n\n' +
        '✅ Tanpa batas karakter\n' +
        '✅ Multi-metode (clipboard / file / tab baru)\n' +
        '✅ Backup otomatis di console\n\n' +
        'Pastikan semua pesan sudah termuat!'
    )) {
        exportChat();
    }

})();
```

### Langkah 4: Konfirmasi dan Hasil
- Klik **OK** pada dialog konfirmasi.
- Script akan bekerja beberapa detik, lalu muncul notifikasi sukses.
- Hasil ekspor sudah tersalin ke clipboard.
- Buka editor teks (Notepad, VS Code, Obsidian, dll.) dan tekan **Ctrl+V** (atau **Cmd+V** di Mac) untuk melihat hasil Markdown.

## 📄 Contoh Format Output

```markdown
# Chat Export from arena.ai

**Mode:** Battle
**Export Date:** 3 Maret 2026 14.32.10
**Total Messages:** 5

---

## 👤 User (1)

Halo!! Test! i dari malaysia, you from?
ape model ai yang kau nak pake tu??

---

## 🤖 Assistant (1) — **claude-sonnet-4-5-20250929**

Halo! 👋

Saya Claude, AI assistant buatan Anthropic. ...

---

## 🤖 Assistant (2) — **pulse**

**Thinking:**

The user is asking about greetings for different regions. ...

Hai! Apa khabar, kawan dari Malaysia? ...

---

*Exported with [arena.ai Chat Exporter](https://github.com/sadidft/LMSYS-LMArena-Exporter-Chat)*
```

## 🔄 Apa yang Berbeda dari Versi Sebelumnya?

| Fitur | Versi Lama (LMArena) | Versi Baru (arena.ai) |
|-------|----------------------|------------------------|
| Deteksi user/assistant | Berdasarkan urutan genap/ganjil (rentan salah) | ✅ Berdasarkan class CSS (`bg-surface-primary` = assistant, `bg-surface-raised` = user) |
| Nama model | Tidak ditampilkan | ✅ Diambil dari `<span class="truncate">` di header pesan |
| Konten thinking | Tidak ada | ✅ Diekstrak jika tombol "Thought for …" sudah diklik |
| Mode chat | Tidak disebut | ✅ Terdeteksi dari tombol mode di pojok atas |
| Urutan pesan | Opsional dibalik (manual) | ✅ Otomatis kronologis (dari terlama ke terbaru) |
| Copy ke clipboard | `navigator.clipboard` (sering gagal di console) | ✅ Menggunakan `textarea` + `execCommand` (lebih stabil) |
| Fallback jika gagal copy | Hanya alert | ✅ Teks lengkap dicetak ke console untuk disalin manual |
| Bahasa notifikasi | Inggris | ✅ Indonesia |

## ⚠️ Error Handling & Troubleshooting

### "Tidak ada pesan ditemukan"
**Penyebab:** Halaman belum dimuat lengkap, atau struktur DOM berubah.  
**Solusi:** 
- Refresh halaman dan tunggu hingga semua pesan muncul.
- Scroll ke atas untuk memicu lazy loading.
- Pastikan Anda berada di halaman chat (bukan halaman lain).

### Bagian thinking tidak muncul
**Penyebab:** Tombol "Thought for …" tidak diklik sebelum menjalankan script.  
**Solusi:** Klik setiap tombol tersebut untuk memperluas, lalu jalankan ulang script.

### Gagal menyalin otomatis
**Penyebab:** Browser membatasi akses clipboard dari console.  
**Solusi:** 
- Hasil ekspor akan tetap dicetak ke console (lengkap).
- Anda bisa menyalinnya secara manual dari console log.

### Urutan pesan terbalik
Script sudah mengurutkan dari terlama ke terbaru. Jika Anda merasa urutan masih salah, periksa apakah Anda sudah scroll ke atas sebelum menjalankan script.

## 🌐 Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Browser berbasis Chromium lainnya

## 📌 Limitasi

- Hanya bekerja di halaman **arena.ai** dengan struktur HTML saat ini (Maret 2026). Jika arena.ai mengubah tata letak, script mungkin perlu penyesuaian.
- Tidak mendukung ekspor lampiran (gambar, file) – hanya teks.
- Konten *thinking* hanya bisa diekspor jika sudah diperluas secara manual.

## 🤝 Contributing

Kontribusi sangat diterima! Silakan buka *issue* atau kirim *pull request* melalui [repository GitHub](https://github.com/sadidft/LMSYS-LMArena-Exporter-Chat/). Pastikan untuk menguji perubahan Anda di berbagai browser sebelum mengirim PR.

## 📜 License

**MIT License** – Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan apa pun, dengan syarat mencantumkan kredit asli.

---

**Selamat mengekspor percakapan AI Anda!** 🚀
