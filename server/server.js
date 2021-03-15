require('dotenv/config')
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const AWSConfig = {
    apiVersion: "2012-11-05",
    accessKeyId: process.env.AWS_ID,
    accessSecretKey: process.env.AWS_SECRET,
    region: process.env.REGION
}
AWS.config.update(AWSConfig);

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
        console.log('File format unsupported!')
        res.status(500).send("Unsupported image extensions, try again.")
        return;
    }

    //Preparing the S3 image payload
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuidv4()}.${fileType}`,
        Body: image
    }

    // Uploading the image to the bucket
    s3.upload(params, (error, data) => {
        if(error){
            res.status(500).send(err)
        }
        console.log("Image saved to S3 bucket")
        console.log("Key: " + params.Key)
    })

    //Preparing the SQS message payload
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
        MessageBody: "Resizing image load",
        QueueUrl: process.env.SQS_URL
    }

    // Sending the message to SQS
    sqs.sendMessage(sqsSendParams, (err, data) => {
        if(err) {
            console.log("Error", err);
        } else {
            console.log("Message sent to SQS: ", data.MessageId)
        }
    })
    console.log(req.file)
    res.status(200)
})


app.post('/download', function(req,res){
    s3.listObjectsV2({
            Bucket: process.env.AWS_BUCKET_NAME
        }).promise()
        .then(data => {
            console.log("Contents:")
            console.log(data.Contents[0])
            splittedStr = data.Contents[0].Key.split('.')
            file = download(process.env.AWS_ID, process.env.AWS_SECRET, process.env.REGION,
                     process.env.AWS_BUCKET_NAME, data.Contents[0].Key)
        })
        .catch(err => {
            console.log("Error present: " + err)
        });

    res.sendFile(__dirname + '\\AWS_resources\\image.' + extension, file)

});


function download(accessKeyId, secretAccessKey, region, bucketName, baseImage) {
        console.log("Starting Download... ")
        const s3 = new AWS.S3({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            region: region
        });
        const params = {
            Bucket: bucketName,
            Key: baseImage
         };

        s3.getObject(params, (err, data) => {
            if(err) console.error(err);
            if(data.Body){
                console.log("Image Downloaded.");
                return(data.Body)
            }
        });
}



