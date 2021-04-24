import dotenv from "dotenv"
import path from "path";

// Custom env first thing to do
if (process.env.NODE_ENV !== "production") {
    dotenv.config({
        path: path.join(__dirname, ".env")
    })
}

import express from "express";
import { getLogger } from "./util/loggerUtil";
import { CustomRequest } from "./definations/index"
import { CloudwatchService } from "./services/cloudwatchService";
import { CustomHttpError } from "./services/CustomHttpError";
import { start as cronConsmer } from "./consumers/cronQueueConsumer";
import { LimtrayRedis } from "./Connectors/redisConnector";

LimtrayRedis.startClient();

export const app = express();
export const applicationLogger = getLogger();
const port = 8080;




function errorHandler(err: CustomHttpError, req: CustomRequest, res: express.Response, next: express.NextFunction) {
    const logger = req.log ? req.log : applicationLogger;
    if (res.headersSent) {
        return next(err)
    }
    const status = err.status ? err.status : 500;
    logger.error(err.error ? err.error : err);
    res.status(status)

    return res.json({
        status,
        error: err.message ? err.message : "Unhandled Internal error"
    })
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: CustomRequest, res, next) => {
    req.log = getLogger();
    next();
})

app.get("/health", async (req: CustomRequest, res, next) => {
    return res.status(200).send("ok");
})

app.post("/api/jobs/", async (req: CustomRequest, res, next) => {
    const svc = new CloudwatchService(req.log);
    let result;
    try {
        req.log.info("Incomming packet", { data: req.body });
        result = await svc.createCloudwatchEvent(req.body);
    } catch (err) {
        return next(err);
    }
    res.status(201).json(result);
});

app.get("/api/jobs/", async (req: CustomRequest, res, next) => {
    const svc = new CloudwatchService(req.log);
    let result;
    try {
        req.log.info("Incomming packet", { data: req.query });
        result = await svc.listEvents(); // TODO: add query param for limit and text token, downstead function already have this
    } catch (err) {
        return next(err);
    }
    res.json(result);
});

app.get("/api/job/:name", async (req: CustomRequest, res, next) => {
    const svc = new CloudwatchService(req.log);
    let result;
    try {
        req.log.info("Incomming packet", { data: req.params.name });
        result = await svc.describeEvent(req.params.name);
    } catch (err) {
        return next(err);
    }
    res.json(JSON.parse(result));
})


app.delete("/api/job/:name", async (req: CustomRequest, res, next) => {
    const svc = new CloudwatchService(req.log);
    try {
        req.log.info("Incomming packet", { data: req.params.name });
        await svc.deleteEvent(req.params.name);
    } catch (err) {
        return next(err);
    }
    res.json(true);
})

app.use(errorHandler);

app.listen(port, () => {
    applicationLogger.info(`server started at http://localhost:${port}`);
    cronConsmer();
});

export default app;