export interface ITechRecordWrapper {
    primaryVrm?: string;
    secondaryVrms?: string[];
    vin: string;
    systemNumber: string;
    partialVin?: string;
    trailerId?: string;
    techRecord: ITechRecord[];
}

export interface ITechRecord {
    createdAt: string;
    createdByName: string;
    createdById: string;
    lastUpdatedAt: string;
    lastUpdatedByName: string;
    lastUpdatedById: string;
    updateType: string;
    reasonForCreation: string;
    statusCode: string;
    vehicleType: string;
    plates: Plates[];
}

export interface Plates {
    plateSerialNumber: string;
    plateIssueDate: string;
    plateReasonForIssue: string;
    plateIssuer: string;
    toEmailAddress: string;
}
