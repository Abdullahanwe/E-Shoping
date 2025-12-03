import { Module } from "@nestjs/common";
import { RealtimeGateway } from "./gateway";
import { TokenService } from "src/common";
import { TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";



@Module({
    imports:[UserModel,TokenModel],
    providers:[RealtimeGateway,TokenService,UserRepository,TokenRepository]
})
export class RealtimeModule{

}