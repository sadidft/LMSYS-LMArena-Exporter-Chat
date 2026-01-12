# LMArena Chat Exporter

JavaScript utility untuk mengekspor percakapan chat dari LMArena ke format Markdown. Script ini berjalan di browser console dan secara otomatis mendeteksi pesan user dan assistant, kemudian menyalin hasilnya ke clipboard.

## Fitur

- Export chat LMArena ke format Markdown yang rapi
- Deteksi otomatis pesan user dan assistant berdasarkan urutan
- Pembersihan konten otomatis (whitespace, line breaks berlebihan)
- Copy otomatis ke clipboard
- Fallback manual copy jika clipboard gagal
- Opsi reverse urutan pesan
- Support berbagai selector DOM LMArena

## Cara Penggunaan

### Langkah 1: Buka Chat LMArena
Pastikan halaman chat sudah dimuat lengkap dan semua pesan terlihat.

### Langkah 2: Buka Browser Console
- **Chrome/Edge**: `F12` atau `Ctrl+Shift+I`, pilih tab "Console"
- **Firefox**: `F12` atau `Ctrl+Shift+K`
- **Safari**: `Cmd+Option+I` (aktifkan Developer Menu dulu)

### Langkah 3: Jalankan Script
Copy-paste kode berikut ke console dan tekan Enter:

```javascript
(function() {
    console.log("Starting chat export...");
    
    const exportChatMessages = () => {
        let chatMessages = [];
        
        const possibleSelectors = [
            '.prose',
            '[data-testid="message"]',
            '.message',
            '.chat-message',
            '[role="article"]',
            '.whitespace-pre-wrap'
        ];
        
        for (let i = 0; i < possibleSelectors.length; i++) {
            chatMessages = Array.from(document.querySelectorAll(possibleSelectors[i]));
            if (chatMessages.length > 0) {
                console.log(`Found ${chatMessages.length} messages using selector: ${possibleSelectors[i]}`);
                break;
            }
        }
        
        if (chatMessages.length === 0) {
            console.error("No chat messages found. Please refresh and wait for chat to load.");
            alert("No chat messages found. Make sure the page is fully loaded.");
            return;
        }

        let exportedMarkdown = "# Chat Export from LMArena\n\n";
        exportedMarkdown += "**Export Date:** " + new Date().toLocaleString('id-ID') + "\n";
        exportedMarkdown += "**Total Messages:** " + chatMessages.length + "\n\n";
        exportedMarkdown += "---\n\n";

        let userMessageCount = 1;
        let assistantMessageCount = 1;

        const needReverse = confirm("Do you want to reverse message order? (OK = Yes, Cancel = No)");
        const finalMessages = needReverse ? chatMessages.reverse() : chatMessages;

        for (let m = 0; m < finalMessages.length; m++) {
            const currentMessage = finalMessages[m];
            
            let messageText = currentMessage.innerText || currentMessage.textContent || '';
            messageText = messageText.trim();
            messageText = messageText.replace(/\n{3,}/g, '\n\n');
            messageText = messageText.replace(/^\s+|\s+$/gm, '');
            messageText = messageText.replace(/\t/g, '    ');
            messageText = messageText.replace(/^(Human:|User:|Assistant:|AI:)\s*/gm, '');
            
            if (messageText.length === 0) continue;
            
            let messageHeader = "";
            let isUserMessage = (m % 2 === 0);
            
            if (isUserMessage) {
                messageHeader = "## User (" + userMessageCount + ")";
                userMessageCount++;
            } else {
                messageHeader = "## Assistant (" + assistantMessageCount + ")";
                assistantMessageCount++;
            }
            
            exportedMarkdown += messageHeader + "\n\n" + messageText + "\n\n---\n\n";
        }

        exportedMarkdown += "*Exported using LMArena Chat Exporter*\n";
        exportedMarkdown += "*Total " + (userMessageCount + assistantMessageCount - 2) + " messages exported*";

        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = exportedMarkdown;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.left = '-9999px';
        tempTextarea.style.top = '-9999px';
        document.body.appendChild(tempTextarea);
        
        try {
            tempTextarea.select();
            tempTextarea.setSelectionRange(0, 99999);
            
            const copySuccess = document.execCommand('copy');
            
            if (copySuccess) {
                console.log("SUCCESS! Chat copied to clipboard!");
                console.log("Preview (first 500 chars):");
                console.log(exportedMarkdown.substring(0, 500) + "...");
                alert("Success! " + (userMessageCount + assistantMessageCount - 2) + " messages copied to clipboard.\n\nPaste in text editor to see markdown result.");
            } else {
                throw new Error("Copy command failed");
            }
        } catch (error) {
            console.error("Auto copy failed:", error);
            console.log("MANUAL COPY - Copy text below:");
            console.log("==================================================");
            console.log(exportedMarkdown);
            console.log("==================================================");
            alert("Auto copy failed. Check console for manual copy.");
        } finally {
            document.body.removeChild(tempTextarea);
        }

        return {
            totalMessages: userMessageCount + assistantMessageCount - 2,
            userMessages: userMessageCount - 1,
            assistantMessages: assistantMessageCount - 1,
            markdownContent: exportedMarkdown
        };
    };

    console.log("Click OK to start export...");
    
    if (confirm("Start exporting chat to markdown?\n\nMake sure chat page is fully loaded.")) {
        return exportChatMessages();
    } else {
        console.log("Export cancelled by user.");
        return null;
    }
})();
```

### Langkah 4: Konfirmasi Export
- Klik "OK" untuk memulai export
- Pilih apakah urutan pesan perlu dibalik (biasanya pilih "Cancel" untuk urutan normal)
- Chat akan otomatis disalin ke clipboard

### Langkah 5: Paste Hasil
Buka text editor atau markdown viewer, lalu paste (`Ctrl+V`) untuk melihat hasil export.

## Format Output

```markdown
# Chat Export from LMArena

**Export Date:** 12/1/2026, 16.00.40
**Total Messages:** 4

---

## User (1)

Pertanyaan atau pesan dari user...

---

## Assistant (1)

Respons dari AI assistant...

---

## User (2)

Pertanyaan berikutnya...

---

*Exported using LMArena Chat Exporter*
*Total 4 messages exported*
```

## Error Handling

### "No chat messages found"
**Penyebab:** Halaman belum dimuat lengkap atau struktur DOM berubah
**Solusi:** 
- Refresh halaman dan tunggu chat dimuat
- Scroll ke atas/bawah untuk memastikan semua pesan loaded
- Coba lagi setelah beberapa detik

### "Auto copy failed"
**Penyebab:** Browser memblokir clipboard access atau permission denied
**Solusi:**
- Hasil export akan ditampilkan di console
- Copy manual dari console log
- Pastikan browser tab dalam keadaan active/focused

### Urutan Pesan Terbalik
**Penyebab:** LMArena kadang merender pesan dengan urutan berbeda
**Solusi:** 
- Pilih "OK" saat ditanya reverse order
- Atau edit manual hasil export

### Pesan Kosong atau Tidak Lengkap
**Penyebab:** Konten pesan belum dimuat atau menggunakan lazy loading
**Solusi:**
- Scroll ke seluruh chat untuk trigger loading
- Tunggu beberapa detik sebelum menjalankan script

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Limitasi

- Hanya bekerja di halaman LMArena yang sudah dimuat lengkap
- Tidak mendukung export attachment atau media
- Deteksi role berdasarkan urutan pesan (user-assistant-user-assistant)
- Memerlukan JavaScript enabled

## Contributing

Kontribusi dalam bentuk bug report, feature request, atau pull request sangat diterima. Pastikan untuk test di berbagai browser sebelum submit PR.

## License

MIT License - bebas digunakan untuk keperluan apapun dengan mencantumkan credit.
```

README ini SEO-friendly dengan keyword seperti "LMArena", "chat export", "markdown", "JavaScript", dan menjelaskan semua aspek penting tanpa terlalu verbose.
