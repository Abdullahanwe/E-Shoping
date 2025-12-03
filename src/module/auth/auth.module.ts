import { Module } from "@nestjs/common";
import { AuthenticationService } from "./auth.service";
import { AuthenticationController } from "./auth.controller";
import { OtpModel, OtpRepository, TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "path";
import { SecurityService, TokenService } from "src/common/service";
import { TokenSecurity } from "src/common/utils/security/token.security";
import { AuthenticationGuard } from "src/common/guards/authentication/authentication.guard";



const jwt = process.env.JWT_SECRET as string;
console.log(jwt);


@Module({
    imports: [ConfigModule.forRoot({
        envFilePath: resolve("./config/.env.development"),
        isGlobal: true
    }), JwtModule.register({
        global: true,
        secret: process.env.JWT_SECRET as string,
        signOptions: { expiresIn: '60s' },
    }), UserModel,OtpModel,TokenModel
],
    providers: [AuthenticationGuard,AuthenticationService, UserRepository,OtpRepository , SecurityService,TokenSecurity ,TokenService,TokenRepository,JwtService] ,
    controllers: [AuthenticationController],
    exports: [UserRepository,TokenSecurity,TokenService,TokenRepository,JwtService , UserModel,TokenModel],
})
export class AuthenticationModule { }




