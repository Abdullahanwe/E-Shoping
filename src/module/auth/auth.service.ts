import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { compareHash, createNumericalOtp, emailEvent, IUser, LoginCredentialsResponse, OtpEnum, ProviderEnum } from "src/common";
import { OtpRepository, UserDocument, UserRepository } from "src/DB";
import { ConfirmEmailDto, LoginBodyDto, ResendConfirmEmailDto, SignupBodyDto } from "./dto/auth.dto";
import { Types } from "mongoose";
import { SecurityService } from "src/common/service";
import { TokenSecurity } from "src/common/utils/security/token.security";


@Injectable()
export class AuthenticationService {
    private users: IUser[] = []
    constructor(private readonly userRepository: UserRepository,
        private readonly otpRepository: OtpRepository,
        private readonly securityService: SecurityService,
        private readonly tokenSecurity: TokenSecurity) { }

    private async createConfirmEmailOtp(userId: Types.ObjectId) {
        await this.otpRepository.create({
            data: [
                {
                    code: createNumericalOtp() as string,
                    expiredAt: new Date(Date.now() + 2 * 60 * 100),
                    createdBy: userId,
                    type: OtpEnum.ConfirmEmail,
                }
            ]
        })

    }

    async signup(data: SignupBodyDto): Promise<string> {
        const { email, password, username } = data
        const checkUserExist = await this.userRepository.findOne({ filter: { email } })
        if (checkUserExist) {
            throw new ConflictException("Email already Exist")
        }
        const [user] = await this.userRepository.create({ data: [{ username, email, password }] })
        if (!user) {
            throw new BadRequestException("fail to signup this account ")
        }
        await this.createConfirmEmailOtp(user._id)
        return 'Done';
    }
    async resendConfirmEmail(data: ResendConfirmEmailDto): Promise<string> {
        const { email } = data
        const user = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false } },
            options: {
                populate: [{ path: 'otp', match: { type: OtpEnum.ConfirmEmail } }]
            }
        })
        console.log({ user });
        if (!user) {
            throw new NotFoundException('Fail to find matching account')
        }
        if (user.otp?.length) {
            throw new ConflictException(`Sorry we can not grant you new OTP until the Existing one become expired please try again after:${user.otp[0].expiredAt}`)
        }

        await this.createConfirmEmailOtp(user._id)

        return 'Done';
    }


    confirmEmail = async (data: ConfirmEmailDto): Promise<{ message: string }> => {
        const { email, code }: ConfirmEmailDto = data;
        const user = await this.userRepository.findOne({
            filter: { email, confirmEmail: { $exists: false } },
            options: {
                populate: [{ path: 'otp', match: { type: OtpEnum.ConfirmEmail } }]
            },
        })


        if (!user) {
            throw new NotFoundException("Invalid account")
        }


        if (!(user.otp?.length &&
            await this.securityService.compareHash(code, user.otp[0].code))) {

            throw new BadRequestException('invalid otp')
        }

        user.confirmEmail = new Date();
        await user.save();
        await this.otpRepository.deleteOne({ filter: { _id: user.otp[0]._id } })
        return { message: 'Don' }
    }

    async login(data: LoginBodyDto): Promise<LoginCredentialsResponse> {
        const { email, password } = data
        const user = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: ProviderEnum.system
            }
        })
        console.log(user);

        if (!user) {
            throw new NotFoundException("Fail to find matching account")
        }
        if (!await this.securityService.compareHash(password, user.password)) {
            throw new NotFoundException("Fail to find matching account");
        }
        return await this.tokenSecurity.createLoginCredentials(user as UserDocument);
    }

}