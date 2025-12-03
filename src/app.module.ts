import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './module/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { CategoryService } from './module/category/category.service';
import { CategoryController } from './module/category/category.controller';
import { CategoryModule } from './module/category/category.module';
import { ProductModule } from './module/product/product.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandModule } from './module/brand/brand.module';
import { CartModule } from './module/cart/cart.module';
import { CouponModule } from './module/coupon/coupon.module';
import { OrderModule } from './module/order/order.module';
import { RealtimeModule } from './module/gateway/gateway.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: resolve("./config/.env.development"),
    isGlobal: true
  }),
  CacheModule.register({
    ttl:5000,
  isGlobal: true,
}),
  MongooseModule.forRoot(process.env.DB_URI as string ,{serverSelectionTimeoutMS:30000})
  , AuthenticationModule, UserModule , CategoryModule, ProductModule, BrandModule,CartModule,CouponModule,OrderModule,RealtimeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
