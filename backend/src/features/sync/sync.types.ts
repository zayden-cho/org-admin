export interface KonacardData {
    cardNumber: string;
    appRegistered: string;
}

export interface SourceRow {
    sourceId: string | number;
    corp: string;
    name: string;
    ldap: string;
    phoneNumber: string;
    checkoffStatus: string;
    cmsStatus: string;
}

export interface SheetItem {
    corpString: string;
    rows: SourceRow[];
}
