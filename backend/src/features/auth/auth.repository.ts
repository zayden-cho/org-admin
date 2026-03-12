export class AuthRepository {
    private allowedEmails: Set<string>;

    constructor() {
        this.allowedEmails = new Set([
            // 여기에 허용할 이메일 추가
        ]);

        console.log('🔍 ALLOWED_EMAILS 환경변수:', process.env.ALLOWED_EMAILS);

        const envEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || [];

        console.log('🔍 파싱된 이메일 목록:', envEmails);

        envEmails.forEach(email => this.allowedEmails.add(email));

        console.log('🔍 최종 허용 이메일:', Array.from(this.allowedEmails));
    }




    /**
     * 이메일이 허용된 목록에 있는지 확인
     */
    isEmailAllowed(email: string): boolean {
        const emailLower = email.toLowerCase();

        console.log('🔍 체크 중인 이메일:', emailLower);
        console.log('🔍 현재 허용 목록:', Array.from(this.allowedEmails));

        if (this.allowedEmails.has(emailLower)) {
            console.log('✅ 화이트리스트에서 허용됨');
            return true;
        }

        // 2. 도메인 체크
        // if (emailLower.endsWith('@*.com')) {
        //     console.log('도메인 체크로 허용됨');
        //     return true;
        // }

        console.log('허용되지 않은 이메일');
        return false;
    }

    /**
     * 화이트리스트에 이메일 추가
     */
    addEmail(email: string): void {
        this.allowedEmails.add(email.toLowerCase());
    }

    /**
     * 화이트리스트에서 이메일 제거
     */
    removeEmail(email: string): void {
        this.allowedEmails.delete(email.toLowerCase());
    }

    /**
     * 전체 허용 이메일 목록 조회
     */
    getAllowedEmails(): string[] {
        return Array.from(this.allowedEmails);
    }
}

export const authRepository = new AuthRepository();
