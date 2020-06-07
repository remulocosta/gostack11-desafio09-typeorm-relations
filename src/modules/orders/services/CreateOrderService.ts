import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Customer from '@modules/customers/infra/typeorm/entities/Customer';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IProductItem {
  product_id: string;
  price: number;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const checkCustomerExists = await this.customersRepository.findById(
      customer_id,
    );

    if (!checkCustomerExists) {
      throw new AppError('Customer does not exists');
    }

    const productsId = products.map(product => {
      return { id: product.id };
    });

    const productsByIds = await this.productsRepository.findAllById(productsId);

    if (productsId.length !== productsByIds.length) {
      throw new AppError('Missing product');
    }

    const productsResult = productsByIds.map(productById => {
      const productResult = products.find(
        product => product.id === productById.id,
      );

      return {
        product_id: productById.id,
        price: productById.price,
        quantity: productResult?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer: checkCustomerExists,
      products: productsResult,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
