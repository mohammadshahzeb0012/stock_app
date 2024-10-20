const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const clc = require("cli-color");
const app = express();
const PORT = process.env.PORT || 8000;
const multer = require("multer");
const fs = require("fs")
const csv = require('csv-parser');


const db = require("./db.js")
const StockModel = require("./models/stockModel.js")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "./public")))


let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public')
    },
    filename: (req, file, cb) => {
        const extensionName = path.extname(file.originalname)
        if (extensionName !== '.csv') {
            return cb(new Error({
                status: 400,
                message: "file not supported"
            }))
        }
        cb(null, file.originalname)
    }
})

let upload = multer({ storage })

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

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No file found"
        });
    }

    const filePath = path.join(__dirname, 'public', req.file.originalname);
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
});

app.get('/api/highest_volume', async (req, res) => {
    const { start_date, end_date, symbol } = req.query;

    const query = {}

    if (start_date && end_date) {
        query.date = {
            $gte: new Date(start_date),
            $lte: new Date(end_date),
        }
    }

    if (symbol) {
        query.symbol = symbol
    }

    try {
        const stock = await StockModel.find(query)
            .sort({ volume: -1 })
            .limit(1)
        return res.status(200).json(stock)
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
})

app.get('/api/average_close', async (req, res) => {
    const { start_date, end_date, symbol } = req.query;

    const query = {}

    if (start_date && end_date) {
        query.date = {
            $gte: new Date(start_date),
            $lte: new Date(end_date),
        }
    }

    if (symbol) {
        query.symbol = symbol
    }
    try {
        const stocks = await StockModel.find(query)
        if (stocks.length === 0) {
            return res.status(404).json({ message: 'No records found for the specified query.' });
        }
        const stockssClose = stocks.reduce((sun, stock) => sun + stock.close, 0)
        const averageClose = stockssClose / stocks.length
        return res.status(200).json({ average_close: averageClose });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
})

app.get("/api/average_vwap", async (req, res) => {
    const { start_date, end_date, symbol } = req.query;

    const query = {}

    if (start_date && end_date) {
        query.date = {
            $gte: new Date(start_date),
            $lte: new Date(end_date),
        }
    }

    if (symbol) {
        query.symbol = symbol
    }

    try {
        const stocks = await StockModel.find(query)
        if (stocks.length === 0) {
            return res.status(404).json({ message: 'No records found for the specified query.' });
        }
        const stocksVwap = stocks.reduce((sum, stock) => sum + stock.vwap, 0)
        const averageVwap = stocksVwap / stocks.length
        return res.status(200).json({ average_vwap: averageVwap });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
})

app.use((err, req, res, next) => {
    res.send('file not supported')
    next()
})

app.listen(PORT, () => {
    console.log(clc.blue(`Server is running on ${clc.white(`http://localhost:${PORT}`)}`));
});