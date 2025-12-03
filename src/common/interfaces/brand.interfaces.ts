import { Types } from "mongoose";
import { OtpEnum } from "../enums";
import { IUser } from "./user.interfaces";


export interface IBrand {
    _id?: Types.ObjectId;

    name: string;
    slug: string
    slogan: string;
    image: {
        public_id: string;
        secure_url: string;
    };

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;
    createdAt: Date;
    updatedAt: Date;

    freezedAt?: Date;
    restoredAt?: Date;
}
