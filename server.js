import express, { response } from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Browser instance for pooling
let browser;

// Initialize browser on server start
(async () => {
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ],
            executablePath: process.env.NODE_ENV === 'production' 
                ? '/usr/bin/google-chrome-stable'
                : undefined
        });
        console.log('Browser instance created successfully');
    } catch (error) {
        console.error('Failed to launch browser:', error);
        process.exit(1);
    }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing browser...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Closing browser...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

// Helper function to validate date format (MM/DD/YYYY)
function isValidDate(dateStr) {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    return regex.test(dateStr);
}

// Helper function to validate URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Helper function to read URLs from file
function readUrlsFromFile(filename) {
    try {
        const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
        return content.split('\n')
            .map(url => url.trim())
            .filter(url => url);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
}

// Helper function to read URLs and eids from file
function readUrlsAndEidsFromFile(filename) {
    try {
        const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
        return content.split('\n')
            .map(line => {
                const [url, eid] = line.trim().split(' ');
                return { url, eid: parseInt(eid) };
            })
            // .filter(item => item.url && !isNaN(item.eid));
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
}

// Helper function to format date for API
function formatDateForAPI(dateStr) {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Helper function to format date for calendar
function formatDateForCalendar(dateStr) {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

// Shared function to extract price
async function extractPrice(page, url) {
    try {
        console.log(`Waiting for price element on ${url}...`);
        await page.waitForSelector('.price', { 
            timeout: 10000,
            visible: true 
        }).catch(error => {
            console.log(`Price element not found after 10s on ${url}`);
            return null;
        });

        console.log(`Extracting price from ${url}...`);
        const price = await page.evaluate(() => {
            const priceElement = document.querySelector('.price');
            return priceElement ? priceElement.textContent.trim() : null;
        });

        if (!price) {
            console.log(`No price found in element on ${url}`);
            return null;
        }

        console.log(`Found price on ${url}: ${price}`);
        return price;
    } catch (error) {
        console.error(`Price extraction error on ${url}:`, error);
        return null;
    }
}

// Scraping endpoint for list.txt
app.get('/api/scrape/list1', async (req, res) => {
    const { arrival, departure } = req.query;
    
    if (!arrival || !departure) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    console.log(arrival, departure);
    const urls = readUrlsFromFile('list.txt');
    const results = [];

    try {
        // Use the existing browser instance
        if (!browser) {
            throw new Error('Browser instance not initialized');
        }

        for (const url of urls) {
            try {
                console.log(`Starting scrape for URL: ${url}`);
                const page = await browser.newPage();
                
                // Set a longer timeout for navigation
                await page.setDefaultNavigationTimeout(60000);
                await page.setDefaultTimeout(60000);
                
                // Construct URL with date parameters
                const bookingurl = `${url}?checkin=${arrival}&checkout=${departure}`;
                console.log(`Navigating to: ${bookingurl}`);
                
                // Navigate to the URL with date parameters
                await page.goto(bookingurl, {
                    waitUntil: 'networkidle0',
                    timeout: 60000
                });

                console.log(`Page loaded: ${url}`);

                const data = await page.evaluate((url) => {
                    // First check for error message
                    const errorElement = document.querySelector('div.pdp-quote div.alert-danger');
                    if (errorElement) {
                        return { url, price: 'N/A' };
                    }

                    // If no error, get the price
                    const price = document.evaluate(
                        '//*[@id="quoteForm"]/ul/li[4]/span[2]',
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue?.textContent || '';
                    return { url, price };
                }, bookingurl);
                console.log(data.price);
                results.push(data);
                await page.close();
            } catch (error) {
                console.error(`Error processing ${url}:`, error);
                results.push({ url, price: 'Error: ' + error.message });
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to scrape data' });
    }
});

// API endpoint for list2.txt and list3.txt
app.get('/api/scrape/list2', async (req, res) => {
    const { arrival, departure, listNumber } = req.query;
    
    console.log(arrival, departure, listNumber);
    if (!arrival || !departure) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const filename = listNumber === '2' ? 'list2.txt' : 'list3.txt';
    const items = readUrlsAndEidsFromFile(filename);
    const results = [];

    console.log(items);
    try {
        for (const { url, eid } of items) {
            try {
                console.log(`Processing URL: ${url} with eid: ${eid}`);
                
                const params = {
                    'rcav[begin]': formatDateForAPI(arrival),
                    'rcav[end]': formatDateForAPI(departure),
                    'rcav[adult]': 1,
                    'rcav[child]': 0,
                    'rcav[eid]': eid
                };
                let response;
                // Add flex parameters for list2.txt
                if (listNumber === '2') {
                    params['rcav[flex]'] = '';
                    params['rcav[flex_type]'] = 'd';
                }
                if (listNumber === '2'){
                    response = await axios.get('https://www.emeraldcoastpcb.com/rcapi/item/avail/search', { params });
                    console.log(response.data);
                } 
                if (listNumber === '3') {
                    response = await axios.get('https://www.panhandlegetaways.com/rcapi/item/avail/search', { params });
                    console.log(response.data);
                }
                let price = "";
                if(response == undefined){
                    price = 'N/A';
                    results.push({ url, price });
                } else {
                    // Check if prices array exists and has items
                    price = response.data[0]?.prices?.[0]?.p || 'N/A';
                }               
              
                results.push({ url, price });
            } catch (error) {
                console.error(`Error processing ${url}:`, error);
                results.push({ url, price: 'Error: ' + error.message });
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// HTML endpoint
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 