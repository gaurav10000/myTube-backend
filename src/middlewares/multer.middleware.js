import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function(req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // this is just to make every filename unique, which is not required here becasue file is gonna stay here for a very short period of time and then we will remove it
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage, // becasue we are using ES6
})