// @ts-nocheck
import { GoogleGenAI } from "@google/genai";

// --- Robust Data Loading ---
function loadFromStorage(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        if (item === null || item === 'undefined') {
            return defaultValue;
        }
        return JSON.parse(item);
    } catch (e) {
        console.error(`Error parsing JSON from localStorage for key "${key}":`, e);
        return defaultValue;
    }
}

function loadStringFromStorage(key, defaultValue) {
    const item = localStorage.getItem(key);
    return item === null || item === 'undefined' ? defaultValue : item;
}

function loadNumberFromStorage(key, defaultValue) {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    const num = parseFloat(item);
    return isNaN(num) ? defaultValue : num;
}

function loadBooleanFromStorage(key, defaultValue) {
    const item = localStorage.getItem(key);
    return item === null ? defaultValue : item === 'true';
}

function sanitizeModel(modelName) {
    const PROHIBITED_MODELS = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
    if (PROHIBITED_MODELS.includes(modelName)) {
        console.warn(`Prohibited model "${modelName}" detected. Upgrading to "gemini-3-flash-preview".`);
        return 'gemini-3-flash-preview';
    }
    return modelName;
}

let currentGroupView = '全部';
let toastTimer = null;

// Initial Data Load
let savedUserAvatar = loadStringFromStorage('userAvatar', 'https://api.dicebear.com/7.x/miniavs/svg?seed=Girl');
let savedUserName = loadStringFromStorage('userName', '用户姓名');
let savedUserBio = loadStringFromStorage('userBio', '> 天天开心 <');
let savedUserPersona = loadStringFromStorage('userPersona', '我是一个活泼开朗、喜欢开玩笑的女孩。');
let savedUserCover = loadStringFromStorage('userCover', '');
let walletBalance = loadNumberFromStorage('walletBalance', 1314.52);
let walletPassword = loadStringFromStorage('walletPassword', null);

let config = { 
  key: loadStringFromStorage('apiKey', ''), 
  model: sanitizeModel(loadStringFromStorage('apiModel', 'gemini-3-flash-preview')),
  temp: loadNumberFromStorage('apiTemp', 0.8),
  baseUrl: loadStringFromStorage('apiUrl', '')
};

let contacts = loadFromStorage('contacts', [{ id: 1, name: "男友", realname: "", avatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=Boy", prompt: "你是用户的男朋友，温柔体贴，偶尔会有点小霸道。", worldBookId: 'wb_1', hideAvatar: 'none', history: [], syncReality: false, useRealTime: false, useRealWeather: false, city: '', latitude: null, longitude: null, group: '特别关心', isGroup: false, isPinned: false, members: [], memory: { auto: false, limit: 20, summary: "" }, unreadCount: 0, walletBalance: 520.13 }]);

// Ensure data integrity
contacts.forEach((c) => {
  if (!c.id) c.id = Date.now() + Math.random();
  if (!c.history) c.history = [];
  if (c.isGroup && !c.memory) c.memory = { auto: false, limit: 20, summary: "" };
  if (c.unreadCount === undefined) c.unreadCount = 0;
  if (c.offlineMode === undefined) c.offlineMode = { enabled: false, showThoughts: true, userPov: 'second', charPov: 'first', wordCount: 150, styleWbId: '' };
  if (c.latitude === undefined) c.latitude = null;
  if (c.longitude === undefined) c.longitude = null;
  if (c.walletBalance === undefined) c.walletBalance = Math.floor(Math.random() * 2000) + 50;
  if (c.proactiveChat === undefined) c.proactiveChat = false;
});

let wbGroups = loadFromStorage('wbGroups', ['默认']); 
let worldBooks = loadFromStorage('worldBooks', [{ id: 'wb_1', title: '简单恋爱日常', content: '现代都市背景...', group: '默认' }]);
let customEmojis = loadFromStorage('customEmojis', []);
let emojiGroups = loadFromStorage('emojiGroups', ['默认']);
let currentEmojiGroup = '全部';
let moments = loadFromStorage('moments', []);
let autoMomentEnabled = loadBooleanFromStorage('autoMomentEnabled', false);
let isFullscreen = loadBooleanFromStorage('isFullscreen', false); 
let chatBackgroundImage = loadStringFromStorage('chatBackgroundImage', null);
let desktopWallpaper = loadStringFromStorage('desktopWallpaper', null);
let appIconStyle = loadStringFromStorage('appIconStyle', 'default');
let customAppIcons = loadFromStorage('customAppIcons', {});
let currentEditingIcon = null;
let fontPresets = loadFromStorage('fontPresets', {});
let activeFontUrl = loadStringFromStorage('activeFontUrl', '');
let apiPresets = loadFromStorage('apiPresets', {});
let backgroundNotificationsEnabled = loadBooleanFromStorage('backgroundNotificationsEnabled', false);

let currentChatId = null; 
let autoGenInterval = null; 
let tempMomentImg = ""; 
let selectedMsgIndex = null; 
let longPressTimer = null;
let isMultiSelectMode = false; 
let selectedMessageIndices = [];
let replyingToMsg = null;
let currentPasswordAttempt = '';
let selectedChatListId = null;
let tempNewCharAvatar = '';
let commentLongPressTimer = null;
let editingMessageIndex = null;
let lastAutoMomentTimestamp = 0;
let lastDisplayedTimestamp = 0;
let notificationTimer = null;
let lastNotificationCharId = null;
let replyingToComment = null;
let selectedCommentMid = null;
let selectedCommentId = null;
let activeMomentPopup = null;

let passwordModalContext = {
    mode: 'verify', 
    step: 1,
    tempPassword: '',
    onsuccess: ( (password) => {} ),
};

// Global Functions
function showToast(message, type = 'info', duration = 2000) {
    const toast = document.getElementById('system-toast');
    if (!toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = ''; 
    toast.classList.add(type);
    void toast.offsetWidth; 
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};

function showNotification(name, message, avatar) {
    const banner = document.getElementById('notification-banner');
    const notifAvatar = document.getElementById('notif-avatar');
    const notifName = document.getElementById('notif-name');
    const notifMessage = document.getElementById('notif-message');
    
    if (banner && notifAvatar && notifName && notifMessage) {
        notifAvatar.style.backgroundImage = `url('${avatar}')`;
        notifName.textContent = name;
        notifMessage.textContent = message;
        
        banner.classList.add('show');
        
        // 5秒后自动隐藏
        if (notificationTimer) clearTimeout(notificationTimer);
        notificationTimer = setTimeout(() => {
            banner.classList.remove('show');
        }, 5000);
    }
}

function getCleanBaseUrl(url) { 
  if(!url) return ""; 
  let c = url.trim(); 
  while(c.endsWith('/')) c = c.slice(0,-1);
  // remove trailing /v1beta/models or /v1beta if present to avoid duplication
  if (c.endsWith('/v1beta/models')) c = c.replace(/\/v1beta\/models$/, '');
  else if (c.endsWith('/v1beta')) c = c.replace(/\/v1beta$/, '');
  return c; 
}

async function callGeminiAPI(prompt, model = 'gemini-3-flash-preview') {
    if (!config.key) {
        throw new Error('API Key is not configured.');
    }

    if (config.baseUrl) {
        const apiHost = getCleanBaseUrl(config.baseUrl);
        const url = `${apiHost}/v1beta/models/${model}:generateContent?key=${config.key}`;
        const body = { contents: [{ parts: [{ text: prompt }] }] };
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP Error ${response.status}`);
        }
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
        const ai = new GoogleGenAI({ apiKey: config.key });
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text;
    }
}

function compressImage(base64Str, quality = 0.7, maxWidth = 800) {
  return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          let mimeType = 'image/jpeg';
          if (base64Str.startsWith('data:image/png')) {
              mimeType = 'image/png';
              resolve(canvas.toDataURL(mimeType));
          } else {
              resolve(canvas.toDataURL(mimeType, quality));
          }
      };
      img.onerror = (error) => reject(error);
  });
}

function formatContactTime(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date >= today) return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    else if (date >= yesterday) return '昨天';
    else return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function formatChatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    if (date >= today) {
        return timeStr;
    } else if (date >= yesterday) {
        return `昨天 ${timeStr}`;
    } else {
        return `${(date.getMonth() + 1)}月${date.getDate()}日 ${timeStr}`;
    }
}

function renderGroupBar() { 
  const bar = document.getElementById('wb-group-bar');
  if (!bar) return;
  bar.innerHTML = ''; 
  let allPill = document.createElement('div'); 
  allPill.className = `group-pill ${currentGroupView==='全部'?'active':''}`; 
  allPill.innerText='全部'; 
  allPill.onclick=()=>{ currentGroupView='全部'; openWorldBooks(); }; 
  bar.appendChild(allPill); 
  wbGroups.forEach(g => { 
    let p = document.createElement('div'); 
    p.className=`group-pill ${currentGroupView===g?'active':''}`; 
    p.innerText=g; p.onclick=()=>{ currentGroupView=g; openWorldBooks(); }; 
    p.ondblclick=()=>deleteGroup(g); 
    bar.appendChild(p); 
  }); 
  let add = document.createElement('div'); 
  add.className='group-add-btn'; 
  add.innerHTML='<i class="fas fa-plus"></i>'; 
  add.onclick=addNewGroup; 
  bar.appendChild(add); 
}

function renderWBList() { 
  const c = document.getElementById('wb-list-container');
  if(!c) return;
  c.innerHTML = ''; 
  let list = currentGroupView==='全部' ? worldBooks : worldBooks.filter((b)=>(b.group||'默认')===currentGroupView); 
  list.forEach((wb) => { 
    let d = document.createElement('div'); 
    d.className='wb-item'; 
    d.innerHTML = `<div onclick="editWB('${wb.id}')" style="flex:1"><div class="wb-title">${wb.title} <span class="wb-tag">${wb.group||'默认'}</span></div><div class="wb-preview">${wb.content}</div></div><i class="fas fa-trash" style="color:#ff5252;padding:10px" onclick="deleteWB('${wb.id}')"></i>`; 
    c.appendChild(d); 
  }); 
  if (list.length === 0) { 
    c.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无世界书内容，点击右上角+号添加</div>'; 
  } 
}

function applyGlobalFont() {
    const styleId = 'custom-global-font';
    let styleEl = document.getElementById(styleId);
    const fontPreviewEl = document.getElementById('font-preview');

    if (activeFontUrl) {
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        const fontName = 'CustomGlobalFont';
        styleEl.textContent = `
          @font-face { 
              font-family: '${fontName}'; 
              src: url('${activeFontUrl}'); 
          }
          body, #phone-shell, input, textarea, button, select { 
              font-family: '${fontName}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; 
          }
        `;
        if (fontPreviewEl) fontPreviewEl.style.fontFamily = `'${fontName}', sans-serif`;

    } else {
      if (styleEl) styleEl.remove();
      if (fontPreviewEl) fontPreviewEl.style.fontFamily = `sans-serif`;
    }
}

function renderFontPresets() {
    const select = document.getElementById('font-preset-select');
    if (!select) return;
    select.innerHTML = '<option value="">选择字体预设...</option>';
    for (const name in fontPresets) {
        const option = document.createElement('option');
        option.value = name;
        option.innerText = name;
        select.appendChild(option);
    }
}

function renderApiPresets() {
    const select = document.getElementById('api-preset-select');
    if (!select) return;
    select.innerHTML = '<option value="">选择预设...</option>';
    for (const name in apiPresets) {
        const option = document.createElement('option');
        option.value = name;
        option.innerText = name;
        select.appendChild(option);
    }
}

function openWeChat() { 
  hideMomentCommentBar(); 
  updateMeTab(); 
  updateMomentsHeader(); 
  switchWxTab('chat', document.querySelector('.wechat-footer .wx-tab:first-child')); 
  renderContacts(); 
  showScreen('screen-wechat'); 
};

function openWorldBooks() { 
  if (typeof currentGroupView === 'undefined') { currentGroupView = '全部'; } 
  renderGroupBar(); 
  renderWBList(); 
  showScreen('screen-worldbooks'); 
};
  
function openSettings() {
  document.getElementById('api-key').value = config.key;
  document.getElementById('api-model').value = config.model;
  document.getElementById('api-temp').value = String(config.temp);
  document.getElementById('temp-display').innerText = String(config.temp);
  document.getElementById('api-url').value = config.baseUrl; // Populate API URL
  document.getElementById('setting-bg-notifications').checked = backgroundNotificationsEnabled;
  renderApiPresets(); 
  showScreen('screen-settings');
};

function openThemes() { 
  document.getElementById('theme-fullscreen-toggle').checked = isFullscreen; 
  updateChatBgPreview(); 
  updateWallpaperPreview();
  document.getElementById('icon-style-select').value = appIconStyle;
  renderCustomIconEditor();
  renderFontPresets();
  showScreen('screen-themes'); 
};

function openCharPhone() {
    showScreen('screen-char-phone');
    renderCharPhoneList();
}

function goHome() { 
  hideMomentCommentBar(); 
  showScreen('screen-home'); 
};

function showScreen(id) { 
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
  document.getElementById(id).classList.add('active'); 
};

function closeModal(id) { 
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none'; 
};

// --- ALL FUNCTION DEFINITIONS ---
function toggleFullscreen(checked) {
  isFullscreen = checked;
  localStorage.setItem('isFullscreen', String(isFullscreen));
  document.getElementById('phone-shell').classList.toggle('fullscreen-mode', isFullscreen);
}

function changeIconStyle(style) {
  appIconStyle = style;
  localStorage.setItem('appIconStyle', appIconStyle);
  applyAppIconStyle();
}

function addNewGroup() {
  document.getElementById('new-wb-group-name-input').value = '';
  document.getElementById('modal-wb-new-group').style.display = 'flex';
}

function confirmAddNewWBGroup() {
  const newGroup = document.getElementById('new-wb-group-name-input').value.trim();
  if (newGroup && !wbGroups.includes(newGroup)) {
    wbGroups.push(newGroup);
    localStorage.setItem('wbGroups', JSON.stringify(wbGroups));
    openWorldBooks();
  }
  closeModal('modal-wb-new-group');
}

function deleteGroup(groupName) {
  if (groupName === '默认') {
    showToast('默认分组不能删除', 'error');
    return;
  }
  if (confirm(`确定要删除分组 "${groupName}" 吗？\n该分组下的世界书将移至“默认”分组。`)) {
    wbGroups = wbGroups.filter(g => g !== groupName);
    worldBooks.forEach((wb) => {
      if (wb.group === groupName) {
        wb.group = '默认';
      }
    });
    localStorage.setItem('wbGroups', JSON.stringify(wbGroups));
    localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
    currentGroupView = '全部';
    openWorldBooks();
  }
}

function editWB(id) {
  const wb = worldBooks.find((w) => w.id === id);
  if (!wb) return;
  document.getElementById('wb-modal-title').innerText = '编辑世界书';
  document.getElementById('wb-id').value = wb.id;
  document.getElementById('wb-title').value = wb.title;
  document.getElementById('wb-content').value = wb.content;
  const groupSelect = document.getElementById('wb-group-select');
  groupSelect.innerHTML = '';
  wbGroups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.innerText = g;
      if (g === (wb.group || '默认')) opt.selected = true;
      groupSelect.appendChild(opt);
  });
  document.getElementById('modal-wb').style.display = 'flex';
}

function saveWB() {
  const id = document.getElementById('wb-id').value;
  const title = document.getElementById('wb-title').value.trim();
  const content = document.getElementById('wb-content').value.trim();
  const group = document.getElementById('wb-group-select').value;

  if (!title || !content) {
    showToast('标题和内容不能为空', 'error');
    return;
  }

  if (id) {
    const wb = worldBooks.find((w) => w.id === id);
    if (wb) {
      wb.title = title;
      wb.content = content;
      wb.group = group;
    }
  } else {
    worldBooks.push({ id: `wb_${Date.now()}`, title, content, group });
  }
  localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
  renderWBList();
  closeModal('modal-wb');
}

function deleteWB(id) {
  if (confirm('确定要删除这个世界书吗？')) {
    worldBooks = worldBooks.filter((w) => w.id !== id);
    localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
    renderWBList();
  }
}

function backToWeChat() {
  currentChatId = null;
  exitMultiSelectMode();
  renderContacts();
  openWeChat();
}

function backToChat() {
  showScreen('screen-chat');
}

function switchWxTab(id, btn) {
    document.querySelectorAll('.wx-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.wechat-tab-content').forEach(c => (c).style.display = 'none');
    document.getElementById(`tab-${id}`).style.display = 'block';
    document.getElementById(`tab-${id}`).scrollTop = 0;
    
    const titleMap = { chat: '微信', contacts: '通讯录', moments: '发现', me: '我' };
    (document.getElementById('wx-title')).innerText = titleMap[id];
    (document.getElementById('wx-add-btn')).style.display = (id === 'chat' || id === 'contacts') ? 'block' : 'none';
    (document.getElementById('wx-cam-btn')).style.display = id === 'moments' ? 'block' : 'none';
    (document.getElementById('wx-group-btn')).style.display = id === 'contacts' ? 'block' : 'none';
    
    if (id === 'moments') renderMoments();
    if (id === 'contacts') renderAddressBook();
}

function saveSettings() {
  config.key = document.getElementById('api-key').value;
  config.model = document.getElementById('api-model').value;
  config.temp = parseFloat(document.getElementById('api-temp').value);
  config.baseUrl = document.getElementById('api-url').value.trim(); // Save API URL
  localStorage.setItem('apiKey', config.key);
  localStorage.setItem('apiModel', config.model);
  localStorage.setItem('apiTemp', String(config.temp));
  localStorage.setItem('apiUrl', config.baseUrl); // Save API URL to localStorage
  showToast('配置已保存', 'success');
};

async function fetchModels() {
    const modelSelect = document.getElementById('api-model');
    const key = document.getElementById('api-key').value;
    let baseUrl = document.getElementById('api-url').value.trim();

    if (!baseUrl) {
        showToast('请输入API反代地址以刷新模型', 'error');
        return;
    }
    
    showToast('正在刷新模型列表...', 'info');

    // Clean the base URL
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    if (baseUrl.endsWith('/v1')) {
       baseUrl = baseUrl.slice(0, -3);
    }

    const url = `${baseUrl}/v1/models`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        let models = [];
        if (data.data && Array.isArray(data.data)) { // OpenAI format
            models = data.data.map(model => model.id);
        } else if (data.models && Array.isArray(data.models)) { // Google format
            models = data.models.map(model => model.name.replace('models/', ''));
        }

        if (models.length > 0) {
            modelSelect.innerHTML = '';
            models.sort().forEach(modelId => {
                const option = document.createElement('option');
                option.value = modelId;
                option.innerText = modelId;
                modelSelect.appendChild(option);
            });
            
            if ([...modelSelect.options].some(o => o.value === config.model)) {
                modelSelect.value = config.model;
            }
            
            showToast(`已加载 ${models.length} 个模型`, 'success');
        } else {
            throw new Error('未找到可用模型或API返回格式不正确');
        }
        
    } catch (error) {
        console.error('Failed to fetch models:', error);
        showToast(`模型刷新失败: ${error.message}`, 'error');
        modelSelect.innerHTML = '<option value="">刷新失败, 请检查设置</option>';
    }
}

function exitMultiSelectMode() {
    isMultiSelectMode = false;
    selectedMessageIndices = [];
    document.getElementById('multi-select-bar').style.display = 'none';
    document.getElementById('input-area').style.display = 'flex';
    document.querySelectorAll('.msg-row.multi-select-mode').forEach(row => {
        row.classList.remove('multi-select-mode', 'selected');
        (row).onclick = null;
    });
}

function updateChatTitleIndicator() {
  const char = contacts.find((c) => c.id === currentChatId);
  if (!char) return;
  const ind = document.getElementById('chat-title');
  if (!ind) return;
  
  if (ind.dataset.originalTitle) return;

  let icons = '';
  if (!char.isGroup && char.offlineMode && char.offlineMode.enabled) {
    icons += ' <span class="offline-indicator">线下</span>';
  }
  ind.innerHTML = `${char.name}${icons}`;
}

function showMsgContextMenu(e, index) {
    selectedMsgIndex = index;
    const menu = document.getElementById('msg-context-menu');
    
    const char = contacts.find(c => c.id === currentChatId);
    if (!char || !menu) return;
    const msg = char.history[index];
    if (!msg || msg.type === 'system') { // Don't show menu for system messages
        menu.style.display = 'none';
        return;
    }

    const retryBtn = menu.querySelector('[onclick*="retry"]');
    const editBtn = menu.querySelector('[onclick*="edit"]');
    const recallBtn = menu.querySelector('[onclick*="recall"]');
    
    const isUserMsg = msg.sender === 'user';
    const isTextMsg = msg.type === 'text' || !msg.type;

    // User's message menu
    recallBtn.style.display = isUserMsg && (Date.now() - msg.timestamp) < 2 * 60 * 1000 ? 'flex' : 'none';
    
    // AI's message menu
    retryBtn.style.display = !isUserMsg ? 'flex' : 'none';
    
    // Common items
    editBtn.style.display = isTextMsg ? 'flex' : 'none';

    menu.style.display = 'block';
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].pageX;
        clientY = e.touches[0].pageY;
    } else {
        clientX = e.pageX;
        clientY = e.pageY;
    }

    menu.style.left = `${clientX}px`;
    menu.style.top = `${clientY}px`;
    
    const rect = menu.getBoundingClientRect();
    const shellRect = document.getElementById('phone-shell').getBoundingClientRect();
    if (rect.right > shellRect.right) menu.style.left = `${clientX - rect.width}px`;
    if (rect.bottom > shellRect.bottom) menu.style.top = `${clientY - rect.height}px`;
}

function createMessageElement(msg, isSelf, isImg, index) {
    const div = document.createElement('div');
    div.className = `msg-row ${isSelf ? 'sent' : 'received'}`;
    
    let contentHtml = '';
    
    if (msg.type === 'red-packet') {
        contentHtml = `
            <div class="message msg-red-packet">
                <i class="fas fa-gift"></i>
                <div>
                    <div style="font-size:14px; font-weight:bold;">${msg.content || '恭喜发财，大吉大利'}</div>
                    <div style="font-size:10px; opacity:0.8;">微信红包</div>
                </div>
            </div>`;
    } else if (msg.type === 'transfer') {
        let statusText;
        if (msg.status === 'accepted') {
            if (isSelf) {
                // A message sent BY THE USER.
                // If it's a confirmation of receipt, it should say "已收款".
                // If it's their original transfer that was accepted by the other party, it should say "已被接收".
                // The confirmation message content is "收到转账".
                statusText = (msg.content && msg.content.includes('收到转账')) ? '已收款' : '已被接收';
            } else {
                // A message received BY THE USER.
                // This is either the AI's original transfer that the user accepted, or the AI's confirmation.
                // In both cases, from the user's perspective, it should show "已收款".
                statusText = '已收款';
            }
        } else {
            // Handle other statuses as before.
            statusText = {
                pending: isSelf ? '等待对方收款' : '请收款',
                returned: isSelf ? '已退还' : '对方已退还',
            }[msg.status] || (isSelf ? '等待对方收款' : '请收款');
        }
        
        const isClickable = !isSelf && msg.status === 'pending';
        const clickHandler = isClickable ? `onclick="window.acceptTransfer('${msg.id}')"` : '';

        contentHtml = `
            <div class="message msg-transfer ${msg.status || ''}" ${clickHandler}>
                <div class="transfer-content">
                    <div class="transfer-icon"><i class="fas fa-exchange-alt"></i></div>
                    <div class="transfer-details">
                        <span class="transfer-amount">¥${msg.amount.toFixed(2)}</span>
                        <span class="transfer-status">${statusText}</span>
                    </div>
                </div>
                <div class="transfer-footer">微信转账</div>
            </div>`;
    } else if (msg.type === 'dice') {
        contentHtml = `<div class="message msg-dice"><i class="fas fa-dice-${['one','two','three','four','five','six'][msg.value-1]}"></i></div>`;
    } else if (isImg) {
        contentHtml = `<img src="${msg.content}" class="msg-img" onclick="window.showLightbox('${msg.content}')">`;
    } else {
        const quoteHtml = msg.quote ? `<div class="msg-quote">${msg.quote.name}: ${msg.quote.content}</div>` : '';
        const textClass = (msg.isThought) ? 'msg-thought-offline' : '';
        contentHtml = `<div class="message ${textClass}">${quoteHtml}${msg.content}</div>`;
    }

    const char = contacts.find((c) => c.id === currentChatId);
    if (!char) return div;

    const sender = isSelf ? null : (char.isGroup ? contacts.find(c => c.id === msg.senderId) || char : char);
    const avatarUrl = isSelf 
        ? (char.selfAvatar || savedUserAvatar) 
        : (sender ? sender.avatar : '');

    const showAvatar = !(char.hideAvatar === (isSelf ? 'user' : 'char') || char.hideAvatar === 'both');

    div.innerHTML = `
        ${(!isSelf && showAvatar) ? `<div class="chat-avatar-img" style="background-image: url('${avatarUrl}')"></div>` : ''}
        <div style="display:flex; flex-direction:column; align-items:${isSelf ? 'flex-end' : 'flex-start'}; max-width:80%;">
          ${char.isGroup && !isSelf ? `<div class="msg-sender-name">${msg.senderName}</div>` : ''}
          ${contentHtml}
        </div>
        ${(isSelf && showAvatar) ? `<div class="chat-avatar-img" style="background-image: url('${char.selfAvatar || savedUserAvatar}')"></div>` : ''}
    `;
    
    const msgElement = div.querySelector('.message, .msg-img, .msg-red-packet, .msg-transfer');

    if (msgElement) {
        if (isMultiSelectMode) {
             div.classList.add('multi-select-mode');
            if (selectedMessageIndices.includes(index)) {
                div.classList.add('selected');
            }
            div.onclick = () => {
                if (selectedMessageIndices.includes(index)) {
                    selectedMessageIndices = selectedMessageIndices.filter(i => i !== index);
                    div.classList.remove('selected');
                } else {
                    selectedMessageIndices.push(index);
                    div.classList.add('selected');
                }
            };
        } else {
            let touchTimer;
            msgElement.addEventListener('touchstart', (e) => {
                if(isMultiSelectMode) return;
                touchTimer = window.setTimeout(() => showMsgContextMenu(e, index), 500);
            });
            msgElement.addEventListener('touchend', () => clearTimeout(touchTimer));
            msgElement.addEventListener('contextmenu', (e) => {
                if(isMultiSelectMode) return;
                e.preventDefault();
                showMsgContextMenu(e, index);
            });
        }
    }
    return div;
}

function renderEmojiPanel() {
    const grid = document.getElementById('emoji-grid');
    const bar = document.getElementById('emoji-group-bar');
    grid.innerHTML = '';
    bar.innerHTML = '';

    const allPill = document.createElement('div');
    allPill.className = `emoji-group-pill ${currentEmojiGroup === '全部' ? 'active' : ''}`;
    allPill.innerText = '全部';
    allPill.onclick = () => switchEmojiGroup('全部');
    bar.appendChild(allPill);

    emojiGroups.forEach(g => {
        const pill = document.createElement('div');
        pill.className = `emoji-group-pill ${currentEmojiGroup === g ? 'active' : ''}`;
        pill.innerText = g;
        pill.onclick = () => switchEmojiGroup(g);
        bar.appendChild(pill);
    });

    const addGroupBtn = document.createElement('div');
    addGroupBtn.className = 'emoji-group-btn';
    addGroupBtn.innerHTML = '<i class="fas fa-folder-plus"></i>';
    addGroupBtn.title = '添加分组';
    addGroupBtn.onclick = addNewEmojiGroup;
    
    const addEmojiBtn = document.createElement('div');
    addEmojiBtn.className = 'emoji-group-btn';
    addEmojiBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addEmojiBtn.title = '添加表情';
    addEmojiBtn.onclick = ()=>document.getElementById('emoji-upload').click();

    bar.appendChild(document.createElement('div')).style.flexGrow = '1';
    bar.appendChild(addGroupBtn);
    bar.appendChild(addEmojiBtn);
    
    const char = contacts.find((c) => c.id === currentChatId);
    if (char) {
      if (currentEmojiGroup === '全部' || currentEmojiGroup === '默认') {
        const diceBtn = document.createElement('div');
        diceBtn.className = 'emoji-item';
        diceBtn.innerHTML = `<i class="fas fa-dice" style="font-size:36px; color:#333;"></i>`;
        diceBtn.onclick = sendDiceMessage;
        grid.appendChild(diceBtn);
      }
    }

    const emojisToShow = currentEmojiGroup === '全部' ? customEmojis : customEmojis.filter((e) => e.group === currentEmojiGroup);
    emojisToShow.forEach((emoji) => {
        let d = document.createElement('div');
        d.className = 'emoji-item';
        d.innerHTML = `<img src="${emoji.src}" style="width:40px;height:40px; object-fit:contain;">`;
        d.onclick = ()=>sendImageMessageOnly(emoji.src);
        grid.appendChild(d);
    });
  }

function toggleMomentsMenu() {
    const menu = document.getElementById('moments-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function toggleAddMenu() {
    const menu = document.getElementById('add-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function showUserPersonaModal() {
  document.getElementById('user-persona-input').value = savedUserPersona;
  document.getElementById('modal-user-persona').style.display = 'flex';
};

function saveUserPersona() {
  savedUserPersona = document.getElementById('user-persona-input').value;
  localStorage.setItem('userPersona', savedUserPersona);
  closeModal('modal-user-persona');
  showToast('人设已保存', 'success');
};

function showWalletModal() {
    document.getElementById('modal-wallet-balance').innerText = walletBalance.toFixed(2);
    document.getElementById('modal-wallet').style.display = 'flex';
}

function saveFontPreset() {
    const url = document.getElementById('font-url-input').value.trim();
    if (!url) {
      showToast('请输入字体链接', 'error');
      return;
    }
    const name = prompt("请输入字体预设名称:");
    if (!name || name.trim() === '') return;
    
    fontPresets[name] = url;
    localStorage.setItem('fontPresets', JSON.stringify(fontPresets));
    renderFontPresets();
    showToast('预设已保存', 'success');
}

function deleteFontPreset() {
    const name = document.getElementById('font-preset-select').value;
    if (name && fontPresets[name] && confirm(`删除 ${name}?`)) {
        delete fontPresets[name];
        localStorage.setItem('fontPresets', JSON.stringify(fontPresets));
        renderFontPresets();
    }
}

function loadFontPreset() {
    const name = document.getElementById('font-preset-select').value;
    if (name && fontPresets[name]) {
        document.getElementById('font-url-input').value = fontPresets[name];
        applyFontFromInput();
    }
}

function applyFontFromInput() {
    const url = document.getElementById('font-url-input').value.trim();
    activeFontUrl = url;
    localStorage.setItem('activeFontUrl', url);
    applyGlobalFont();
}

function loadApiPreset() {
    const name = document.getElementById('api-preset-select').value;
    if (name && apiPresets[name]) {
        const p = apiPresets[name];
        document.getElementById('api-key').value = p.key;
        document.getElementById('api-model').value = p.model;
        document.getElementById('api-temp').value = p.temp;
        document.getElementById('api-url').value = p.baseUrl || ''; // Load API URL
    }
}

function saveApiPreset() {
    document.getElementById('api-preset-name-input').value = '';
    document.getElementById('modal-save-api-preset').style.display = 'flex';
}

function confirmSaveApiPreset() {
    const name = document.getElementById('api-preset-name-input').value.trim();
    if (name) {
        apiPresets[name] = {
            key: document.getElementById('api-key').value,
            model: document.getElementById('api-model').value,
            temp: document.getElementById('api-temp').value,
            baseUrl: document.getElementById('api-url').value.trim() // Save API URL
        };
        localStorage.setItem('apiPresets', JSON.stringify(apiPresets));
        renderApiPresets();
        closeModal('modal-save-api-preset');
    }
}

function deleteApiPreset() {
    const name = document.getElementById('api-preset-select').value;
    if (name && apiPresets[name] && confirm(`删除 ${name}?`)) {
        delete apiPresets[name];
        localStorage.setItem('apiPresets', JSON.stringify(apiPresets));
        renderApiPresets();
    }
}

function openCharDetailSettings() {
    const char = contacts.find((c) => c.id === currentChatId);
    if (!char) return;
    document.getElementById('setting-avatar-preview').src = char.avatar;
    document.getElementById('setting-char-name').value = char.name;
    document.getElementById('setting-char-group').value = char.group || '';
    document.getElementById('setting-self-avatar-preview').src = char.selfAvatar || savedUserAvatar;
    const isGroup = char.isGroup;
    document.getElementById('row-realname').style.display = isGroup ? 'none' : 'flex';
    document.getElementById('row-prompt').style.display = isGroup ? 'none' : 'block';
    document.getElementById('row-self-avatar').style.display = isGroup ? 'none' : 'block';
    document.getElementById('row-reality-settings').style.display = isGroup ? 'none' : 'block';
    document.getElementById('row-proactive-chat').style.display = isGroup ? 'none' : 'block';
    if (!isGroup) {
        document.getElementById('setting-char-realname').value = char.realname || '';
        document.getElementById('setting-char-prompt').value = char.prompt || '';
        document.getElementById('setting-char-hide-avatar').value = char.hideAvatar || 'none';
        const wbSelect = document.getElementById('setting-char-wb');
        wbSelect.innerHTML = '<option value="">不绑定</option>';
        worldBooks.forEach((wb) => {
            const opt = document.createElement('option'); opt.value = wb.id; opt.innerText = `${wb.title} (${wb.group})`; if (char.worldBookId === wb.id) opt.selected = true; wbSelect.appendChild(opt);
        });
        document.getElementById('setting-char-sync-reality').checked = char.syncReality || false;
        toggleRealitySettings(char.syncReality || false);
        document.getElementById('setting-char-real-weather').checked = char.useRealWeather || false;
        document.getElementById('setting-char-city').value = char.city || '';
        document.getElementById('setting-char-real-time').checked = char.useRealTime || false;
        document.getElementById('setting-char-proactive').checked = char.proactiveChat || false;
        toggleCityInput(char.useRealWeather || false);
    }
    showScreen('screen-char-settings');
}

function showPostMomentModal() {
    toggleMomentsMenu(); 
    tempMomentImg = ""; 
    document.getElementById('moment-img-status').innerText="未选择"; 
    document.getElementById('moment-text').value=""; 
    const visSelect = document.getElementById('moment-visibility');
    visSelect.innerHTML = '<option value="all">公开 (所有好友)</option>';
    const groups = [...new Set(contacts.filter((c) => !c.isGroup && c.group).map((c) => c.group))];
    groups.forEach(g => { if(g) { let opt = document.createElement('option'); opt.value = g; opt.innerText = `仅 ${g} 可见`; visSelect.appendChild(opt); } });
    document.getElementById('modal-post-moment').style.display='flex'; 
}

function showCharMomentsSettings() {
    toggleMomentsMenu();
    const charSelect = document.getElementById('moment-char-select');
    charSelect.innerHTML = contacts.filter((c)=>!c.isGroup).map((c)=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('moment-auto-toggle').checked = autoMomentEnabled;
    const listContainer = document.getElementById('auto-moment-char-list');
    listContainer.innerHTML = contacts.filter((c)=>!c.isGroup).map((c)=>`
        <div class="select-item">
          <input type="checkbox" id="automoment-char-${c.id}" value="${c.id}" ${c.autoMoment ? 'checked' : ''} onchange="updateAutoMomentChar('${c.id}', this.checked)">
          <label for="automoment-char-${c.id}" style="display:flex;align-items:center;width:100%;"><div class="select-avatar" style="background-image:url('${c.avatar}')"></div><span>${c.name}</span></label>
        </div>
    `).join('');
    document.getElementById('auto-moment-char-list-container').style.display = autoMomentEnabled ? 'block' : 'none';
    document.getElementById('modal-char-moment-settings').style.display = 'flex';
}

function openOfflineModeSettings() {
    const char = contacts.find((c) => c.id === currentChatId);
    if (!char || !char.offlineMode) return;
    const { enabled, showThoughts, userPov, charPov, wordCount, styleWbId } = char.offlineMode;
    document.getElementById('offline-mode-toggle').checked = enabled;
    document.getElementById('offline-show-thoughts').checked = showThoughts;
    document.getElementById('offline-user-pov').value = userPov;
    document.getElementById('offline-char-pov').value = charPov;
    document.getElementById('offline-word-count').value = String(wordCount);
    const wbSelect = document.getElementById('offline-style-wb');
    wbSelect.innerHTML = '<option value="">默认风格</option>';
    worldBooks.forEach((wb) => {
        const opt = document.createElement('option'); opt.value = wb.id; opt.innerText = `${wb.title} (${wb.group})`; if (styleWbId === wb.id) opt.selected = true; wbSelect.appendChild(opt);
    });
    toggleOfflineOptions(enabled);
    document.getElementById('modal-offline-settings').style.display = 'flex';
    document.getElementById('action-panel').classList.remove('show');
}

function openMemoryModal() {
    const char = contacts.find(c => c.id === currentChatId);
    if(!char) return;
    document.getElementById('mem-auto-toggle').checked = char.memory.auto;
    document.getElementById('mem-limit-input').value = String(char.memory.limit);
    document.getElementById('mem-summary-text').value = char.memory.summary || "";
    document.getElementById('modal-memory').style.display = 'flex';
    document.getElementById('action-panel').classList.remove('show');
};

function handleInput() {
  const inputArea = document.getElementById('input-area');
  const val = document.getElementById('msg-input').value;
  const sendBtn = document.getElementById('btn-send');

  if (val.trim().length > 0) {
    inputArea.classList.add('typing-mode');
    sendBtn.style.display = 'block';
  } else {
    inputArea.classList.remove('typing-mode');
    sendBtn.style.display = 'none';
  }
};

function editHomeText(type) { 
  let k = type === 'name' ? 'userName' : 'userBio'; 
  let el = document.getElementById('home-user-' + type); 
  if (el.style.display === 'none') return; 
  let currentVal = el.innerText; 
  let input = document.createElement('input'); 
  input.type = 'text'; 
  input.value = currentVal; 
  input.className = el.className; 
  input.style.fontSize = window.getComputedStyle(el).fontSize; 
  input.style.fontWeight = window.getComputedStyle(el).fontWeight; 
  input.style.color = window.getComputedStyle(el).color; 
  input.style.textAlign = 'center'; 
  input.style.width = '100%'; 
  input.style.border = 'none'; 
  input.style.background = 'rgba(255,255,255,0.5)'; 
  input.style.borderRadius = '5px'; 
  input.style.padding = '5px'; 
  el.style.display = 'none'; 
  el.parentNode.insertBefore(input, el.nextSibling); 
  input.focus(); 
  const save = () => { 
    let newVal = input.value.trim(); 
    if (newVal) { 
      el.innerText = newVal; 
      localStorage.setItem(k, newVal); 
      if (type === 'name') { savedUserName = newVal; updateMeTab(); updateMomentsHeader(); } 
      else if (type === 'bio') { savedUserBio = newVal; } 
    } 
    el.style.display = ''; 
    input.parentNode.removeChild(input); 
  }; 
  input.addEventListener('blur', save); 
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { input.blur(); } else if (e.key === 'Escape') { el.style.display = ''; input.parentNode.removeChild(input); } }); 
};

function updateMeTab() { 
  document.getElementById('me-tab-avatar').style.backgroundImage=`url('${savedUserAvatar}')`;
  document.getElementById('me-tab-name').innerText = savedUserName;
  document.getElementById('wallet-balance').innerText = walletBalance.toFixed(2);
}

function updateMomentsHeader() { 
  document.getElementById('moments-avatar').style.backgroundImage=`url('${savedUserAvatar}')`; 
  document.getElementById('moments-name').innerText=savedUserName; 
  document.getElementById('moments-header').style.backgroundImage = savedUserCover ? `url('${savedUserCover}')` : 'none'; 
}

function applyChatBackground() {
  const chatScreen = document.getElementById('screen-chat');
  const chatMessages = document.getElementById('chat-messages');
  if (chatBackgroundImage) {
      chatScreen.style.backgroundImage = `url('${chatBackgroundImage}')`;
      chatScreen.style.backgroundSize = 'cover';
      chatScreen.style.backgroundPosition = 'center';
      chatScreen.style.backgroundAttachment = 'fixed';
      chatMessages.style.backgroundColor = 'transparent';
  } else {
      chatScreen.style.backgroundImage = 'none';
      chatMessages.style.backgroundColor = '#f2f2f7';
  }
}

function updateChatBgPreview() { 
  const preview = document.getElementById('chat-bg-preview'); 
  if (preview) { preview.src = chatBackgroundImage || ''; } 
}

function applyDesktopWallpaper() { 
  const home = document.getElementById('screen-home'); 
  if(desktopWallpaper){ home.style.backgroundImage = `url('${desktopWallpaper}')`; home.style.backgroundSize = 'cover'; home.style.backgroundPosition = 'center'; } 
  else { home.style.backgroundImage = 'var(--bg-gradient)'; } 
}

function updateWallpaperPreview() { 
  const preview = document.getElementById('wallpaper-preview'); 
  if(desktopWallpaper){ preview.style.backgroundImage = `url('${desktopWallpaper}')`; } 
  else { preview.style.backgroundImage = 'var(--bg-gradient)'; } 
}

function applyAppIconStyle() {
  const homeScreen = document.getElementById('screen-home');
  homeScreen.dataset.iconStyle = appIconStyle;
  const iconMap = { 
      wechat: 'fab fa-weixin', 
      worldbook: 'fas fa-book-open', 
      settings: 'fas fa-cog', 
      themes: 'fas fa-palette',
      charphone: 'fas fa-mobile-alt'
  };
  document.querySelectorAll('#screen-home .app-item').forEach(item => {
      const appName = (item).dataset.app;
      const iconBox = item.querySelector('.app-icon-box');
      iconBox.style.backgroundImage = '';
      iconBox.innerHTML = `<i class="${iconMap[appName]}"></i>`;
      if (appIconStyle === 'custom' && customAppIcons[appName]) {
          iconBox.innerHTML = '';
          iconBox.style.backgroundImage = `url('${customAppIcons[appName]}')`;
          iconBox.style.backgroundSize = 'cover';
      }
  });
}

function renderCustomIconEditor() {
  const grid = document.getElementById('custom-icon-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const apps = [
      {id: 'wechat', name: '微信'}, 
      {id: 'worldbook', name: '世界书'}, 
      {id: 'settings', name: '设置'}, 
      {id: 'themes', name: '主题'},
      {id: 'charphone', name: '查手机'}
  ];
  apps.forEach(app => {
      const item = document.createElement('div');
      item.className = 'app-item';
      item.onclick = () => editCustomIcon(app.id);
      const iconUrl = customAppIcons[app.id];
      item.innerHTML = `
          <div class="app-icon-box" style="${iconUrl ? `background-image:url(${iconUrl}); background-size:cover;` : 'background-color:#eee;'}">
              ${!iconUrl ? '<i class="fas fa-plus"></i>' : ''}
          </div>
          <span>${app.name}</span>
      `;
      grid.appendChild(item);
  });
}

function editCustomIcon(appName) {
    currentEditingIcon = appName;
    const input = document.getElementById('custom-icon-upload');
    if(input) input.click();
}

function showAddWBModal() {
    document.getElementById('wb-modal-title').innerText = '新建世界书';
    document.getElementById('wb-id').value = '';
    document.getElementById('wb-title').value = '';
    document.getElementById('wb-content').value = '';
    const groupSelect = document.getElementById('wb-group-select');
    groupSelect.innerHTML = '';
    wbGroups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.innerText = g;
        groupSelect.appendChild(opt);
    });
    document.getElementById('modal-wb').style.display = 'flex';
}

function hideMomentCommentBar() {
    const bar = document.getElementById('moment-comment-bar');
    if (bar) bar.style.display = 'none';
    replyingToComment = null;
    selectedCommentMid = null;
    selectedCommentId = null;
    document.getElementById('moment-comment-input').placeholder = '评论...';
}

function toggleActionPanel(type) {
    const panel = document.getElementById('action-panel');
    const emojiPanel = document.getElementById('panel-emoji');
    const morePanel = document.getElementById('panel-more');
    const currentlyOpen = panel.classList.contains('show');
    const openingSamePanel = (type === 'emoji' && emojiPanel.classList.contains('active')) ||
                             (type === 'more' && morePanel.classList.contains('active'));

    if (currentlyOpen && openingSamePanel) {
        panel.classList.remove('show');
    } else {
        panel.classList.add('show');
        document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${type}`).classList.add('active');
        if (type === 'emoji') renderEmojiPanel();
        if (type === 'more') renderActionPanel();
    }
}

function renderActionPanel() {
    const grid = document.getElementById('action-grid-more');
    if (!grid) return;
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;

    let actions = [
        { name: '照片', icon: 'fas fa-image', action: "document.getElementById('img-send-upload').click()" },
        { name: '记忆', icon: 'fas fa-brain', action: "openMemoryModal()" },
    ];
    
    if (char.isGroup) {
        // Red packet action removed
    } else {
        actions.push({ name: '转账', icon: 'fas fa-exchange-alt', action: "sendTransfer()" });
        actions.push({ name: '线下', icon: 'fas fa-theater-masks', action: "openOfflineModeSettings()" });
    }

    grid.innerHTML = actions.map(a => `
        <div class="action-item" onclick="${a.action}">
            <div class="action-icon"><i class="${a.icon}"></i></div>
            <span>${a.name}</span>
        </div>
    `).join('');
}

function switchEmojiGroup(group) {
    currentEmojiGroup = group;
    renderEmojiPanel();
}

function addNewEmojiGroup() {
    document.getElementById('new-emoji-group-name-input').value = '';
    document.getElementById('modal-new-emoji-group').style.display = 'flex';
}

function confirmAddNewEmojiGroup() {
    const newGroup = document.getElementById('new-emoji-group-name-input').value.trim();
    if (newGroup && !emojiGroups.includes(newGroup)) {
        emojiGroups.push(newGroup);
        localStorage.setItem('emojiGroups', JSON.stringify(emojiGroups));
        currentEmojiGroup = newGroup;
        renderEmojiPanel();
    }
    closeModal('modal-new-emoji-group');
}

function renderContacts() {
    const container = document.getElementById('contact-container');
    container.innerHTML = '';
    
    const sortedContacts = [...contacts].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const lastMsgA = a.history[a.history.length - 1];
        const lastMsgB = b.history[b.history.length - 1];
        const timeA = lastMsgA ? lastMsgA.timestamp : 0;
        const timeB = lastMsgB ? lastMsgB.timestamp : 0;
        return timeB - timeA;
    });

    sortedContacts.forEach(c => {
        const lastMsg = c.history[c.history.length - 1] || {};
        let desc = lastMsg.content || '';
        if (lastMsg.type === 'image') desc = '[图片]';
        else if (lastMsg.type === 'transfer') desc = '[转账]';
        else if (lastMsg.type === 'red-packet') desc = '[红包]';
        else if (lastMsg.type === 'dice') desc = '[骰子]';
        
        const item = document.createElement('div');
        item.className = 'contact-item' + (c.isPinned ? ' pinned' : '');
        item.dataset.charId = c.id;
        item.onclick = () => openChat(c.id);
        item.innerHTML = `
            <div class="contact-avatar" style="background-image: url('${c.avatar}')"></div>
            <div class="contact-info">
                <div class="contact-name">${c.name}</div>
                <div class="contact-desc">${desc}</div>
            </div>
            <div class="contact-meta">
                <span>${formatContactTime(lastMsg.timestamp)}</span>
                ${c.unreadCount > 0 ? `<div class="unread-badge">${c.unreadCount}</div>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

function renderCharPhoneList() {
    const container = document.getElementById('char-phone-list');
    container.innerHTML = '';
    const characters = contacts.filter(c => !c.isGroup);
    if (characters.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding-top:20px;">没有角色可以查看。</p>';
        return;
    }
    characters.forEach(char => {
        const charDiv = document.createElement('div');
        charDiv.className = 'addr-item';
        charDiv.onclick = () => showCharWallet(char.id);
        charDiv.innerHTML = `
            <div class="addr-avatar" style="background-image: url(${char.avatar || ''})"></div>
            <div class="addr-name">${char.name}</div>
        `;
        container.appendChild(charDiv);
    });
}

function showCharWallet(charId) {
    const character = contacts.find(c => c.id === charId);
    if (!character) return;
    const currentBalance = character.walletBalance !== undefined ? character.walletBalance : 0;
    const newBalanceStr = prompt(`查看/编辑 ${character.name} 的钱包余额:`, currentBalance);
    
    if (newBalanceStr !== null) { // User didn't cancel
        const newBalance = parseFloat(newBalanceStr);
        if (!isNaN(newBalance)) {
            character.walletBalance = newBalance;
            localStorage.setItem('contacts', JSON.stringify(contacts));
            showToast(`${character.name} 的余额已更新`, 'success');
        } else {
            showToast('无效的金额', 'error');
        }
    }
}

function renderChat() {
  const container = document.getElementById('chat-messages');
  const char = contacts.find((c) => c.id === currentChatId);
  if (!container || !char) return;
  container.innerHTML = '';
  lastDisplayedTimestamp = 0;

  char.history.forEach((msg, index) => {
    if (msg.timestamp - lastDisplayedTimestamp > 5 * 60 * 1000) {
      const timeLabel = document.createElement('div');
      timeLabel.className = 'chat-time-label';
      timeLabel.textContent = formatChatTime(msg.timestamp);
      container.appendChild(timeLabel);
      lastDisplayedTimestamp = msg.timestamp;
    }

    if (msg.type === 'system') {
        const sysLabel = document.createElement('div');
        sysLabel.className = 'sys-tip';
        sysLabel.textContent = msg.content;
        container.appendChild(sysLabel);
        return;
    }

    const isSelf = msg.sender === 'user';
    const isImg = msg.type === 'image';

    const msgElement = createMessageElement(msg, isSelf, isImg, index);
    
    container.appendChild(msgElement);
  });
  
  container.scrollTop = container.scrollHeight;
  updateChatTitleIndicator();
}

function showTypingIndicator() {
    const titleEl = document.getElementById('chat-title');
    if (titleEl) {
        const char = contacts.find((c) => c.id === currentChatId);
        if(char) {
            titleEl.dataset.originalTitle = titleEl.innerHTML;
            titleEl.innerText = '对方正在输入中...';
        }
    }
}

function hideTypingIndicator() {
     const titleEl = document.getElementById('chat-title');
     if (titleEl && titleEl.dataset.originalTitle) {
         titleEl.innerHTML = titleEl.dataset.originalTitle;
         delete titleEl.dataset.originalTitle;
     }
}

async function sendAiTextAsSentences(sentences, char, speakerId, speakerName) {
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (sentence.trim() === '') continue;

        const textMsg = {
            senderId: speakerId,
            senderName: speakerName,
            content: sentence.trim(),
            timestamp: Date.now() + i, // Add a tiny offset to maintain order
            type: 'text'
        };
        if (!char.isGroup) textMsg.sender = speakerId;
        char.history.push(textMsg);
        
        const chatScreenIsActive = document.getElementById('screen-chat').classList.contains('active');
        if (chatScreenIsActive && currentChatId === char.id) {
            renderChat(); // Update UI for this message
        }
        
        if (i < sentences.length - 1) { // Don't delay after the last message
            const delay = 500 + Math.random() * 700;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function getAIResponse(isContinuation = false) {
    const char = contacts.find((c) => c.id === currentChatId);
    if (!char || !config.key) {
        if (!config.key) {
            showToast('请在设置中配置 API Key', 'error');
        }
        return;
    }

    showTypingIndicator();

    try {
        let responseText;

        // --- Build Common Data ---
        let systemInstructionText = savedUserPersona;

        let capabilities = [
            "You can roll a dice by starting your response with '[DICE]'. Example: '[DICE] Let's see!'",
            "You can send a money transfer to the user (if you have enough balance) by starting your response with '[TRANSFER:amount]'. Example: '[TRANSFER:5.20] Here is some pocket money.'",
            "You can accept a pending transfer from the user by responding with '[ACCEPT]'. You can optionally add text after, like '[ACCEPT] Thanks!'",
            "You can return a pending transfer from the user by responding with '[RETURN]'. You can optionally add text after, like '[RETURN] No need, thanks.'",
            "You can change your avatar by describing a new one. Start your response with '[SET_AVATAR_SEED:description]'. Example: '[SET_AVATAR_SEED:a happy smiling cat]'",
            "You can delete your most recent Moments post by responding with just '[DELETE_MOMENT]' and an optional confirmation text."
        ];

        if (char.isGroup) {
            systemInstructionText += "\n\n这是一个群聊。群成员如下:\n";
            char.members.forEach(memberId => {
                const member = contacts.find(c => c.id === memberId);
                if (member) systemInstructionText += `- ${member.name}: ${member.prompt}\n`;
            });
            systemInstructionText += "\n根据最新的对话内容，选择一个最合适的角色进行回复。你的回复必须以'角色名: '开头，例如 '张三: 你好啊'。This format applies to all capabilities, for example: '张三: [TRANSFER:10] Lunch is on me!'";
        } else {
            systemInstructionText += `\n\n${char.prompt}`;
            const wb = worldBooks.find(w => w.id === char.worldBookId);
            if (wb) systemInstructionText += `\n\n[World Book: ${wb.title}]\n${wb.content}`;
            if (!char.offlineMode || !char.offlineMode.enabled) systemInstructionText += "\n\nThis is an online chat. Your reply must be a direct spoken message. Keep it concise and conversational, like a real chat. Avoid long paragraphs. Do NOT include descriptive actions or thoughts in asterisks (*...*).";
        }
        systemInstructionText += "\n\nAvailable Actions:\n- " + capabilities.join('\n- ');

        // --- Detect Model Type and Call API ---
        const modelName = config.model.toLowerCase();
        const isOpenAICompatible = modelName.includes('gpt') || modelName.includes('claude') || modelName.includes('llama');
        
        if (isOpenAICompatible && !config.baseUrl) {
            throw new Error('使用非 Gemini 模型时，必须在设置中填写“API 地址 (反代)”。');
        }

        if (isOpenAICompatible && config.baseUrl) {
            // --- OpenAI-Compatible API Call ---
            const apiHost = getCleanBaseUrl(config.baseUrl);
            const url = `${apiHost}/v1/chat/completions`;
            
            let messagesForAPI = [{ role: 'system', content: systemInstructionText }];

            char.history.slice(-char.memory.limit).forEach(msg => {
                let text;
                if (msg.type === 'text' || !msg.type) text = msg.content;
                else if (msg.type === 'transfer' && msg.sender === 'user') text = `[你发起了一笔 ${msg.amount.toFixed(2)} 元的转账]`;
                else if (msg.type === 'transfer' && msg.sender !== 'user') text = `[你收到了一笔 ${msg.amount.toFixed(2)} 元的转账]`;
                else if (msg.type === 'red-packet') text = '[你发了一个红包]';
                else if (msg.type === 'dice') text = '[掷骰子]';
                
                if (text) {
                    const role = (msg.sender === 'user' || msg.senderId === 'user') ? 'user' : 'assistant';
                    const content = (role === 'assistant' && char.isGroup) ? `${msg.senderName}: ${text}` : text;
                    messagesForAPI.push({ role, content });
                }
            });
            
            if (isContinuation) {
                messagesForAPI.push({ role: 'user', content: '继续' });
            }

            const body = {
                model: config.model,
                messages: messagesForAPI,
                temperature: config.temp
            };

            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
                body: JSON.stringify(body)
            });

            if (!resp.ok) {
                const errorData = await resp.json();
                throw new Error(errorData.error?.message || `HTTP Error ${resp.status}`);
            }
            const data = await resp.json();
            responseText = data.choices?.[0]?.message?.content;

        } else {
            // --- Google Gemini API Call (Proxy or Direct) ---
            const historyForAPI = char.history.slice(-char.memory.limit)
                .map(msg => {
                    let text;
                    if (msg.type === 'text' || !msg.type) text = msg.content;
                    else if (msg.type === 'transfer' && msg.sender === 'user') text = `[你发起了一笔 ${msg.amount.toFixed(2)} 元的转账]`;
                    else if (msg.type === 'transfer' && msg.sender !== 'user') text = `[你收到了一笔 ${msg.amount.toFixed(2)} 元的转账]`;
                    else if (msg.type === 'red-packet') text = '[你发了一个红包]';
                    else if (msg.type === 'dice') text = '[掷骰子]';
                    else return null;

                    if (!text) return null;

                    const role = (msg.sender === 'user' || msg.senderId === 'user') ? 'user' : 'model';
                    const content = (role === 'model' && char.isGroup) ? `${msg.senderName}: ${text}` : text;
                    return { role, parts: [{ text: content }] };
                }).filter(Boolean);
                
            const contentsForAPI = [...historyForAPI];
            if (isContinuation) {
                contentsForAPI.push({ role: 'user', parts: [{ text: '继续' }] });
            }
                
            if(contentsForAPI.length === 0) return;

            if (config.baseUrl) {
                const apiHost = getCleanBaseUrl(config.baseUrl);
                const url = `${apiHost}/v1beta/models/${config.model}:generateContent?key=${config.key}`;
                const body = {
                    contents: contentsForAPI,
                    systemInstruction: { parts: [{ text: systemInstructionText }] },
                    generationConfig: { temperature: config.temp }
                };
                const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                if (!resp.ok) {
                    const errorData = await resp.json();
                    throw new Error(errorData.error?.message || `HTTP Error ${resp.status}`);
                }
                const data = await resp.json();
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            } else {
                const ai = new GoogleGenAI({ apiKey: config.key });
                const response = await ai.models.generateContent({
                    model: config.model,
                    contents: contentsForAPI,
                    config: {
                      systemInstruction: { parts: [{ text: systemInstructionText }] },
                      temperature: config.temp,
                    },
                });
                responseText = response.text;
            }
        }

        // --- Process Response ---
        if (responseText) {
            let aiText = responseText.trim();
            let messageContent = aiText;
            let speakerId = char.isGroup ? null : char.id;
            let speakerName = char.isGroup ? null : char.name;
            let speakerChar = char;

            if (char.isGroup) {
                const match = aiText.match(/^(.+?):([\s\S]*)$/);
                if (match) {
                    const parsedSpeakerName = match[1].trim();
                    messageContent = match[2].trim();
                    const member = char.members.map(id => contacts.find(c => c.id === id)).find(m => m && m.name === parsedSpeakerName);
                    if (member) {
                        speakerId = member.id;
                        speakerName = member.name;
                        speakerChar = member;
                    } else {
                         showToast(`AI回复格式错误 (未知说话人: ${parsedSpeakerName})`, 'error');
                         return;
                    }
                } else {
                     showToast('AI回复格式错误，已忽略', 'error');
                     return;
                }
            }
            
            const transferActionMatch = messageContent.match(/^\[(ACCEPT|RETURN)\]\s*/);
            const transferMatch = messageContent.match(/^\[TRANSFER:([\d.]+)\]\s*/);
            const avatarMatch = messageContent.match(/^\[SET_AVATAR_SEED:(.+?)\]\s*/);
            const deleteMomentMatch = messageContent.match(/^\[DELETE_MOMENT\]\s*/);
            
            if (transferActionMatch) {
                const lastUserTransfer = char.history.findLast(m => m.type === 'transfer' && m.sender === 'user' && m.status === 'pending');
                if (lastUserTransfer) {
                    const action = transferActionMatch[1];
                    messageContent = messageContent.substring(transferActionMatch[0].length).trim();
            
                    if (action === 'ACCEPT') {
                        lastUserTransfer.status = 'accepted';
                        if (speakerChar.walletBalance !== undefined) speakerChar.walletBalance += lastUserTransfer.amount;
                        
                        const newConfirmationMsg = {
                            id: `transfer_confirm_${Date.now()}`,
                            senderId: speakerId,
                            senderName: speakerName,
                            content: `收到转账`,
                            timestamp: Date.now(),
                            type: 'transfer',
                            amount: lastUserTransfer.amount,
                            status: 'accepted'
                        };
                        if (!char.isGroup) newConfirmationMsg.sender = speakerId;
                        char.history.push(newConfirmationMsg);

                    } else { // RETURN
                        lastUserTransfer.status = 'returned';
                        walletBalance += lastUserTransfer.amount;
                        localStorage.setItem('walletBalance', walletBalance.toString());
                        updateMeTab();

                        const newConfirmationMsg = {
                            id: `transfer_confirm_${Date.now()}`,
                            senderId: speakerId,
                            senderName: speakerName,
                            content: `退还转账`,
                            timestamp: Date.now(),
                            type: 'transfer',
                            amount: lastUserTransfer.amount,
                            status: 'returned'
                        };
                        if (!char.isGroup) newConfirmationMsg.sender = speakerId;
                        char.history.push(newConfirmationMsg);
                    }
                } else {
                     messageContent = messageContent.substring(transferActionMatch[0].length).trim();
                }

            } else if (transferMatch) {
                const amount = parseFloat(transferMatch[1]);
                if (speakerChar && !isNaN(amount) && amount > 0 && speakerChar.walletBalance >= amount) {
                    speakerChar.walletBalance -= amount;
                    const newMsg = { id: `transfer_${Date.now()}`, senderId: speakerId, senderName: speakerName, content: `向你转账`, timestamp: Date.now(), type: 'transfer', amount: amount, status: 'pending' };
                     if(!char.isGroup) newMsg.sender = speakerId;
                    char.history.push(newMsg);
                }
                messageContent = messageContent.substring(transferMatch[0].length).trim();
            } else if (avatarMatch) {
                const seed = avatarMatch[1];
                if (speakerChar) {
                    speakerChar.avatar = `https://api.dicebear.com/7.x/miniavs/svg?seed=${encodeURIComponent(seed)}`;
                    showToast(`${speakerName}更换了头像`, 'success');
                }
                messageContent = messageContent.substring(avatarMatch[0].length).trim();
            } else if (deleteMomentMatch) {
                const lastMomentIndex = moments.findLastIndex(m => m.charId === speakerId);
                if (lastMomentIndex > -1) {
                    moments.splice(lastMomentIndex, 1);
                    localStorage.setItem('moments', JSON.stringify(moments));
                    showToast(`${speakerName}删除了一条朋友圈`, 'success');
                    if (document.getElementById('tab-moments').style.display === 'block') {
                        renderMoments();
                    }
                }
                messageContent = messageContent.substring(deleteMomentMatch[0].length).trim();
            }

            let didRenderSequentially = false;
            if (messageContent) {
                const diceMatch = messageContent.match(/^\[DICE\]\s*/);
                if (diceMatch) {
                    const remainingText = messageContent.substring(diceMatch[0].length).trim();
                    const diceValue = Math.floor(Math.random() * 6) + 1;
                    const diceMsg = { senderId: speakerId, senderName: speakerName, content: '', timestamp: Date.now(), type: 'dice', value: diceValue };
                    if (!char.isGroup) diceMsg.sender = speakerId;
                    char.history.push(diceMsg);
                    messageContent = remainingText || null;
                }

                if (messageContent) {
                     if (!char.isGroup && char.offlineMode?.enabled) {
                        const textMsg = { senderId: speakerId, senderName: speakerName, content: messageContent, timestamp: Date.now(), type: 'text' };
                        if (!char.isGroup) textMsg.sender = speakerId;
                        char.history.push(textMsg);
                    } else {
                        const sentences = messageContent.split('\n').filter(s => s.trim());
                        await sendAiTextAsSentences(sentences, char, speakerId, speakerName);
                        didRenderSequentially = true;
                    }
                }
            }

            const chatScreenIsActive = document.getElementById('screen-chat').classList.contains('active');
            
            if (!chatScreenIsActive || currentChatId !== char.id) {
                char.unreadCount = (char.unreadCount || 0) + 1;
                lastNotificationCharId = char.id;
                
                const notificationBody = responseText.trim().split('\n')[0].replace(/\[.*?\]\s*/, '').trim();
                
                if (notificationBody) {
                    showNotification(speakerName, notificationBody, speakerChar.avatar);
                }
            }
            
            localStorage.setItem('contacts', JSON.stringify(contacts));

            if (chatScreenIsActive && currentChatId === char.id) {
                if (!didRenderSequentially) {
                    renderChat();
                }
            }
            
            renderContacts();

        } else {
             throw new Error("AI response was empty.");
        }
    } catch (e) {
        console.error("API Error:", e);
        showToast(`AI回复出错: ${e.message}`, 'error');
    } finally {
        hideTypingIndicator();
    }
}


async function continueAIResponse() {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    await getAIResponse(true);
}


async function sendMessage() {
  const input = document.getElementById('msg-input');
  const content = input.value.trim();
  if (!content) return;

  const char = contacts.find((c) => c.id === currentChatId);
  if (!char) return;

  const newMsg = {
    sender: 'user',
    content: content,
    timestamp: Date.now(),
    type: 'text',
    quote: replyingToMsg ? { name: replyingToMsg.sender === 'user' ? savedUserName : char.name, content: replyingToMsg.content } : null
  };

  char.history.push(newMsg);
  localStorage.setItem('contacts', JSON.stringify(contacts));
  renderChat();
  renderContacts();
  cancelReply();
  input.value = '';
  handleInput();
  // getAIResponse(); // Removed for manual trigger
};

function openChat(id) {
    currentChatId = id;
    const char = contacts.find((c) => c.id === currentChatId);
    if (!char) return;

    document.getElementById('chat-title').innerText = char.name;
    char.unreadCount = 0;
    renderChat();
    showScreen('screen-chat');
}

function renderMoments() {
    const container = document.getElementById('moments-container');
    container.innerHTML = '';
    const sortedMoments = [...moments].sort((a, b) => b.timestamp - a.timestamp);
    sortedMoments.forEach(m => {
        const poster = contacts.find(c => c.id === m.charId) || { name: savedUserName, avatar: savedUserAvatar };
        const item = document.createElement('div');
        item.className = 'moment-item';
        
        let likesHtml = m.likes.map(lId => {
            if (lId === 'user') return savedUserName;
            return contacts.find(c => c.id === lId)?.name || '';
        }).filter(Boolean).join(', ');
        
        let commentsHtml = m.comments.map(c => `
            <div class="m-comment-item" data-comment-id="${c.id}" 
                 oncontextmenu="event.preventDefault(); window.menuActionComment('long-press', event, '${m.id}', '${c.id}')"
                 onclick="window.commentMoment('${m.id}', '${c.id}')">
                <span class="m-comment-user">${c.senderName}</span>
                ${c.replyTo ? `回复 <span class="m-comment-user">${c.replyTo}</span>` : ''}: 
                ${c.text}
            </div>`).join('');

        const isLiked = m.likes.includes('user');

        item.innerHTML = `
            <div class="m-avatar" style="background-image: url('${poster.avatar}')"></div>
            <div class="m-content">
                <div class="m-name">${poster.name}</div>
                <div class="m-text">${m.text}</div>
                ${m.image ? `<img src="${m.image}" class="msg-img" onclick="window.showLightbox('${m.image}')">` : ''}
                <div class="m-meta">
                    <span>${formatContactTime(m.timestamp)}</span>
                    ${m.charId === 'user' ? `<span class="m-del-btn" onclick="window.deleteMoment('${m.id}')">删除</span>` : ''}
                    <div class="m-actions-toolbar">
                        <div class="m-action-item" onclick="window.likeMoment('${m.id}', this)">
                           <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                           <span>${m.likes.length > 0 ? m.likes.length : '点赞'}</span>
                        </div>
                        <div class="m-action-item" onclick="window.commentMoment('${m.id}')">
                           <i class="far fa-comment-dots"></i>
                           <span>${m.comments.length > 0 ? m.comments.length : '评论'}</span>
                        </div>
                    </div>
                </div>
                <div class="m-comments-area" style="${(m.likes.length > 0 || m.comments.length > 0) ? '' : 'display:none;'}">
                    ${m.likes.length > 0 ? `<div class="m-like-list"><i class="fas fa-heart" style="color:var(--wx-blue); margin-right:5px;"></i> ${likesHtml}</div>` : ''}
                    <div class="m-comments-list">${commentsHtml}</div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderAddressBook() {
    const container = document.getElementById('address-book-container');
    container.innerHTML = '';
    
    const grouped = contacts.reduce((acc, c) => {
        if (c.isGroup) return acc;
        const groupName = c.group || '未分组';
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(c);
        return acc;
    }, {});
    
    // Add groups first
    const groupSection = document.createElement('div');
    groupSection.innerHTML = `<div class="addr-group-title">群聊</div>`;
    contacts.filter(c => c.isGroup).forEach(g => {
        groupSection.innerHTML += `
            <div class="addr-item" onclick="openChat('${g.id}')">
                <div class="addr-avatar" style="background-image: url('${g.avatar}')"></div>
                <div class="addr-name">${g.name}</div>
            </div>
        `;
    });
    container.appendChild(groupSection);
    
    Object.keys(grouped).sort().forEach(groupName => {
        const section = document.createElement('div');
        section.innerHTML = `<div class="addr-group-title">${groupName}</div>`;
        grouped[groupName].forEach(c => {
             section.innerHTML += `
                <div class="addr-item" onclick="openChat('${c.id}')">
                    <div class="addr-avatar" style="background-image: url('${c.avatar}')"></div>
                    <div class="addr-name">${c.name}</div>
                </div>
            `;
        });
        container.appendChild(section);
    });
}

function acceptTransfer(msgId) {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    const msg = char.history.find(m => m.id === msgId);

    if (msg && msg.status === 'pending') {
        msg.status = 'accepted';
        walletBalance += msg.amount;
        localStorage.setItem('walletBalance', walletBalance.toString());

        const newConfirmationMsg = {
            id: `transfer_confirm_${Date.now()}`,
            sender: 'user',
            content: `收到转账`,
            timestamp: Date.now(),
            type: 'transfer',
            amount: msg.amount,
            status: 'accepted'
        };
        char.history.push(newConfirmationMsg);
        
        localStorage.setItem('contacts', JSON.stringify(contacts));
        renderChat();
        updateMeTab();
        renderContacts();
    }
};

function menuAction(action) {
    const menu = document.getElementById('msg-context-menu');
    if (menu) menu.style.display = 'none';
    if (selectedMsgIndex === null) return;
    
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    const msg = char.history[selectedMsgIndex];

    switch(action) {
        case 'retry':
            // "Retry" is for AI messages. It deletes the AI's message and regenerates.
            const msgToRetry = char.history[selectedMsgIndex];
            if (msgToRetry && msgToRetry.sender !== 'user') {
                char.history.splice(selectedMsgIndex, 1); // Remove the AI message
                localStorage.setItem('contacts', JSON.stringify(contacts));
                renderChat();
                getAIResponse(); // Regenerate response based on previous history
            }
            break;
        case 'reply':
            replyingToMsg = msg;
            const quoteBar = document.getElementById('quote-bar');
            const quoteContent = document.getElementById('quote-content-preview');
            if (quoteBar && quoteContent) {
                quoteContent.innerText = msg.content;
                quoteBar.style.display = 'flex';
            }
            break;
        case 'multi-select':
             isMultiSelectMode = true;
             selectedMessageIndices = [selectedMsgIndex];
             document.getElementById('multi-select-bar').style.display = 'flex';
             document.getElementById('input-area').style.display = 'none';
             renderChat();
            break;
        case 'edit':
             // Allow editing both user and AI messages
             if (msg && (msg.type === 'text' || !msg.type)) {
                editingMessageIndex = selectedMsgIndex;
                document.getElementById('edit-message-input').value = msg.content;
                document.getElementById('modal-edit-message').style.display = 'flex';
             }
            break;
        case 'delete':
            char.history.splice(selectedMsgIndex, 1);
            localStorage.setItem('contacts', JSON.stringify(contacts));
            renderChat();
            break;
        case 'recall':
            if (msg.sender === 'user' && (Date.now() - msg.timestamp) < 2 * 60 * 1000) {
                msg.type = 'system';
                msg.content = '你撤回了一条消息';
                localStorage.setItem('contacts', JSON.stringify(contacts));
                renderChat();
            }
            break;
    }
    selectedMsgIndex = null;
};

function cancelReply() {
    replyingToMsg = null;
    const quoteBar = document.getElementById('quote-bar');
    if(quoteBar) quoteBar.style.display = 'none';
};

function showLightbox(src) {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        (lightbox.querySelector('img')).src = src;
        lightbox.style.display = 'flex';
    }
};

function hideLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
    }
};

function sendDiceMessage() {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    const value = Math.floor(Math.random() * 6) + 1;
    const newMsg = { sender: 'user', content: '', timestamp: Date.now(), type: 'dice', value: value };
    char.history.push(newMsg);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderChat();
    renderContacts();
    document.getElementById('action-panel').classList.remove('show');
    // getAIResponse(); // Removed for manual trigger
};

function sendImageMessageOnly(src) {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    const newMsg = { sender: 'user', content: src, timestamp: Date.now(), type: 'image' };
    char.history.push(newMsg);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderChat();
    renderContacts();
    document.getElementById('action-panel').classList.remove('show');
    document.getElementById('img-send-upload').value = '';
    // getAIResponse(); // Removed for manual trigger
};

function showAddContactModal() {
    document.getElementById('new-name').value = '';
    document.getElementById('new-prompt').value = '';
    document.getElementById('new-char-avatar-preview').style.backgroundImage = '';
    document.getElementById('new-char-avatar-preview').innerHTML = '<i class="fas fa-camera"></i>';
    tempNewCharAvatar = '';
    document.getElementById('modal-add-char').style.display = 'flex';
    toggleAddMenu();
};

function addNewChar() {
    const name = document.getElementById('new-name').value.trim();
    const prompt = document.getElementById('new-prompt').value.trim();
    if (!name || !prompt) {
        showToast('名字和人设不能为空', 'error');
        return;
    }
    const newChar = {
        id: `char_${Date.now()}`,
        name,
        prompt,
        avatar: tempNewCharAvatar || `https://api.dicebear.com/7.x/miniavs/svg?seed=${name}`,
        history: [],
        isGroup: false,
        memory: { auto: false, limit: 20, summary: "" },
        unreadCount: 0,
        offlineMode: { enabled: false, showThoughts: true, userPov: 'second', charPov: 'first', wordCount: 150, styleWbId: '' },
        walletBalance: Math.floor(Math.random() * 2000) + 50,
        proactiveChat: false,
    };
    contacts.push(newChar);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderContacts();
    renderAddressBook();
    closeModal('modal-add-char');
    showToast('好友添加成功', 'success');
};

function showCreateGroupModal() {
    const listEl = document.getElementById('group-member-select-list');
    listEl.innerHTML = contacts.filter(c => !c.isGroup).map(c => `
        <div class="select-item">
            <input type="checkbox" id="member-${c.id}" value="${c.id}" class="group-member-checkbox">
            <label for="member-${c.id}" style="display:flex; align-items:center; width: 100%;">
                <div class="select-avatar" style="background-image:url('${c.avatar}')"></div>
                <span>${c.name}</span>
            </label>
        </div>
    `).join('');
    document.getElementById('modal-create-group').style.display = 'flex';
    toggleAddMenu();
};

function createNewGroupChat() {
    const name = document.getElementById('new-group-name').value.trim() || '群聊';
    const selectedMembers = Array.from(document.querySelectorAll('.group-member-checkbox:checked')).map(el => (el).value);
    
    if (selectedMembers.length === 0) {
        showToast('请至少选择一个群成员', 'error');
        return;
    }

    const newGroup = {
        id: `group_${Date.now()}`,
        name,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        history: [],
        isGroup: true,
        members: selectedMembers, // Store member IDs
        memory: { auto: false, limit: 20, summary: "" },
        unreadCount: 0
    };
    contacts.unshift(newGroup);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderContacts();
    renderAddressBook();
    closeModal('modal-create-group');
    showToast('群聊创建成功', 'success');
};

function postUserMoment() {
    const text = document.getElementById('moment-text').value.trim();
    if (!text && !tempMomentImg) {
        showToast('请输入内容或选择图片', 'error');
        return;
    }
    const visibility = document.getElementById('moment-visibility').value;
    const newMoment = {
        id: `moment_${Date.now()}`,
        charId: 'user',
        text,
        image: tempMomentImg,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        visibility: visibility
    };
    moments.push(newMoment);
    localStorage.setItem('moments', JSON.stringify(moments));
    renderMoments();
    closeModal('modal-post-moment');
    
    // 添加：触发AI好友评论
    setTimeout(() => {
        triggerAIComments(newMoment, { 
            senderId: 'user', 
            senderName: savedUserName, 
            text: newMoment.text, 
            id: null 
        });
    }, 2000 + Math.random() * 3000);
};

function deleteMoment(mid) {
    moments = moments.filter(m => m.id !== mid);
    localStorage.setItem('moments', JSON.stringify(moments));
    renderMoments();
    showToast('朋友圈已删除', 'success');
}

function likeMoment(mid, btnElement) {
    const moment = moments.find(m => m.id === mid);
    if (!moment) return;

    const icon = btnElement.querySelector('i');
    const countSpan = btnElement.querySelector('span');
    const momentItem = btnElement.closest('.moment-item');
    if (!icon || !countSpan || !momentItem) return;

    const userIndex = moment.likes.indexOf('user');
    if (userIndex > -1) {
        moment.likes.splice(userIndex, 1);
        icon.classList.remove('fas');
        icon.classList.add('far');
    } else {
        moment.likes.push('user');
        icon.classList.remove('far');
        icon.classList.add('fas', 'like-anim');
        setTimeout(() => icon.classList.remove('like-anim'), 400);
    }
    
    localStorage.setItem('moments', JSON.stringify(moments));
    
    // Update count display
    countSpan.textContent = moment.likes.length > 0 ? String(moment.likes.length) : '点赞';

    // Update the like list below
    const likesArea = momentItem.querySelector('.m-comments-area');
    let likeList = momentItem.querySelector('.m-like-list');

    if (moment.likes.length > 0) {
        if (!likeList) {
            likeList = document.createElement('div');
            likeList.className = 'm-like-list';
            if (likesArea.firstChild) {
                likesArea.insertBefore(likeList, likesArea.firstChild);
            } else {
                likesArea.appendChild(likeList);
            }
        }
        const likesHtml = moment.likes.map(lId => {
            if (lId === 'user') return savedUserName;
            return contacts.find(c => c.id === lId)?.name || '';
        }).filter(Boolean).join(', ');
        likeList.innerHTML = `<i class="fas fa-heart" style="color:var(--wx-blue); margin-right:5px;"></i> ${likesHtml}`;
        likeList.style.display = '';
    } else {
        if (likeList) {
            likeList.style.display = 'none';
        }
    }
    
    if(likesArea) {
         if (moment.likes.length > 0 || moment.comments.length > 0) {
            likesArea.style.display = '';
         } else {
            likesArea.style.display = 'none';
         }
    }
}

function commentMoment(mid, cid) {
    const moment = moments.find(m => m.id === mid);
    if (!moment) return;
    
    selectedCommentMid = mid;
    selectedCommentId = cid || null;
    
    const commentInput = document.getElementById('moment-comment-input');
    const commentBar = document.getElementById('moment-comment-bar');

    if (cid) {
        // Replying to a specific comment
        const targetComment = moment.comments.find(c => c.id === cid);
        if (targetComment) {
            replyingToComment = targetComment;
            commentInput.placeholder = `回复 ${targetComment.senderName}:`;
        }
    } else {
        // General comment on the moment
        replyingToComment = null;
        commentInput.placeholder = '评论...';
    }
    
    commentBar.style.display = 'flex';
    commentInput.focus();
};

function sendMomentComment() {
    const text = document.getElementById('moment-comment-input').value.trim();
    if (!text) return;

    const moment = moments.find(m => m.id === selectedCommentMid);
    if (!moment) return;

    const newComment = {
        id: `comment_${Date.now()}`,
        senderId: 'user',
        senderName: savedUserName,
        text: text,
        timestamp: Date.now(),
        replyTo: replyingToComment ? replyingToComment.senderName : null,
        replyToId: replyingToComment ? replyingToComment.id : null,
    };
    
    moment.comments.push(newComment);
    localStorage.setItem('moments', JSON.stringify(moments));
    renderMoments();
    hideMomentCommentBar(); // Reset and hide the comment bar
    document.getElementById('moment-comment-input').value = '';

    setTimeout(() => triggerAIComments(moment, newComment), 2000 + Math.random() * 3000);
};

function menuActionComment(action, event, mid, cid) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        // Set state here, as 'event' is only present on the initial call
        selectedCommentMid = mid;
        selectedCommentId = cid;
    }

    const menu = document.getElementById('comment-context-menu');
    
    if (action === 'long-press') {
        menu.style.display = 'block';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;

        const rect = menu.getBoundingClientRect();
        const shellRect = document.getElementById('phone-shell').getBoundingClientRect();
        if (rect.right > shellRect.right) menu.style.left = `${event.pageX - rect.width}px`;
        if (rect.bottom > shellRect.bottom) menu.style.top = `${event.pageY - rect.height}px`;

    } else if (action === 'delete') {
        if (menu) menu.style.display = 'none';
        
        if (!selectedCommentMid || !selectedCommentId) {
            console.error('No comment selected for deletion');
            return;
        }

        const moment = moments.find(m => m.id === selectedCommentMid);
        if (moment) {
            const originalLength = moment.comments.length;
            moment.comments = moment.comments.filter(c => c.id !== selectedCommentId);
            
            if (moment.comments.length < originalLength) {
                localStorage.setItem('moments', JSON.stringify(moments));
                renderMoments();
                showToast('评论已删除', 'success');
            } else {
                console.warn('Comment not found for deletion.');
            }
        }
        // Reset state variables after action
        selectedCommentMid = null;
        selectedCommentId = null;
    }
}

function saveCharDetailSettings() {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;

    char.name = document.getElementById('setting-char-name').value;
    char.group = document.getElementById('setting-char-group').value.trim();
    char.avatar = document.getElementById('setting-avatar-preview').src;

    if (!char.isGroup) {
        char.realname = document.getElementById('setting-char-realname').value;
        char.prompt = document.getElementById('setting-char-prompt').value;
        char.hideAvatar = document.getElementById('setting-char-hide-avatar').value;
        char.worldBookId = document.getElementById('setting-char-wb').value;
        char.selfAvatar = document.getElementById('setting-self-avatar-preview').src;
        char.syncReality = document.getElementById('setting-char-sync-reality').checked;
        char.useRealTime = document.getElementById('setting-char-real-time').checked;
        char.useRealWeather = document.getElementById('setting-char-real-weather').checked;
        char.city = document.getElementById('setting-char-city').value;
        char.proactiveChat = document.getElementById('setting-char-proactive').checked;
    }

    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderContacts();
    renderChat();
    backToChat();
    showToast('保存成功', 'success');
};

function deleteCurrentChar() {
  const char = contacts.find((c) => c.id === currentChatId);
  if (!char) return;
  const message = `确定要${char.isGroup ? '解散群聊' : '删除好友'} "${char.name}" 吗？此操作不可恢复。`;
  document.getElementById('confirm-delete-message').innerText = message;
  document.getElementById('modal-confirm-delete').style.display = 'flex';
}

function confirmDeleteChar() {
  if (!currentChatId) return;
  contacts = contacts.filter(c => c.id !== currentChatId);
  localStorage.setItem('contacts', JSON.stringify(contacts));
  closeModal('modal-confirm-delete');
  currentChatId = null;
  backToWeChat();
  showToast('已删除', 'success');
}

function toggleRealitySettings(checked) {
    const realityOptions = document.getElementById('reality-options');
    if (realityOptions) {
        realityOptions.style.display = checked ? 'block' : 'none';
    }
};

function toggleCityInput(checked) {
    const cityInputDiv = document.getElementById('city-input-div');
    if (cityInputDiv) {
        cityInputDiv.style.display = checked ? 'block' : 'none';
    }
};

function toggleOfflineOptions(checked) {
    const offlineOptions = document.getElementById('offline-options-container');
    if (offlineOptions) {
        offlineOptions.style.display = checked ? 'block' : 'none';
    }
};

function saveMemorySettings() {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    char.memory.auto = document.getElementById('mem-auto-toggle').checked;
    char.memory.limit = parseInt(document.getElementById('mem-limit-input').value, 10) || 20;
    char.memory.summary = document.getElementById('mem-summary-text').value;
    localStorage.setItem('contacts', JSON.stringify(contacts));
    closeModal('modal-memory');
    showToast('记忆设置已保存', 'success');
};

function saveOfflineModeSettings() {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    char.offlineMode = {
        enabled: document.getElementById('offline-mode-toggle').checked,
        showThoughts: document.getElementById('offline-show-thoughts').checked,
        userPov: document.getElementById('offline-user-pov').value,
        charPov: document.getElementById('offline-char-pov').value,
        wordCount: parseInt(document.getElementById('offline-word-count').value, 10) || 150,
        styleWbId: document.getElementById('offline-style-wb').value,
    };
    localStorage.setItem('contacts', JSON.stringify(contacts));
    closeModal('modal-offline-settings');
    updateChatTitleIndicator();
};

function sendTransfer() {
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    document.getElementById('transfer-recipient-name').innerText = char.name;
    document.getElementById('transfer-wallet-balance').innerText = walletBalance.toFixed(2);
    document.getElementById('transfer-amount').value = '';
    document.getElementById('modal-transfer').style.display = 'flex';
    document.getElementById('action-panel').classList.remove('show');
};

function openTopUpModal() {
    document.getElementById('topup-amount').value = '';
    document.getElementById('modal-wallet-topup').style.display = 'flex';
};

function confirmTopUp() {
    const amount = parseFloat(document.getElementById('topup-amount').value);
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效的充值金额', 'error');
        return;
    }
    walletBalance += amount;
    localStorage.setItem('walletBalance', walletBalance.toString());
    updateMeTab();
    document.getElementById('modal-wallet-balance').innerText = walletBalance.toFixed(2);
    closeModal('modal-wallet-topup');
    showToast(`充值成功 ¥${amount.toFixed(2)}`, 'success');
};

function openPasswordSetModal() {
    passwordModalContext.onsuccess = (newPassword) => {
        walletPassword = newPassword;
        localStorage.setItem('walletPassword', walletPassword);
        showToast('支付密码设置成功', 'success');
    };
    if (walletPassword) {
        // To change password, first verify old one
        passwordModalContext.mode = 'verify';
        openPasswordModal('请输入原支付密码', (password) => {
            if (password === walletPassword) {
                // Verified, now set new one
                passwordModalContext.mode = 'set';
                passwordModalContext.step = 1;
                openPasswordModal('请输入新支付密码', passwordModalContext.onsuccess);
            } else {
                showToast('原密码错误', 'error');
                return false; // Prevent modal from closing
            }
        });

    } else {
        // Set new password directly
        passwordModalContext.mode = 'set';
        passwordModalContext.step = 1;
        openPasswordModal('请设置6位支付密码', passwordModalContext.onsuccess);
    }
};

function showGroupManagerModal() {
    const addrGroups = ['未分组', ...new Set(contacts.filter(c => c.group).map(c => c.group))];
    const groupSelect = document.getElementById('target-addr-group');
    groupSelect.innerHTML = addrGroups.map(g => `<option value="${g}">${g}</option>`).join('');

    const moveList = document.getElementById('addr-move-list');
    moveList.innerHTML = contacts.filter(c => !c.isGroup).map(c => `
        <div class="select-item">
            <input type="checkbox" id="move-char-${c.id}" value="${c.id}" class="move-char-checkbox">
            <label for="move-char-${c.id}" style="display:flex; align-items:center; width:100%;">
                <div class="select-avatar" style="background-image:url('${c.avatar}')"></div>
                <span>${c.name} (${c.group || '未分组'})</span>
            </label>
        </div>
    `).join('');

    document.getElementById('modal-group-manager').style.display = 'flex';
};

function addNewAddrGroup() {
    const newGroup = document.getElementById('new-addr-group-name').value.trim();
    if (newGroup) {
        const groupSelect = document.getElementById('target-addr-group');
        const exists = Array.from(groupSelect.options).some(opt => opt.value === newGroup);
        if (!exists) {
            const option = document.createElement('option');
            option.value = newGroup;
            option.text = newGroup;
            groupSelect.add(option);
            groupSelect.value = newGroup;
            document.getElementById('new-addr-group-name').value = '';
            showToast(`分组 "${newGroup}" 已添加`, 'success');
        } else {
            showToast('分组已存在', 'info');
        }
    }
};

function saveAddrGroupMove() {
    const targetGroup = document.getElementById('target-addr-group').value;
    const selectedChars = Array.from(document.querySelectorAll('.move-char-checkbox:checked')).map(el => (el).value);
    
    if (selectedChars.length === 0) {
        showToast('请选择要移动的角色', 'info');
        return;
    }

    selectedChars.forEach(charId => {
        const char = contacts.find(c => c.id.toString() === charId);
        if (char) {
            char.group = targetGroup === '未分组' ? '' : targetGroup;
        }
    });

    localStorage.setItem('contacts', JSON.stringify(contacts));
    renderAddressBook();
    closeModal('modal-group-manager');
    showToast('角色已移动', 'success');
};

async function triggerAIComments(moment, lastComment) {
    if (!config.key) return;

    const poster = contacts.find(c => c.id === moment.charId) || { id: 'user', name: savedUserName };
    
    let visibleFriends;
    if (moment.visibility === 'all') {
        visibleFriends = contacts.filter(c => !c.isGroup && c.id !== 'user');
    } else {
        visibleFriends = contacts.filter(c => !c.isGroup && c.id !== 'user' && c.group === moment.visibility);
    }

    // A character can respond as long as they aren't the last person who commented.
    let potentialResponders = visibleFriends.filter(c => c.id !== lastComment.senderId);

    if (potentialResponders.length === 0) return;
    
    const responder = potentialResponders[Math.floor(Math.random() * potentialResponders.length)];
    if (!responder) return;

    // AI *must* reply to the user. Also increase the chance of AI-to-AI replies.
    const shouldReply = lastComment.senderId === 'user' || Math.random() < 0.6;

    if (shouldReply) {
        try {
            const ai = new GoogleGenAI({ apiKey: config.key });
            
            const targetComment = lastComment;
            const isReplying = targetComment && targetComment.id && targetComment.senderId !== responder.id;

            const prompt = `
            You are ${responder.name}. Your persona is: ${responder.prompt}.
            You are seeing a moment on your timeline from ${poster.name}.
            Moment content: "${moment.text}"
            ${isReplying ? 
              `You are replying to a comment from ${targetComment.senderName} that says: "${targetComment.text}".` :
              `You are making a new comment on the moment.`
            }
            Task: Write a short, natural, in-character comment.
            - Keep it brief (10-30 words).
            - Do not use hashtags or emojis.
            - Output only the comment text.
            Your comment:`;
            
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt,
                generationConfig: { temperature: 0.85 }
            });
            
            const replyText = response.text?.trim();
            
            if (replyText) {
                const newAIComment = {
                    id: `comment_${Date.now()}`,
                    senderId: responder.id,
                    senderName: responder.name,
                    text: replyText,
                    timestamp: Date.now(),
                    replyTo: isReplying ? targetComment.senderName : null,
                    replyToId: isReplying ? targetComment.id : null,
                };
                
                moment.comments.push(newAIComment);
                localStorage.setItem('moments', JSON.stringify(moments));
                
                if (document.getElementById('tab-moments').style.display === 'block') {
                    renderMoments();
                }
                
                // Only show notification if the comment is on the user's post.
                if (moment.charId === 'user') {
                    showNotification(responder.name, `评论了你的朋友圈: ${replyText.substring(0, 30)}...`, responder.avatar);
                }

                if (moment.comments.length < 8) {
                   setTimeout(() => triggerAIComments(moment, newAIComment), 3000 + Math.random() * 5000);
                }
            }
        } catch (e) {
            console.error("AI comment generation failed:", e);
        }
    }
}

async function generateAIMoment() {
    const charId = document.getElementById('moment-char-select').value;
    const char = contacts.find(c => c.id.toString() === charId);
    if (!char) {
        showToast('请选择一个角色', 'error');
        return;
    }
    if (!config.key) {
        showToast('请先在设置中配置API Key', 'error');
        return;
    }

    showToast('正在生成朋友圈...', 'info');
    closeModal('modal-char-moment-settings');

    try {
        const ai = new GoogleGenAI({ apiKey: config.key });
        
        const prompt = `你是${char.name}，你的人设是：${char.prompt}
        请你以这个角色的身份，创作一条朋友圈动态。
        要求：
        1. 完全符合角色的性格和背景
        2. 内容可以是日常分享、心情表达、趣事记录等
        3. 自然、真实、有生活气息
        4. 长度在15-50字之间
        5. 不要使用表情符号和#话题标签
        6. 直接输出动态内容，不要加引号
        
        朋友圈内容：`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            generationConfig: { temperature: 0.8 }
        });

        const momentText = response.text?.trim();

        if (momentText) {
            const newMoment = {
                id: `moment_${Date.now()}`,
                charId: char.id,
                text: momentText,
                image: '',
                timestamp: Date.now(),
                likes: [],
                comments: [],
                visibility: 'all'
            };
            
            moments.unshift(newMoment);
            localStorage.setItem('moments', JSON.stringify(moments));
            
            if (document.getElementById('tab-moments').style.display === 'block') {
                renderMoments();
            }
            
            showToast(`${char.name} 发布了朋友圈！`, 'success');
            
            setTimeout(() => {
                triggerAIComments(newMoment, { 
                    senderId: newMoment.charId, 
                    senderName: char.name, 
                    text: newMoment.text, 
                    id: null 
                });
            }, 2000 + Math.random() * 3000);
        } else {
            throw new Error('AI未能生成内容');
        }
    } catch (e) {
        console.error("Moment generation failed:", e);
        showToast('朋友圈生成失败', 'error');
    }
}

function startAutoMomentGeneration() {
    if (!autoMomentEnabled) return;
    
    // 每小时检查一次
    setInterval(async () => {
        const now = Date.now();
        
        // 至少间隔2小时才生成
        if (now - lastAutoMomentTimestamp < 2 * 60 * 60 * 1000) return;
        
        // 获取启用了自动朋友圈的角色
        const autoMomentChars = contacts.filter(c => c.autoMoment && !c.isGroup);
        if (autoMomentChars.length === 0) return;
        
        // 随机选择一个角色
        const char = autoMomentChars[Math.floor(Math.random() * autoMomentChars.length)];
        
        // 25%的概率生成朋友圈
        if (Math.random() < 0.25) {
            lastAutoMomentTimestamp = now;
            
            try {
                const ai = new GoogleGenAI({ apiKey: config.key });
                const prompt = `作为${char.name}（${char.prompt}），发一条简短的朋友圈，关于日常生活、心情或所见所闻，15-40字。`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    generationConfig: { temperature: 0.8 }
                });
                
                const momentText = response.text?.trim();
                
                if (momentText) {
                    const newMoment = {
                        id: `moment_${Date.now()}`,
                        charId: char.id,
                        text: momentText,
                        image: '',
                        timestamp: now,
                        likes: [],
                        comments: [],
                        visibility: 'all'
                    };
                    
                    moments.unshift(newMoment);
                    localStorage.setItem('moments', JSON.stringify(moments));
                    
                    lastAutoMomentTimestamp = now;
                    
                    setTimeout(() => {
                        triggerAIComments(newMoment, { 
                            senderId: newMoment.charId, 
                            senderName: char.name, 
                            text: newMoment.text, 
                            id: null 
                        });
                    }, 3000 + Math.random() * 4000);
                }
            } catch (e) {
                console.error("Auto moment generation failed:", e);
            }
        }
    }, 60 * 60 * 1000); // 每小时检查一次
}

function confirmTransfer() {
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    if (isNaN(amount) || amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    if (amount > walletBalance) {
        showToast('钱包余额不足', 'error');
        return;
    }
    
    const execute = () => {
        walletBalance -= amount;
        localStorage.setItem('walletBalance', walletBalance.toString());
        
        const char = contacts.find(c => c.id === currentChatId);
        if (char) {
            const newMsg = {
                id: `transfer_${Date.now()}`,
                sender: 'user',
                content: `向 ${char.name} 转账`,
                timestamp: Date.now(),
                type: 'transfer',
                amount: amount,
                status: 'pending' // pending, accepted, returned
            };
            char.history.push(newMsg);
            localStorage.setItem('contacts', JSON.stringify(contacts));
            renderChat();
            // getAIResponse(); // Removed for manual trigger
        }
        
        updateMeTab();
        closeModal('modal-transfer');
    };

    if (walletPassword) {
        openPasswordModal('请输入支付密码', (password) => {
            if (password === walletPassword) {
                execute();
                return true;
            } else {
                showToast('密码错误', 'error');
                return false;
            }
        });
    } else {
        execute();
    }
};

function openPasswordModal(title, onsuccess) {
    passwordModalContext.onsuccess = onsuccess;
    document.getElementById('password-modal-title').innerText = title;
    currentPasswordAttempt = '';
    document.querySelectorAll('#password-dots-container div').forEach(dot => dot.classList.remove('filled'));
    document.getElementById('password-error-msg').innerText = '';
    document.getElementById('modal-password-input').style.display = 'flex';
}

function closePasswordModal() {
     document.getElementById('modal-password-input').style.display = 'none';
};

function handleNumpadClick(num) {
    if (currentPasswordAttempt.length < 6) {
        currentPasswordAttempt += num;
        updatePasswordDots();

        if (currentPasswordAttempt.length === 6) {
            processPasswordAttempt();
        }
    }
};

function handleNumpadBackspace() {
    if (currentPasswordAttempt.length > 0) {
        currentPasswordAttempt = currentPasswordAttempt.slice(0, -1);
        updatePasswordDots();
    }
};

function updatePasswordDots() {
    document.querySelectorAll('#password-dots-container div').forEach((dot, index) => {
        if (index < currentPasswordAttempt.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function processPasswordAttempt() {
    const { mode, step } = passwordModalContext;

    if (mode === 'set') {
        if (step === 1) {
            passwordModalContext.tempPassword = currentPasswordAttempt;
            passwordModalContext.step = 2;
            document.getElementById('password-modal-title').innerText = '请再次输入以确认';
            currentPasswordAttempt = '';
            updatePasswordDots();
        } else { // step 2
            if (currentPasswordAttempt === passwordModalContext.tempPassword) {
                if(passwordModalContext.onsuccess) passwordModalContext.onsuccess(currentPasswordAttempt);
                closePasswordModal();
            } else {
                document.getElementById('password-error-msg').innerText = '两次输入的密码不一致';
                shakePasswordDots();
                currentPasswordAttempt = '';
                setTimeout(updatePasswordDots, 500);
                passwordModalContext.step = 1;
                document.getElementById('password-modal-title').innerText = '请设置6位支付密码';
            }
        }
    } else { // mode === 'verify'
        if (passwordModalContext.onsuccess) {
            const result = passwordModalContext.onsuccess(currentPasswordAttempt);
            if (result !== false) {
               closePasswordModal();
            } else {
               shakePasswordDots();
               currentPasswordAttempt = '';
               setTimeout(updatePasswordDots, 500);
            }
        }
    }
}

function shakePasswordDots() {
    const dots = document.getElementById('password-dots-container');
    if(dots) {
        dots.classList.add('shake');
        setTimeout(() => dots.classList.remove('shake'), 500);
    }
}

function toggleAutoMoment(enabled) {
    const container = document.getElementById('auto-moment-char-list-container');
    if (container) {
        container.style.display = enabled ? 'block' : 'none';
    }
    autoMomentEnabled = enabled;
    localStorage.setItem('autoMomentEnabled', enabled.toString());
    if (!enabled) {
        contacts.forEach(c => { if (c.autoMoment) c.autoMoment = false; });
        localStorage.setItem('contacts', JSON.stringify(contacts));
        document.querySelectorAll('#auto-moment-char-list input[type=checkbox]').forEach(cb => (cb).checked = false);
    }
};

function updateAutoMomentChar(charId, isEnabled) {
    const char = contacts.find(c => c.id.toString() === charId);
    if (char) {
        char.autoMoment = isEnabled;
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }
};

function checkWeatherLocation(city) {
    const statusEl = document.getElementById('weather-status');
    if (!statusEl) return;
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;

    if (!city) {
        statusEl.innerText = '';
        char.latitude = null;
        char.longitude = null;
        return;
    }
    
    statusEl.innerText = '正在获取位置...';
    statusEl.style.color = '#999';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            char.latitude = position.coords.latitude;
            char.longitude = position.coords.longitude;
            statusEl.innerText = `✅ 位置已设定为: ${city}`;
            statusEl.style.color = 'var(--wx-green)';
            showToast('地理位置已同步', 'success');
        },
        (error) => {
            console.error("Geolocation error:", error);
            statusEl.innerText = '❌ 无法获取位置，请检查权限';
            statusEl.style.color = '#ff5252';
            char.latitude = null;
            char.longitude = null;
        }
    );
};

function exportBackup() {
    const keysToBackup = [
        'userAvatar', 'userName', 'userBio', 'userPersona', 'userCover',
        'walletBalance', 'walletPassword', 'apiKey', 'apiModel', 'apiTemp', 'apiUrl', // Added apiUrl
        'contacts', 'wbGroups', 'worldBooks', 'customEmojis', 'emojiGroups',
        'moments', 'autoMomentEnabled', 'isFullscreen', 'chatBackgroundImage',
        'desktopWallpaper', 'appIconStyle', 'customAppIcons', 'fontPresets', 'activeFontUrl', 'apiPresets',
        'backgroundNotificationsEnabled'
    ];
    
    const backupData = {};
    keysToBackup.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            try {
                // Try to parse JSON strings, otherwise store as is
                backupData[key] = JSON.parse(value);
            } catch (e) {
                backupData[key] = value;
            }
        }
    });

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strawberry_phone_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
};

function onNotificationClick() {
  if (lastNotificationCharId) {
    openChat(lastNotificationCharId);
  }
  const banner = document.getElementById('notification-banner');
  if(banner) banner.classList.remove('show');
  if (notificationTimer) clearTimeout(notificationTimer);
}

function deleteSelectedMessages() {
    if (selectedMessageIndices.length === 0) {
        showToast('请选择要删除的消息', 'info');
        return;
    }
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    
    char.history = char.history.filter((_, index) => !selectedMessageIndices.includes(index));
    localStorage.setItem('contacts', JSON.stringify(contacts));
    exitMultiSelectMode();
    renderChat();
}

function menuActionChatList(action) {
    const menu = document.getElementById('chat-list-context-menu');
    if (menu) menu.style.display = 'none';
    if (!selectedChatListId) return;

    const char = contacts.find(c => c.id === selectedChatListId);
    if (!char) return;

    switch(action) {
        case 'pin_top':
            char.isPinned = !char.isPinned;
            localStorage.setItem('contacts', JSON.stringify(contacts));
            renderContacts();
            break;
        case 'clear_history':
            if (confirm(`确定要清空与 ${char.name} 的聊天记录吗？`)) {
                char.history = [];
                localStorage.setItem('contacts', JSON.stringify(contacts));
                renderContacts();
                if (currentChatId === char.id) {
                    renderChat();
                }
            }
            break;
    }
    selectedChatListId = null;
}

function saveEditedMessage() {
    if (editingMessageIndex === null) return;
    const char = contacts.find(c => c.id === currentChatId);
    if (!char) return;
    
    const newContent = document.getElementById('edit-message-input').value;
    char.history[editingMessageIndex].content = newContent;
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    renderChat();
    closeModal('modal-edit-message');
    editingMessageIndex = null;
}

function toggleBackgroundNotifications(enabled) {
    backgroundNotificationsEnabled = enabled;
    localStorage.setItem('backgroundNotificationsEnabled', String(enabled));
    if (enabled && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('后台通知已开启', 'success');
            } else {
                showToast('通知权限被拒绝', 'error');
                document.getElementById('setting-bg-notifications').checked = false;
                backgroundNotificationsEnabled = false;
                localStorage.setItem('backgroundNotificationsEnabled', 'false');
            }
        });
    } else if (enabled) {
        showToast('后台通知已开启', 'success');
    } else {
        showToast('后台通知已关闭', 'info');
    }
}

function handleFileUpload(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        compressImage(e.target.result).then(compressedSrc => {
            callback(compressedSrc);
        }).catch(err => {
            console.error("Image compression failed:", err);
            showToast('图片处理失败', 'error');
        });
    };
    reader.readAsDataURL(file);
}


// Assign all functions to the window object. This is crucial for onclick handlers in HTML to work when using a module script.
Object.assign(window, {
    showToast, editHomeText, showScreen, goHome, closeModal, openSettings, saveSettings,
    fetchModels, openWeChat, openWorldBooks, openThemes, toggleFullscreen, changeIconStyle,
    addNewGroup, confirmAddNewWBGroup, deleteGroup, showAddWBModal, editWB, saveWB,
    deleteWB, backToWeChat, backToChat, switchWxTab, showUserPersonaModal, saveUserPersona,
    handleInput, toggleActionPanel, switchEmojiGroup, addNewEmojiGroup, confirmAddNewEmojiGroup,
    sendMessage, sendDiceMessage, sendImageMessageOnly, sendTransfer, confirmTransfer,
    acceptTransfer, menuAction, cancelReply, openChat, showLightbox, hideLightbox,
    toggleMomentsMenu, toggleAddMenu, showPostMomentModal, postUserMoment, deleteMoment,
    likeMoment, sendMomentComment, commentMoment, showWalletModal, openTopUpModal,
    confirmTopUp, openPasswordSetModal,
    closePasswordModal, handleNumpadClick, handleNumpadBackspace, deleteSelectedMessages,
    showGroupManagerModal, showAddContactModal, addNewChar, showCreateGroupModal,
    createNewGroupChat, addNewAddrGroup, saveAddrGroupMove, openCharDetailSettings,
    saveCharDetailSettings, deleteCurrentChar, confirmDeleteChar, toggleRealitySettings,
    toggleCityInput, checkWeatherLocation, generateAIMoment, showCharMomentsSettings,
    toggleAutoMoment, updateAutoMomentChar, loadApiPreset, saveApiPreset, deleteApiPreset,
    confirmSaveApiPreset, applyFontFromInput, loadFontPreset, saveFontPreset, deleteFontPreset,
    exportBackup, onNotificationClick, openOfflineModeSettings, toggleOfflineOptions,
    saveOfflineModeSettings, requestAIResponse: getAIResponse, continueAIResponse, menuActionChatList, menuActionComment,
    saveEditedMessage, openWbSelection: ()=>{}, backToCharSettings: ()=>{}, selectWorldBook: ()=>{},
    openMemoryModal, saveMemorySettings, hideMomentCommentBar, renderFontPresets, applyGlobalFont,
    openCharPhone, renderCharPhoneList, showCharWallet, toggleBackgroundNotifications
});


document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    }

    // Initial UI setup
    document.getElementById('home-avatar-img').style.backgroundImage = `url('${savedUserAvatar}')`;
    document.getElementById('home-user-name').innerText = savedUserName;
    document.getElementById('home-user-bio').innerText = savedUserBio;

    // Apply initial theme settings
    if (isFullscreen) {
        document.getElementById('phone-shell').classList.add('fullscreen-mode');
    }
    applyDesktopWallpaper();
    applyChatBackground();
    applyAppIconStyle();
    applyGlobalFont();
    
    // Set up chat list long-press
    const contactContainer = document.getElementById('contact-container');
    let longPressTimer;
    const startLongPress = (e, isTouch) => {
        const item = e.target.closest('.contact-item');
        if (item) {
            longPressTimer = setTimeout(() => {
                const charId = item.dataset.charId;
                const char = contacts.find(c => String(c.id) === charId);
                if (char) {
                    selectedChatListId = char.id;
                    const menu = document.getElementById('chat-list-context-menu');
                    const pinOption = menu.querySelector('[onclick*="pin_top"]');
                    pinOption.innerText = char.isPinned ? '取消置顶' : '置顶';
                    menu.style.display = 'block';
                    const clientX = isTouch ? e.touches[0].pageX : e.pageX;
                    const clientY = isTouch ? e.touches[0].pageY : e.pageY;
                    menu.style.left = `${clientX}px`;
                    menu.style.top = `${clientY}px`;
                }
            }, 700);
        }
    };
    contactContainer.addEventListener('touchstart', (e) => startLongPress(e, true));
    contactContainer.addEventListener('touchend', () => clearTimeout(longPressTimer));
    contactContainer.addEventListener('touchmove', () => clearTimeout(longPressTimer));
    contactContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        startLongPress(e, false);
    });

    // Microphone button long press for continuation
    const micBtn = document.getElementById('mic-btn');
    let micLongPressTimer;
    micBtn.addEventListener('touchstart', () => {
        micLongPressTimer = setTimeout(() => {
            showToast('继续生成...', 'info');
            continueAIResponse();
        }, 800);
    });
    micBtn.addEventListener('touchend', () => clearTimeout(micLongPressTimer));
    micBtn.onclick = () => {
        getAIResponse();
    };


    // Hide menus on outside click
    document.body.addEventListener('click', (e) => {
        const isMenuClick = e.target.closest('#msg-context-menu, #add-menu, #moments-menu, #chat-list-context-menu, #comment-context-menu');
        const isMenuTrigger = e.target.closest('.message, .msg-img, #wx-add-btn, #wx-cam-btn, .contact-item, .m-comment-item');
        if (!isMenuClick && !isMenuTrigger) {
            document.getElementById('msg-context-menu').style.display = 'none';
            document.getElementById('add-menu').style.display = 'none';
            document.getElementById('moments-menu').style.display = 'none';
            document.getElementById('chat-list-context-menu').style.display = 'none';
            document.getElementById('comment-context-menu').style.display = 'none';
        }
    });

    // File input handlers
    document.getElementById('avatar-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        savedUserAvatar = src;
        localStorage.setItem('userAvatar', savedUserAvatar);
        document.getElementById('home-avatar-img').style.backgroundImage = `url('${src}')`;
        updateMeTab();
        updateMomentsHeader();
    }));
    
    document.getElementById('char-avatar-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        document.getElementById('setting-avatar-preview').src = src;
    }));
    
    document.getElementById('new-char-avatar-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        tempNewCharAvatar = src;
        const preview = document.getElementById('new-char-avatar-preview');
        preview.style.backgroundImage = `url('${src}')`;
        preview.innerHTML = '';
    }));

    document.getElementById('char-self-avatar-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        document.getElementById('setting-self-avatar-preview').src = src;
    }));

    document.getElementById('img-send-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        sendImageMessageOnly(src);
    }));

    document.getElementById('moment-img-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        tempMomentImg = src;
        document.getElementById('moment-img-status').innerText = '已选择图片';
    }));

    document.getElementById('cover-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        savedUserCover = src;
        localStorage.setItem('userCover', savedUserCover);
        updateMomentsHeader();
    }));

    document.getElementById('wallpaper-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        desktopWallpaper = src;
        localStorage.setItem('desktopWallpaper', desktopWallpaper);
        applyDesktopWallpaper();
        updateWallpaperPreview();
    }));

    document.getElementById('chat-bg-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        chatBackgroundImage = src;
        localStorage.setItem('chatBackgroundImage', chatBackgroundImage);
        applyChatBackground();
        updateChatBgPreview();
    }));
    
    document.getElementById('custom-icon-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        if (currentEditingIcon) {
            customAppIcons[currentEditingIcon] = src;
            localStorage.setItem('customAppIcons', JSON.stringify(customAppIcons));
            renderCustomIconEditor();
            if (appIconStyle === 'custom') {
                applyAppIconStyle();
            }
        }
    }));
    
    document.getElementById('emoji-upload').addEventListener('change', (e) => handleFileUpload(e.target.files[0], (src) => {
        const group = prompt("将表情添加到哪个分组？", currentEmojiGroup === '全部' ? '默认' : currentEmojiGroup);
        if (group) {
            if (!emojiGroups.includes(group)) {
                emojiGroups.push(group);
                localStorage.setItem('emojiGroups', JSON.stringify(emojiGroups));
            }
            customEmojis.push({ src, group });
            localStorage.setItem('customEmojis', JSON.stringify(customEmojis));
            currentEmojiGroup = group;
            renderEmojiPanel();
        }
    }));

    document.getElementById('backup-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (confirm('这将覆盖您当前的所有数据，确定要导入吗？')) {
                        Object.keys(data).forEach(key => {
                            const value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                            localStorage.setItem(key, value);
                        });
                        alert('导入成功，页面将刷新。');
                        location.reload();
                    }
                } catch (err) {
                    alert('导入失败，文件格式错误。');
                    console.error(err);
                }
            };
            reader.readAsText(file);
        }
    });
    
    // Proactive Chat logic
    setInterval(async () => {
        if (!config.key || document.hidden) return; // Don't run if tab is not active or no API key
        
        const proactiveChars = contacts.filter(c => c.proactiveChat && !c.isGroup);
        if (proactiveChars.length === 0) return;
        
        // Randomly check if we should send a message (e.g., once every ~15 mins on average)
        if (Math.random() < 1 / (15 * 60)) { // 1 check per second -> 1/900 chance per second
            const char = proactiveChars[Math.floor(Math.random() * proactiveChars.length)];
            const lastMsg = char.history[char.history.length - 1];

            // Only send if it's been a while since the last message
            if (!lastMsg || (Date.now() - lastMsg.timestamp > 30 * 60 * 1000)) { // 30 mins
                 try {
                    const ai = new GoogleGenAI({ apiKey: config.key });
                    const prompt = `You are ${char.name} (${char.prompt}). You haven't talked to the user in a while. Start a new conversation by sending a short, natural, in-character message. For example, ask a question, share something interesting, or just say hello. Output only the message text.`;
                    
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: prompt,
                        generationConfig: { temperature: 0.9 }
                    });
                    
                    const messageText = response.text?.trim();
                    if (messageText) {
                        char.history.push({
                            sender: char.id,
                            content: messageText,
                            timestamp: Date.now(),
                            type: 'text'
                        });
                        char.unreadCount = (char.unreadCount || 0) + 1;
                        localStorage.setItem('contacts', JSON.stringify(contacts));
                        
                        // Show notification
                        lastNotificationCharId = char.id;
                        showNotification(char.name, messageText, char.avatar);

                        // If user is on the chat list page, update it
                        if (document.getElementById('screen-wechat').classList.contains('active')) {
                            renderContacts();
                        }
                    }
                } catch (e) {
                    console.error("Proactive chat failed:", e);
                }
            }
        }
    }, 1000); // Check every second

    // Start background auto moment generation
    if (autoMomentEnabled) {
        startAutoMomentGeneration();
    }
    
    // Check notification permissions on load
    if (backgroundNotificationsEnabled && Notification.permission !== 'granted') {
         Notification.requestPermission();
    }
});