import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { cartModel, CartRepository, CouponModel, CouponRepository, OrderModel, OrderRepository, ProductModel, ProductRepository } from 'src/DB';
import { AuthenticationModule } from '../auth/auth.module';
import { CartService } from '../cart/cart.service';
import { PaymentService } from 'src/common';
import { RealtimeGateway } from '../gateway/gateway';

@Module({
  imports:[AuthenticationModule,OrderModel,cartModel, ProductModel,CouponModel],
  controllers: [OrderController],
  providers: [RealtimeGateway,OrderService,ProductRepository,OrderRepository,CartRepository,CouponRepository,CartService,PaymentService],
})
export class OrderModule {}
