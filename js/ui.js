class UI {
    constructor() {
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.itemForm = document.getElementById('itemForm');
        this.itemsContainer = document.getElementById('itemsContainer');
        this.recentItemsContainer = document.getElementById('recentItemsContainer');
        this.searchInput = document.getElementById('searchInput');
        this.moodIndicator = document.querySelector('.mood-indicator');
        this.currentMood = this.getStoredMood() || 'happy';
        this.items = [];
        
        this.showLoadingState();
        this.initializeApp();
    }

    showLoadingState() {
        this.itemsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading your memories...</p>
            </div>
        `;
        this.recentItemsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading recent memories...</p>
            </div>
        `;
    }

    async initializeApp() {
        try {
            await db.ensureInitialized();
            this.updateMoodIndicator();
            this.setupEventListeners();
            await this.loadInitialItems();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
            this.showRetryButton();
        }
    }

    showRetryButton() {
        this.itemsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load your memories</p>
                <button class="retry-button" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    Retry
                </button>
            </div>
        `;
        this.recentItemsContainer.innerHTML = '';
    }

    async loadInitialItems() {
        try {
            const items = await db.getAllItems();
            this.renderItems(items);
            this.renderRecentItems(items);
        } catch (error) {
            console.error('Failed to load items:', error);
            this.showError('Failed to load items. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Modal close button
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        // Add buttons
        const addLinkBtn = document.getElementById('addLinkBtn');
        const addPhotoBtn = document.getElementById('addPhotoBtn');
        const addFileBtn = document.getElementById('addFileBtn');
        const createPostBtn = document.getElementById('createPostBtn');

        if (addLinkBtn) addLinkBtn.addEventListener('click', () => this.showAddLinkModal());
        if (addPhotoBtn) addPhotoBtn.addEventListener('click', () => this.showAddPhotoModal());
        if (addFileBtn) addFileBtn.addEventListener('click', () => this.showAddFileModal());
        if (createPostBtn) createPostBtn.addEventListener('click', () => this.showCreatePostModal());

        // Search input with debounce
        let searchTimeout;
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                searchTimeout = setTimeout(async () => {
                    if (query) {
                        const items = await db.getAllItems();
                        const filteredItems = items.filter(item => {
                            const searchableContent = this.getSearchableContent(item);
                            return searchableContent.toLowerCase().includes(query.toLowerCase());
                        });
                        this.renderItems(filteredItems);
                        this.renderRecentItems(filteredItems);
                    } else {
                        this.loadInitialItems();
                    }
                }, 300);
            });
        }

        // View All button
        const viewAllBtn = document.querySelector('.view-all-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.itemsContainer.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    getSearchableContent(item) {
        switch (item.type) {
            case 'post':
                return `${item.content} ${item.tags.join(' ')}`;
            case 'link':
                return `${item.title || ''} ${item.url} ${item.tags.join(' ')} ${item.notes || ''}`;
            case 'photo':
            case 'file':
                return `${item.name || ''} ${item.tags.join(' ')} ${item.notes || ''}`;
            default:
                return '';
        }
    }

    showModal(title) {
        if (this.modal && this.modalTitle) {
            this.modalTitle.textContent = title;
            this.modal.style.display = 'block';
            this.itemForm.innerHTML = '';
        }
    }

    hideModal() {
        if (this.modal && this.itemForm) {
            this.modal.style.display = 'none';
            this.itemForm.reset();
        }
    }

    showAddLinkModal() {
        this.showModal('Add New Link');
        this.itemForm.innerHTML = `
            <input type="url" name="url" placeholder="Enter URL" required>
            <input type="text" name="title" placeholder="Title">
            <input type="text" name="tags" placeholder="Tags (comma-separated)">
            <textarea name="notes" placeholder="Notes"></textarea>
            <button type="submit">Save Link</button>
        `;
        this.setupFormSubmit('link');
    }

    showAddPhotoModal() {
        this.showModal('Add New Photo');
        this.itemForm.innerHTML = `
            <input type="file" name="photo" accept="image/*" required>
            <input type="text" name="tags" placeholder="Tags (comma-separated)">
            <textarea name="notes" placeholder="Notes"></textarea>
            <button type="submit">Save Photo</button>
        `;
        this.setupFormSubmit('photo');
    }

    showAddFileModal() {
        this.showModal('Add New File');
        this.itemForm.innerHTML = `
            <input type="file" name="file" required>
            <input type="text" name="tags" placeholder="Tags (comma-separated)">
            <textarea name="notes" placeholder="Notes"></textarea>
            <button type="submit">Save File</button>
        `;
        this.setupFormSubmit('file');
    }

    showCreatePostModal() {
        this.showModal('Create New Post');
        this.itemForm.innerHTML = `
            <div class="mood-selector">
                <div class="mood-option ${this.currentMood === 'happy' ? 'selected' : ''}" data-mood="happy">
                    <i class="fas fa-smile"></i>
                    <span>Happy</span>
                </div>
                <div class="mood-option ${this.currentMood === 'sad' ? 'selected' : ''}" data-mood="sad">
                    <i class="fas fa-sad-tear"></i>
                    <span>Sad</span>
                </div>
                <div class="mood-option ${this.currentMood === 'excited' ? 'selected' : ''}" data-mood="excited">
                    <i class="fas fa-star"></i>
                    <span>Excited</span>
                </div>
                <div class="mood-option ${this.currentMood === 'peaceful' ? 'selected' : ''}" data-mood="peaceful">
                    <i class="fas fa-peace"></i>
                    <span>Peaceful</span>
                </div>
                <div class="mood-option ${this.currentMood === 'thoughtful' ? 'selected' : ''}" data-mood="thoughtful">
                    <i class="fas fa-brain"></i>
                    <span>Thoughtful</span>
                </div>
                <div class="mood-option ${this.currentMood === 'angry' ? 'selected' : ''}" data-mood="angry">
                    <i class="fas fa-angry"></i>
                    <span>Angry</span>
                </div>
            </div>
            <textarea name="content" placeholder="What's on your mind?" required></textarea>
            <input type="file" name="image" accept="image/*">
            <input type="text" name="tags" placeholder="Tags (comma-separated)">
            <button type="submit">Post</button>
        `;

        // Add mood selection functionality
        const moodOptions = this.itemForm.querySelectorAll('.mood-option');
        moodOptions.forEach(option => {
            option.addEventListener('click', () => {
                moodOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.currentMood = option.dataset.mood;
                this.updateMoodIndicator();
            });
        });

        this.setupFormSubmit('post');
    }

    setupFormSubmit(type) {
        this.itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(this.itemForm);
            
            try {
                const item = {
                    id: Date.now().toString(),
                    type,
                    created: new Date(),
                    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean)
                };

                switch (type) {
                    case 'post':
                        item.content = formData.get('content');
                        item.mood = this.currentMood;
                        const imageFile = formData.get('image');
                        if (imageFile.size > 0) {
                            item.image = await fileManager.saveFile(imageFile, 'post');
                        }
                        break;
                    case 'link':
                        item.url = formData.get('url');
                        item.title = formData.get('title');
                        item.favicon = await this.getFavicon(item.url);
                        break;
                    case 'photo':
                        const photoFile = formData.get('photo');
                        item.fileName = await fileManager.saveFile(photoFile, 'photo');
                        item.preview = await fileManager.createImagePreview(photoFile);
                        item.size = photoFile.size;
                        break;
                    case 'file':
                        const file = formData.get('file');
                        item.fileName = await fileManager.saveFile(file, 'file');
                        item.name = file.name;
                        item.type = file.type;
                        item.size = file.size;
                        break;
                }

                await this.addItem(item);
            } catch (error) {
                console.error('Error saving item:', error);
                this.showError('Failed to save item. Please try again.');
            }
        });
    }

    async getFavicon(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch {
            return null;
        }
    }

    async renderRecentItems(items) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentItems = items.filter(item => 
            new Date(item.created) >= sevenDaysAgo
        ).sort((a, b) => new Date(b.created) - new Date(a.created));

        this.recentItemsContainer.innerHTML = '';
        
        if (recentItems.length === 0) {
            this.recentItemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No recent memories</p>
                </div>
            `;
            return;
        }

        recentItems.forEach(item => {
            const itemElement = this.createItemElement(item);
            this.recentItemsContainer.appendChild(itemElement);
        });
    }

    renderItems(items) {
        this.itemsContainer.innerHTML = '';
        
        if (items.length === 0) {
            this.itemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-archive"></i>
                    <p>No memories yet</p>
                </div>
            `;
            return;
        }

        items.forEach(item => {
            const itemElement = this.createItemElement(item);
            this.itemsContainer.appendChild(itemElement);
        });
    }

    createItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = item.type === 'post' ? 'post-card' : 'item-card';
        
        let content = '';
        switch (item.type) {
            case 'post':
                content = `
                    <div class="post-header">
                        <div class="post-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="post-meta">
                            <div class="post-author">You</div>
                            <div class="post-date">${new Date(item.created).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</div>
                        </div>
                    </div>
                    ${item.mood ? `
                        <div class="post-mood" style="background-color: ${this.getMoodColor(item.mood)}">
                            <i class="fas ${this.getMoodIcon(item.mood)}"></i>
                            ${item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}
                        </div>
                    ` : ''}
                    <div class="post-content">${item.content}</div>
                    ${item.image ? `<img src="${item.image}" alt="post image" class="post-image">` : ''}
                    ${item.tags.length > 0 ? `
                        <div class="post-tags">
                            ${item.tags.map(tag => `
                                <span class="post-tag">
                                    <i class="fas fa-tag"></i>
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="post-actions">
                        <div class="post-action like-action" data-id="${item.id}">
                            <i class="far fa-heart"></i>
                            <span>Like</span>
                        </div>
                        <div class="post-action comment-action" data-id="${item.id}">
                            <i class="far fa-comment"></i>
                            <span>Comment</span>
                        </div>
                        <div class="post-action save-action" data-id="${item.id}">
                            <i class="far fa-bookmark"></i>
                            <span>Save</span>
                        </div>
                    </div>
                    <div class="comments-section" id="comments-${item.id}">
                        <div class="comments-list"></div>
                        <div class="comment-form">
                            <textarea placeholder="Write a comment..." class="comment-input"></textarea>
                            <button class="comment-submit">Post</button>
                        </div>
                    </div>
                `;
                break;
            case 'link':
                content = `
                    <div class="item-header">
                        <img src="${item.favicon || 'icons/default-favicon.png'}" alt="favicon" class="favicon">
                        <h3>${item.title || 'Untitled Link'}</h3>
                    </div>
                    <a href="${item.url}" target="_blank" class="item-url">
                        <i class="fas fa-external-link-alt"></i>
                        ${item.url}
                    </a>
                `;
                break;
            case 'photo':
                content = `
                    <div class="item-header">
                        <i class="fas fa-image item-icon"></i>
                        <h3>Photo</h3>
                    </div>
                    <img src="${item.preview}" alt="photo preview" class="photo-preview">
                `;
                break;
            case 'file':
                content = `
                    <div class="item-header">
                        <i class="fas ${this.getFileIconClass(item.type)} item-icon"></i>
                        <h3>${item.name}</h3>
                    </div>
                    <p class="file-info">
                        <i class="fas fa-file"></i>
                        ${this.formatFileSize(item.size)}
                    </p>
                `;
                break;
        }

        const tags = item.tags.map(tag => `
            <span class="tag">
                <i class="fas fa-tag"></i>
                ${tag}
            </span>
        `).join('');
        
        const notes = item.notes ? `
            <div class="notes-container">
                <i class="fas fa-sticky-note"></i>
                <p class="notes">${item.notes}</p>
            </div>
        ` : '';
        
        const date = new Date(item.created).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        itemElement.innerHTML = `
            ${content}
            <div class="tags">${tags}</div>
            ${notes}
            <div class="item-footer">
                <span class="date">
                    <i class="far fa-calendar"></i>
                    ${date}
                </span>
                <div class="item-actions">
                    <button class="delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;

        itemElement.querySelector('.delete-btn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this item?')) {
                try {
                    if (item.image) {
                        await fileManager.deleteFile(item.image);
                    }
                    await this.deleteItem(item.id);
                } catch (error) {
                    console.error('Error deleting item:', error);
                    this.showError('Failed to delete item. Please try again.');
                }
            }
        });

        // Add event listeners for post actions
        if (item.type === 'post') {
            const postElement = itemElement;
            
            // Like action
            const likeAction = postElement.querySelector('.like-action');
            likeAction.addEventListener('click', () => this.handleLike(item.id));

            // Comment action
            const commentAction = postElement.querySelector('.comment-action');
            commentAction.addEventListener('click', () => this.toggleComments(item.id));

            // Save action
            const saveAction = postElement.querySelector('.save-action');
            saveAction.addEventListener('click', () => this.handleSave(item.id));

            // Comment form
            const commentForm = postElement.querySelector('.comment-form');
            const commentInput = postElement.querySelector('.comment-input');
            const commentSubmit = postElement.querySelector('.comment-submit');

            commentSubmit.addEventListener('click', async () => {
                const commentText = commentInput.value.trim();
                if (commentText) {
                    await this.addComment(item.id, commentText);
                    commentInput.value = '';
                }
            });
        }

        return itemElement;
    }

    getFileIconClass(fileType) {
        const icons = {
            'image': 'fa-image',
            'video': 'fa-video',
            'audio': 'fa-music',
            'application/pdf': 'fa-file-pdf',
            'text': 'fa-file-alt',
            'default': 'fa-file'
        };

        if (fileType.startsWith('image/')) return icons.image;
        if (fileType.startsWith('video/')) return icons.video;
        if (fileType.startsWith('audio/')) return icons.audio;
        if (fileType === 'application/pdf') return icons.pdf;
        if (fileType.startsWith('text/')) return icons.text;
        return icons.default;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getMoodIcon(mood) {
        const icons = {
            happy: 'fa-smile',
            sad: 'fa-sad-tear',
            excited: 'fa-star',
            peaceful: 'fa-peace',
            thoughtful: 'fa-brain',
            angry: 'fa-angry',
            neutral: 'fa-meh'
        };
        return icons[mood] || icons.neutral;
    }

    getMoodColor(mood) {
        const colors = {
            happy: 'var(--mood-happy)',
            sad: 'var(--mood-sad)',
            excited: 'var(--mood-excited)',
            peaceful: 'var(--mood-happy)',
            thoughtful: 'var(--mood-neutral)',
            angry: 'var(--mood-angry)',
            neutral: 'var(--mood-neutral)'
        };
        return colors[mood] || colors.neutral;
    }

    getStoredMood() {
        return localStorage.getItem('currentMood');
    }

    updateMoodIndicator() {
        const moodIcons = {
            happy: 'fa-smile',
            sad: 'fa-sad-tear',
            excited: 'fa-star',
            peaceful: 'fa-peace',
            thoughtful: 'fa-brain',
            angry: 'fa-angry',
            neutral: 'fa-meh'
        };

        const moodColors = {
            happy: 'var(--mood-happy)',
            sad: 'var(--mood-sad)',
            excited: 'var(--mood-excited)',
            peaceful: 'var(--mood-happy)',
            thoughtful: 'var(--mood-neutral)',
            angry: 'var(--mood-angry)',
            neutral: 'var(--mood-neutral)'
        };

        const icon = this.moodIndicator.querySelector('i');
        icon.className = `fas ${moodIcons[this.currentMood]}`;
        icon.style.color = moodColors[this.currentMood];
        localStorage.setItem('currentMood', this.currentMood);
    }

    async handleLike(postId) {
        const post = await db.getItem(postId);
        if (!post.likes) post.likes = 0;
        post.likes++;
        await this.updateItem(postId, post);
        await this.updatePostUI(postId);
    }

    async handleSave(postId) {
        const post = await db.getItem(postId);
        post.saved = !post.saved;
        await this.updateItem(postId, post);
        await this.updatePostUI(postId);
    }

    toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        commentsSection.classList.toggle('show');
    }

    async addComment(postId, text) {
        const post = await db.getItem(postId);
        if (!post.comments) post.comments = [];
        
        const comment = {
            id: Date.now().toString(),
            text,
            created: new Date(),
            author: 'You'
        };

        post.comments.push(comment);
        await this.updateItem(postId, post);
        await this.updatePostUI(postId);

        // Generate AI response
        this.generateAIResponse(postId, post);
    }

    async generateAIResponse(postId, post) {
        const aiResponse = await this.getAIResponse(post.content, post.mood);
        const comment = {
            id: Date.now().toString(),
            text: aiResponse,
            created: new Date(),
            author: 'AI Assistant'
        };

        post.comments.push(comment);
        await this.updateItem(postId, post);
        await this.updatePostUI(postId);
    }

    async getAIResponse(content, mood) {
        // Simple AI response based on mood and content
        const responses = {
            happy: [
                "That's wonderful! Your positive energy is contagious! 😊",
                "I'm glad you're feeling happy! Keep spreading those good vibes! 🌟",
                "Your happiness makes me smile too! Keep it up! ✨"
            ],
            sad: [
                "I understand you're feeling down. Remember, it's okay to feel this way. 🌧️",
                "I'm here to listen. Would you like to talk about what's bothering you? 🤗",
                "Remember that difficult times are temporary. You're stronger than you know. 💪"
            ],
            excited: [
                "Your excitement is palpable! What's got you so thrilled? 🎉",
                "That's fantastic! I can feel your energy through the screen! ⚡",
                "Your enthusiasm is contagious! Keep that energy going! 🚀"
            ],
            peaceful: [
                "Your sense of peace is beautiful. It's a wonderful state to be in. 🕊️",
                "That inner peace you're feeling is precious. Cherish this moment. 🌿",
                "Your peaceful energy is calming. Thank you for sharing it. 🌅"
            ],
            thoughtful: [
                "Your thoughts are interesting. Would you like to elaborate? 🤔",
                "That's a fascinating perspective. I'd love to hear more. 💭",
                "Your reflection shows deep thinking. Keep exploring those ideas. 📚"
            ],
            angry: [
                "I can sense your frustration. Would you like to talk about it? 🔥",
                "It's okay to feel angry. Would you like to discuss what happened? 💢",
                "I'm here to listen if you want to talk about what's bothering you. 🎯"
            ]
        };

        const moodResponses = responses[mood] || responses.thoughtful;
        return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }

    async updatePostUI(postId) {
        try {
            const post = await db.getItem(postId);
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                // Update likes
                const likeCount = postElement.querySelector('.like-count');
                if (likeCount) {
                    likeCount.textContent = post.likes || 0;
                }

                // Update save button
                const saveButton = postElement.querySelector('.save-action');
                if (saveButton) {
                    saveButton.classList.toggle('saved', post.saved);
                }

                // Update comments
                const commentsList = postElement.querySelector('.comments-list');
                if (commentsList) {
                    commentsList.innerHTML = (post.comments || []).map(comment => `
                        <div class="comment">
                            <div class="comment-header">
                                <span class="comment-author">${comment.author}</span>
                                <span class="comment-date">${new Date(comment.created).toLocaleDateString()}</span>
                            </div>
                            <div class="comment-content">${comment.text}</div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Failed to update post UI:', error);
            this.showError('Failed to update post. Please refresh the page.');
        }
    }

    async addItem(item) {
        try {
            const newItem = await db.addItem(item);
            this.items.push(newItem);
            this.renderItems();
            this.closeModal();
        } catch (error) {
            console.error('Failed to add item:', error);
            this.showError('Failed to add item. Please try again.');
        }
    }

    async deleteItem(id) {
        try {
            await db.deleteItem(id);
            this.items = this.items.filter(item => item.id !== id);
            this.renderItems();
        } catch (error) {
            console.error('Failed to delete item:', error);
            this.showError('Failed to delete item. Please try again.');
        }
    }

    async updateItem(id, updatedItem) {
        try {
            await db.updateItem(id, updatedItem);
            this.items = this.items.map(item => 
                item.id === id ? { ...item, ...updatedItem } : item
            );
            this.renderItems();
        } catch (error) {
            console.error('Failed to update item:', error);
            this.showError('Failed to update item. Please try again.');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Remove any existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        // Add the new error message at the top of the container
        this.itemsContainer.insertBefore(errorDiv, this.itemsContainer.firstChild);
        
        // Remove the error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize UI with error handling
const ui = new UI(); 