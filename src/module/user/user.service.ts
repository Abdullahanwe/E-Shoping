import { Injectable } from "@nestjs/common";
import { IUser } from "src/common";
import { CloudinaryService } from "src/common/service/cloudinary.service";
import { UserDocument, UserRepository } from "src/DB";
import { UploadApiResponse } from "cloudinary";


@Injectable()
export class UserService {
    constructor(private readonly cloudinaryService: CloudinaryService,
        private readonly userRepository: UserRepository) { }


    async profile(user: UserDocument): Promise<UserDocument> {
        const profile = await this.userRepository.findOne({
            filter: { _id: user._id },
            options: { populate: [{ path: "wishlist" }] }
        }) as UserDocument
        return profile;
    }
    async profileImage(file: Express.Multer.File, user: UserDocument): Promise<UserDocument> {
        const result: UploadApiResponse = await this.cloudinaryService.uploadFile(
            file,
            `user/${user._id.toString()}`,
        );

        user.profilePicture = result.secure_url
        await user.save();
        return user;
    }
}