import { Types } from "mongoose";
import { OrderStatusEnum, OtpEnum, PaymentEnum } from "../enums";
import { IUser } from "./user.interfaces";
import { ICoupon } from "./coupon.interfaces";
import { IProduct } from "./product.interfaces";


export interface IOrderProduct {
    _id?: Types.ObjectId;
    productId: Types.ObjectId | IProduct;
    quantity: number;
    unitPrice: number;
    finalPrice:number;


    createdAt: Date;
    updatedAt: Date;


}
export interface IOrder {
    _id?: Types.ObjectId;
    orderId: string;

    address: string;
    phone: string;
    note?: string;
    cancelReason?: string;

    status: OrderStatusEnum
    payment: PaymentEnum;
    coupon?: Types.ObjectId | ICoupon;
    discount?: number;
    total: number;
    subtotal: number;

    paidAt?: Date;
    paymentIntent?: string;
    intentId?:string;
    products: IOrderProduct[];
    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt: Date;
    updatedAt: Date;

    freezedAt?: Date;
    restoredAt?: Date;
}
