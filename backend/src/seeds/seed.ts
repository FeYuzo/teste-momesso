import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Machine } from '../machines/entities/machine.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'momesso_db',
  entities: [Company, User, Machine],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('🌱 Iniciando seed...');

  // Clear existing data (em ordem para evitar erro de FK)
  await dataSource.getRepository(Machine).createQueryBuilder().delete().execute();
  await dataSource.getRepository(User).createQueryBuilder().delete().execute();
  await dataSource.getRepository(Company).createQueryBuilder().delete().execute();

  // Create companies
  const company1 = await dataSource.getRepository(Company).save({
    name: 'Momesso Tecnologia Ltda',
    cnpj: '12.345.678/0001-90',
  });

  const company2 = await dataSource.getRepository(Company).save({
    name: 'Tech Solutions S.A.',
    cnpj: '98.765.432/0001-10',
  });

  console.log('✅ Empresas criadas');

  // Create users
  const hashedPassword = await bcrypt.hash('123456', 10);

  await dataSource.getRepository(User).save([
    {
      name: 'Admin Geral',
      email: 'admin@momesso.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      companyId: company1.id,
    },
    {
      name: 'João Silva',
      email: 'joao@momesso.com',
      password: hashedPassword,
      role: UserRole.USER,
      companyId: company1.id,
    },
    {
      name: 'Maria Santos',
      email: 'maria@techsolutions.com',
      password: hashedPassword,
      role: UserRole.USER,
      companyId: company2.id,
    },
    {
      name: 'Admin Tech',
      email: 'admin@techsolutions.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      companyId: company2.id,
    },
  ]);

  console.log('✅ Usuários criados');

  // Create machines
  await dataSource.getRepository(Machine).save([
    {
      name: 'Torno CNC Alpha',
      serialNumber: 'SN-001-MOMESSO',
      companyId: company1.id,
    },
    {
      name: 'Fresadora Beta',
      serialNumber: 'SN-002-MOMESSO',
      companyId: company1.id,
    },
    {
      name: 'Prensa Hidráulica Gama',
      serialNumber: 'SN-003-MOMESSO',
      companyId: company1.id,
    },
    {
      name: 'Robô Industrial X1',
      serialNumber: 'SN-001-TECH',
      companyId: company2.id,
    },
    {
      name: 'Impressora 3D Pro',
      serialNumber: 'SN-002-TECH',
      companyId: company2.id,
    },
  ]);

  console.log('✅ Máquinas criadas');

  console.log('\n🎉 Seed concluído com sucesso!\n');
  console.log('📋 Usuários criados:');
  console.log('  ADMIN: admin@momesso.com / 123456');
  console.log('  USER:  joao@momesso.com / 123456');
  console.log('  USER:  maria@techsolutions.com / 123456');
  console.log('  ADMIN: admin@techsolutions.com / 123456');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
