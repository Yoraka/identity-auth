export interface User {
    id: number;
    username: string;
    email: string;
    created_at: Date;
    updated_at: Date;
}
export interface AuthCredentials {
    username: string;
    password: string;
    faceFeatures?: Buffer;
}
export interface AuthResult {
    success: boolean;
    score: number;
    token?: string;
    message?: string;
    user?: Omit<User, 'password_hash' | 'face_features'>;
}
export interface RegisterDTO {
    username: string;
    email: string;
    password: string;
    faceFeatures?: Buffer;
}
export interface LoginDTO {
    username: string;
    password: string;
    faceFeatures?: Buffer;
}
export interface UpdateFaceFeaturesDTO {
    userId: number;
    faceFeatures: Buffer;
}
