import * as bunyan from "bunyan";
import { v4 as uuid4 } from "uuid";

export const getLogger = (name?: string) => {
    const uid = uuid4();
    const logger = bunyan.createLogger({
        name: name || "cron-events-service",
        level: "debug",
        src: true,
    })
    logger.fields.req_id = uid;
    return logger;
}

export default getLogger;

