import {SQService} from "../../src/services/SQService";
import {SQMockClient} from "../models/SQMockClient";
import {StreamService} from "../../src/services/StreamService";
import {PromiseResult} from "aws-sdk/lib/request";
import {ReceiveMessageResult, SendMessageResult} from "aws-sdk/clients/sqs";
import {AWSError} from "aws-sdk";
import event from "../resources/stream-event.json";
import expandedRecord from "../resources/expanded-record.json";

describe("ministry-plate-gen-init", () => {
    let processedEvent: any;

    beforeEach(() => {
        processedEvent = StreamService.getTechRecordsStream(event);
    });

    afterEach(() => {
        processedEvent = null;
    });

    context("StreamService", () => {
        context("when fetching tech records stream and the eventName is MODIFY", () => {
            it("should result in an array of filtered js objects", () => {
                processedEvent = StreamService.getTechRecordsStream(event);
                expect(processedEvent).toEqual(expandedRecord);
            });
        });
    });

    context("SQService", () => {
        const sqService: SQService = new SQService(new SQMockClient() as any);
        context("when adding a record to the queue", () => {
            context("and the queue does not exist", () => {
                it("should fail to add the records to the ministryPlateGen queue", () => {
                    const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

                    processedEvent.forEach(async (record: any) => {
                        sendMessagePromises.push(sqService.sendPlateGenMessage(JSON.stringify(record)));
                    });

                    expect.assertions(2);
                    return Promise.all(sendMessagePromises)
                        .catch((error: AWSError) => {
                            expect(error).toBeInstanceOf(Error);
                            expect(error.message).toEqual("Queue ministry-plate-q was not found.");
                        });
                });

                it("should fail to read any records from the queue", () => {
                    expect.assertions(2);
                    return sqService.getMessages()
                        .catch((error: AWSError) => {
                            expect(error).toBeInstanceOf(Error);
                            expect(error.message).toEqual("Queue ministry-plate-q was not found.");
                        });
                });
            });

            context("and the queue does exist", () => {
                it("should successfully add the records to the ministryPlateGen queue", () => {
                    const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];
                    sqService.sqsClient.createQueue({
                        QueueName: "ministry-plate-q"
                    });

                    processedEvent.forEach(async (record: any) => {
                        sendMessagePromises.push(sqService.sendPlateGenMessage(JSON.stringify(record)));
                    });

                    expect.assertions(0);
                    return Promise.all(sendMessagePromises)
                        .catch((error: AWSError) => {
                            console.error(error);
                            expect(error).toBeFalsy();
                        });
                });

                it("should successfully read the added records from the queue", () => {
                    return sqService.getMessages()
                        .then((messages: ReceiveMessageResult) => {
                            const firstRecord = messages.Messages![0].Body![0];
                            const secondRecord = messages.Messages![0].Body![1];
                            expect(JSON.parse(firstRecord)).toEqual(processedEvent[0]);
                            expect(JSON.parse(secondRecord)).toEqual(processedEvent[1]);
                            sqService.sqsClient.deleteQueue({QueueUrl: "sqs://queue/ministry-plate-q"});
                        });
                });
            });
        });
    });
});
