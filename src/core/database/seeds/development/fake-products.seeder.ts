import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { BaseSeeder } from '../base-seeder.abstract';
import { Product } from '@/features/products/entities/product.entity';
import { Category } from '@/features/categories/entities/category.entity';

@Injectable()
export class FakeProductsSeeder extends BaseSeeder {
  name = 'FakeProductsSeeder';

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {
    super();
  }

  async shouldRun(): Promise<boolean> {
    if (process.env.NODE_ENV !== 'development') {
      return false;
    }
    const productCount = await this.productsRepository.count();
    return productCount === 0;
  }

  async run(): Promise<void> {
    this.log('Starting fake products generation...');

    const categories = await this.categoriesRepository.find();


    if (categories.length === 0) {
      this.log('No categories found. Run categories seeder first.');
      return;
    }

    const wineNames = [
      'Reserva Especial', 'Gran Reserva', 'Cosecha Tardía', 'Edición Limitada',
      'Selección del Enólogo', 'Viña Antigua', 'Terroir Único', 'Cuvée Prestige'
    ];

    const grapeVarieties = [
      'Cabernet Sauvignon', 'Merlot', 'Malbec', 'Syrah', 
      'Chardonnay', 'Sauvignon Blanc', 'Pinot Noir', 'Tempranillo'
    ];

    const regions = [
      'Valle de Napa, California', 'Mendoza, Argentina', 'La Rioja, España',
      'Toscana, Italia', 'Borgoña, Francia', 'Valle Central, Chile'
    ];

     const productCount = faker.number.int({ min: 5, max: 10 });
      
     for (let i = 0; i < productCount; i++) {
      const category = faker.helpers.arrayElement(categories);
        
      const product = this.productsRepository.create({
        name: `${faker.helpers.arrayElement(wineNames)} ${faker.helpers.arrayElement(grapeVarieties)}`,
        description: faker.lorem.paragraph(),
        category_id: category.id,
        vintage_year: faker.number.int({ min: 2015, max: 2023 }),
        alcohol_content: faker.number.float({ min: 11.5, max: 15.5, fractionDigits: 1 }),
        grape_variety: faker.helpers.arrayElement(grapeVarieties),
        region: faker.helpers.arrayElement(regions),
        volume: 750,
        price: faker.number.float({ min: 15, max: 120, fractionDigits: 2 }),
        image_url: faker.image.urlLoremFlickr({ category: 'wine' }),
        images: Array.from({ length: 3 }, () => faker.image.urlLoremFlickr({ category: 'wine' })),
        tasting_notes: faker.lorem.sentences(2),
        food_pairing: [
          faker.helpers.arrayElement(['Carnes rojas', 'Quesos curados', 'Pasta']),
          faker.helpers.arrayElement(['Pescado', 'Mariscos', 'Ensaladas']),
        ],
        awards: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => 
          faker.helpers.arrayElement(['Medalla de Oro', '90+ Puntos', 'Mejor de Clase'])
        ),
        is_active: faker.datatype.boolean(0.8),
      });

      await this.productsRepository.save(product);
      this.log(`Created product: ${product.name}`);
    }

    this.log('Fake products generation completed!');
  }
}
