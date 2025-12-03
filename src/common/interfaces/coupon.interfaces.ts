import { Types } from "mongoose";
import { CouponEnum, OtpEnum } from "../enums";
import { IUser } from "./user.interfaces";


export interface ICoupon {
    _id?: Types.ObjectId;

    name: string;
    slug: string
    image: {
        public_id: string;
        secure_url: string;
    };

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;
    userBy?:Types.ObjectId[]|IUser[];

    duration:number;
    discount:number;
    type:CouponEnum;
    startDate:Date;
    endDate:Date;

    createdAt: Date;
    updatedAt: Date;

    freezedAt?: Date;
    restoredAt?: Date;
}
