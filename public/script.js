async function fetchData() {
    const url = document.getElementById('url').value.trim();
    let arrival = document.getElementById('arrival').value.trim();
    let departure = document.getElementById('departure').value.trim();

    if (!url || !arrival || !departure) {
        const error = document.getElementById('error');
        error.textContent = 'Please fill in all fields';
        error.style.display = 'block';
        return;
    }

    const formatDate = (date) => {
        const [year, month, day] = date.split('-');
        return `${month}/${day}/${year}`;
    };

    arrival = formatDate(arrival);
    departure = formatDate(departure);

    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const result = document.getElementById('result');

    loading.style.display = 'block';
    error.style.display = 'none';
    result.style.display = 'none';

    try {
        const params = new URLSearchParams({
            url: url,
            arrival: arrival,
            departure: departure
        });

        const response = await fetch(`http://localhost:3000/api/scrape?${params.toString()}`);
        const data = await response.json();
        if (response.ok) {
            document.getElementById('price').textContent = data.price || 'Price information is unavailable for the selected dates.';
            const bookingUrl = `${url}?checkin=${arrival}&checkout=${departure}`;
            const bookingLink = document.getElementById('booking-link');
            bookingLink.href = bookingUrl;
            bookingLink.textContent = bookingUrl;
            result.style.display = 'block';
        } else {
            throw new Error(data.error || 'Failed to fetch data');
        }
    } catch (err) {
        error.textContent = err.message || 'Error loading data. Please try again.';
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Helper function to format date
function formatDate(date) {
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year}`;
}

// Helper function to create table row
function createTableRow(data) {
    const row = document.createElement('tr');
    const urlCell = document.createElement('td');
    const priceCell = document.createElement('td');
    
    const urlLink = document.createElement('a');
    urlLink.href = data.url;
    urlLink.textContent = data.url;
    urlLink.target = '_blank';
    urlCell.appendChild(urlLink);
    
    priceCell.textContent = data.price || 'Price unavailable';
    
    row.appendChild(urlCell);
    row.appendChild(priceCell);
    return row;
}

// Helper function to update progress
function updateProgress(message) {
    const progress = document.getElementById('progress');
    progress.textContent = message;
}

// Helper function to show loading
function showLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
}

// Helper function to hide loading
function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
}

// Helper function to show error
function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.style.display = 'block';
}

// Helper function to hide error
function hideError() {
    const error = document.getElementById('error');
    error.style.display = 'none';
}

// Helper function to show result
function showResult() {
    const result = document.getElementById('result');
    result.style.display = 'block';
}

// Helper function to hide result
function hideResult() {
    const result = document.getElementById('result');
    result.style.display = 'none';
}

// Helper function to fetch data for a single URL
async function fetchData(url, arrival, departure) {
    try {
        const params = new URLSearchParams({
            url: url,
            arrival: arrival,
            departure: departure
        });

        const response = await fetch(`/api/scrape?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data');
        }
        
        const data = await response.json();
        const bookingUrl = `${url}?checkin=${arrival}&checkout=${departure}`;
        return {
            url: bookingUrl,
            price: data.price
        };
    } catch (error) {
        console.error(`Error fetching data for ${url}:`, error);
        return {
            url: url,
            price: 'Error: ' + error.message
        };
    }
}

// Process a list of URLs
async function processList(listNumber, arrival, departure) {
    const endpoint = listNumber === 1 ? '/api/scrape/list1' : '/api/scrape/list2';
    const params = new URLSearchParams({
        arrival,
        departure
    });

    if (listNumber !== 1) {
        params.append('listNumber', listNumber);
    }

    try {
        const response = await fetch(`${endpoint}?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data');
        }

        const results = await response.json();
        const resultsBody = document.getElementById('results-body');
        
        if (listNumber === 1) {
            resultsBody.innerHTML = ''; // Clear existing results for list 1
        }

        for (const result of results) {
            const row = createTableRow(result);
            resultsBody.insertBefore(row, resultsBody.firstChild);
        }

        showResult();
    } catch (error) {
        showError('Error processing list: ' + error.message);
    }
}

// Main function to handle list 1
async function fetchList1Data() {
    const arrival = document.getElementById('arrival').value;
    const departure = document.getElementById('departure').value;
    
    if (!arrival || !departure) {
        showError('Please select both arrival and departure dates');
        return;
    }

    const buttons = document.querySelectorAll('.submit-btn');
    buttons.forEach(btn => btn.disabled = true);
    showLoading();
    hideError();
    hideResult();

    try {
        await processList(1, arrival, departure);
    } finally {
        hideLoading();
        buttons.forEach(btn => btn.disabled = false);
    }
}

// Main function to handle list 2
async function fetchList2Data() {
    const arrival = document.getElementById('arrival').value;
    const departure = document.getElementById('departure').value;
    
    if (!arrival || !departure) {
        showError('Please select both arrival and departure dates');
        return;
    }

    const buttons = document.querySelectorAll('.submit-btn');
    buttons.forEach(btn => btn.disabled = true);
    showLoading();
    hideError();

    try {
        await processList(2, arrival, departure);
    } finally {
        hideLoading();
        buttons.forEach(btn => btn.disabled = false);
    }
}

// Main function to handle list 3
async function fetchList3Data() {
    const arrival = document.getElementById('arrival').value;
    const departure = document.getElementById('departure').value;
    
    if (!arrival || !departure) {
        showError('Please select both arrival and departure dates');
        return;
    }

    const buttons = document.querySelectorAll('.submit-btn');
    buttons.forEach(btn => btn.disabled = true);
    showLoading();
    hideError();

    try {
        await processList(3, arrival, departure);
    } finally {
        hideLoading();
        buttons.forEach(btn => btn.disabled = false);
    }
}