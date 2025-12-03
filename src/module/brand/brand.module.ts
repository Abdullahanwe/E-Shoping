import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandModel, BrandRepository } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { AuthenticationModule } from '../auth/auth.module';

@Module({
  imports:[AuthenticationModule,BrandModel],
  controllers: [BrandController],
  providers: [BrandService,BrandRepository,CloudinaryService ],
  exports:[BrandRepository]
})
export class BrandModule {}
