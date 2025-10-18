import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  return category;
  }

  // Method for the seeder (optional for now)
  async createSeedData() {
    const categories = [
      { name: 'Tinto', description: 'Vinos tintos con cuerpo y estructura', type: 'product' },
      { name: 'Blanco', description: 'Vinos blancos frescos y aromáticos', type: 'product' },
      { name: 'Rosado', description: 'Vinos rosados ligeros y afrutados', type: 'product' },
      { name: 'Espumoso', description: 'Vinos espumosos y champagnes', type: 'product' },
      { name: 'Dulce', description: 'Vinos dulces y de postre', type: 'product' },
    ];

    for (const categoryData of categories) {
      const exists = await this.categoriesRepository.findOne({
        where: { name: categoryData.name }
      });
      
      if (!exists) {
        await this.categoriesRepository.save(categoryData);
      }
    }
  }
}
