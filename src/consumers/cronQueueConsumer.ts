
import { getLogger } from '../util/loggerUtil';
import { EventJob } from '../definations';
import { CloudwatchService } from '../services/cloudwatchService';
import { NotificationService } from '../services/NotificationService';
import { LimtrayRedis } from '../Connectors/redisConnector';
import { Credentials, SQS } from "aws-sdk"


// Inititate SQS
const region = process.env.AWS_REGION;
const credentials = new Credentials(
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_KEY
);


const sqs = new SQS({ region, credentials })

const logger = getLogger("event-consumer");

export const start = async () => {
    logger.info("Starting listner for " + process.env.EVENT_QUEUE);
    // Get queue url by queue name
    const queueUrl = await sqs.getQueueUrl({ QueueName: process.env.EVENT_QUEUE }).promise();

    while (true) {
        // Get message from SQS
        const messagesResponse = await sqs.receiveMessage({
            QueueUrl: queueUrl.QueueUrl,
            MaxNumberOfMessages: 1,
            VisibilityTimeout: 60,
            WaitTimeSeconds: 20,
            AttributeNames: [],
        }).promise();

        const messages = messagesResponse.Messages;
        if (!messages || messages.length === 0) {
            // Sleep for 30 sec
            await sleep(30000);
            continue; // Recheck for message
        }
        for (const data of messages) {
            const log = getLogger("event-consumer");
            try {
                const message: EventJob = JSON.parse(data.Body);
                log.debug({ message }, "[CronQueue] Incomming packet")

                // For repeat patern queue will get message at the time of creating the event, we dont want that event
                // check if job is locked then ignore

                const lock = await LimtrayRedis.isJobLocked(message.name);
                if (lock || lock === "1") {
                    log.debug("Deleting message as job is locked");
                    return done(queueUrl.QueueUrl, data.ReceiptHandle);
                }

                // If the schedular is required only once then delete the job
                if (message.type === "single") {
                    const svc = new CloudwatchService(log);
                    await svc.deleteEvent(message.name); // Remove event from cloudwatch events
                }

                // Notify third party
                let notificationSvc: NotificationService;
                if (message.callbackUrl) {
                    notificationSvc = new NotificationService(log, "HTTP_CALLBACK", message);
                }
                else if (message.topic) {
                    notificationSvc = new NotificationService(log, "TOPIC", message);
                } else if (message.queue) {
                    notificationSvc = new NotificationService(log, "QUEUE", message);
                }
                await notificationSvc.notify();
            } catch (error) {
                log.error(error, "[CronQueue] error occured " + data.Body);
            }
            log.debug("Removing message with message id: " + data.MessageId);
            // Removing message in case if failure also
            // This can be tweeked according to the reqirement, dead queue can also be used here
            // I did not wanted to flood the reciever with same request
            await done(queueUrl.QueueUrl, data.ReceiptHandle);
        }
    }
}

/**
 * To delete message from queue
 * @param QueueUrl 
 * @param ReceiptHandle 
 */
const done = async (QueueUrl: string, ReceiptHandle: string) => {
    await sqs.deleteMessage({
        QueueUrl,
        ReceiptHandle
    }).promise();
}

/**
 * To reduce the numeber of polls
 * @param ms 
 * @returns 
 */
const sleep = (ms: number) => {
    return new Promise((resolve, _) => {
        setTimeout(() => {
            logger.debug(`Slept for ${ms}ms`)
            return resolve(true);
        }, ms)
    })
}