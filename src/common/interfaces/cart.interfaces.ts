import { Types } from "mongoose";
import { IUser } from "./user.interfaces";

export interface ICartProduct {

    _id?: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICart {
    _id?: Types.ObjectId;


    createdBy: Types.ObjectId | IUser;
    products: ICartProduct[];


    createdAt?: Date;
    updatedAt?: Date;

    freezedAt?: Date;
    restoredAt?: Date;
}
