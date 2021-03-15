require('dotenv/config')
const sharp = require("sharp");
const AWS = require('aws-sdk')
const fs = require('fs');
const AWSConfig = {
    apiVersion: "2012-11-05",
    accessKeyId: process.env.AWS_ID,
    accessSecretKey: process.env.AWS_SECRET,
    region: process.env.REGION
}
AWS.config.update(AWSConfig);

var sqs = new AWS.SQS({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

var params = {
    MaxNumberOfMessages: 10,
    MessageAttributeNames: [
        "All"
    ],
    // VisibilityTimeout: 0,
    // WaitTimeSeconds: 0,
    QueueUrl: process.env.SQS_URL
}

let readUserDetails = () => {
    sqs.receiveMessage(params, (err, data) => {
        console.log("SQS Polled Data: " + data.Messages)
        if(err) {
            console.log("Received error", err);
            return;
        } else if(data.Messages) {
            console.log("Number of messages received: " + data.Messages.length);
            console.log("Received message: " + JSON.stringify(data.Messages[0]));
            console.log("Message body: " + data.Messages[0].Body);
            // Fetching all the SQS messages and preforming resizing and deletion
            for(let i = 0; i < data.Messages.length; i++) {
                image = data.Messages[i].MessageAttributes.Image.BinaryValue;
                width = data.Messages[i].MessageAttributes.Width.StringValue;
                height = data.Messages[i].MessageAttributes.Height.StringValue;
                extension = data.Messages[i].MessageAttributes.Extension.StringValue;
                bucketKey = data.Messages[i].MessageAttributes.BucketKey.StringValue;
                console.log("Image from message: " + image)
                console.log('Looping iteration: ' + i)
                resizeImage(image, parseInt(width), parseInt(height), extension, bucketKey)
                deleteMessages(data.Messages[i])
            }
        } else {
            console.log('No messages received');
        }
    })
}

let deleteMessages = (data) => {
    let deleteParams = {
        QueueUrl: process.env.SQS_URL,
        ReceiptHandle: data.ReceiptHandle
    };
    console.log("ReceiptHandle: " + data.ReceiptHandle);
    sqs.deleteMessage(deleteParams, (err, data) => {
        if(err) {
            console.log('Delete error', err);
        } else {
            console.log('Message Deleted', data)
        }
    })
}

let resizeImage = (image, width, height, extension, bucketKey) => {
    console.log("Extension")
    console.log(extension)
    sharp(image)
        .resize(width, height, {
            fit: "contain"
        })
        .toFormat(extension)
        .toBuffer()
        .then(data => {
            console.log("sharp data: ")
            console.log(data)
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: bucketKey,
                Body: data
            }
            s3.upload(params, (error, data) => {
                if(error){
                    res.status(500).send(err)
                }
                console.log("S3 resized response: ")
                console.log(data)
                fs.writeFileSync('./AWS_resources/image.' + extension, params.Body)
                return data.Key;
            })
        })
        .catch( err => { 'Error in sharp' + err });
}

readUserDetails()