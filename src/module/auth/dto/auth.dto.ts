import { Allow, IsEmail, IsNotEmpty, IsString, isStrongPassword, IsStrongPassword, Length, Matches, ValidateIf } from "class-validator";
import { IsMatch } from "src/common";


export class ResendConfirmEmailDto {
    @IsEmail()
    email: string;
}

export class ConfirmEmailDto extends ResendConfirmEmailDto {
    @Matches(/^\d{6}$/)
    code: string
}

export class LoginBodyDto extends ResendConfirmEmailDto {
    @IsStrongPassword({ minUppercase: 1 })
    password: string;
}


export class SignupBodyDto {
    @Length(2, 52, { message: 'username min length is 2 char and max length is 52 char' })
    @IsString()
    @IsNotEmpty()
    username: string;
    @IsEmail()
    email: string;
    @IsStrongPassword()
    password: string
    @ValidateIf((data: SignupBodyDto) => {
        return Boolean(data.password)
    })
    // @Validate(MatchBetweenFields , {message:"confirm password not identical with password" })
    @IsMatch<string>(['password'])
    confirmPassword: string;

    @Matches(/\d{6}$/, { message: 'OTP must be exactly 6 digits' })
    otp: string
}


