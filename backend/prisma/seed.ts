import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crear organización (Centro de Acopio)
  const org = await prisma.organization.create({
    data: {
      name: 'Centro de Acopio Norte',
      type: 'COLLECTION_CENTER',
      rut: '76.123.456-7',
    },
  });

  // Crear facility
  const facility = await prisma.facility.create({
    data: {
      organizationId: org.id,
      name: 'Facility Principal',
      address: 'Av. Principal 123, Santiago',
      latitude: -33.4372,
      longitude: -70.6506,
    },
  });

  // Crear operador
  const hashedPassword = await bcrypt.hash('123456', 10);
  const operator = await prisma.user.create({
    data: {
      email: 'operador@test.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Operador',
      role: 'OPERATOR',
      organizationId: org.id,
      facilityId: facility.id,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword, // usa la misma: 123456
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
    },
  });

  // Crear punto de reciclaje
  const pointQr = await prisma.qrCode.create({
    data: {
      type: 'COLLECTION_POINT',
      status: 'USED',
    },
  });

  const collectionPoint = await prisma.collectionPoint.create({
    data: {
      name: 'Punto Verde Plaza Italia',
      address: 'Plaza Italia, Santiago',
      latitude: -33.4372,
      longitude: -70.6506,
      facilityId: facility.id,
      qrCodeId: pointQr.id,
    },
  });

  console.log('Seed completado:');
  console.log('- Organización:', org.name);
  console.log('- Facility:', facility.name);
  console.log('- Operador: operador@test.com / 123456');
  console.log('- Punto de reciclaje:', collectionPoint.name);
  console.log('- QR del punto:', pointQr.id);
  console.log('- Admin: admin@test.com / 123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());