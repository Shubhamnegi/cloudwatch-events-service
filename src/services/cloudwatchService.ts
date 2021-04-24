import { ListRulesRequest, PutRuleRequest, PutTargetsRequest } from "aws-sdk/clients/cloudwatchevents";
import Logger from "bunyan";
import { formatterSQSARN, getCronExpression, getJobName, getJobPrefix, getRedisKey } from "../util/formatter";
import { EventJob } from "../definations/index";
import { cweClient } from "../util/cloudwatchClient"
import { CustomHttpError } from "./CustomHttpError";
import { v4 as uuid4 } from "uuid";
import { postMessage } from "../util/slackUtil"
import { LimtrayRedis } from '../Connectors/redisConnector';

// const slackEnabled = JSON.parse(process.env.SLACK_ENABLED);
export class CloudwatchService {
    private logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
    }

    async createCloudwatchEvent(job: EventJob): Promise<any> {
        const expression = getCronExpression(job.type, job.interval); // TODO: failed for 1 minute, need to check this
        const putRuleParam: PutRuleRequest = {
            Name: getJobName(job.name),
            Description: "cloudwatch event to trigger sqs",
            State: "ENABLED",
            ScheduleExpression: expression
        };
        this.logger.debug({ putRuleParam }, "rule params");
        try {
            const response = await cweClient.putRule(putRuleParam).promise();
            this.logger.debug(response.RuleArn);
            const arn = response.RuleArn;
            if (arn) {
                await this.createTarget(putRuleParam.Name, job);
            }
            await LimtrayRedis.lockJob(job.name);
            postMessage(`New \`job: ${putRuleParam.Name}\` created with arn \`${arn}\``, job);
            return { arn };
        } catch (error) {
            this.logger.error(error, { job })
            throw new CustomHttpError(500, error);
        }
    }

    private async createTarget(ruleName: string, job: EventJob) {
        const putTargetparam: PutTargetsRequest = {
            Rule: ruleName,
            Targets: [{
                Input: JSON.stringify(job),
                Id: uuid4(),
                Arn: formatterSQSARN(process.env.EVENT_QUEUE)
            }]
        }
        this.logger.debug({ putTargetparam }, "putTargetparam");
        await cweClient.putTargets(putTargetparam).promise();
    }

    async deleteEvent(jobName: string): Promise<void> {
        if (jobName.indexOf(getJobPrefix()) < 0) {
            // prefix not appended, lets append that
            jobName = getJobName(jobName);
        }
        const targets = await cweClient.listTargetsByRule({
            Rule: jobName
        }).promise();

        if (targets.Targets.length > 0) {
            this.logger.debug(targets.Targets);
            const targetIds = targets.Targets.map(x => x.Id); // Get list of ids
            const remResult = await cweClient.removeTargets({ Ids: targetIds, Rule: jobName }).promise(); // Remove target befor remoing rule
            this.logger.debug("Deleted target");
        }
        // Remove rule from cwe
        await cweClient.deleteRule({
            Name: jobName,
            Force: true
        }).promise();
        postMessage(`Deleted job: \`${jobName}\` From cloudwatch events`);
        this.logger.debug("Deleted rule");
    }

    async listEvents(limit?: number, nextToken?: string)/* : Promise<Array<any>>  */ {
        const param: ListRulesRequest = {
            NamePrefix: getJobPrefix()
        }
        if (limit !== null) {
            param.Limit = limit
        }
        if (nextToken !== null) {
            param.NextToken = nextToken
        }
        const events = await cweClient.listRules(param).promise();
        return events.Rules
    }

    async describeEvent(eventName: string): Promise<any> {
        if (eventName.indexOf(getJobPrefix()) < 0) {
            // prefix not appended, lets append that
            eventName = getJobName(eventName);
        }
        const event = await cweClient.listTargetsByRule({
            Rule: eventName
        }).promise();
        if (event.Targets.length > 0) {
            return event.Targets[0].Input;
        } else {
            throw new CustomHttpError(400, new Error("Invalid event name,no target found. Please check of any target is mapped to this event"));
        }
    }
}