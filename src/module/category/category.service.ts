import { BadGatewayException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import {  UpdateCategoryDto } from './dto/update-category.dto';
import { BrandRepository, CategoryDocument, CategoryRepository, UserDocument } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { Types } from 'mongoose';
import { lean } from 'src/DB/repository/database.repository';
import { FolderEnum, GetAllDTO } from 'src/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CategoryService {
  constructor(private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: CloudinaryService
  ) { }


  async create(createCategoryDto: CreateCategoryDto, file: Express.Multer.File, user: UserDocument): Promise<CategoryDocument> {
    const { name } = createCategoryDto;
    const checkDuplicated = await this.categoryRepository.findOne({ filter: { name, paranoId: false } });
    if (checkDuplicated) {
      throw new ConflictException(checkDuplicated.freezedAt ? "Duplicated with archived Category" : 'Duplicated Category name')
    }
    const brands: Types.ObjectId[] = [...new Set(createCategoryDto.brands || [])]

    if (brands && (await this.brandRepository.find({ filter: { _id: { $in: brands } } })).length != brands.length) {
      throw new NotFoundException("Some of mentioned brands are not exist");
    }
    let assetFolderId: string = randomUUID();
    const image: UploadApiResponse = await this.cloudinaryService.uploadFile(file, `${FolderEnum.Category}/${assetFolderId}`)
    const [category] = await this.categoryRepository.create({
      data: [{ ...createCategoryDto, image: { secure_url: image.secure_url, public_id: image.public_id }, assetFolderId, createdBy: user._id, brands: brands.map(brand => { return Types.ObjectId.createFromHexString(brand as unknown as string) }) }]
    })
    if (!category) {
      await this.cloudinaryService.deleteResources(image.public_id)
      throw new BadGatewayException("Fail to Create this Category Resource")
    }
    return category;
  }


  async update(categoryId: Types.ObjectId,
    updateCategoryDto: UpdateCategoryDto,
    user: UserDocument
  ): Promise<CategoryDocument | lean<CategoryDocument>> {
    if (updateCategoryDto.name && (await this.categoryRepository.findOne({
      filter: { name: updateCategoryDto.name },
    }))
    ) {
      throw new ConflictException("Duplicated Category Name")
    }
    const brands: Types.ObjectId[] = [...new Set(updateCategoryDto.brands || [])]

    if (brands && (await this.brandRepository.find({ filter: { _id: { $in: brands } } })).length != brands.length) {
      throw new NotFoundException("Some of mentioned brands are not exist");
    }
    const removeBrands = updateCategoryDto.brands ?? [];
    delete updateCategoryDto.removeBrands;
    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: [{
        $set: {
          ...updateCategoryDto,
          updatedBy: user._id,
          brands: {

            $setUnion: [
              {
                $setDifference: [
                  "$brand",
                  (removeBrands || []).map((brand) => {
                    return Types.ObjectId.createFromHexString(brand as unknown as string);
                  })
                ]
              },
              brands.map((brand) => {
                return Types.ObjectId.createFromHexString(brands as unknown as string)
              })
            ]
          }
        }
      }]

    })
    if (!category) {
      throw new NotFoundException("Fail to find matching Category instance")
    }
    return category;
  }

  async updateAttachment(categoryId: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument
  ): Promise<CategoryDocument | lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOne({
      filter: { _id: categoryId },
    })
    if (!category) {
      throw new NotFoundException("Fail to find matching Category instance")
    }
    const image = await this.cloudinaryService.uploadFile(file, `${FolderEnum.Category}/${category.assetFolderId

      }`)
    const updatedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        image,
        updatedBy: user._id
      },
    })
    if (!updatedCategory) {
      await this.cloudinaryService.deleteResources(image.public_id)
      throw new NotFoundException("Fail to find matching Category instance")
    }
    await this.cloudinaryService.deleteResources([category.image.public_id]);
    return updatedCategory;
  }
  async restore(categoryId: Types.ObjectId,
    user: UserDocument
  ): Promise<CategoryDocument | lean<CategoryDocument>> {

    const Category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId, paranoId: false, freezedAt: { $exists: true } },
      update: {
        restoredAt: new Date,
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!Category) {
      throw new NotFoundException("Fail to find matching Category instance")
    }
    return Category;
  }
  async freeze(categoryId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {

    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        freezedAt: new Date,
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!category) {
      throw new NotFoundException("Fail to find matching Category instance")
    }
    return "Done";
  }

  async remove(
    categoryId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {

    const Category = await this.categoryRepository.findOneAndDelete({
      filter: { _id: categoryId, paranoId: false, freezedAt: { $exists: true } }
    })
    if (!Category) {
      throw new NotFoundException("Fail to find matching Category instance")
    }
    await this.cloudinaryService.deleteResources([Category.image.public_id])
    return "Done";
  }
  async findAll(data: GetAllDTO, archive: boolean = false): Promise<{
    docsCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number | string;
    result: CategoryDocument[] | lean<CategoryDocument>[];
  }
  > {
    const { page, size, search } = data;
    const result = await this.categoryRepository.paginate({
      filter: {
        ...(search ? {
          $or: [
            { name: { $regex: search, options: 'i' } },
            { slug: { $regex: search, options: 'i' } },
            { description: { $regex: search, options: 'i' } },
          ]
        } : {}),
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {})
      }, page, size
    })
    return result;
  }
  async findOne(categoryId: Types.ObjectId, archive: boolean = false): Promise<CategoryDocument | lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOne({
      filter: {
        _id: categoryId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {})
      }
    })
    if (!category) {
      throw new NotFoundException('Fail to find matching Category instant')
    }
    return category;
  }


}
