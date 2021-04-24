# cron-events-service

## Implementaion

Production Queue Name: production-cron-cloudwatch-event
Test Queue Name: test-cron-cloudwatch-event

- Create a webserver with same api url's available in current cron service
- On create job api 
	- Create a new cloudwatch event using interval key
	- Select target as SQS `test-cron-cloudwatch-event`
	- Set message body as requested in the api which looks similar to this, just add a prefix to the name with environment_cron_job_ (This will help us filter cron jobs in cloudwatch events) 
	```
		{
	    "name": "couch_migration_script",
	    "type": "repeat",
	    "callbackUrl": "https://google.com",
	    "queue": "queue_url",
	    "topic": "topic_arn",
	    "payload": {
	        "status": "yes"
	    },
	    "interval": "120000",	    
	}
	```
- Create a consumer in the same service for queue `test-cron-cloudwatch-event`	
  - On message recieved, make an http call to callbackurl in the message with payload key
  - Only if the type key in the message set as single, then delete the `event` from  cloudwatch using name key
  - Delete message from the queue

Total cost of cloudwatch events is $1 per 1 million events

## Usage (Repeated Tasks)

Follow (https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions)[CronExpressions] for correct repeat expression

|Field | 	Values | 	Wildcards | 
|------|-----------|--------------| 
| Minutes | 0-59 | , - * / |
| Hours | 0-23 | , - * / |
| Day-of-month | 1-31 | , - * ? / L W |
| Month | 1-12 or JAN-DEC | , - * / |
| Day-of-week | 1-7 or SUN-SAT | , - * ? L # |
| Year | 1970-2199 | , - * / |

### Wildcards
 - The , (comma) wildcard includes additional values. In the Month field, JAN,FEB,MAR would include January, February, and March.

 - The - (dash) wildcard specifies ranges. In the Day field, 1-15 would include days 1 through 15 of the specified month.

 - The * (asterisk) wildcard includes all values in the field. In the Hours field, * would include every hour. You cannot use * in both the Day-of-month and Day-of-week fields. If you use it in one, you must use ? in the other.

 - The / (forward slash) wildcard specifies increments. In the Minutes field, you could enter 1/10 to specify every tenth minute, starting from the first minute of the hour (for example, the 11th, 21st, and 31st minute, and so on).

 - The ? (question mark) wildcard specifies one or another. In the Day-of-month field you could enter 7 and if you didn't care what day of the week the 7th was, you could enter ? in the Day-of-week field.

 - The L wildcard in the Day-of-month or Day-of-week fields specifies the last day of the month or week.

 - The W wildcard in the Day-of-month field specifies a weekday. In the Day-of-month field, 3W specifies the weekday closest to the third day of the month.

 - The # wildcard in the Day-of-week field specifies a certain instance of the specified day of the week within a month. For example, 3#2 would be the second Tuesday of the month: the 3 refers to Tuesday because it is the third day of each week, and the 2 refers to the second day of that type within the month.

### Restrictions
- You can't specify the Day-of-month and Day-of-week fields in the same cron expression. If you specify a value (or a *) in one of the fields, you must use a ? (question mark) in the other.

 - Cron expressions that lead to rates faster than 1 minute are not supported.

## Setup
 - Create SQS
 - Update policy to allow events to push message, sample policy given below
    SQS Policy for Test
    ```
    {
    "Version": "2012-10-17",
    "Id": "arn:aws:sqs:ap-southeast-1:445897275450:test-cron-cloudwatch-event/SQSDefaultPolicy",
    "Statement": [
        {
        "Sid": "AWSEvents_test_cronjob_test_job_4c7b918a-10eb-4f9b-b275-48bf6a3980b9",
        "Effect": "Allow",
        "Principal": {
            "Service": "events.amazonaws.com"
        },
        "Action": "sqs:SendMessage",
        "Resource": "arn:aws:sqs:ap-southeast-1:445897275450:test-cron-cloudwatch-event",
        "Condition": {
            "ArnLike": {
            "aws:SourceArn": "arn:aws:events:ap-southeast-1:445897275450:rule/test_cronjob*"
            }
        }
        }
    ]
    }
    ```


## Pending items
 - Integrate slack to know all http response for failed and successfull request
 - Slack notification whenever a new event is scheduled   


 ## Curl Requests

 ```
 curl -XPOST "localhost:8080/jobs/" -H "content-type:application/json" -d '{ "type": "single", "interval": "120000", "callbackUrl": "https://webhook.site/4e95a957-df67-4f23-af9b-46d6b52f5de5", "payload": { "status": 1 }, "name": "test_job" }'
```

```
curl -XPOST "localhost:8080/jobs/" -H "content-type:application/json" -d '{ "type": "repeat", "interval": "0/2 * * * ? *", "callbackUrl": "https://webhook.site/4e95a957-df67-4f23-af9b-46d6b52f5de5", "payload": { "status": 1 }, "name": "test_job" }'
```

```
curl -XGET "localhost:8080/jobs/"
```

```
curl -XGET "localhost:8080/job/test_job"
```

```
curl -XDELETE "localhost:8080/job/test_job"
```

