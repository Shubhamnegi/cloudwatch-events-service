import * as dotenv from "dotenv";
import * as path from "path";
const envPath = path.join(__dirname, "../.env");
dotenv.config({
    path: envPath
})

import { NotificationService } from "../services/NotificationService";
import { getLogger } from "../util/loggerUtil";
const logger = getLogger("TEST-SUITE");

logger.info(envPath, "env path");


const testQueueUrl = process.env.TEST_QUEUE_URL;
// const testTopicArn = process.env.TEST_TOPIC_ARN;
const dummyqjob = {
    "type": "single",
    "interval": "120000",
    "queue": testQueueUrl,
    "payload": {
        "status": 1
    },
    "name": "test_job"
}

describe("Notification Service Test", () => {
    it("Should be able to push into queue", async () => {
        const svc = new NotificationService(logger, "QUEUE", dummyqjob);
        await svc.notify();
    });
})