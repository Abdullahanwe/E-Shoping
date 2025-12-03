import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { BrandRepository, CategoryDocument, CategoryRepository, ProductDocument, ProductRepository, UserRepository, type UserDocument } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { FolderEnum, GetAllDTO } from 'src/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { UpdateProductAttachmentDto, UpdateProductDto } from './dto/update-product.dto';
import { lean } from 'src/DB/repository/database.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userRepository: UserRepository
  ) { }
  async create(createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    user: UserDocument): Promise<ProductDocument> {
    const { name, description, discountPercent, originalPrice, stock } = createProductDto
    const category = await this.categoryRepository.findOne({ filter: { _id: createProductDto.category } });
    if (!category) {
      throw new NotFoundException("Fail to find matching category instance")
    }
    const brand = await this.brandRepository.findOne({ filter: { _id: createProductDto.brand } });
    if (!brand) {
      throw new NotFoundException("Fail to find matching Brand instance")
    }

    let assetFolderId = randomUUID()
    const images = await this.cloudinaryService.uploadFiles(files, `${FolderEnum.Category}/${createProductDto.category}/${FolderEnum.Product}/${assetFolderId}`)
    const [product] = await this.productRepository.create({
      data: [{
        category: category._id,
        brand: brand._id,
        name,
        description,
        discountPercent,
        originalPrice,
        salePrice: originalPrice - originalPrice * ((discountPercent || 0) / 100),
        stock,
        assetFolderId,
        images,
        createdBy: user._id,

      }]
    })
    if (!product) {
      throw new BadRequestException('Fail to create this product instance')
    }

    return product;
  }

  async update(productId: Types.ObjectId, updateProductDto: UpdateProductDto, user: UserDocument): Promise<ProductDocument | lean<ProductDocument>> {
    const product = await this.productRepository.findOne({ filter: { _id: productId } })
    if (!product) {
      throw new NotFoundException("Fail to matching product instance")
    }
    if (updateProductDto.category) {
      const category = await this.categoryRepository.findOne({ filter: { _id: updateProductDto.category } });
      if (!category) {
        throw new NotFoundException("Fail to find matching category instance")
      }
      updateProductDto.category = category._id;
    }

    if (updateProductDto.brand) {
      const brand = await this.brandRepository.findOne({ filter: { _id: updateProductDto.brand } });
      if (!brand) {
        throw new NotFoundException("Fail to find matching Brand instance")
      }
      updateProductDto.brand = brand._id;
    }

    let salePrice = product.salePrice;
    if (updateProductDto.originalPrice || updateProductDto.discountPercent) {
      const mainPrice = updateProductDto.originalPrice ?? product.originalPrice;
      const discountPercent = updateProductDto.discountPercent ?? product.discountPercent;
      const finalPrice = mainPrice - (mainPrice * (discountPercent / 100));
      salePrice = finalPrice > 0 ? finalPrice : 1;
    }
    const updateProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        ...updateProductDto,
        salePrice,
        updatedBy: user._id
      }
    })

    if (!updateProduct) {
      throw new BadRequestException('Fail to update this product instance')
    }

    return updateProduct;
  }

  async updateAttachment(productId: Types.ObjectId,
    updateProductAttachmentDto: UpdateProductAttachmentDto,
    user: UserDocument,
    files: Express.Multer.File[]) {

    const product = await this.productRepository.findOne({ filter: { _id: productId }, options: { populate: [{ path: "category" }] } })
    if (!product) {
      throw new NotFoundException("Fail to matching product instance")
    }
    let attachments: { secure_url: string; public_id: string }[] = [];
    if (files?.length) {
      attachments = await this.cloudinaryService.uploadFiles(files, `${FolderEnum.Category}/${(product.category as unknown as CategoryDocument).assetFolderId}/${FolderEnum.Product}/${product.assetFolderId}`)
    }
    const removeAttachment = [...new Set(updateProductAttachmentDto.removeAttachment ?? [])]

    const updateProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: [
        {
          $set: {
            images: {
              $concatArrays: [
                {
                  $filter: {
                    input: "$images",
                    as: "img",
                    cond: { $not: { $in: ["$$img._id", removeAttachment] } }
                  }
                },
                attachments // array of new { secure_url, public_id }
              ]
            },
            updatedBy: user._id

          }
        }
      ],
      options: { new: true }
    })
    // const updateProduct = await this.productRepository.findOneAndUpdate({
    //   filter: { _id: productId },
    //   update: [
    //     {
    //       $set: {
    //         images: {
    //           $concatArrays: [
    //             {
    //               $filter: {
    //                 input: "$images",
    //                 as: "img",
    //                 cond: { $not: { $in: ["$$img.public_id", removeAttachment] } }
    //               }
    //             },
    //             attachments // array of new { secure_url, public_id }
    //           ]
    //         },
    //         updatedBy: user._id
    //       }
    //     }
    //   ],
    //   options: { new: true }
    // })
    console.log(updateProduct);


    if (!updateProduct) {
      for (const file of attachments) {
        await this.cloudinaryService.destroyFile(file.public_id);
      }
      throw new BadRequestException('Fail to update this product instance')
    }
    for (const file of removeAttachment) {
      await this.cloudinaryService.destroyFile(file);
    }
    return updateProduct;



  }

  async restore(productId: Types.ObjectId,
    user: UserDocument
  ): Promise<ProductDocument | lean<ProductDocument>> {

    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId, paranoId: false, freezedAt: { $exists: true } },
      update: {
        restoredAt: new Date,
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!product) {
      throw new NotFoundException("Fail to find matching product instance")
    }
    return product;
  }
  async freeze(productId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {

    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        freezedAt: new Date,
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false
      }
    })
    if (!product) {
      throw new NotFoundException("Fail to find matching product instance")
    }

    return "Done";
  }

  async remove(
    productId: Types.ObjectId,
    user: UserDocument
  ): Promise<string> {

    const product = await this.productRepository.findOneAndDelete({
      filter: { _id: productId, paranoId: false, freezedAt: { $exists: true } }
    })
    if (!product) {
      throw new NotFoundException("Fail to find matching product instance")
    }
    await this.cloudinaryService.deleteResources([product.images[0].public_id])
    return "Done";
  }
  async findAll(data: GetAllDTO, archive: boolean = false): Promise<{
    docsCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number | string;
    result: ProductDocument[] | lean<ProductDocument>[];
  }
  > {
    const { page, size, search } = data;
    const result = await this.productRepository.paginate({
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
  async findOne(productId: Types.ObjectId, archive: boolean = false): Promise<ProductDocument | lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {})
      }
    })
    if (!product) {
      throw new NotFoundException('Fail to find matching product instant')
    }
    return product;
  }
  async addToWishlist(productId: Types.ObjectId,user:UserDocument): Promise<ProductDocument | lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
      }
    })
    if (!product) {
      throw new NotFoundException('Fail to find matching product instant')
    }
    await this.userRepository.updateOne({
      filter:{_id:user._id},
      update:{
        $addToSet:{wishlist:product._id}
      }
    })
    return product;
  }
  async removeFromWishlist(productId: Types.ObjectId,user:UserDocument): Promise<string> {
  
    await this.userRepository.updateOne({
      filter:{_id:user._id},
      update:{
        $pull:{wishlist:Types.ObjectId.createFromHexString(productId as unknown as string)}
      }
    })
    return "Done";
  }


}









