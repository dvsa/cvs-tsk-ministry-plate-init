import HTTPError from "../models/HTTPError";
import {ERRORS, VEHICLE_TYPE} from "./Enums";
import {ITechRecord, ITechRecordWrapper, Plates} from "./index";

/**
 * Utils functions
 */
export class Utils {

    /**
     * Filter records to be sent to SQS
     * @param records
     */
    public static getCurrentRecordWithPlates(record: ITechRecordWrapper): ITechRecord {
        const latestArchivedTechRecord: ITechRecord = this.getLatestArchivedTechRecord(record.techRecord);
        this.debugOnlyLog("LATEST ARCHIVED", JSON.stringify(latestArchivedTechRecord));
        const currentTechRecord: ITechRecord = this.getCurrentTechRecord(record.techRecord);
        this.debugOnlyLog("CURRENT ", JSON.stringify(currentTechRecord));
        currentTechRecord.plates = this.getNewPlates(currentTechRecord, latestArchivedTechRecord);
        this.debugOnlyLog("PLATES", currentTechRecord.plates);
        return currentTechRecord;
    }

    /**
     * function that returns the latest archived tech-record
     * @param techRecords
     */
    public static getLatestArchivedTechRecord(techRecords: ITechRecord[]): ITechRecord {
        const archivedRecords = techRecords
            .filter((techRecord: any) => techRecord.statusCode === "archived")
            .sort((a, b) => {
                return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();
            });
        return archivedRecords[0];
    }

    /**
     * function that returns the current tech-record
     * @param techRecords
     */
    public static getCurrentTechRecord(techRecords: ITechRecord[]): ITechRecord {
        const currentRecords = techRecords.filter((techRecord: ITechRecord) => techRecord.statusCode === "current");
        if (currentRecords.length === 0) {
            throw new HTTPError(404, ERRORS.NO_CURRENT_RECORD_FOUND);
        }
        if (currentRecords.length > 1) {
            throw new HTTPError(400, ERRORS.MORE_THAN_ONE_CURRENT);
        }
        if (currentRecords[0].vehicleType === VEHICLE_TYPE.PSV) {
            throw new HTTPError(400, ERRORS.PSV_NOT_ALLOWED);
        }
        return currentRecords[0];
    }

    /**
     * function that returns the plates for which PDFs should be generated
     * @param currentRecord
     * @param archivedRecord
     */
    public static getNewPlates(currentRecord: ITechRecord, archivedRecord: ITechRecord): Plates[] {
        const oldPlateIds: string[] = archivedRecord.plates ? archivedRecord.plates.map((oldPlate: Plates) => oldPlate.plateSerialNumber) : [];
        this.debugOnlyLog("old plates", oldPlateIds);
        const newPlates: Plates[] = currentRecord.plates ? currentRecord.plates.filter((newPlate: Plates) => oldPlateIds.indexOf(newPlate.plateSerialNumber) === -1) : [];
        this.debugOnlyLog("new plates", newPlates);
        if (!newPlates.length) {
            throw new HTTPError(400, ERRORS.NO_NEW_PLATES);
        }
        return newPlates;
    }

    /**
     * Function for logging only when env variable DEBUG=TRUE
     * @param args - arguments to be logged
     */
    public static debugOnlyLog(...args: any) {
        if (process.env.DEBUG === "TRUE") {
            console.log(...args);
        }
    }
}
