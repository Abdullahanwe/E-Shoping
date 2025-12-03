import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { BrandModel, BrandRepository, CategoryModel, CategoryRepository, ProductModel, ProductRepository } from 'src/DB';
import { CloudinaryService } from 'src/common/service/cloudinary.service';
import { AuthenticationModule } from '../auth/auth.module';

@Module({
  imports:[AuthenticationModule,CategoryModel, ProductModel, BrandModel],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, BrandRepository, CategoryRepository, CloudinaryService],
})
export class ProductModule { }
