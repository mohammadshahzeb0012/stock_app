const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public");  
    },
    filename: (req, file, cb) => {
        const extensionName = path.extname(file.originalname);
        if (extensionName !== '.csv') {
            return cb(new Error());  // Simplified error message
        }
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage })
module.exports = upload;