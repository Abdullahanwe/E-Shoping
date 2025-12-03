import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RoleEnum } from "src/common/enums";
import { UserDocument } from "src/DB";
import { randomUUID } from "crypto"; // ✅ استخدم randomUUID بدل zod.uuid
import { sign, Secret, SignOptions } from "jsonwebtoken";

export enum SignatureLevelEnum {
    Bearer = 'Bearer',
    System = 'System',
}

@Injectable()
export class TokenSecurity {
    constructor(private readonly configService: ConfigService) { }

    private detectSignatureLevel(role: RoleEnum = RoleEnum.user): SignatureLevelEnum {
        switch (role) {
            case RoleEnum.admin:
                return SignatureLevelEnum.System;
            default:
                return SignatureLevelEnum.Bearer;
        }
    }

    private getSignatures(signatureLevel: SignatureLevelEnum): {
        access_signature: string;
        refresh_signature: string;
    } {
        if (signatureLevel === SignatureLevelEnum.System) {
            return {
                access_signature: this.configService.get<string>('ACCESS_SYSTEM_TOKEN_SIGNATURE') || "",
                refresh_signature: this.configService.get<string>('REFRESH_SYSTEM_TOKEN_SIGNATURE') || "",
            };
        }

        return {
            access_signature: this.configService.get<string>('ACCESS_USER_TOKEN_SIGNATURE') || "",
            refresh_signature: this.configService.get<string>('REFRESH_USER_TOKEN_SIGNATURE') || "",
        };
    }

    private async generateToken({
        payload,
        secret,
        options,
    }: {
        payload: object;
        secret: Secret;
        options?: SignOptions;
    }): Promise<string> {
        return sign(payload, secret, options);
    }

    async createLoginCredentials(user: any) {
        const signatureLevel = this.detectSignatureLevel((user as any).role);
        const { access_signature, refresh_signature } = this.getSignatures(signatureLevel);
        const jwtid = randomUUID();

        const access_token = await this.generateToken({
            payload: { sub: user._id },
            secret: access_signature,
            options: {
                expiresIn: Number(this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN')) || '15m' as any,
                jwtid,
               
            },
        });

        const refresh_token = await this.generateToken({
            payload: { sub: user._id },
            secret: refresh_signature,
            options: {
                expiresIn: Number(this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN')) || '7d' as any,
                jwtid,
            },
        });

        return { access_token, refresh_token };
    }
}
