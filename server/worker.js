require('dotenv/config')
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

var params = {
    AttributeNames: [
        "SentTimestamp"
    ],
    MaxNumberOfMessages: 5,
    MessageAttributeNames: [
        "All"
    ],
    VisibilityTimeout: 0,
    WaitTimeSeconds: 0,
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
        console.log("Number of messages received: " + data.Messages.length);
        console.log("Received message: " + JSON.stringify(data.Messages[0]));
        console.log("Message body: " + data.Messages[0].Body);
        var deleteParams = {
            QueueUrl: queueURL,
            ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        console.log("ReceiptHandle in param: " + deleteParams.ReceiptHandle);

        sqs.deleteMessage(deleteParams, (err, data) => {
            if(err) {
                console.log('Delete error', err);
            } else {
                console.log('Message Deleted', data)
            }
        })
        console.log("Lenght: " + data.Messages.length)
    } else {
        console.log('No messages received');
    }
    
})
}

readUserDetails()