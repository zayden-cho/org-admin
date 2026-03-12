export interface GoogleUser {
    email: string;
    name: string;
    picture: string;
    email_verified: boolean;
}

export interface AuthToken {
    token: string;
    user: {
        email: string;
        name: string;
        picture: string;
    };
}
