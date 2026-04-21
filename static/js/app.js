document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Conversation history to send to backend
    let conversationHistory = [];

    // Handle Shift+Enter for new lines in textarea
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Handle New Chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            conversationHistory = [];
            chatMessages.innerHTML = `
                <div class="message ai">
                    <div class="avatar">AI</div>
                    <div class="message-content">
                        Hello. I am your Clinical Assistant. Please describe your symptoms in detail, including when they started and any other relevant context.
                    </div>
                </div>
            `;
            userInput.value = '';
        });
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (!text) return;

        // Add user message to UI
        addMessageToUI('user', text);
        userInput.value = '';
        
        // Add to history
        conversationHistory.push({ role: 'user', content: text });

        // Show typing indicator
        const typingId = showTypingIndicator();

        // Fetch CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator(typingId);

            if (data.status === 'success') {
                const aiText = data.response;
                // Basic markdown to HTML (paragraphs and bold)
                const formattedText = formatMarkdown(aiText);
                addMessageToUI('ai', formattedText, true);
                conversationHistory.push({ role: 'model', content: aiText });
            } else {
                addMessageToUI('ai', `Error: ${data.message}`, true);
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            addMessageToUI('ai', 'Error connecting to the server.', true);
        }
    });

    function addMessageToUI(sender, text, isHtml = false) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = sender === 'user' ? 'U' : 'AI';

        const content = document.createElement('div');
        content.classList.add('message-content');
        if (isHtml) {
            content.innerHTML = text;
        } else {
            content.textContent = text;
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'ai');
        msgDiv.id = id;

        msgDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="message-content" style="padding: 1rem;">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatMarkdown(text) {
        // Very basic markdown parser for the UI
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Handle line breaks
        const paragraphs = html.split('\n').filter(p => p.trim() !== '');
        return paragraphs.map(p => {
            if (p.startsWith('- ') || p.startsWith('* ')) {
                return `<li>${p.substring(2)}</li>`;
            }
            return `<p>${p}</p>`;
        }).join('');
    }
});
