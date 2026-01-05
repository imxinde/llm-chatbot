/**
 * AI ChatBot - Main Application
 * A simple LLM chat application using OpenRouter API
 */

// State
const state = {
  messages: [],
  currentModel: 'openai/gpt-3.5-turbo',
  currentModelName: 'GPT-3.5 Turbo',
  models: [],
  isLoading: false
};

// DOM Elements
const elements = {
  chatArea: document.getElementById('chatArea'),
  messagesContainer: document.getElementById('messagesContainer'),
  welcomeMessage: document.getElementById('welcomeMessage'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  modelSelector: document.getElementById('modelSelector'),
  currentModel: document.getElementById('currentModel'),
  modelModal: document.getElementById('modelModal'),
  modelList: document.getElementById('modelList'),
  closeModal: document.getElementById('closeModal')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadModels();
});

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Send message
  elements.sendBtn.addEventListener('click', sendMessage);
  
  // Input handling
  elements.messageInput.addEventListener('input', handleInputChange);
  elements.messageInput.addEventListener('keydown', handleKeyDown);
  
  // New chat
  elements.newChatBtn.addEventListener('click', startNewChat);
  
  // Model selection
  elements.modelSelector.addEventListener('click', openModelModal);
  elements.closeModal.addEventListener('click', closeModelModal);
  elements.modelModal.addEventListener('click', (e) => {
    if (e.target === elements.modelModal) closeModelModal();
  });
}

/**
 * Handle input changes
 */
function handleInputChange() {
  const hasContent = elements.messageInput.value.trim().length > 0;
  elements.sendBtn.disabled = !hasContent || state.isLoading;
  
  // Auto-resize textarea
  elements.messageInput.style.height = 'auto';
  elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 120) + 'px';
}

/**
 * Handle keyboard events
 */
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!elements.sendBtn.disabled) {
      sendMessage();
    }
  }
}

/**
 * Send message to API
 */
async function sendMessage() {
  const content = elements.messageInput.value.trim();
  if (!content || state.isLoading) return;

  // Hide welcome message
  elements.welcomeMessage.classList.add('hidden');

  // Add user message
  addMessage('user', content);
  elements.messageInput.value = '';
  handleInputChange();

  // Prepare messages for API
  const apiMessages = state.messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // Add assistant message placeholder
  const assistantMessageEl = addMessage('assistant', '', true);
  
  state.isLoading = true;
  elements.sendBtn.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: apiMessages,
        model: state.currentModel
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          
          if (parsed.content) {
            assistantContent += parsed.content;
            updateMessageContent(assistantMessageEl, assistantContent);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Save assistant message to state
    state.messages.push({
      role: 'assistant',
      content: assistantContent,
      timestamp: Date.now()
    });

    // Remove typing indicator
    removeTypingIndicator(assistantMessageEl);

  } catch (error) {
    console.error('Error:', error);
    updateMessageContent(assistantMessageEl, '抱歉，发生了错误：' + error.message);
    removeTypingIndicator(assistantMessageEl);
  } finally {
    state.isLoading = false;
    handleInputChange();
    scrollToBottom();
  }
}

/**
 * Add message to chat
 */
function addMessage(role, content, isStreaming = false) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = 'message-avatar';
  avatarEl.innerHTML = role === 'user' 
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  
  if (isStreaming) {
    contentEl.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  } else {
    contentEl.innerHTML = formatMessage(content);
  }

  messageEl.appendChild(avatarEl);
  messageEl.appendChild(contentEl);
  elements.messagesContainer.appendChild(messageEl);

  // Save to state (only for user messages here)
  if (role === 'user') {
    state.messages.push({
      role,
      content,
      timestamp: Date.now()
    });
  }

  scrollToBottom();
  return messageEl;
}

/**
 * Update message content during streaming
 */
function updateMessageContent(messageEl, content) {
  const contentEl = messageEl.querySelector('.message-content');
  const typingIndicator = contentEl.querySelector('.typing-indicator');
  
  if (typingIndicator) {
    contentEl.innerHTML = formatMessage(content) + '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  } else {
    contentEl.innerHTML = formatMessage(content);
  }
  
  scrollToBottom();
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator(messageEl) {
  const typingIndicator = messageEl.querySelector('.typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Format message content (basic markdown support)
 */
function formatMessage(content) {
  // Escape HTML
  let formatted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks
  formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  elements.chatArea.scrollTop = elements.chatArea.scrollHeight;
}

/**
 * Start new chat
 */
function startNewChat() {
  state.messages = [];
  elements.messagesContainer.innerHTML = '';
  elements.welcomeMessage.classList.remove('hidden');
  elements.messageInput.value = '';
  handleInputChange();
  elements.messageInput.focus();
}

/**
 * Load available models
 */
async function loadModels() {
  try {
    const response = await fetch('/api/models');
    const data = await response.json();
    
    if (data.models) {
      state.models = data.models;
      renderModelList();
    }
  } catch (error) {
    console.error('Failed to load models:', error);
    elements.modelList.innerHTML = '<div class="loading">加载模型列表失败</div>';
  }
}

/**
 * Render model list in modal
 */
function renderModelList() {
  if (state.models.length === 0) {
    elements.modelList.innerHTML = '<div class="loading">暂无可用模型</div>';
    return;
  }

  elements.modelList.innerHTML = state.models.map(model => `
    <div class="model-item ${model.id === state.currentModel ? 'selected' : ''}" data-id="${model.id}" data-name="${model.name}">
      <div class="model-item-name">${model.name}</div>
      <div class="model-item-desc">${model.description || model.id}</div>
    </div>
  `).join('');

  // Add click handlers
  elements.modelList.querySelectorAll('.model-item').forEach(item => {
    item.addEventListener('click', () => {
      selectModel(item.dataset.id, item.dataset.name);
    });
  });
}

/**
 * Select a model
 */
function selectModel(id, name) {
  state.currentModel = id;
  state.currentModelName = name;
  elements.currentModel.textContent = name;
  
  // Update selected state
  elements.modelList.querySelectorAll('.model-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.id === id);
  });
  
  closeModelModal();
}

/**
 * Open model selection modal
 */
function openModelModal() {
  elements.modelModal.classList.add('active');
}

/**
 * Close model selection modal
 */
function closeModelModal() {
  elements.modelModal.classList.remove('active');
}
