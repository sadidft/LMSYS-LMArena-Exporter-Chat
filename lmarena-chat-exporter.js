```
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

bikin kode untuk console itu jadi tanpa batasan teks. bisa copy semua! semua! ya!! semua isi chat!!! mau berapapun itu!!!!
