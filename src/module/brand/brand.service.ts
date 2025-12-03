import { BadGatewayException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandDocument, BrandRepository, UserDocument } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import {  UpdateBrandDto } from './dto/update-brand.dto';
import { Types } from 'mongoose';
import { lean } from 'src/DB/repository/database.repository';
import { FolderEnum, GetAllDTO } from 'src/common';
// import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository,
    private readonly cloudinaryService: CloudinaryService
  ) { }


  async create(createBrandDto: CreateBrandDto, file: Express.Multer.File, user: UserDocument): Promise<BrandDocument> {
    const { name, slogan } = createBrandDto;
    const checkDuplicated = await this.brandRepository.findOne({ filter: { name, paranoId: false } });
    if (checkDuplicated) {
      throw new ConflictException(checkDuplicated.freezedAt ? "Duplicated with archived brand" : 'Duplicated brand name')
    }
    const image: UploadApiResponse = await this.cloudinaryService.uploadFile(file, `Brand`)
    const [brand] = await this.brandRepository.create({ data: [{ name, slogan, image: { secure_url: image.secure_url, public_id: image.public_id }, createdBy: user._id }] })
    if (!brand) {
      await this.cloudinaryService.deleteResources(image.public_id)
      throw new BadGatewayException("Fail to Create this Brand Resource")
    }
    return brand;
  }


  async update(brandId: Types.ObjectId,
    updateBrandDto: UpdateBrandDto,
    user: UserDocument
  ): Promise<BrandDocument | lean<BrandDocument>> {
    if (updateBrandDto.name && (await this.brandRepository.findOne({
      filter: { name: updateBrandDto.name },
    }))
    ) {
      throw new ConflictException("Duplicated brand Name")
    }
    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        ...updateBrandDto,
        updatedBy: user._id,
      }
    })
    if (!brand) {
      throw new NotFoundException("Fail to find matching brand instance")
    }
    return brand;
  }
  async updateAttachment(brandId: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument
  ): Promise<BrandDocument | lean<BrandDocument>> {
    const image = await this.cloudinaryService.uploadFile(file, FolderEnum.Brand)
    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        image,
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!brand) {
      await this.cloudinaryService.deleteResources([image.public_id])
      throw new NotFoundException("Fail to find matching brand instance")
    }
    await this.cloudinaryService.deleteResources([brand.image.public_id]);
    brand.image = image
    return brand;
  }
  async restore(brandId: Types.ObjectId,
    user: UserDocument
  ): Promise<BrandDocument | lean<BrandDocument>> {

    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId, paranoId: false, freezedAt: { $exists: true } },
      update: {
        restoredAt: new Date,
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!brand) {
      throw new NotFoundException("Fail to find matching brand instance")
    }
    return brand;
  }
  async freeze(brandId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {

    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        freezedAt: new Date,
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!brand) {
      throw new NotFoundException("Fail to find matching brand instance")
    }
    return "Done";
  }

  async remove(
    brandId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {

    const brand = await this.brandRepository.findOneAndDelete({
      filter: { _id: brandId, paranoId: false, freezedAt: { $exists: true } }
    })
    if (!brand) {
      throw new NotFoundException("Fail to find matching brand instance")
    }
    await this.cloudinaryService.deleteResources([brand.image.public_id])
    return "Done";
  }
  async findAll(data: GetAllDTO, archive: boolean = false): Promise<{
    docsCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number | string;
    result: BrandDocument[] | lean<BrandDocument>[];
  }
  > {
    const { page, size, search } = data;
    const result = await this.brandRepository.paginate({
      filter: {
        ...(search ? {
          $or: [
            { name: { $regex: search, options: 'i' } },
            { slug: { $regex: search, options: 'i' } },
            { slogan: { $regex: search, options: 'i' } },
          ]
        } : {}),
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {})
      }, page, size
    })
    return result;
  }
  async findOne(brandId: Types.ObjectId, archive: boolean = false): Promise<BrandDocument | lean<BrandDocument>> {
    const brand = await this.brandRepository.findOne({
      filter: {
        _id:brandId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {})
      }
    })
    if(!brand){
      throw new NotFoundException('Fail to find matching brand instant')
    }
    return brand;
  }





}
