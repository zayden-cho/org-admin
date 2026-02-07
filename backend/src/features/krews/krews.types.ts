export interface KrewRawData {
    corpId: string;
    krewId: string;
    corp: string;
    name: string;
    ldap: string;
    phoneNumber: string;
    isCheckoff: string;
    status: string;
    joinMonth: string;
    konacard: string;
    konacardAppRegistered: string;
    position: string;
    orgChart: string[];
}

export const KREW_HEADER_MAP: Record<string, keyof KrewRawData> = {
    "corpId": "corpId",
    "krewId": "krewId",
    "법인": "corp",
    "한글명": "name",
    "영문명": "ldap",
    "연락처": "phoneNumber",
    "체크오프 대상": "isCheckoff",
    "CMS 상태": "status",
    "가입월": "joinMonth",
    "코나카드": "konacard",
    "코나카드 앱등록여부": "konacardAppRegistered",
    "직책": "position",
    "조직도": "orgChart",
};