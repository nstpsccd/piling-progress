// Configuration
const GOOGLE_SHEETS_ID = '14b1coBLSj8b2ZvMaB1zXbVnnIarnGAxrqIjAwBYWki8';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

// Grid configuration
const GRID_COLUMNS = 10;
const GRID_MARGIN_X = 0.1;
const GRID_MARGIN_Y = 0.1;

// Get data from published Google Sheet
async function fetchPileData() {
    try {
        // Using "Published to Web" CSV export
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        
        const response = await fetch(csvUrl);
        const csvData = await response.text();
        
        // Convert CSV to JSON
        const workbook = XLSX.read(csvData, { type: 'string' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        return jsonData.map(row => {
            // Adjust these property names to match your column headers
            return [
                row['Pile ID'] || row['Pile No'] || row['ID'], // Adjust based on your header
                row['Status'] || row['Progress'],              // Adjust based on your header
                row['Notes'] || row['Remarks'] || ''          // Adjust based on your header
            ];
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

// Parse pile ID to get position (customize based on your ID format)
function parsePileId(pileId) {
    if (!pileId) return { row: 1, col: 1 };
    
    // Example for IDs like "P-101" where 1=row, 01=column
    if (pileId.startsWith('P-')) {
        const num = pileId.split('-')[1];
        return {
            row: parseInt(num.charAt(0)) || 1,
            col: parseInt(num.substring(1)) || 1
        };
    }
    
    // Example for IDs like "P1-02" where 1=row, 02=column
    if (pileId.includes('-')) {
        const [rowPart, colPart] = pileId.split('-');
        return {
            row: parseInt(rowPart.replace('P', '')) || 1,
            col: parseInt(colPart) || 1
        };
    }
    
    // Fallback: Assign sequential positions
    const num = parseInt(pileId.replace(/\D/g, '')) || 0;
    return {
        row: Math.floor(num / GRID_COLUMNS) + 1,
        col: (num % GRID_COLUMNS) + 1
    };
}

// Create pile markers on the drawing
function renderPiles(pileData) {
    const container = document.getElementById('map-container');
    const background = document.getElementById('drawing-background');
    
    // Clear existing markers
    document.querySelectorAll('.pile-marker').forEach(m => m.remove());
    
    // Get container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Calculate grid cell size
    const cellWidth = width * (1 - 2 * GRID_MARGIN_X) / GRID_COLUMNS;
    const rowsNeeded = Math.ceil(pileData.length / GRID_COLUMNS);
    const cellHeight = height * (1 - 2 * GRID_MARGIN_Y) / rowsNeeded;
    
    pileData.forEach((pile, index) => {
        const [id, status, notes] = pile;
        
        // Parse position from ID or use sequential position
        const position = parsePileId(id);
        const { row, col } = position;
        
        // Create marker element
        const marker = document.createElement('div');
        marker.className = `pile-marker ${status ? status.toLowerCase() : 'pending'}`;
        marker.dataset.id = id;
        marker.dataset.status = status;
        marker.title = `${id}: ${status}`;
        marker.textContent = id ? id.toString().split('-').pop() : '?';
        
        // Calculate position
        const x = width * GRID_MARGIN_X + (col - 0.5) * cellWidth;
        const y = height * GRID_MARGIN_Y + (row - 0.5) * cellHeight;
        
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        
        // Add hover tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'pile-info';
        tooltip.innerHTML = `
            <strong>Pile:</strong> ${id || 'N/A'}<br>
            <strong>Status:</strong> ${status || 'Unknown'}<br>
            <strong>Notes:</strong> ${notes || ''}
        `;
        marker.appendChild(tooltip);
        
        // Show tooltip on hover
        marker.addEventListener('mouseover', () => {
            tooltip.style.display = 'block';
            tooltip.style.left = '25px';
            tooltip.style.top = '0';
        });
        
        marker.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });
        
        container.appendChild(marker);
    });
}

// Update status summary
function updateSummary(pileData) {
    const counts = {
        completed: 0,
        ongoing: 0,
        pending: 0
    };
    
    pileData.forEach(pile => {
        const status = pile[1] ? pile[1].toLowerCase() : 'pending';
        if (status.includes('complete')) counts.completed++;
        else if (status.includes('ongo')) counts.ongoing++;
        else counts.pending++;
    });
    
    const total = pileData.length;
    const summary = document.getElementById('status-summary');
    summary.innerHTML = `
        <h3>Progress Summary</h3>
        <p>Total Piles: ${total}</p>
        <p>Completed: ${counts.completed} (${total ? Math.round(counts.completed/total*100) : 0}%)</p>
        <p>Ongoing: ${counts.ongoing} (${total ? Math.round(counts.ongoing/total*100) : 0}%)</p>
        <p>Pending: ${counts.pending} (${total ? Math.round(counts.pending/total*100) : 0}%)</p>
    `;
}

// Initialize the application
async function init() {
    const pileData = await fetchPileData();
    renderPiles(pileData);
    updateSummary(pileData);
    
    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
    
    // Add refresh button handler
    document.getElementById('refresh-btn').addEventListener('click', async () => {
        document.getElementById('loading').style.display = 'flex';
        const newData = await fetchPileData();
        renderPiles(newData);
        updateSummary(newData);
        document.getElementById('loading').style.display = 'none';
    });
}

// Start the app when the page loads
window.addEventListener('load', init);