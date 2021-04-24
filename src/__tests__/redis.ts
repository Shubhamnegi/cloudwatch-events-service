import * as dotenv from "dotenv";
import * as path from "path";
const envPath = path.join(__dirname, "../.env");
dotenv.config({
    path: envPath
})
import { LimtrayRedis } from "../Connectors/redisConnector";

LimtrayRedis.startClient();

describe("Redis client test", () => {
    it("Set redis value", async () => {
        const result = await LimtrayRedis.lockJob("shubham");
        expect(result).toEqual("ok");
    })

    it("get redis value", async () => {
        const result = await LimtrayRedis.isJobLocked("shubham");
        expect(result).toEqual("1");
    })
})