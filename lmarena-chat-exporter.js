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
