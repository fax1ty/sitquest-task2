import { model, Schema } from 'mongoose';

export enum UserOnlineStatus {
    Unknown = 0,
    Online = 1,
    Offline = 2
}

export enum UserRole {
    Unknow = 0,
    User = 1,
    Admin = 2
}

interface IUser {
    email: string;
    password: string;
    token: string;
    name: string;
    lastSeen: number;
    status: UserOnlineStatus;
    role: UserRole;
}

export const User = model<IUser>('User',
    new Schema({
        email: String,
        password: String,
        token: String,
        name: String,
        lastSeen: Number,
        status: Number,
        role: Number
    })
);