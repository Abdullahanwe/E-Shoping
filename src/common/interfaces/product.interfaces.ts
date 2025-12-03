import { Types } from "mongoose";
import { OtpEnum } from "../enums";
import { IUser } from "./user.interfaces";
import { ICategory } from "./category.interfaces";
import { IBrand } from "./brand.interfaces";

export interface Image {
    public_id: string;
    secure_url: string;
}
export interface IProduct {
    _id?: Types.ObjectId;

    name: string;
    slug: string
    description?: string;
    images: Image[];

    originalPrice: number;
    discountPercent: number;
    salePrice: number;
    assetFolderId:string;
    stock: number;
    soldItems: number;

    category: Types.ObjectId | ICategory;
    brand: Types.ObjectId | IBrand;

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt: Date;
    updatedAt: Date;

    freezedAt?: Date;
    restoredAt?: Date;
}
