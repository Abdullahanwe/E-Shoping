import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponDocument, CouponRepository, UserDocument } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { FolderEnum } from 'src/common';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) { }
  async create(createCouponDto: CreateCouponDto, file: Express.Multer.File, user: UserDocument):Promise<CouponDocument> {
    const checkDuplicated = await this.couponRepository.findOne({filter:{name:createCouponDto.name,paranoId:false}})
    if(checkDuplicated){
      throw new ConflictException('Duplicated Coupon Name')
    }
    const image = await this.cloudinaryService.uploadFile(file,FolderEnum.Coupon )
    const [coupon] = await this.couponRepository.create({
      data:[{
        ...createCouponDto,
        image: { secure_url: image.secure_url, public_id: image.public_id },
        createdBy:user._id
      }]
    })
    if(!coupon){
      await this.cloudinaryService.destroyFile(image.public_id)
      throw new BadRequestException('Fail to create this coupon instance')
    }

    return coupon;
  }

  findAll() {
    return `This action returns all coupon`;
  }

  findOne(id: number) {
    return `This action returns a #${id} coupon`;
  }

  update(id: number, updateCouponDto: UpdateCouponDto) {
    return `This action updates a #${id} coupon`;
  }

  remove(id: number) {
    return `This action removes a #${id} coupon`;
  }
}
