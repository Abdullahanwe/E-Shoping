
import { Injectable } from "@nestjs/common";
import { DatabaseRepository } from "./database.repository";
import { Order , OrderDocument as TDocument} from "../model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";



@Injectable()
export class OrderRepository extends DatabaseRepository<TDocument>{
    constructor(@InjectModel(Order.name) protected readonly model: Model<TDocument>){
        super(model)
    } 
}