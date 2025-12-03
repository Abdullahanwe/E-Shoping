import { Types } from "mongoose";
import { GenderEnum, LanguageEnum, ProviderEnum, RoleEnum } from "../enums";
import { OtpDocument } from "src/DB";
import { IProduct } from "./product.interfaces";

export interface IUser {
    _id?: Types.ObjectId;
    firstName: string;
    lastName: string;
    username?: string;
    email: string;
    confirmEmail?: Date;
    password?: string;
    confirmEmailOtp?: string;

    role: RoleEnum;
    gender: GenderEnum;

    changeCredentialsTime?: Date
    otp?: OtpDocument[];
    provider: ProviderEnum;

    preferredLanguage: LanguageEnum;

    profilePicture?: string;

    createdAt: Date;
    updatedAt: Date;

    wishlist?: Types.ObjectId[] | IProduct[]
}
