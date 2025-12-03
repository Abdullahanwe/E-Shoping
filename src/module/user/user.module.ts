import { MiddlewareConsumer, Module } from "@nestjs/common";
import { UserController } from "./user.contriller";
import { UserService } from "./user.service";
import { PreAuthMiddleware, TokenService } from "src/common";
import { TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";
import { JwtService } from "@nestjs/jwt";
import { AuthenticationModule } from "../auth/auth.module";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Request } from "express";
import { randomUUID } from "crypto";
import { CloudinaryService } from "src/common/service/cloudinary.service";

@Module({
    imports: [AuthenticationModule, MulterModule.register({
        // storage: diskStorage({
        //     destination(req: Request, file: Express.Multer.File, callback: Function) {
        //         callback(null, './uploads')
        //     },
        //     filename(req: Request, file: Express.Multer.File, callback: Function){
        //         const fileName = randomUUID() + '_' + Date.now() + '_' + file.originalname;
        //         callback(null, fileName)
        //     }
        // })
    })],
    controllers: [UserController],
    providers: [UserService, TokenService,CloudinaryService],
    exports: [],

})

export class UserModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(PreAuthMiddleware)
            .forRoutes(UserController);
    }
}