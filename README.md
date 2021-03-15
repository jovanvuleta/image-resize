Project steps: # image-resize
- npm install (install required dependecies)
- Configure the .env file with the appropriate AWS key information, Bucket and SQS information
- Fields for .env file that need to be added in the project:
    AWS_ID="your ID key"
    AWS_SECRET="your secret key"
    AWS_BUCKET_NAME="your bucket name"
    SQS_URL = "your sqs url"
    REGION = "your region"
- Spin up the server with command "npm run server"
- Front End part of the application is located on the port 4200 (http://localhost:4200/)
- The image is picked and uploaded to the AWS with required widht and height information from the FE
- Then the worker script should be launched from the terminal with the command "npm run worker"
- After the worker finished fetching all the SQS information and finishes resizing, click on the Download button to receive your resized image content
