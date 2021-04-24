import app from "../index";
import supertest from "supertest";

describe("GET /health - simple health check", () => {
    it("Hello API Request", async () => {
        const result = await supertest(app).get("/health");
        expect(result.text).toEqual("ok");
        expect(result.status).toEqual(200);
    });
});

describe("cron job route", () => {
    it("POST api/jobs/ - Create new job on cloudwatch event for callback",
        async () => {
            const result = await supertest(app)
                .post("/api/jobs/")
                .set({ "content-type": "application/json" })
                .send({
                    "name": "OSS_PREORDER_LT4FE8OE0GSDG",
                    "type": "single",
                    "queue": "https://sqs.ap-southeast-1.amazonaws.com/445897275450/test-schedular-hack-service-master",
                    "payload": {
                        "entity": "PreOrder",
                        "action": "UPDATE",
                        "message": {
                            "entityId": "LT4FE8OE0GSDG",
                            "externalId": "LT4FE8OE0GSDG",
                            "brandId": "693",
                            "preOrderTime": 1618828320
                        },
                        "payload": {
                            "entityId": "LT4FE8OE0GSDG",
                            "externalId": "LT4FE8OE0GSDG",
                            "brandId": "693",
                            "preOrderTime": 1618828320
                        },
                        "delay": 300000,
                        "messageId": "OSS_PREORDER_LT4FE8OE0GSDG",
                        "destination": "test-oss-reminder-schedule-publish"
                    },
                    "interval": "300000",
                    "timezone": "Asia/Kolkata"
                });
            expect(result.status).toEqual(201);
        })
    it("GET api/job/test_job - Should be able to get details of event",
        async () => {
            const result = await supertest(app)
                .get("/job/test_job");
            expect(result.status).toEqual(200);
        })
})

