import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInventoryTable1760908098982 implements MigrationInterface {
  name = 'CreateInventoryTable1760908098982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inventory',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isUnique: true, // One-to-one relationship
          },
          {
            name: 'current_stock',
            type: 'integer',
            default: 0,
          },
          {
            name: 'reserved_stock',
            type: 'integer',
            default: 0,
          },
          {
            name: 'minimum_stock',
            type: 'integer',
            default: 10,
          },
          {
            name: 'maximum_stock',
            type: 'integer',
            default: 1000,
          },
          {
            name: 'last_updated',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '100',
          },
        ],
      }),
      true,
    );

    // Foreign Key to products
    await queryRunner.createForeignKey(
      'inventory',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE', // If product is deleted, delete inventory too
      }),
    );

    // Index for faster queries
    await queryRunner.createIndex(
      'inventory',
      new TableIndex({
        name: 'IDX_INVENTORY_PRODUCT_ID',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'inventory',
      new TableIndex({
        name: 'IDX_INVENTORY_LOW_STOCK',
        columnNames: ['current_stock', 'minimum_stock'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventory');
  }

}
