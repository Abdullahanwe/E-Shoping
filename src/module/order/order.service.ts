import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartRepository, CouponRepository, OrderDocument, OrderProduct, OrderRepository, ProductDocument, ProductRepository, UserDocument } from 'src/DB';
import { CouponEnum, OrderStatusEnum, PaymentEnum, PaymentService } from 'src/common';
import { randomUUID } from 'crypto';
import { CartService } from '../cart/cart.service';
import { Types } from 'mongoose';
import Stripe from 'stripe';
import type { Request } from 'express';
import { RealtimeGateway } from '../gateway/gateway';

@Injectable()
export class OrderService {
  constructor(
    private readonly cartService: CartService,
    private readonly paymentService: PaymentService,
    private readonly orderRepository: OrderRepository,
    private readonly couponRepository: CouponRepository,
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) { }

  async webhook(req: Request): Promise<void> {
    const event = await this.paymentService.webhook(req)
    const { orderId } = event.data.object.metadata as { orderId: string };
    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: Types.ObjectId.createFromHexString(orderId),
        status: OrderStatusEnum.Pending,
        payment: PaymentEnum.Card
      },
      update: {
        paidAt: new Date(),
        status: OrderStatusEnum.Placed
      }
    })
    if (!order) {
      throw new NotFoundException("Fail to find matching order");
    }
    await this.paymentService.confirmPaymentIntent(order.intentId as string)

  }



  async create(createOrderDto: CreateOrderDto, user: UserDocument): Promise<OrderDocument> {
    const cart = await this.cartRepository.findOne({ filter: { createdBy: user._id } })
    if (!cart?.products?.length) {
      throw new NotFoundException("Cart is empty")
    }
    let discount = 0;
    let coupon: any;
    if (createOrderDto.coupon) {
      coupon = await this.couponRepository.findOne({
        filter: {
          _id: createOrderDto.coupon,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() }
        }
      })
      if (!coupon) {
        throw new NotFoundException("Fail to find matching coupon")
      }
      if (coupon.duration <= (coupon.usedBy?.filter(ele =>
        ele.toString() == user._id.toString()
      )?.length || 0)) {
        throw new ConflictException(`Sorry you have reached the limit for this coupon can be used only ${coupon.duration} times for each please try another valid coupon`)
      }
    }
    let total = 0;
    const products: OrderProduct[] = []
    for (const product of cart.products) {
      const cartProduct = await this.productRepository.findOne({
        filter: {
          _id: product.productId,
          stock: { $gte: product.quantity }
        }
      })
      if (!cartProduct) {
        throw new NotFoundException(`Fail to find matching product ${product.productId} or out of Stock`)
      }
      const finalPrice = cartProduct.salePrice * product.quantity;
      products.push({
        productId: cartProduct._id,
        unitPrice: cartProduct.salePrice,
        quantity: product.quantity,

      } as unknown as OrderProduct
      )
      total += finalPrice;
    }
    if (coupon?.discount) {
      discount = coupon.type == CouponEnum.Percent ? coupon.discount / 100 : coupon.discount / total;
    }
    delete createOrderDto.coupon;
    const [order] = await this.orderRepository.create({
      data: [{
        ...createOrderDto,
        coupon: coupon?._id,
        discount,
        orderId: randomUUID().slice(0, 8),
        products,
        total,
        createdBy: user._id,
      }]
    })
    if (!order) {
      throw new BadRequestException("fail to create this order")
    }
    if (coupon) {
      if (!coupon.usedBy) {
        coupon.usedBy = [];
      }
      coupon.usedBy.push(user._id);
      await coupon.save()
    }

    const stockProducts: { productId: Types.ObjectId, stock: number }[] = []
    for (const product of cart.products) {
      const updatedProduct = await this.productRepository.findOneAndUpdate({
        filter: {
          _id: product.productId,
          stock: { $gte: product.quantity }
        },
        update: {
          $inc: { __v: 1, stock: product.quantity }
        }
      })as ProductDocument;
      stockProducts.push({ productId: updatedProduct?._id, stock: updatedProduct?.stock })
    }
    this.realtimeGateway.changeProductSocket(stockProducts)
    // await this.cartService.remove(user)
    return order;
  }
  async cancel(orderId: Types.ObjectId, user: UserDocument): Promise<OrderDocument> {

    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: orderId,
        status: { $lt: OrderStatusEnum.Cancel }
      },
      update: {
        status: OrderStatusEnum.Cancel,
        updatedBy: user._id
      }
    })

    if (!order) {
      throw new NotFoundException("Fail to find matching order")
    }

    for (const product of order.products) {
      await this.productRepository.updateOne({
        filter: {
          _id: product.productId,
          stock: { $gte: product.quantity }
        },
        update: {
          $inc: { __v: 1, stock: product.quantity }
        }
      })
    }
    if (order.coupon) {
      await this.couponRepository.updateOne({
        filter: { _id: order.coupon },
        update: {
          $pull: { usedBy: order.createdBy }
        }
      })
    }

    if (order.payment == PaymentEnum.Card) {
      await this.paymentService.refund(order.intentId as string)
    }

    await this.cartService.remove(user)
    return order as OrderDocument;
  }

  async checkOut(orderId: Types.ObjectId, user: UserDocument) {
    const order = await this.orderRepository.findOne({
      filter: {
        _id: orderId,
        createdBy: user._id,
        payment: PaymentEnum.Card,
        status: OrderStatusEnum.Pending
      },
      options: {
        populate: [{ path: "products.productId", select: "name" }]
      }
    })
    if (!order) {
      throw new NotFoundException("fail to find matching order")
    }
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (order.discount) {
      const coupon = await this.paymentService.crateCoupon({
        duration: "once",
        currency: "egp",
        percent_off: parseFloat((order.discount * 100).toFixed(2))
      })
      discounts.push({ coupon: coupon.id })
    }
    const session = await this.paymentService.checkOutSession({
      customer_email: user.email,
      metadata: { orderId: orderId.toString() },
      discounts,
      // mode,
      line_items: order.products.map(product => {
        return {
          quantity: 5,
          price_data: {
            currency: 'egp',
            product_data: {
              name: (product.productId as ProductDocument).name
            },
            unit_amount: product.unitPrice * 100
          }
        }
      })
    })
    const method = await this.paymentService.createPaymentMethod({
      type: "card",
      card: {
        token: "tok_visa"
      }
    })
    const intent = await this.paymentService.createPaymentIntent({
      amount: order.subtotal * 100,
      currency: 'egp',
      payment_method: method.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    })
    order.intentId = intent.id
    await order.save()
    console.log({ method: intent });

    return session.url as string;
  }





  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
