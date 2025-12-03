import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, BrandRepository, CategoryModel, CategoryRepository } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { AuthenticationModule } from '../auth/auth.module';

@Module({
  imports:[AuthenticationModule,CategoryModel,BrandModel ],
  controllers: [CategoryController],
  providers: [CategoryService , BrandRepository , CategoryRepository , CloudinaryService],
})
export class CategoryModule {}
