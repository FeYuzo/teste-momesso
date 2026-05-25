import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { MachinesModule } from './machines/machines.module';
import { Company } from './companies/entities/company.entity';
import { User } from './users/entities/user.entity';
import { Machine } from './machines/entities/machine.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'momesso_db',
      entities: [Company, User, Machine],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: false,
    }),
    AuthModule,
    CompaniesModule,
    UsersModule,
    MachinesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
