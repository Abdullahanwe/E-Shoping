import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types, UpdateQuery } from "mongoose";
import slugify from "slugify";
import { IOrder, IOrderProduct, IProduct, OrderStatusEnum, PaymentEnum } from "src/common";

@Schema({ timestamps: true, strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class OrderProduct implements IOrderProduct {
    @Prop({ type: Types.ObjectId, ref: "Product", required: true })
    productId: Types.ObjectId | IProduct;
    @Prop({ type: Number, required: true })
    quantity: number;
    @Prop({ type: Number, required: true })
    unitPrice: number;
    @Prop({ type: Number, required: false })
    finalPrice: number;

    createdAt: Date;
    updatedAt: Date;
}





@Schema({ timestamps: true, strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Order implements IOrder {
    @Prop({ type: String, required: true, unique: true })
    orderId: string;
    @Prop({ type: String, required: true })
    address: string;
    @Prop({ type: String, required: true })
    phone: string;
    @Prop({ type: String })
    note?: string | undefined;
    @Prop({ type: String, required: false })
    cancelReason?: string | undefined;

    @Prop({ type: Types.ObjectId, ref: "Coupon" })
    coupon?: Types.ObjectId;
    @Prop({ type: Number, default: 0 })
    discount?: number;
    @Prop({ type: Number })
    subtotal: number;
    @Prop({ type: Number, required: true })
    total: number;

    @Prop({ type: Date })
    paidAt?: Date;
    @Prop({ type: String, enum: PaymentEnum, default: PaymentEnum.Cash })
    payment: PaymentEnum;
    @Prop({type:String})
    intentId?: string ;
    @Prop({
        type: String, enum: OrderStatusEnum, default: function (this: Order) {
            return this.payment == PaymentEnum.Card ? OrderStatusEnum.Pending : OrderStatusEnum.Placed
        }
    })
    status: OrderStatusEnum;
    @Prop({ type: String, required: false })
    paymentIntent?: string;

    @Prop([OrderProduct])
    products: OrderProduct[];



    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId
    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId
    createdAt: Date;
    updatedAt: Date;

    @Prop({ type: Date })
    freezedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;
}

export type OrderDocument = HydratedDocument<Order>
const OrderSchema = SchemaFactory.createForClass(Order)
OrderSchema.pre("save", async function (next) {
    if (this.isModified("total")) {
        const discount = this.discount ?? 0;
        this.subtotal = this.total - (this.total * discount)
    }
})

OrderSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 })


OrderSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
    const update = this.getUpdate() as UpdateQuery<OrderDocument>;

    if (update.name) {
        this.setUpdate({ ...update, slug: slugify(update.name) })
    }
    const query = this.getQuery();
    if (query.paranoId === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }
    next()
});
OrderSchema.pre(['findOne', 'find'], async function (next) {
    const query = this.getQuery();
    if (query.paranoId === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }
    next()
});



export const OrderModel = MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])