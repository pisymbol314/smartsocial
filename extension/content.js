const API_URL = 'http://localhost:5000/suggest-comment';

// Initialize the enhanced popup
const suggestionPopup = (function() {
  const popup = document.createElement('div');
  popup.id = 'comment-suggester-popup';
  popup.style.cssText = `
    position: fixed;
    top: 100px;
    left: 100px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 100000;
    width: 400px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: auto;
    display: none;
    resize: both;
    min-width: 300px;
    min-height: 200px;
    cursor: default;
  `;

  // Header with move cursor
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 10px;
    cursor: move;
    background: #f5f5f5;
    border-radius: 8px 8px 0 0;
    margin: -20px -20px 20px -20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Suggested Comment';
  title.style.cssText = 'margin: 0; color: #0a66c2;';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  `;

  header.appendChild(title);
  header.appendChild(closeBtn);
  popup.appendChild(header);

  // Content area with text cursor
  const content = document.createElement('div');
  content.id = 'suggestion-text';
  content.style.cssText = `
    white-space: pre-wrap;
    margin-bottom: 20px;
    padding: 10px;
    background: #f9f9f9;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
    cursor: text;
  `;
  popup.appendChild(content);

  // Button container
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin-top: 15px;
  `;

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.style.cssText = `
    flex: 1;
    padding: 8px;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

  const insertBtn = document.createElement('button');
  insertBtn.textContent = 'Insert';
  insertBtn.style.cssText = `
    flex: 1;
    padding: 8px;
    background: #00a660;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;

  btnContainer.appendChild(copyBtn);
  btnContainer.appendChild(insertBtn);
  popup.appendChild(btnContainer);

  // Draggable functionality
  let offsetX, offsetY, isDragging = false;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
    popup.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    popup.style.left = `${e.clientX - offsetX}px`;
    popup.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    popup.style.cursor = 'default';
    header.style.cursor = 'move';
  });

  // Button functionality
  closeBtn.addEventListener('click', () => popup.style.display = 'none');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(content.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
  });
  insertBtn.addEventListener('click', () => {
    const commentBox = document.querySelector('.comments-comment-box__editor, .ql-editor');
    if (commentBox) {
      commentBox.focus();
      document.execCommand('insertText', false, content.textContent);
      popup.style.display = 'none';
    } else {
      insertBtn.textContent = 'Open comment box first!';
      setTimeout(() => insertBtn.textContent = 'Insert', 2000);
    }
  });

  document.body.appendChild(popup);
  return popup;
})();

// Rest of your LinkedIn-specific code remains unchanged
function createControlPanel(post, platform) {
  const container = document.createElement('div');
  container.className = 'comment-suggester-panel';
  container.style.cssText = 'margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;';

  const input = document.createElement('input');
  input.placeholder = 'Style (e.g., short, witty, supportive, professional)';
  input.className = 'comment-style-input';
  input.style.cssText = 'flex: 1; padding: 6px 12px; border: 1px solid #ccc; border-radius: 16px; font-size: 14px;';

  const button = document.createElement('button');
  button.textContent = '💡 Suggest Comment';
  button.className = 'comment-suggester-btn';
  button.style.cssText = 'padding: 6px 12px; background: #0a66c2; color: white; border: none; border-radius: 16px; cursor: pointer; font-size: 14px;';

  button.onclick = async () => {
    button.disabled = true;
    button.textContent = '⏳ Generating...';
    const style = input.value.trim();
    const postText = post.innerText.slice(0, 1000);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ post_content: postText, style })
      });
      const data = await response.json();
      const suggestion = data.suggested_comment || "No suggestion found.";

      insertIntoCommentBox(suggestion, platform);
      showSuggestion(suggestion);
    } catch (err) {
      showSuggestion("Error: " + err.message);
    } finally {
      button.disabled = false;
      button.textContent = '💡 Suggest Comment';
    }
  };

  container.appendChild(input);
  container.appendChild(button);
  return container;
}

function insertIntoCommentBox(suggestion, platform) {
  if (platform === 'linkedin') {
    const commentBox = document.querySelector('div.comments-comment-box__contenteditable[contenteditable="true"]');
    if (commentBox) {
      commentBox.focus();
      document.execCommand('insertText', false, suggestion);
    }
  }
}

function showSuggestion(text) {
  suggestionPopup.querySelector('#suggestion-text').textContent = text;
  suggestionPopup.style.display = 'block';
  suggestionPopup.style.zIndex = '100000';
}

function handlePost(post, platform) {
  if (post.querySelector('.comment-suggester-panel')) return;
  const panel = createControlPanel(post, platform);
  const actionsDiv = post.querySelector('.social-actions, .feed-shared-social-actions') || post.querySelector('div:last-child');
  if (actionsDiv) actionsDiv.appendChild(panel);
}

function findLinkedInPosts() {
  return Array.from(document.querySelectorAll('div.feed-shared-update-v2')).filter(div => div.innerText.length > 100);
}

function monitorPosts() {
  if (window.location.hostname.includes('linkedin')) {
    findLinkedInPosts().forEach(post => handlePost(post, 'linkedin'));
  }
}

const observer = new MutationObserver(monitorPosts);
observer.observe(document.body, { childList: true, subtree: true });
setInterval(monitorPosts, 3000);
monitorPosts();