
import { Injectable } from "@nestjs/common";
import { DatabaseRepository } from "./database.repository";
import { Cart , CartDocument as TDocument} from "../model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";



@Injectable()
export class CartRepository extends DatabaseRepository<TDocument>{
    constructor(@InjectModel(Cart.name) protected readonly model: Model<TDocument>){
        super(model)
    } 
}