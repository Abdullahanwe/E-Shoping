import { Types } from "mongoose";
import { OtpEnum } from "../enums";
import { IUser } from "./user.interfaces";
import { IBrand } from "./brand.interfaces";


export interface ICategory {
    _id?: Types.ObjectId;

    name: string;
    slug: string
    description: string;
    image: {
        public_id: string;
        secure_url: string;
    };
    assetFolderId:string;
    brands?: Types.ObjectId[] | IBrand[];
    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;
    createdAt: Date;
    updatedAt: Date;

    freezedAt?: Date;
    restoredAt?: Date;
}
