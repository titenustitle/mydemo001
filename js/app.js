// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize file manager
        await fileManager.init();
        
        // Load and display all items
        const items = await db.getAllItems();
        ui.renderItems(items);
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
}); 