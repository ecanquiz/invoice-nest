import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../iam/users/entities/user.entity';
import { CustomerProfile } from '../profiles/entities/customer-profile.entity';
import { CustomerCommunicationPreference } from '../preferences/communications/entities/customer-communication-preference.entity';                                                                                       
import { CustomerWinePreference } from '../preferences/wines/entities/customer-wine-preference.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @OneToOne(() => User, user => user.customer)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => CustomerProfile, profile => profile.customer)
  profile: CustomerProfile;

  @OneToMany(() => CustomerCommunicationPreference, pref => pref.customer)
  communicationPreferences: CustomerCommunicationPreference[];

  @OneToMany(() => CustomerWinePreference, pref => pref.customer)
  winePreferences: CustomerWinePreference[];

  // Here you can add Customer specific fields if you need to
  @Column({ type: 'varchar', length: 30, nullable: true })
  customer_code: string;

  @CreateDateColumn()
  created_at: Date;
}
