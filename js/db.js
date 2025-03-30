class Database {
    constructor() {
        this.dbName = 'memorySaverDB';
        this.dbVersion = 1;
        this.db = null;
        this.initialized = false;
        this.initRetries = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                    if (this.initRetries < this.maxRetries) {
                        this.initRetries++;
                        console.log(`Retrying database initialization (attempt ${this.initRetries}/${this.maxRetries})`);
                        setTimeout(() => {
                            this.recreateDatabase().then(resolve).catch(reject);
                        }, 1000);
                    } else {
                        console.error('Max retries reached. Database initialization failed.');
                        reject(new Error('Failed to initialize database after multiple attempts'));
                    }
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.initialized = true;
                    this.initRetries = 0;
                    console.log('Database initialized successfully');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create stores for different item types
                    if (!db.objectStoreNames.contains('items')) {
                        const itemStore = db.createObjectStore('items', { keyPath: 'id' });
                        itemStore.createIndex('type', 'type', { unique: false });
                        itemStore.createIndex('created', 'created', { unique: false });
                        itemStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                        console.log('Database schema updated successfully');
                    }
                };
            } catch (error) {
                console.error('Database initialization error:', error);
                if (this.initRetries < this.maxRetries) {
                    this.initRetries++;
                    setTimeout(() => {
                        this.recreateDatabase().then(resolve).catch(reject);
                    }, 1000);
                } else {
                    reject(error);
                }
            }
        });
    }

    async recreateDatabase() {
        return new Promise((resolve, reject) => {
            try {
                // Delete the existing database
                const deleteRequest = indexedDB.deleteDatabase(this.dbName);
                
                deleteRequest.onerror = () => {
                    console.error('Failed to delete database:', deleteRequest.error);
                    reject(deleteRequest.error);
                };

                deleteRequest.onsuccess = () => {
                    console.log('Database deleted successfully, attempting to recreate');
                    // Reinitialize the database
                    this.init().then(resolve).catch(reject);
                };
            } catch (error) {
                console.error('Database recreation error:', error);
                reject(error);
            }
        });
    }

    async ensureInitialized() {
        if (!this.initialized) {
            try {
                await this.init();
            } catch (error) {
                console.error('Failed to initialize database:', error);
                throw new Error('Database initialization failed. Please refresh the page.');
            }
        }
    }

    async addItem(item) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');
                const request = store.add(item);

                request.onsuccess = () => resolve(item);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('Add item error:', error);
                reject(error);
            }
        });
    }

    async getItem(id) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readonly');
                const store = transaction.objectStore('items');
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('Get item error:', error);
                reject(error);
            }
        });
    }

    async getAllItems() {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readonly');
                const store = transaction.objectStore('items');
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('Get all items error:', error);
                reject(error);
            }
        });
    }

    async updateItem(id, item) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');
                const request = store.put({ ...item, id });

                request.onsuccess = () => resolve(item);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('Update item error:', error);
                reject(error);
            }
        });
    }

    async deleteItem(id) {
        await this.ensureInitialized();
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['items'], 'readwrite');
                const store = transaction.objectStore('items');
                const request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('Delete item error:', error);
                reject(error);
            }
        });
    }

    async searchItems(query) {
        await this.ensureInitialized();
        const items = await this.getAllItems();
        const searchTerm = query.toLowerCase();
        
        return items.filter(item => {
            const searchableText = [
                item.title || '',
                item.url || '',
                item.notes || '',
                item.content || '',
                ...(item.tags || [])
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
    }
}

// Initialize database with error handling
const db = new Database(); 