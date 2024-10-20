const mongoose = require("mongoose")
const clc = require("cli-color")
require("dotenv").config()

const db = mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(clc.yellow("mongodb connected")))
    .catch((e) => console.log(clc.yellow("mongodb error", e)))

module.exports = db