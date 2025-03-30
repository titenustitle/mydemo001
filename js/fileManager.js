class FileManager {
    constructor() {
        this.rootDirectory = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.rootDirectory = await window.showDirectoryPicker();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize FileManager:', error);
            return false;
        }
    }

    async saveFile(file, type) {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) throw new Error('Failed to initialize FileManager');
        }

        try {
            const fileName = `${Date.now()}-${file.name}`;
            const fileHandle = await this.rootDirectory.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            return fileName;
        } catch (error) {
            console.error('Failed to save file:', error);
            throw error;
        }
    }

    async readFile(fileName) {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) throw new Error('Failed to initialize FileManager');
        }

        try {
            const fileHandle = await this.rootDirectory.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return file;
        } catch (error) {
            console.error('Failed to read file:', error);
            throw error;
        }
    }

    async deleteFile(fileName) {
        if (!this.initialized) {
            const success = await this.init();
            if (!success) throw new Error('Failed to initialize FileManager');
        }

        try {
            await this.rootDirectory.removeEntry(fileName);
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }

    async createImagePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set thumbnail size
                    const maxSize = 200;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    getFileIcon(fileType) {
        const icons = {
            'image': '🖼️',
            'video': '🎥',
            'audio': '🎵',
            'application/pdf': '📄',
            'text': '📝',
            'default': '📁'
        };

        if (fileType.startsWith('image/')) return icons.image;
        if (fileType.startsWith('video/')) return icons.video;
        if (fileType.startsWith('audio/')) return icons.audio;
        if (fileType === 'application/pdf') return icons.pdf;
        if (fileType.startsWith('text/')) return icons.text;
        return icons.default;
    }
}

const fileManager = new FileManager(); 