# RealJoy Rental Scraper

This project is a web application that allows users to scrape rental price information for properties listed on RealJoy. Users can upload a list of property URLs, select a property, and specify arrival and departure dates to retrieve rental pricing information.

## Features

- **File Upload**: Import a `.txt` file containing property URLs.
- **Dropdown Selection**: Select a property URL from a dropdown menu.
- **Date Picker**: Choose arrival and departure dates using a modern date picker.
- **Price Scraping**: Scrape rental price information for the selected property and date range.
- **Loading Spinner**: Displays a spinner while fetching data.
- **Error Handling**: Displays error messages for invalid inputs or failed scraping attempts.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Web Scraping**: Puppeteer
- **Cross-Origin Support**: CORS

## Example .txt File for URLs 
    https://www.realjoy.com/beach-rentals/majestic-beach-towers-11006
    https://www.realjoy.com/beach-rentals/majestic-beach-towers-11014
    https://www.realjoy.com/beach-rentals/majestic-beach-towers-11210

## Installation
1. Install dependencies:
   npm install

2. Start the server:
   npm start

3. Open file:
   public/index.html