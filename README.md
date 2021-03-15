# image-resize

Project steps:
- git clone https://github.com/jovanvuleta/image-resize.git
- In the terminal run the command "npm install" (install required dependencies)
- Create and configure the .env file(in the server folder) with the appropriate AWS key information, Bucket and SQS information
- Please follow the .env field structure that need to be added in the project:
    - AWS_ID="your ID key"
    - AWS_SECRET="your secret key"
    - AWS_BUCKET_NAME="your bucket name"
    - SQS_URL = "your sqs url"
    - REGION = "your region"
- Spin up the server with command "npm run server" from the terminal which is started at the port 3033 (http://localhost:3033/)
- Front end part of the application is located on the port 4200 (http://localhost:4200/)
- The image should be picked and uploaded to the AWS with required widht and height information from the FE
- Then the worker script should be launched from the terminal with the command "npm run worker"
- After the worker finished fetching all the SQS information and finishes resizing, click on the Download button to receive your resized image content
