import {ministryPlateGenInit} from "../../src/functions/ministryPlateGenInit";
import mockContext from "aws-lambda-mock-context";
import {SQService} from "../../src/services/SQService";
import {StreamService} from "../../src/services/StreamService";
import {Utils} from "../../src/utils/Utils";


describe("ministryPlateGenInit Function", () => {
    const ctx = mockContext();
    afterAll(() => {
        jest.restoreAllMocks();
        jest.resetModuleRegistry();
    });

    describe("if the event is undefined", () => {
        it("should return undefined", async () => {

            expect.assertions(1);
            try {
                const result = await ministryPlateGenInit(undefined, ctx, () => {
                    return;
                });
                expect(result).toBe(undefined);
            } catch (e) {
                console.log(e);
            }
        });
    });

    describe("with good event", () => {
        it("should invoke SQS service with correct params", async () => {
            const sendPlateGenMessage = jest.fn();
            SQService.prototype.sendPlateGenMessage = sendPlateGenMessage;
            StreamService.getTechRecordsStream = jest.fn().mockReturnValue([{TechRecord: "techRecordStream"}]);
            Utils.getCurrentRecordWithPlates = jest.fn().mockReturnValue([{TechRecord: "currentRecordWithPlates"}]);

            try {
                await ministryPlateGenInit({}, ctx, () => {
                    return;
                });
            } catch (e) {
                console.log(e);
            }
            expect(sendPlateGenMessage).toHaveBeenCalledWith(JSON.stringify({TechRecord: "techRecordStream"}));
            expect(sendPlateGenMessage).toHaveBeenCalledTimes(1);
        });
    });

    describe("when SQService throws error", () => {
        it("should throw error", async () => {
            StreamService.getTechRecordsStream = jest.fn().mockReturnValue([{}]);
            const myError = new Error("It Broke!");
            SQService.prototype.sendPlateGenMessage = jest.fn().mockRejectedValue(myError);
            StreamService.getTechRecordsStream = jest.fn().mockReturnValue([{test: "thing"}]);
            Utils.getCurrentRecordWithPlates = jest.fn().mockReturnValue([{test: "thing"}]);


            expect.assertions(1);
            try {
                await ministryPlateGenInit({}, ctx, () => {
                    return;
                });
            } catch (e) {
                expect(e.message).toEqual(myError.message);
            }
        });
    });
});
