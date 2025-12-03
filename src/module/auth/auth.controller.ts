import { Body, Controller, HttpCode, HttpException, HttpStatus, ParseIntPipe, Patch, Post, Req, Res, ValidationPipe } from "@nestjs/common";
import { AuthenticationService } from "./auth.service";
import { ConfirmEmailDto, LoginBodyDto, ResendConfirmEmailDto, SignupBodyDto } from "./dto/auth.dto";
import { IResponse, LoginCredentialsResponse, successResponse } from "src/common";
import { LoginResponse } from "./entities/auth.entities";



@Controller('auth')
export class AuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) { }

    @Post('signup')
    async signup(
        @Body() body: SignupBodyDto): Promise<IResponse> {
        await this.authenticationService.signup(body);
        return successResponse();
    }

    @Post('resend-confirm-email')
    async resendConfirmEmail(
        @Body()
        body: ResendConfirmEmailDto,
    ): Promise<IResponse> {

        await this.authenticationService.resendConfirmEmail(body);
        return successResponse()


    }
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() body: LoginBodyDto): Promise<IResponse<LoginResponse>> {
        const credential = await this.authenticationService.login(body);

        return successResponse<LoginResponse>({ message: 'Done', data: { credential } })
    }
    @HttpCode(HttpStatus.OK)
    @Patch('confirm-email')
    async confirmEmail(@Body() body: ConfirmEmailDto): Promise<IResponse> {
        await this.authenticationService.confirmEmail(body);

        return successResponse()
    }
}
