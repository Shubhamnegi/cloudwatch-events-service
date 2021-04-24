import { Credentials, SNS, SQS } from "aws-sdk";
import Logger from "bunyan";
import { formattedPayload } from "../util/formatter";
import { EventJob, NotificationTypes } from "../definations";
import got from "got";
import { postMessage } from "../util/slackUtil";

const credentials = new Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_KEY
);
const region = process.env.AWS_REGION;

/**
 * Responsible to push message to topic and queue
 */
export class NotificationService {
    private logger: Logger
    private sqsClient: SQS
    private snsClient: SNS
    private type: NotificationTypes;
    private job: EventJob;

    constructor(logger: Logger, type: NotificationTypes, job: EventJob) {
        if (!type) {
            throw new Error("Type cannot be null");
        }
        if (!job) {
            throw new Error("Job cannot be null");
        }
        this.logger = logger;
        this.type = type;
        this.job = job;

        if (type === "QUEUE") {
            this.sqsClient = new SQS({ credentials, region });
        }
        else if (type === "TOPIC") {
            this.snsClient = new SNS({ credentials, region });
        }
    }

    /**
     * Will push to topic or queue depending on the type of message
     */
    async notify() {
        // This is based on the requirement of the incomming message for the reciever, can be tweeked according to the reqirement
        const message = formattedPayload(this.job.name, this.job.payload);
        // This can be convert to factory pattern instead of a swith here :D
        switch (this.type) {
            case "QUEUE":
                const sqsResult = await this.sqsClient.sendMessage({
                    QueueUrl: this.job.queue,
                    MessageBody: message,
                }).promise();

                this.logger.debug(`SQS publish response for queue: ${this.job.queue}`,
                    {
                        result: sqsResult
                    });
                postMessage(`pushed message to topic \`${this.job.topic}\` by job \`${this.job.name}\``,
                    formattedPayload(
                        this.job.name,
                        this.job.payload
                    ));
                break;
            case "TOPIC":
                const snsResult = await this.snsClient.publish({
                    TopicArn: this.job.topic,
                    Message: message
                }).promise();

                this.logger.debug(`SQS publish response from topic ${this.job.topic}`,
                    {
                        result: snsResult
                    });
                postMessage(`pushed message to topic \`${this.job.topic}\` by job \`${this.job.name}\``,
                    formattedPayload(
                        this.job.name,
                        this.job.payload
                    ));
                break;
            case "HTTP_CALLBACK":
                const response = await got(this.job.callbackUrl, {
                    method: "POST",
                    json: { payload: this.job.payload }
                })
                this.logger.debug(`Http status for  ${this.job.callbackUrl} is ${response.statusCode}`);
                postMessage(`pushed http request to \`${this.job.callbackUrl}\` by job \`${this.job.name}\``, { response: response.body })
                break;
            default:
                const msg = `invalid type ${this.type}`;
                const error = new Error(msg);
                this.logger.error(error, { job: this.job });
                throw error;
        }
    }
}