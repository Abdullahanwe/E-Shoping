import { UserDocument } from "src/DB";
import { JwtPayload } from 'jsonwebtoken'
import type { Request } from "express";
import { TokenEnum } from "../enums";
import { Types } from "mongoose";
import { IUser } from "./user.interfaces";


export interface IToken {
    _id?: Types.ObjectId;
    jti: string;
    expiredAt: Date
    createdBy: Types.ObjectId | IUser
    createdAt: Date;
    updatedAt: Date;

}

export interface ICredentials {
    user: UserDocument;
    decoded: JwtPayload;

}
export interface IAuthRequest extends Request {
    credentials: ICredentials;
    tokenType: TokenEnum
}