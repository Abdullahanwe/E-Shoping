import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUD_NAME'),
            api_key: this.configService.get('API_KEY'),
            api_secret: this.configService.get('API_SECRET'),
            secure: true,
        });
    }
    async uploadFile(file: Express.Multer.File, path = 'general'): Promise<UploadApiResponse> {
        if (!file?.buffer) throw new Error('File buffer is missing');

        return new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: `${this.configService.get('APPLICATION_NAME')}/user/${path}`,
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        if (!result) return reject(new Error('No result returned from Cloudinary'));
                        resolve(result);
                    },
                )
                .end(file.buffer);
        });
    }


    async destroyFile(public_id: string): Promise<any> {
        if (!public_id) throw new Error('public_id is required');
        return cloudinary.uploader.destroy(public_id);
    }

    async uploadFiles(
        files: Express.Multer.File[],
        path = 'general',
    ): Promise<{ secure_url: string; public_id: string }[]> {
        const attachments: { secure_url: string; public_id: string }[] = [];
        for (const file of files) {
            const result = await this.uploadFile(file, path);
            attachments.push({
                secure_url: result.secure_url,
                public_id: result.public_id,
            });
        }
        return attachments;
    }



    async deleteResources(
        public_ids: string | string[],
        options = { type: 'upload', resource_type: 'image' },
    ): Promise<any> {
        const ids = Array.isArray(public_ids) ? public_ids : [public_ids];
        return cloudinary.api.delete_resources(ids, options);
    }


    async deleteFolderByPrefix(prefix: string): Promise<any> {
        if (!prefix) throw new Error('prefix is required');
        return cloudinary.api.delete_resources_by_prefix(
            `${this.configService.get('APPLICATION_NAME')}/${prefix}`,
        );
    }
}
