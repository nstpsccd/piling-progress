// Configuration
const GOOGLE_SHEETS_ID = '14b1coBLSj8b2ZvMaB1zXbVnnIarnGAxrqIjAwBYWki8';
const SHEET_NAME = 'Sheet1';

// Store pile data and positions
let pileData = [];
let pilePositions = {};
let drawingImg;

// Fetch data from Google Sheets
async function fetchPileData() {
    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        
        // Simple CSV parsing
        const rows = csvData.split('\n');
        const headers = rows[0].split(',');
        return rows.slice(1).map(row => {
            const values = row.split(',');
            return {
                id: values[0]?.trim() || '',
                status: values[1]?.trim().toLowerCase() || 'pending',
                notes: values[2]?.trim() || ''
            };
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// Initialize p5.js for image processing
function setup() {
    noCanvas();
    
    // Load the drawing image
    drawingImg = document.getElementById('drawing-img');
    
    // Initialize the application
    init();
}

// Main initialization
async function init() {
    // Load pile data
    pileData = await fetchPileData();
    console.log('Loaded pile data:', pileData);
    
    // Process the drawing to find pile IDs
    await processDrawing();
    
    // Create status markers
    createStatusMarkers();
}

// Process drawing to find pile IDs (simplified approach)
async function processDrawing() {
    // In a real implementation, you would:
    // 1. Use OCR to detect text in the drawing
    // 2. Identify pile ID locations
    // 3. Store positions in pilePositions
    
    // For this example, we'll simulate with manual positions
    // Replace this with actual OCR processing in production
    
    // Example simulated positions (you would generate these automatically)
    pilePositions = {
        'P-101': { x: 150, y: 200 },
        'P-102': { x: 300, y: 250 },
        'P-103': { x: 450, y: 180 },
        // Add all your pile positions here
    };
    
    // Alternative: Add a way to manually map positions
    setupManualMapping();
}

function setupManualMapping() {
    const container = document.getElementById('drawing-container');
    const img = document.getElementById('drawing-img');
    
    img.addEventListener('click', (e) => {
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pileId = prompt('Enter pile ID for this location:');
        if (pileId) {
            pilePositions[pileId] = { x, y };
            console.log(`Mapped ${pileId} to (${x}, ${y})`);
            createStatusMarkers();
        }
    });
}

// Create status markers based on data and positions
function createStatusMarkers() {
    // Clear existing markers
    document.querySelectorAll('.pile-highlight').forEach(el => el.remove());
    
    // Create new markers
    pileData.forEach(pile => {
        const position = pilePositions[pile.id];
        if (position) {
            const marker = document.createElement('div');
            marker.className = `pile-highlight status-${pile.status}`;
            marker.style.left = `${position.x}px`;
            marker.style.top = `${position.y}px`;
            marker.textContent = pile.id;
            marker.title = `Status: ${pile.status}\n${pile.notes}`;
            
            document.getElementById('drawing-container').appendChild(marker);
        }
    });
}

// Search functionality
document.getElementById('search-box').addEventListener('input', (e) => {
    const searchId = e.target.value.trim();
    if (!searchId) return;
    
    const marker = document.querySelector('.pile-highlight');
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        marker.style.animation = 'pulse 0.5s 3';
    }
});

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', async () => {
    pileData = await fetchPileData();
    createStatusMarkers();
});

// Initialize p5
new p5();