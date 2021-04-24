import { Credentials, CloudWatchEvents } from "aws-sdk";
import { getLogger } from "./loggerUtil"

const credentials = new Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_KEY
);

export const cweClient = new CloudWatchEvents({
    credentials,
    region: process.env.AWS_REGION
})




