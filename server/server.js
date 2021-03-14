require('dotenv/config')
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const SESConfig = {
    apiVersion: "2012-11-05",
    accessKeyId: process.env.AWS_ID,
    accessSecretKey: process.env.AWS_SECRET,
    region: "eu-central-1"
}
AWS.config.update(SESConfig);

var queueURL = 'https://sqs.eu-central-1.amazonaws.com/901871468409/my-queue'

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

var sqs = new AWS.SQS({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const app = express()
app.use(cors())
const port = 3033

const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})

const upload = multer({storage}).single('image')

app.listen(port, () => {
    console.log(`Server is up at ${port}`)
})

// const { Worker } =  require("worker_threads");

// module.exports = function imageResizer(image, size, extension) {
//     return new Promise((resolve, reject) => {
//     const worker = new  Worker(__dirname + "/workerThread.js", {
//         workerData: { image, size, extension }
//     });
//     worker.on("message", resolve);
//     worker.on("error", reject);
//     worker.on("exit", code  => {
//         if (code  !==  0)
//             reject(new  Error(`Worker stopped with exit code ${code}`));
//         });
//     });
// };

app.post('/upload', upload, (req, res) => {
    let myFile = req.file.originalname.split(".")
    const fileType = myFile[myFile.length - 1]
    const size = req.file.size;
    const image = req.file.buffer;
    const width = req.body.width;
    const height = req.body.height;
    console.log("Size: " + size)
    console.log("Width: " + width)
    console.log("Height: " + height)

    if(!fileType.toString().toLowerCase() === 'jpg' || !fileType.toString().toLowerCase() === 'png'){
        console.log('File format exception triggered!')
        res.status(500).send("Unsupported image extensions, try again.")
        return;
    }
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuidv4()}.${fileType}`,
        Body: image
    }

    s3.upload(params, (error, data) => {
        if(error){
            res.status(500).send(err)
        }
        console.log("Image saved to S3 bucket")
        console.log("Key: " + params.Key)
    })

    var sqsSendParams = {
        DelaySeconds: 1,
        MessageAttributes: {
            "Image": {
                DataType: "Binary", 
                BinaryValue: image
            },
            "Extension": {
                DataType: "String", 
                StringValue: fileType.toString()
            },
            "BucketKey": {
                DataType: "String",
                StringValue: params.Key.toString()
            },
            "Width": {
                DataType: "Number",
                StringValue: width.toString()
            },
            "Height": {
                DataType: "Number",
                StringValue: height.toString()
            }
        },
        MessageBody: "Hiii, John Doe sending!",
        QueueUrl: queueURL
    }

    sqs.sendMessage(sqsSendParams, (err, data) => {
        if(err) {
            console.log("Error", err);
        } else {
            console.log("Message sent to SQS: ", data.MessageId)
        }
    })
    console.log(req.file)
    res.status(200)
    // imageResizer(image, size, fileType)
})

app.get('/download', (req, res) => {
    const file = 'client/src/assets/img/' + req.query.filename;
    console.log(req.query.filename);
    res.download(file)
})



