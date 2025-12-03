import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { GenderEnum, generateHash, IProduct, IUser, LanguageEnum, ProviderEnum, RoleEnum } from "src/common";
import { OtpDocument } from "./otp.model";

@Schema({ strictQuery: true, timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } })
export class User implements IUser {
    @Prop({ type: String, required: true, minLength: 2, maxLength: 52, trim: true })
    firstName: string
    @Prop({ type: String, required: true, minLength: 2, maxLength: 52, trim: true })
    lastName: string
    @Virtual({
        get: function (this: User) {
            return this.firstName + " " + this.lastName
        },
        set: function (value: string) {
            const [firstName, lastName] = value.split(' ') || [];
            this.set({ firstName, lastName })
        },
    })
    username: string;

    @Prop({ type: String, required: true, unique: true })
    email: string;

    @Prop({ type: Date, required: false })
    confirmEmail: Date;
    @Prop({ type: String })
    confirmEmailOtp?: string;
    @Prop({
        type: String, required: function (this: User) {
            return this.provider === ProviderEnum.google ? false : true
        }
    })
    password: string;

    @Prop({ type: String, enum: ProviderEnum, default: ProviderEnum.system })
    provider: ProviderEnum;
    @Prop({ type: String, enum: GenderEnum, default: GenderEnum.male })
    gender: GenderEnum;
    @Prop({ type: String, enum: RoleEnum, default: RoleEnum.user })
    role: RoleEnum;
    @Prop({ type: String, enum: LanguageEnum, default: LanguageEnum.EN })
    preferredLanguage: LanguageEnum;
    @Prop({ type: String })
    profilePicture: string;
    @Prop({ type: Date, required: false })
    changeCredentialsTime: Date


    @Virtual()
    otp: OtpDocument[];


    createdAt: Date;
    updatedAt: Date;
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
    wishlist?: Types.ObjectId[];

}


const userSchema = SchemaFactory.createForClass(User);
userSchema.virtual("otp", {
    localField: "_id",
    foreignField: "createdBy",
    ref: 'Otp'
})

userSchema.pre('save', async function (this: UserDocument & { waNew: boolean, confirmEmailPlainOtp: string }, next) {
    if (this.isModified("password")) {
        this.password = await generateHash(this.password);
    }
    if (this.isModified("confirmEmailOtp")) {
        this.confirmEmailPlainOtp = this.confirmEmailOtp as string
        this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
    }
    next()
})



export type UserDocument = HydratedDocument<User>;
export const UserModel = MongooseModule.forFeature([{ name: User.name, schema: userSchema }]) 

export const connectedSocket = new Map<string,string[]>()