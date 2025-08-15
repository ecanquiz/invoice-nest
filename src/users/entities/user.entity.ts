import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ 
    type: 'varchar',
    unique: true,
    length: 255
  })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 100
  })
  name!: string | null;

  @Column({ 
    type: 'boolean',
    default: false
   })
  isEmailVerified!: boolean;

  @Column({ 
    type: 'varchar',
    nullable: true,
    length: 255
  })
  emailVerificationToken: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 255 
   })
  passwordResetToken?: string | null;

  @Column({
    nullable: true,
    type: 'timestamptz'
   })
  passwordResetExpires?: Date | null;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 255
  })
  avatar?: string | null;

  @CreateDateColumn({
    type: 'timestamptz'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz'
  })
  updatedAt!: Date;

  /*@BeforeInsert()
  async setVerifiedInDevelopment() {
    if (process.env.NODE_ENV === 'development') {
      this.isEmailVerified = true;
    }
  }*/

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password.trim(), 10);
    }
  }
}
