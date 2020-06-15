import {Callback, Context, Handler} from "aws-lambda";
import {AWSError, SQS} from "aws-sdk";
import {SQService} from "../services/SQService";
import {PromiseResult} from "aws-sdk/lib/request";
import {SendMessageResult} from "aws-sdk/clients/sqs";
import {StreamService} from "../services/StreamService";
import {ITechRecordWrapper} from "../utils";

/**
 * λ function to process a DynamoDB stream of tech records into a queue for ministry plates generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const ministryPlateGenInit: Handler = async (event: any, context?: Context, callback?: Callback): Promise<void | Array<PromiseResult<SendMessageResult, AWSError>>> => {
    if (!event) {
        console.error("ERROR: event is not defined.");
        return;
    }

    // Convert the received event into a readable array of filtered tech records
    const expandedRecords: ITechRecordWrapper[] = StreamService.getTechRecordsStream(event);

    // Instantiate the Simple Queue Service
    const sqService: SQService = new SQService(new SQS());
    const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

    expandedRecords.forEach((record: any) => {
        sendMessagePromises.push(sqService.sendPlateGenMessage(JSON.stringify(record)));
    });

    return Promise.all(sendMessagePromises)
        .catch((error: AWSError) => {
            console.error(error);
            console.log("expanded records", expandedRecords);
            throw error;
        });
};

export {ministryPlateGenInit};
