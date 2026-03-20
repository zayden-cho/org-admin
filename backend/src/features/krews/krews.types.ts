export interface KrewRawData {
    corpId: string;
    krewunionId: string;
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
    chatRoomJoined: string;
}

export const KREW_HEADER_MAP: Record<string, keyof KrewRawData> = {
    "corpId": "corpId",
    "krewunionId": "krewunionId",
    "법인": "corp",
    "한글명": "name",
    "영문명": "ldap",
    "연락처": "phoneNumber",
    "체크오프 대상": "isCheckoff",
    "상태": "status",
    "가입월": "joinMonth",
    "조합원방 참여여부": "chatRoomJoined",
    "코나카드": "konacard",
    "코나카드 앱등록여부": "konacardAppRegistered",
    "직책": "position",
    "조직도": "orgChart"
};
