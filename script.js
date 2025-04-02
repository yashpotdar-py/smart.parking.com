// Smart Parking System - Main Script

// ThingSpeak API Configuration
const API_URL = 'https://api.thingspeak.com/channels/2901814/feeds.json?api_key=GPYSIWQ9GGUX27DQ';
const REFRESH_INTERVAL = 10; // 10 seconds

// Initialize parking spots object (only Slot1, Slot2, Slot3 will be updated via API)
const parkingSpots = {
    Slot1: {
        status: 'unknown',
        element: null
    },
    Slot2: {
        status: 'unknown',
        element: null
    },
    Slot3: {
        status: 'unknown',
        element: null
    }
};

// Initialize static spots (4-81)
const staticSpots = {};
for (let i = 4; i <= 81; i++) {
    staticSpots[`Slot${i}`] = {
        status: 'available',
        element: null
    };
}

// Fetch parking data from ThingSpeak API
async function fetchParkingData() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the data - use only the last entry
        if (data.feeds && data.feeds.length > 0) {
            const latestFeed = data.feeds[data.feeds.length - 1];
            console.log('Latest data:', latestFeed);
            
            // Update parking spots status based on API data
            updateSpotStatus('Slot1', latestFeed.field1 === '1' ? 'occupied' : 'available');
            updateSpotStatus('Slot2', latestFeed.field2 === '1' ? 'occupied' : 'available');
            updateSpotStatus('Slot3', latestFeed.field3 === '1' ? 'occupied' : 'available');
            
            // Update statistics and last updated time
            updateStatistics();
            updateLastUpdated(new Date(latestFeed.created_at));
            
            // Show success notification
            showNotification('Data updated successfully', 'success');
        }
    } catch (error) {
        console.error('Error fetching parking data:', error);
        showNotification('Failed to update data. Retrying...', 'error');
    }
}

// Update spot status in the UI
function updateSpotStatus(spotId, newStatus) {
    const spot = parkingSpots[spotId];
    
    // If no change, do nothing
    if (spot.status === newStatus) return;
    
    // Update spot object
    spot.status = newStatus;
    
    // Clear any existing classes
    spot.element.classList.remove('available', 'occupied', 'unknown');
    
    // Add new status class
    spot.element.classList.add(newStatus);
    
    // Reset animation by cloning the car SVG
    const carSvg = spot.element.querySelector('.car-svg');
    const newCarSvg = carSvg.cloneNode(true);
    carSvg.parentNode.replaceChild(newCarSvg, carSvg);
}

// Update the static spots to always show as available
function initializeStaticSpots() {
    for (const spotId in staticSpots) {
        const spot = staticSpots[spotId];
        spot.element.classList.remove('unknown');
        spot.element.classList.add('available');
    }
}

// Update parking statistics
function updateStatistics() {
    let availableCount = 0;
    let occupiedCount = 0;
    
    // Count API-connected spots
    for (const spotId in parkingSpots) {
        if (parkingSpots[spotId].status === 'available') {
            availableCount++;
        } else if (parkingSpots[spotId].status === 'occupied') {
            occupiedCount++;
        }
    }
    
    // Add all static spots as available
    availableCount += Object.keys(staticSpots).length;
    
    // Update statistics display
    const totalSpots = Object.keys(parkingSpots).length + Object.keys(staticSpots).length;
    const occupancyPercentage = Math.round((occupiedCount / totalSpots) * 100);
    
    document.querySelector('.available-count').textContent = availableCount;
    document.querySelector('.occupied-count').textContent = occupiedCount;
    document.querySelector('.occupancy-percentage').textContent = `${occupancyPercentage}%`;
    
    // Update progress bar
    const progressBar = document.querySelector('.progress-bar-fill');
    progressBar.style.width = `${occupancyPercentage}%`;
    
    // Change color based on occupancy level
    if (occupancyPercentage < 30) {
        progressBar.classList.remove('bg-yellow-500', 'bg-red-500');
        progressBar.classList.add('bg-blue-500');
    } else if (occupancyPercentage < 70) {
        progressBar.classList.remove('bg-blue-500', 'bg-red-500');
        progressBar.classList.add('bg-yellow-500');
    } else {
        progressBar.classList.remove('bg-blue-500', 'bg-yellow-500');
        progressBar.classList.add('bg-red-500');
    }
}

// Update last updated timestamp
function updateLastUpdated(timestamp = null) {
    const now = timestamp || new Date();
    const timeString = now.toLocaleTimeString();
    document.querySelector('.last-updated').textContent = timeString;
}

// Show notification
function showNotification(message, type) {
    const notification = document.querySelector('.notification');
    notification.textContent = message;
    notification.classList.remove('hidden', 'bg-green-500/20', 'bg-red-500/20');
    
    if (type === 'success') {
        notification.classList.add('bg-green-500/20');
    } else {
        notification.classList.add('bg-red-500/20');
    }
    
    // Show notification
    notification.classList.remove('hidden');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Start real-time updates
function startRealTimeUpdates() {
    // Initial fetch
    fetchParkingData();
    
    // Set up regular fetching
    setInterval(fetchParkingData, REFRESH_INTERVAL);
}

// Generate remaining parking spots (for spots 37-81)
function generateRemainingSpots() {
    const parkingGrid = document.querySelector('.parking-grid');
    
    // Check if we need to generate more spots (if there are less than 81 currently)
    const existingSpots = document.querySelectorAll('.parking-spot-card').length;
    if (existingSpots >= 81) return;
    
    // Generate remaining spots from existingSpots+1 to 81
    for (let i = existingSpots + 1; i <= 81; i++) {
        const spotCard = document.createElement('div');
        spotCard.className = 'parking-spot-card';
        
        const spot = document.createElement('div');
        spot.className = 'parking-spot parking-spot-small static-spot';
        spot.dataset.spot = `Slot${i}`;
        
        const label = document.createElement('h2');
        label.className = 'spot-label';
        label.textContent = i;
        
        spot.appendChild(label);
        spotCard.appendChild(spot);
        parkingGrid.appendChild(spotCard);
        
        // Store reference to element
        if (i <= 3) {
            parkingSpots[`Slot${i}`].element = spot;
        } else {
            staticSpots[`Slot${i}`].element = spot;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing smart parking system...');
    
    // Generate any missing spots to complete the 9x9 grid
    generateRemainingSpots();
    
    // Get all parking spot elements
    document.querySelectorAll('.api-connected').forEach(element => {
        const spotId = element.dataset.spot;
        if (parkingSpots[spotId]) {
            parkingSpots[spotId].element = element;
            
            // Initialize with unknown status
            element.classList.add('unknown');
        }
    });
    
    // Get all static spot elements
    document.querySelectorAll('.static-spot').forEach(element => {
        const spotId = element.dataset.spot;
        if (staticSpots[spotId]) {
            staticSpots[spotId].element = element;
        }
    });
    
    // Initialize static spots to always show as available
    initializeStaticSpots();
    
    // Initialize statistics
    updateStatistics();
    
    // Start real-time updates
    startRealTimeUpdates();
});