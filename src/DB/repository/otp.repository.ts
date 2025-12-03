// import { Injectable } from "@nestjs/common";
// import { DatabaseRepository } from "./database.repository";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { Otp , OtpDocument as TDocument} from "../model";

import { Injectable } from "@nestjs/common";
import { DatabaseRepository } from "./database.repository";
import { Otp , OtpDocument as TDocument} from "../model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";



// @Injectable()
// export class OtpRepository extends DatabaseRepository<Otp> {
//     constructor(@InjectModel(Otp.name) protected  readonly model: Model<TDocument>) {
//         super(model)
//     }
// }


@Injectable()
export class OtpRepository extends DatabaseRepository<TDocument>{
    constructor(@InjectModel(Otp.name) protected readonly model: Model<TDocument>){
        super(model)
    } 
}