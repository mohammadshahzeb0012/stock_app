const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const clc = require("cli-color");
const app = express();
const PORT = process.env.PORT || 8000;


//file imports
const db = require("./db.js")
const StockModel = require("./models/stockModel.js")
const router = require("./routes/route.js")
const upload = require("./multer.js")

//middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "./public")))

//routes
app.use(router)

app.use((err, req, res, next) => {
    res.status(400).json('file not supported')
    next()
})

app.listen(PORT, () => {
    console.log(clc.blue(`Server is running on ${clc.white(`http://localhost:${PORT}`)}`));
});