
import { Injectable } from "@nestjs/common";
import { DatabaseRepository } from "./database.repository";
import { Coupon , CouponDocument as TDocument} from "../model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";



@Injectable()
export class CouponRepository extends DatabaseRepository<TDocument>{
    constructor(@InjectModel(Coupon.name) protected readonly model: Model<TDocument>){
        super(model)
    } 
}