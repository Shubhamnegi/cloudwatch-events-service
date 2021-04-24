
export const getJobPrefix = () => {
    return `${process.env.NODE_ENV}_cronjob_`;
}

export const getJobName = (jobName: string): string => {
    return getJobPrefix() + jobName;
}

export const getCronExpression = (type: string, interval: string): string => {
    // expect interval to be millisec if type is single
    // expect interval to be cron if type is repeaat
    // cron(0 20 * * ? *)" or "rate(5 minutes) for expression

    let expression: string;
    if (type.toLowerCase() === "single") {
        const min = Math.round(Number.parseInt(interval, 10) / 1000 / 60);
        expression = `rate(${min} minutes)`;
    } else {
        expression = `cron(${interval})`;
    }
    return expression;
}

export const formatterSQSARN = (queueName: string) => {
    return `arn:aws:sqs:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT}:${queueName}`
}

export const formattedPayload = (name: string, payload: any): string => {
    const message = {
        action: "CREATE",
        entity: 'cron-payload',
        payload: {
            name,
            payload
        }
    };
    return JSON.stringify(message);
}

export const getRedisKey = (name: string) => {
    return "CRON_EVENTS_SERVICE_JOB_" + name;
}