# LMArena Chat Exporter

Utilitas JavaScript untuk mengekspor percakapan chat dari LMArena ke format Markdown. Script ini berjalan di console browser dan secara otomatis mendeteksi pesan user dan assistant, kemudian menyalin hasilnya ke clipboard.

**[🇺🇸 Read in English](README.md)**

## Fitur

- Export chat LMArena ke format Markdown yang rapi
- Deteksi otomatis pesan user dan assistant berdasarkan urutan
- Pembersihan konten otomatis (spasi berlebih, line break)
- Copy otomatis ke clipboard
- Fallback copy manual jika clipboard gagal
- Opsi balik urutan pesan
- Support berbagai selector DOM LMArena

## Cara Penggunaan

### Langkah 1: Buka Chat LMArena
Pastikan halaman chat sudah dimuat lengkap dan semua pesan terlihat.

### Langkah 2: Buka Console Browser
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
