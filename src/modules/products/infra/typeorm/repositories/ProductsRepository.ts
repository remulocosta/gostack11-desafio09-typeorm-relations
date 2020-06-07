import { getRepository, Repository, In } from 'typeorm';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsId = products.map(product => product.id);

    const resultProducts = await this.ormRepository.find({
      where: {
        id: In(productsId),
      },
    });

    return resultProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsById = await this.findAllById(products);
    const productUpdated = productsById.map(productById => {
      const productFind = products.find(
        product => product.id === productById.id,
      );

      if (!productFind) {
        throw new AppError(`Product not found: ${productById.id}`);
      }

      if (productById.quantity < productFind.quantity) {
        throw new AppError('Product not enough quantity');
      }

      const newProduct = productById;

      newProduct.quantity -= productFind.quantity;

      return newProduct;
    });

    await this.ormRepository.save(productUpdated);

    return productUpdated;
  }
}

export default ProductsRepository;
