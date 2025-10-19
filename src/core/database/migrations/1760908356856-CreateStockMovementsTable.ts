import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateStockMovementsTable1760908356856 implements MigrationInterface {
  name = 'CreateStockMovementsTable1760908356856';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stock_movements',
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
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'quantity',
            type: 'integer',
          },
          {
            name: 'previous_stock',
            type: 'integer',
          },
          {
            name: 'new_stock',
            type: 'integer',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'reference_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
          },
        ],
      }),
      true,
    );

    // Foreign Key to products
    await queryRunner.createForeignKey(
      'stock_movements',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    // Indexes for better performance
    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_PRODUCT_ID',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'stock_movements',
      new TableIndex({
        name: 'IDX_STOCK_MOVEMENTS_TYPE',
        columnNames: ['type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stock_movements');
  }
}
