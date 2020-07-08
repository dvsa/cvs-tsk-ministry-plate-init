import {cloneDeep} from "lodash";
import {Utils} from "../../src/utils/Utils";
import unmarshalledEvent from "../resources/unmarshalled-event.json";
import HTTPError from "../../src/models/HTTPError";
import {ERRORS} from "../../src/utils/Enums";
import {Plates} from "../../src/utils";

describe("Utils class", () => {

    let vehicle: any;

    beforeEach(() => {
        vehicle = cloneDeep(unmarshalledEvent[0]);
    });

    afterEach(() => {
        vehicle = null;
        jest.resetAllMocks();
    });

    describe("getLatestArchivedTechRecord", () => {

        it("should sort correctly the archived tech-records and return the latest archived", () => {
            const latestArchived = Utils.getLatestArchivedTechRecord(vehicle.techRecord);
            expect(latestArchived.createdAt).toEqual("2019-06-27T10:26:54.903Z");
            expect(latestArchived.lastUpdatedAt).toEqual("2020-06-18T13:33:21.151Z");
        });
    });

    describe("getCurrentTechRecord", () => {

        context("when trying to get the current tech-record", () => {
            context("and the vehicle has only one current record", () => {
                it("should return the current record", () => {
                    const currentRecord = Utils.getCurrentTechRecord(vehicle.techRecord);
                    expect(currentRecord).toBeDefined();
                    expect(currentRecord.statusCode).toEqual("current");
                });
            });

            context("and the vehicle has no current record", () => {
                it("should return Error 404 Not found", () => {
                    vehicle.techRecord[2].statusCode = "provisional";
                    try {
                        expect(Utils.getCurrentTechRecord(vehicle.techRecord)).toThrowError();
                    } catch (errorResponse) {
                        expect(errorResponse).toBeInstanceOf(HTTPError);
                        expect(errorResponse.statusCode).toEqual(404);
                        expect(errorResponse.body).toEqual(ERRORS.NO_CURRENT_RECORD_FOUND);
                    }
                });
            });

            context("and the vehicle has more than one current record", () => {
                it("should return Error 400 More than one current record found", () => {
                    vehicle.techRecord[1].statusCode = "current";
                    vehicle.techRecord[0].statusCode = "current";
                    try {
                        expect(Utils.getCurrentTechRecord(vehicle.techRecord)).toThrowError();
                    } catch (errorResponse) {
                        expect(errorResponse).toBeInstanceOf(HTTPError);
                        expect(errorResponse.statusCode).toEqual(400);
                        expect(errorResponse.body).toEqual(ERRORS.MORE_THAN_ONE_CURRENT);
                    }
                });
            });

            context("and the vehicle is a PSV", () => {
                it("should return Error 404 PSV not allowed", () => {
                    vehicle.techRecord[2].vehicleType = "psv";
                    try {
                        expect(Utils.getCurrentTechRecord(vehicle.techRecord)).toThrowError();
                    } catch (errorResponse) {
                        expect(errorResponse).toBeInstanceOf(HTTPError);
                        expect(errorResponse.statusCode).toEqual(400);
                        expect(errorResponse.body).toEqual(ERRORS.PSV_NOT_ALLOWED);
                    }
                });
            });
        });
    });

    describe("getNewPlates", () => {
        context("when the archived record had plates generated before", () => {
            it("should return only the newly added plates", () => {
                const currentRecord = Utils.getCurrentTechRecord(vehicle.techRecord);
                const latestArchived = Utils.getLatestArchivedTechRecord(vehicle.techRecord);

                const newlyAddedPlates = Utils.getNewPlates(currentRecord, latestArchived);
                expect(newlyAddedPlates.length).toEqual(2);
                expect(newlyAddedPlates[0].plateSerialNumber).toEqual("123445");
                expect(newlyAddedPlates[1].plateSerialNumber).toEqual("111222");
            });
        });

        context("when the archived record had no plates generated before", () => {
            it("should return only the newly added plates", () => {
                const currentRecord = Utils.getCurrentTechRecord(vehicle.techRecord);
                const latestArchived = Utils.getLatestArchivedTechRecord(vehicle.techRecord);
                delete latestArchived.plates;

                const newlyAddedPlates = Utils.getNewPlates(currentRecord, latestArchived);
                expect(newlyAddedPlates.length).toEqual(3);
                expect(newlyAddedPlates[0].plateSerialNumber).toEqual("123445");
                expect(newlyAddedPlates[1].plateSerialNumber).toEqual("555666");
                expect(newlyAddedPlates[2].plateSerialNumber).toEqual("111222");
            });
        });

        context("when there are no new plates added to the vehicle", () => {
            it("should return only the newly added plates", () => {
                const currentRecord = Utils.getCurrentTechRecord(vehicle.techRecord);
                const latestArchived = Utils.getLatestArchivedTechRecord(vehicle.techRecord);
                const oldPlate: Plates[] = [{
                    plateIssueDate: "2019-12-13",
                    plateReasonForIssue: "Free replacement",
                    plateSerialNumber: "123456",
                    plateIssuer: "Test",
                    toEmailAddress: "random@email.com"
                }];
                latestArchived.plates = oldPlate;
                currentRecord.plates = oldPlate;

                try {
                    expect(Utils.getNewPlates(currentRecord, latestArchived)).toThrowError();
                } catch (errorResponse) {
                    expect(errorResponse).toBeInstanceOf(HTTPError);
                    expect(errorResponse.statusCode).toEqual(400);
                    expect(errorResponse.body).toEqual(ERRORS.NO_NEW_PLATES);
                }
            });
        });
    });
});
