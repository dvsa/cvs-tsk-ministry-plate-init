import {DynamoDBRecord} from "aws-lambda";
import {DynamoDB} from "aws-sdk";
import {cloneDeep} from "lodash";
import {Utils} from "../utils/Utils";
import {ITechRecordWrapper, Plates} from "../utils";

/**
 * Service class for interpreting and formatting
 * incoming DynamoDB streams
 */
class StreamService {

    /**
     * Extract MODIFY events from the DynamoDB Stream, convert them
     * to a JS object and expand the tech records into multiple ones for each plate
     * Example:
     * Convert
     * tech-record
     *  ├── new-plate-1
     *  ├── new-plate-2
     *  into
     *  tech-record
     *  └── new-plate-1
     *  tech-record
     *  └── new-plate-2
     * @param event
     */
    public static getTechRecordsStream(event: any) {
        // Create from a tech record with multiple plates, multiple tech records with one plate each
        const records: any[] = event.Records
            .filter((record: DynamoDBRecord) => { // Retrieve "MODIFY" events
                return record.eventName === "MODIFY";
            })
            .map((record: DynamoDBRecord) => { // Convert to JS object
                if (record.dynamodb && record.dynamodb.NewImage) {
                    return DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
                }
            });
        Utils.debugOnlyLog("UNMARSHALLED EVENTS", JSON.stringify(records));
        return StreamService.expandRecords(records);
    }

    /**
     * Helper method for expanding a single record with multiple plates
     * into multiple records with a single plate
     * @param records
     */
    private static expandRecords(records: ITechRecordWrapper[]): ITechRecordWrapper[] {
        return records
            .map((record: ITechRecordWrapper) => { // Separate each plate in a record to form multiple records
                record.techRecord = Array.of(Utils.getCurrentRecordWithPlates(record));
                const splittedRecords: ITechRecordWrapper[] = [];

                record.techRecord[0].plates.forEach((plate: Plates) => {
                    const clonedRecord: any = cloneDeep(record); // Create record from template
                    clonedRecord.techRecord[0].plates = plate;
                    splittedRecords.push(clonedRecord);
                });
                return splittedRecords;
            })
            .reduce((acc: any[], val: any) => acc.concat(val), []); // Flatten the array
    }
}

export {StreamService};
