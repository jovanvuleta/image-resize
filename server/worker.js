require('dotenv/config')
const { v4: uuidv4 } = require('uuid')
const sharp = require("sharp");
const AWS = require('aws-sdk')
const SESConfig = {
    apiVersion: "2012-11-05",
    accessKeyId: process.env.AWS_ID,
    accessSecretKey: process.env.AWS_SECRET,
    region: "eu-central-1"
}
AWS.config.update(SESConfig);

var queueURL = 'https://sqs.eu-central-1.amazonaws.com/901871468409/my-queue'

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
    QueueUrl: queueURL
}

let readUserDetails = () => {
    sqs.receiveMessage(params, (err, data) => {
        console.log("SQS Polled Data: " + data.Messages)
        if(err) {
            console.log("Received error", err);
            // callback(err, 'Error fetching messages from SQS');
            return;
        } else if(data.Messages) {
            // console.log("Number of messages received: " + data.Messages.length);
            console.log("Received message: " + JSON.stringify(data.Messages[0]));
            // console.log("Message body: " + data.Messages[0].Body);
            
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
            console.log("Lenght: " + data.Messages.length)
        } else {
            console.log('No messages received');
        }
    })
}

let deleteMessages = (data) => {
    let deleteParams = {
        QueueUrl: queueURL,
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
    console.log('Usao u sharp')
    // await sharp(image)
    //     .resize(size, size, { fit:  "cover" })
    //     .toFile(outputPath);   
    secondImageReference = image
    sharp(secondImageReference)
        .resize(width, height, {
            fit: 'contain'
        })
        .toFile('output.png', (err, info) => {
            console.log("Info: ") 
            console.log(info)
        });
    
    sharp(image)
        .resize(width, height, {
            fit: "contain"
        })
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
            })
        })
        .catch( err => { 'Error in sharp' });
}

readUserDetails()