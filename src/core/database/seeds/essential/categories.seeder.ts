import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseSeeder } from '../base-seeder.abstract';
import { Category } from '@/features/categories/entities/category.entity';

@Injectable()
export class CategoriesSeeder extends BaseSeeder {
  name = 'CategoriesSeeder';

  constructor(
    @InjectRepository(Category)
    private categoriesRepo: Repository<Category>,
  ) {
    super();
  }

  async shouldRun(): Promise<boolean> {
    const count = await this.categoriesRepo.count();
    return count === 0;
  }

  async run(): Promise<void> {
    const categories = [
      { name: 'Tinto', description: 'Vinos tintos con cuerpo y estructura', type: 'product' },
      { name: 'Blanco', description: 'Vinos blancos frescos y aromáticos', type: 'product' },
      { name: 'Rosado', description: 'Vinos rosados ligeros y afrutados', type: 'product' },
      { name: 'Espumoso', description: 'Vinos espumosos y champagnes', type: 'product' },
      { name: 'Dulce', description: 'Vinos dulces y de postre', type: 'product' },
    ];

    for (const categoryData of categories) {
      const exists = await this.categoriesRepo.findOne({ where: { name: categoryData.name } });
      if (!exists) {
        await this.categoriesRepo.save(categoryData);
        this.log(`Created: ${categoryData.name}`);
      }
    }
  }
}
