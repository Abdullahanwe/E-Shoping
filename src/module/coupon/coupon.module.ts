import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { AuthenticationModule } from '../auth/auth.module';
import { CouponModel, CouponRepository } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';

@Module({
  imports:[AuthenticationModule, CouponModel],
  controllers: [CouponController],
  providers: [CouponService,CouponRepository,CloudinaryService],
})
export class CouponModule {}
