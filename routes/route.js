const express = require("express")
const router = express.Router()
const uploadFile = require("./../controllers/uploadFile")

//file imports
const upload = require("./../multer")
const highestVolume = require("./../controllers/highestVolume")
const averageClose = require("./../controllers/averageClose")
const averageVwap = require("./../controllers/averageVwap")

//routes
router.post('/upload',upload.single("file"),uploadFile)
router.get("/api/highest_volume",highestVolume)
router.get('/api/average_close',averageClose)
router.get("/api/average_vwap",averageVwap)

module.exports = router