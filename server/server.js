require('dotenv/config')
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid');

const app = express()
app.use(cors())
const port = 3000

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const storage = multer.memoryStorage({
    desitantion: function(req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({storage}).single('image')

app.listen(port, () => {
    console.log(`Server is up at ${port}`)
})

app.post('/upload', upload, (req, res) => {
    let myFile = req.file.originalname.split(".")
    const fileType = myFile[myFile.length - 1]

    if(!fileType.toString().toLowerCase() === 'jpg' || !fileType.toString().toLowerCase() === 'png'){
        console.log('File format exception triggered!')
        res.status(500).send("Unsupported image extensions, try again.")
        return;
    }

    console.log(req.file)
    
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuidv4()}.${fileType}`,
        Body: req.file.buffer
    }

    s3.upload(params, (error, data) => {
        if(error){
            res.status(500).send(err)
        }
        res.status(200).send(data)
    })
})

