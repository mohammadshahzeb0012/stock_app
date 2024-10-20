const path = require('path');
const fs = require("fs")
const csv = require('csv-parser');
const StockModel = require("./../models/stockModel")

const requiredColumns = [
    'Date', 'Symbol',
    'Series', 'Prev Close',
    'Open', 'High',
    'Low', 'Last',
    'Close', 'VWAP',
    'Volume', 'Turnover',
    'Trades', 'Deliverable Volume',
    '%Deliverble'
]

const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No file found"
        });
    }

    const filePath = path.join(__dirname,  './../public', req.file.originalname);
    let totalRecords = 0;
    let successfulRecords = 0;
    let failedRecords = [];

    try {
        const stream = fs.createReadStream(filePath).pipe(csv());
        stream.on('headers', (headers) => {
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length) {
                return res.status(400).json({
                    message: `${missingColumns.length} columns are missing`,
                    missingColumns
                });
            }
        });
        for await (const row of stream) {
            totalRecords++;
            const validationErrors = [];
            if (!Date.parse(row['Date'])) {
                validationErrors.push('Invalid date format');
            }
            const numFields = ['Prev Close', 'Open', 'High', 'Low', 'Last', 'Close', 'VWAP', 'Volume', 'Turnover', 'Trades', 'Deliverable Volume', '%Deliverble'];
            numFields.forEach(field => {
                if (isNaN(row[field])) {
                    validationErrors.push(`${field} should be a number`);
                }
            });
            if (validationErrors.length) {
                failedRecords.push({ row, errors: validationErrors });
            } else {
                const stockData = new StockModel({
                    date: new Date(row['Date']),
                    symbol: row['Symbol'],
                    series: row['Series'],
                    prev_close: parseFloat(row['Prev Close']) || 0,
                    open: parseFloat(row['Open']) || 0,
                    high: parseFloat(row['High']) || 0,
                    low: parseFloat(row['Low']) || 0,
                    last: parseFloat(row['Last']) || 0,
                    close: parseFloat(row['Close']) || 0,
                    vwap: parseFloat(row['VWAP']) || 0,
                    volume: parseFloat(row['Volume']) || 0,
                    turnover: parseFloat(row['Turnover']) || 0,
                    trades: parseInt(row['Trasdes']) || 0,
                    deliverable: parseInt(row['Deliverable Volume']) || 0,
                    percent_deliverable: parseFloat(row['%Deliverble']) || 0
                });
                try {
                    const response = await stockData.save();
                    successfulRecords++;
                } catch (err) {
                    failedRecords.push({ row, errors: ['Failed to save to database'] });
                }
            }
        }

        return res.status(200).json({
            totalRecords,
            successfulRecords,
            failedRecords: failedRecords.length,
            failedRecords
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error reading file",
            error: err.message
        });
    }
    finally {
        fs.unlinkSync(req.file.path);
    }
}

module.exports = uploadFile