const API_URL = 'http://localhost:5000/suggest-comment';

// Create style input + button container
function createControlPanel() {
  const container = document.createElement('div');
  container.className = 'comment-suggester-panel';
  container.style.cssText = `
    margin-top: 10px;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    position: relative;
    z-index: 999;
  `;

  const input = document.createElement('input');
  input.placeholder = 'Style (e.g., short humor, professional, inspirational, celebratory, empathetic)';
  input.className = 'comment-style-input';
  input.style.cssText = `
    flex: 1;
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 16px;
    font-size: 14px;
  `;

  const button = document.createElement('button');
  button.innerHTML = '💡 Suggest Comment';
  button.className = 'comment-suggester-btn';
  button.style.cssText = `
    padding: 6px 12px;
    background: #0a66c2;
    color: white;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  `;

  container.appendChild(input);
  container.appendChild(button);

  return container;
}

// Enhanced draggable popup functionality with cursor changes
function createDraggablePopup() {
  const popup = document.createElement('div');
  popup.id = 'comment-suggester-popup';
  popup.style.cssText = 'position: fixed; top: 100px; left: 100px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 100000; width: 400px; max-width: 90vw; max-height: 80vh; overflow: auto; display: none; resize: both; min-width: 300px; min-height: 200px;';

  const header = document.createElement('div');
  header.style.cssText = 'padding: 10px; cursor: move; background: #f5f5f5; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; display: flex; justify-content: space-between; align-items: center;';
  
  const title = document.createElement('h3');
  title.textContent = 'Suggested Comment';
  title.style.cssText = 'margin: 0; color: #0a66c2;';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = 'background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; line-height: 1;';

  header.appendChild(title);
  header.appendChild(closeBtn);
  popup.appendChild(header);

  const content = document.createElement('div');
  content.id = 'suggestion-text';
  content.style.cssText = 'white-space: pre-wrap; margin-bottom: 20px; padding: 10px; background: #f9f9f9; border-radius: 4px; max-height: 300px; overflow-y: auto;';
  popup.appendChild(content);

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.style.cssText = 'flex: 1; padding: 8px; background: #0a66c2; color: white; border: none; border-radius: 4px; cursor: pointer;';

  const insertBtn = document.createElement('button');
  insertBtn.textContent = 'Insert';
  insertBtn.style.cssText = 'flex: 1; padding: 8px; background: #00a660; color: white; border: none; border-radius: 4px; cursor: pointer;';

  btnContainer.appendChild(copyBtn);
  btnContainer.appendChild(insertBtn);
  popup.appendChild(btnContainer);

  // Make draggable with cursor changes
  let offsetX, offsetY, isDragging = false;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
    popup.style.cursor = 'grabbing'; // Change cursor to grabbing
    e.preventDefault(); // Prevent text selection
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    popup.style.left = `${e.clientX - offsetX}px`;
    popup.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    popup.style.cursor = 'move'; // Change cursor back to move
  });

  // Change cursor for text content in suggestion box
  content.addEventListener('mouseover', () => {
    if (content.textContent.trim().length > 0) {
      content.style.cursor = 'text'; // Text select cursor when there's text
    }
  });

  content.addEventListener('mouseout', () => {
    content.style.cursor = 'default'; // Default cursor
  });

  // Close button functionality
  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  // Copy button functionality
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(content.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
  });

  // Insert button functionality
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
}

// Initialize the popup once
const suggestionPopup = createDraggablePopup();

// Find all visible LinkedIn posts
function findPosts() {
  return Array.from(document.querySelectorAll(
    'div.feed-shared-update-v2, ' +
    'div.scaffold-finite-scroll__content > div > div'
  )).filter(div => div.textContent.trim().length > 100);
}

// Add control panel to posts only once
function addControlsToPosts() {
  findPosts().forEach(post => {
    if (post.querySelector('.comment-suggester-panel')) return;

    const postText = post.querySelector('.feed-shared-update-v2__description-wrapper, [data-id="post-content"]')?.innerText || 
                     post.innerText.slice(0, 1000);

    const panel = createControlPanel();
    const input = panel.querySelector('.comment-style-input');
    const button = panel.querySelector('.comment-suggester-btn');

    button.onclick = async () => {
      button.disabled = true;
      button.innerHTML = '⏳ Generating...';

      try {
        const style = input.value.trim();

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ post_content: postText, style })
        });

        const data = await response.json();
        showSuggestion(data.suggested_comment || "Couldn't generate suggestion");
      } catch (error) {
        showSuggestion("Error: " + error.message);
      } finally {
        button.disabled = false;
        button.innerHTML = '💡 Suggest Comment';
      }
    };

    const actionsDiv = post.querySelector('.social-actions, .feed-shared-social-actions') || 
                       post.querySelector('div:last-child');
    if (actionsDiv) {
      actionsDiv.appendChild(panel);
    }
  });
}

// Show the suggestion in our draggable popup
function showSuggestion(text) {
  const content = suggestionPopup.querySelector('#suggestion-text');
  content.textContent = text;
  suggestionPopup.style.display = 'block';
  
  // Bring to front
  suggestionPopup.style.zIndex = 100000;
}

// Watch for new posts being added dynamically
const observer = new MutationObserver(() => addControlsToPosts());
observer.observe(document.body, { childList: true, subtree: true });

// Initial run for existing posts
addControlsToPosts();
setInterval(addControlsToPosts, 3000);
