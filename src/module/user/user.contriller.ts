import { Controller, Get, Headers, MaxFileSizeValidator, ParseFilePipe, Patch, Req, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { Auth, type IMulterFile, RoleEnum, User, type IAuthRequest, IUser, IResponse, successResponse } from "src/common";
import type { UserDocument } from "src/DB";
import { PreferredLanguageInterceptor } from "src/common/interceptors";
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { cloudFileUpload, fileValidation, localFileUpload } from "src/common/utils/multer";
import { CloudinaryService } from "src/common/service/cloudinary.service";
import { ProfileResponse } from "./entities/user.entity";


@Controller('user')

export class UserController {
    constructor(private readonly userService: UserService) { }

    @Auth([RoleEnum.admin, RoleEnum.user, RoleEnum.superAdmin])
    @Get()
    async profile(
        @User() user: UserDocument
    ): Promise<IResponse<ProfileResponse>> {
        const profile = await this.userService.profile(user)
        return successResponse<ProfileResponse>({ data: { profile } })
    }

    // @SetMetadata("tokenType", TokenEnum.refresh)
    // @UseInterceptors(PreferredLanguageInterceptor)
    // @Auth([RoleEnum.admin, RoleEnum.user])
    // @Get('user')
    // profile(@Headers() header: any, @User() user: UserDocument): { message: string } {

    //     console.log(({
    //         lan: header['accept-language'],
    //         user
    //     }));

    //     return { message: "Done" }
    // }


    // @UseInterceptors(FileInterceptor('profileImage', cloudFileUpload({ validation: fileValidation.image })))
    // @Auth([RoleEnum.user])
    // @Patch('profile-image')
    // profileImage(@UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })] })) file: IMulterFile) {

    //     return { message: 'Done', file }
    // }


    @UseInterceptors(
        FileInterceptor(
            'profileImage',
            cloudFileUpload({ validation: fileValidation.image }),
        ),
    )
    @Auth([RoleEnum.user])
    @Patch('profile-image')
    async profileImage(
        @User() user: UserDocument,
        @UploadedFile(
            new ParseFilePipe({
                validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
            }),
        )
        file: Express.Multer.File
    ): Promise<IResponse<ProfileResponse>> {
        const profile = await this.userService.profileImage(file, user);
        return successResponse<ProfileResponse>({ data: { profile } })
    }



    @UseInterceptors(FilesInterceptor('coverImages', 2, localFileUpload({ folder: 'User', validation: fileValidation.image, fileSize: 2 })))
    @Auth([RoleEnum.user])
    @Patch('cover-image')
    coverImage(@UploadedFiles(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })] })) files: Array<IMulterFile>) {

        return { message: 'Done', files }
    }

    @UseInterceptors(FileFieldsInterceptor([{ name: 'profileImage', maxCount: 1 }, { name: 'coverImage', maxCount: 2 }], localFileUpload({ folder: 'User', validation: fileValidation.image, fileSize: 2 })))
    @Auth([RoleEnum.user])
    @Patch('image')
    Image(@UploadedFiles(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })] }))
    files: { profileImage: Array<IMulterFile>, coverImage: Array<IMulterFile> }) {

        return { message: 'Done', files }
    }

}