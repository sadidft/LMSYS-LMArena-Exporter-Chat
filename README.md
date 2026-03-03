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

```javascript
(function() {
    'use strict';

    console.log('🚀 arena.ai Chat Exporter started');

    function getMode() {
        const modeButton = document.querySelector('button[role="combobox"] p.text-base.font-normal');
        return modeButton ? modeButton.innerText.trim() : 'Unknown';
    }

    function extractThinking(container) {
        const thoughtButton = Array.from(container.querySelectorAll('button')).find(btn =>
            btn.textContent.includes('Thought for')
        );
        if (!thoughtButton) return null;
        const targetId = thoughtButton.getAttribute('aria-controls');
        if (!targetId) return null;
        const contentDiv = document.getElementById(targetId);
        if (!contentDiv) return null;
        return contentDiv.innerText.trim().replace(/\n{3,}/g, '\n\n');
    }

    function getModelName(container) {
        const nameSpan = container.querySelector('span.truncate');
        return nameSpan ? nameSpan.innerText.trim() : 'Unknown Model';
    }

    function getMessageContent(container) {
        const prose = container.querySelector('.prose');
        if (!prose) return '';
        return prose.innerText.trim()
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\s+|\s+$/gm, '');
    }

    function exportChat() {
        console.log('🔍 Scanning for messages...');
        const assistantSelector = 'div.bg-surface-primary';
        const userSelector = 'div.bg-surface-raised';
        const containers = Array.from(document.querySelectorAll(`${assistantSelector}, ${userSelector}`));

        if (containers.length === 0) {
            console.error('❌ No message containers found. Is the chat fully loaded?');
            alert('Tidak ada pesan ditemukan. Pastikan halaman chat sudah dimuat dan coba lagi.');
            return null;
        }

        console.log(`📦 Found ${containers.length} message containers.`);
        containers.reverse(); // dari paling lama ke terbaru

        const messages = [];
        let userCounter = 1, assistantCounter = 1;

        containers.forEach(container => {
            const isAssistant = container.querySelector('.sticky.top-0') !== null;

            if (isAssistant) {
                messages.push({
                    role: 'assistant',
                    model: getModelName(container),
                    content: getMessageContent(container),
                    thinking: extractThinking(container),
                    index: assistantCounter++
                });
            } else {
                messages.push({
                    role: 'user',
                    content: getMessageContent(container),
                    index: userCounter++
                });
            }
        });

        const mode = getMode();
        const date = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        let markdown = `# Chat Export from arena.ai\n\n`;
        markdown += `**Mode:** ${mode}\n`;
        markdown += `**Export Date:** ${date}\n`;
        markdown += `**Total Messages:** ${messages.length}\n\n---\n\n`;

        messages.forEach(msg => {
            if (msg.role === 'user') {
                markdown += `## 👤 User (${msg.index})\n\n${msg.content}\n\n---\n\n`;
            } else {
                markdown += `## 🤖 Assistant (${msg.index}) — **${msg.model}**\n\n`;
                if (msg.thinking) markdown += `**Thinking:**\n\n${msg.thinking}\n\n`;
                markdown += `${msg.content}\n\n---\n\n`;
            }
        });

        markdown += `*Exported with [arena.ai Chat Exporter](https://github.com/sadidft/LMSYS-LMArena-Exporter-Chat)*`;
        copyToClipboard(markdown, messages.length);
        return messages;
    }

    function copyToClipboard(text, total) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999); // dukungan mobile
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ Copied to clipboard!');
                alert(`✅ Sukses! ${total} pesan telah disalin ke clipboard.`);
            } else {
                throw new Error('execCommand returned false');
            }
        } catch (err) {
            console.error('❌ Gagal menyalin otomatis:', err);
            console.log('📋 Silakan salin teks berikut secara manual:\n', text);
            alert('❌ Gagal menyalin otomatis. Cek console (F12) untuk mengambil teks.');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    if (confirm('Mulai ekspor chat dari arena.ai?\n\nPastikan semua pesan sudah termuat dan bagian thinking sudah diklik.')) {
        exportChat();
    } else {
        console.log('Export dibatalkan.');
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
