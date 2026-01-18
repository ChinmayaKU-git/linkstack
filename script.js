/**
 * LinkStack - A web-based link and file management application
 *
 * This application allows users to save, organize, and manage links and files
 * with features like favorites, pinning, folders, tags, and search functionality.
 * Data is stored locally in the browser's localStorage.
 *
 * Features:
 * - Save links with previews
 * - Upload and store files
 * - Organize items into folders
 * - Tag items for better categorization
 * - Favorite and pin important items
 * - Search through saved items
 * - Grid and list view modes
 * - Inspector panel for detailed view
 */

// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
// import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
// import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { createIcons, LayoutGrid, Star, Clock, Pin, Plus, Search, List, ChevronRight, Folder, Globe, Settings, Bell, X, Trash2, Edit3, Tag, FileText, ExternalLink, AlertCircle } from "https://unpkg.com/lucide@latest?module";

// --- Configuration & Initialization ---
// const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
const appId = window.__app_id || 'linkstack-web-v1';

// --- State Management ---
// Global application state variables
let user = { uid: 'local-user' }; // Current user object (simulated for local storage)
let links = []; // Array of saved links and files
let activeTab = 'All Items'; // Currently active filter tab
let viewMode = 'grid'; // Current view mode: 'grid' or 'list'
let searchQuery = ''; // Current search query string
let selectedLink = null; // Currently selected item for inspector
let linkToDeleteId = null; // ID of item pending deletion

// --- Authentication ---
// Currently using simulated authentication for local storage mode
// Firebase authentication code is commented out but available for future cloud sync
// Simulate auth
// onAuthStateChanged(auth, (u) => {
//     if (u) {
//         user = u;
//         const avatarEl = document.getElementById('user-avatar');
//         const userIdEl = document.getElementById('user-id');
//         if (avatarEl) avatarEl.innerText = u.uid.slice(0, 2).toUpperCase();
//         if (userIdEl) userIdEl.innerText = `User ${u.uid.slice(0, 5)}`;
//         startDataListener();
//     } else {
//         signInAnonymously(auth).catch(console.error);
//     }
// });

// Set dummy user for local mode
const avatarEl = document.getElementById('user-avatar');
const userIdEl = document.getElementById('user-id');
if (avatarEl) avatarEl.innerText = user.uid.slice(0, 2).toUpperCase();
if (userIdEl) userIdEl.innerText = `User ${user.uid.slice(0, 5)}`;
startDataListener();

// --- Data Layer ---
/**
 * Initializes the data listener and loads saved links from localStorage
 * In the future, this could be replaced with Firebase real-time listeners
 */
function startDataListener() {
    // const linksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'links');
    // onSnapshot(linksRef, (snapshot) => {
    //     links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //     renderUI();
    //     document.getElementById('app').classList.remove('opacity-0');
    // }, (err) => console.error("Firestore Error:", err));

    // Load from localStorage
    const stored = localStorage.getItem('linkstack-links');
    if (stored) {
        links = JSON.parse(stored);
    }
    renderUI();
    document.getElementById('app').classList.remove('opacity-0');
}

/**
 * Saves the current links array to localStorage
 */
function saveLinks() {
    localStorage.setItem('linkstack-links', JSON.stringify(links));
}

// --- Global UI Exporters ---
// Functions attached to window object for HTML onclick handlers
/**
 * Toggles the visibility of a modal dialog
 * @param {string} id - The ID of the modal element
 * @param {boolean} show - Whether to show or hide the modal
 */
window.toggleModal = (id, show) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
};

/**
 * Toggles between link and file input fields in the add item form
 */
window.toggleItemType = () => {
    const type = document.querySelector('input[name="item-type"]:checked').value;
    document.getElementById('url-field').classList.toggle('hidden', type === 'file');
    document.getElementById('file-field').classList.toggle('hidden', type === 'link');
    const urlInput = document.getElementById('form-url');
    const fileInput = document.getElementById('form-file');
    if (type === 'link') {
        urlInput.required = true;
        fileInput.required = false;
    } else {
        urlInput.required = false;
        fileInput.required = true;
    }
};

/**
 * Sets the active tab/filter and re-renders the UI
 * @param {string} id - The ID of the tab to activate
 */
window.setActiveTab = (id) => {
    activeTab = id;
    renderUI();
};

/**
 * Sets the view mode (grid or list) and updates UI accordingly
 * @param {string} mode - Either 'grid' or 'list'
 */
window.setViewMode = (mode) => {
    viewMode = mode;
    const gBtn = document.getElementById('btn-grid');
    const lBtn = document.getElementById('btn-list');
    if (gBtn) gBtn.classList.toggle('bg-slate-700', mode === 'grid');
    if (gBtn) gBtn.classList.toggle('text-slate-500', mode !== 'grid');
    if (lBtn) lBtn.classList.toggle('bg-slate-700', mode === 'list');
    if (lBtn) lBtn.classList.toggle('text-slate-500', mode !== 'list');
    renderFeed();
};

/**
 * Selects a link for detailed view in the inspector panel
 * @param {string} id - The ID of the link to select
 */
window.selectLink = (id) => {
    selectedLink = links.find(l => l.id === id);
    renderUI();
};

/**
 * Closes the inspector panel and deselects the current link
 */
window.closeInspector = () => {
    selectedLink = null;
    const insp = document.getElementById('inspector');
    if (insp) insp.style.width = '0';
    renderUI();
};

/**
 * Downloads a file item
 * @param {string} id - The ID of the file to download
 */
window.downloadFile = (id) => {
    const item = links.find(l => l.id === id);
    if (item && item.type === 'file') {
        const a = document.createElement('a');
        a.href = item.fileData;
        a.download = item.fileName;
        a.click();
    }
};

/**
 * Updates the note for a specific link
 * @param {string} id - The ID of the link
 * @param {string} val - The new note content
 */
window.updateNote = (id, val) => {
    const link = links.find(l => l.id === id);
    if (link) {
        link.note = val;
        saveLinks();
    }
};

/**
 * Toggles a boolean field (fav, pinned, later) for a link
 * @param {string} id - The ID of the link
 * @param {string} field - The field name to toggle
 * @param {boolean} val - The new value
 */
window.toggleField = (id, field, val) => {
    const link = links.find(l => l.id === id);
    if (link) {
        link[field] = val;
        saveLinks();
        renderUI();
    }
};

/**
 * Prompts for deletion of a link
 * @param {string} id - The ID of the link to delete
 */
window.promptDelete = (id) => {
    linkToDeleteId = id;
    window.toggleModal('delete-modal', true);
};

// --- Rendering Logic ---
/**
 * Main UI rendering function - updates all UI components
 */
function renderUI() {
    renderSidebar();
    renderFeed();
    if (selectedLink) renderInspector();
    
    // Refresh Icons
    createIcons({ icons: { LayoutGrid, Star, Clock, Pin, Plus, Search, List, ChevronRight, Folder, Globe, Settings, Bell, X, Trash2, Edit3, Tag, FileText, ExternalLink, AlertCircle } });
}

/**
 * Renders the sidebar with smart filters, folders, and tags
 */
function renderSidebar() {
    const smartFilters = [
        { id: 'All Items', icon: 'layout-grid', count: links.length },
        { id: 'Favourites', icon: 'star', count: links.filter(l => l.fav).length },
        { id: 'Link Later', icon: 'clock', count: links.filter(l => l.later).length },
        { id: 'Pinned', icon: 'pin', count: links.filter(l => l.pinned).length }
    ];

    const filterContainer = document.getElementById('smart-filters');
    if (filterContainer) {
        filterContainer.innerHTML = smartFilters.map(f => `
            <button onclick="setActiveTab('${f.id}')" class="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${activeTab === f.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}">
                <div class="flex items-center gap-3">
                    <i data-lucide="${f.icon}" class="w-4 h-4"></i>
                    <span class="text-sm font-medium">${f.id}</span>
                </div>
                <span class="text-xs opacity-50">${f.count}</span>
            </button>
        `).join('');
    }

    const uniqueFolders = [...new Set(links.map(l => l.folder || 'General'))].sort();
    const folderList = document.getElementById('folders-list');
    if (folderList) {
        folderList.innerHTML = uniqueFolders.map(f => `
            <div onclick="setActiveTab('${f}')" class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${activeTab === f ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}">
                <i data-lucide="chevron-right" class="w-3 h-3"></i>
                <i data-lucide="folder" class="w-3 h-3 text-indigo-500/70"></i>
                <span class="truncate">${f}</span>
            </div>
        `).join('');
    }

    const allTags = [...new Set(links.flatMap(l => l.tags || []))].sort();
    const tagsCloud = document.getElementById('tags-cloud');
    if (tagsCloud) {
        tagsCloud.innerHTML = allTags.map(t => `
            <button class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 transition-colors">#${t}</button>
        `).join('');
    }
}

/**
 * Returns an appropriate Lucide icon name based on MIME type
 * @param {string} mimeType - The MIME type of the file
 * @returns {string} The icon name to use
 */
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'music';
    if (mimeType === 'application/pdf') return 'file-text';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'file-text';
    return 'file';
}

/**
 * Renders the main feed of links/files based on current filters and view mode
 */
function renderFeed() {
    const container = document.getElementById('links-grid');
    if (!container) return;

    const filtered = links.filter(l => {
        const queryMatch = (l.title + l.url).toLowerCase().includes(searchQuery.toLowerCase());
        let tabMatch = true;
        if (activeTab === 'Favourites') tabMatch = l.fav;
        else if (activeTab === 'Link Later') tabMatch = l.later;
        else if (activeTab === 'Pinned') tabMatch = l.pinned;
        else if (activeTab !== 'All Links') tabMatch = l.folder === activeTab;
        return queryMatch && tabMatch;
    });

    document.getElementById('link-count').innerText = filtered.length;
    document.getElementById('active-tab-title').innerText = activeTab;
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        document.getElementById('empty-state').classList.remove('hidden');
        return;
    }
    document.getElementById('empty-state').classList.add('hidden');

    if (viewMode === 'grid') {
        container.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5";
        container.innerHTML = filtered.map(l => {
            let previewHtml = '';
            if (l.type === 'file') {
                const icon = getFileIcon(l.fileType);
                previewHtml = `<div class="w-full h-full flex items-center justify-center bg-slate-800 rounded-lg">
                    <i data-lucide="${icon}" class="w-12 h-12 text-slate-400"></i>
                </div>`;
            } else {
                previewHtml = `<img src="${l.preview || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80'}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity">`;
            }
            const urlObj = l.type === 'link' ? new URL(l.url.startsWith('http') ? l.url : `https://${l.url}`) : null;
            const domain = l.type === 'link' ? urlObj.hostname.replace('www.', '') : `${(l.fileSize / 1024).toFixed(1)} KB`;
            return `
                <div onclick="selectLink('${l.id}')" class="group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer h-full ${selectedLink?.id === l.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'}">
                    <div class="aspect-video rounded-lg bg-slate-900 mb-4 overflow-hidden border border-slate-700/50">
                        ${previewHtml}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-start justify-between">
                            <h3 class="text-sm font-semibold text-slate-100 line-clamp-1">${l.title}</h3>
                            ${l.fav ? '<i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>' : ''}
                        </div>
                        <p class="text-xs text-slate-500 mb-3 truncate font-mono mt-1">${domain}</p>
                        <div class="flex flex-wrap gap-1">
                            ${(l.tags || []).slice(0, 3).map(t => `<span class="px-2 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-400 border border-slate-700/50">#${t}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        container.className = "flex flex-col border border-slate-800 rounded-xl overflow-hidden";
        container.innerHTML = filtered.map(l => {
            const icon = l.type === 'file' ? getFileIcon(l.fileType) : 'globe';
            const displayUrl = l.type === 'file' ? `${(l.fileSize / 1024).toFixed(1)} KB • ${l.fileType}` : l.url;
            return `
                <div onclick="selectLink('${l.id}')" class="flex items-center gap-4 p-3 border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer ${selectedLink?.id === l.id ? 'bg-indigo-600/10' : ''}">
                    <div class="w-8 h-8 rounded bg-slate-700 flex items-center justify-center shrink-0">
                        <i data-lucide="${icon}" class="w-4 h-4 text-slate-500"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-medium text-slate-200 truncate">${l.title}</h3>
                        <p class="text-[10px] text-slate-500 font-mono truncate">${displayUrl}</p>
                    </div>
                    <div class="flex items-center gap-2">
                         ${l.fav ? '<i data-lucide="star" class="w-4 h-4 text-amber-400 fill-current"></i>' : ''}
                         <i data-lucide="chevron-right" class="w-4 h-4 text-slate-700"></i>
                    </div>
                </div>
            `;
        }).join('');
    }
}

/**
 * Renders the inspector panel with detailed information about the selected link
 */
function renderInspector() {
    if (!selectedLink) return;
    const inspector = document.getElementById('inspector');
    if (!inspector) return;
    
    inspector.style.width = '384px';
    let previewHtml = '';
    if (selectedLink.type === 'file') {
        const icon = getFileIcon(selectedLink.fileType);
        previewHtml = `<div class="w-full aspect-video rounded-xl flex items-center justify-center bg-slate-800 mb-4"><i data-lucide="${icon}" class="w-16 h-16 text-slate-400"></i></div>`;
    } else {
        previewHtml = `<img src="${selectedLink.preview}" class="w-full aspect-video rounded-xl object-cover border border-slate-800 mb-4 bg-slate-950">`;
    }
    inspector.innerHTML = `
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inspector</span>
            <div class="flex items-center gap-1">
                <button onclick="promptDelete('${selectedLink.id}')" class="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                <button onclick="closeInspector()" class="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-8">
            <div>
                ${previewHtml}
                <h2 class="text-lg font-bold text-slate-100 leading-tight">${selectedLink.title}</h2>
                ${selectedLink.type === 'link' ? `<a href="${selectedLink.url}" target="_blank" class="text-xs text-indigo-400 font-mono break-all hover:underline block mt-2">${selectedLink.url}</a>` : `<p class="text-xs text-slate-400 font-mono mt-2">${selectedLink.fileName} • ${(selectedLink.fileSize / 1024).toFixed(1)} KB</p>`}
            </div>
            <div>
                <div class="flex items-center gap-2 text-slate-400 mb-3 text-xs font-bold uppercase tracking-widest"><i data-lucide="tag" class="w-3.5 h-3.5"></i> Tags</div>
                <div class="flex flex-wrap gap-2">
                    ${(selectedLink.tags || []).map(t => `<span class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">#${t}</span>`).join('')}
                    ${(!selectedLink.tags || selectedLink.tags.length === 0) ? '<span class="text-xs text-slate-600 italic">No tags</span>' : ''}
                </div>
            </div>
            <div class="flex flex-col flex-1">
                <div class="flex items-center gap-2 text-slate-400 mb-3 text-xs font-bold uppercase tracking-widest"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> Notes</div>
                <textarea onblur="updateNote('${selectedLink.id}', this.value)" class="w-full h-40 bg-slate-950/50 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-400 outline-none focus:border-indigo-500/50 resize-none">${selectedLink.note || ''}</textarea>
            </div>
            ${selectedLink.type === 'file' ? `
            <div>
                <button onclick="downloadFile('${selectedLink.id}')" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i> Download File
                </button>
            </div>
            ` : ''}
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 grid grid-cols-2 gap-3">
            <button onclick="toggleField('${selectedLink.id}', 'later', ${!selectedLink.later})" class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedLink.later ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}">
                <i data-lucide="clock" class="w-4 h-4"></i> ${selectedLink.later ? 'Saved' : 'Link Later'}
            </button>
            <button onclick="toggleField('${selectedLink.id}', 'fav', ${!selectedLink.fav})" class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedLink.fav ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}">
                <i data-lucide="star" class="w-4 h-4"></i> Favourite
            </button>
        </div>
    `;
}

// --- Event Handlers ---
/**
 * Handles the confirmation of link deletion
 */
document.getElementById('confirm-delete-btn').onclick = () => {
    if (!linkToDeleteId) return;
    links = links.filter(l => l.id !== linkToDeleteId);
    saveLinks();
    if (selectedLink?.id === linkToDeleteId) window.closeInspector();
    window.toggleModal('delete-modal', false);
    linkToDeleteId = null;
    renderUI();
};

/**
 * Handles search input changes
 */
document.getElementById('global-search').oninput = (e) => {
    searchQuery = e.target.value;
    renderFeed();
};

/**
 * Handles form submission for adding new links or files
 */
document.getElementById('add-link-form').onsubmit = async (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="item-type"]:checked').value;
    const title = document.getElementById('form-title').value;
    const folder = document.getElementById('form-folder').value || 'General';
    const tags = document.getElementById('form-tags').value.split(',').map(t => t.trim()).filter(Boolean);

    if (type === 'link') {
        const urlInput = document.getElementById('form-url').value;
        const finalUrl = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;

        const newLink = {
            id: Date.now().toString(),
            type: 'link',
            url: finalUrl, title, folder, tags,
            fav: false, pinned: false, later: false, note: '',
            createdAt: new Date().toISOString(),
            preview: `https://api.microlink.io/?url=${encodeURIComponent(finalUrl)}&screenshot=true&embed=screenshot.url`
        };

        links.push(newLink);
        saveLinks();
        window.toggleModal('add-modal', false);
        e.target.reset();
        renderUI();
    } else {
        const fileInput = document.getElementById('form-file');
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fileData = event.target.result;
            const finalTitle = title || file.name;

            const newFile = {
                id: Date.now().toString(),
                type: 'file',
                title: finalTitle, folder, tags,
                fav: false, pinned: false, later: false, note: '',
                createdAt: new Date().toISOString(),
                fileName: file.name,
                fileType: file.type,
                fileData: fileData,
                fileSize: file.size
            };

            links.push(newFile);
            saveLinks();
            window.toggleModal('add-modal', false);
            e.target.reset();
            renderUI();
        };
        reader.readAsDataURL(file);
    }
};

// --- Command Palette / Keybinds ---
/**
 * Global keyboard shortcuts for enhanced user experience
 */
window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search');
        if (searchInput) searchInput.focus();
    }
});