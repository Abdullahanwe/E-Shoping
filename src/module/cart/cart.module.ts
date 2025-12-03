import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { cartModel, CartRepository, ProductModel, ProductRepository } from 'src/DB';
import { AuthenticationModule } from '../auth/auth.module';

@Module({
  imports:[AuthenticationModule,ProductModel,cartModel],
  controllers: [CartController],
  providers: [CartService,CartRepository,ProductRepository],
})
export class CartModule {}
