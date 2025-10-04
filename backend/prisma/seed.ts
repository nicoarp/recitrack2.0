import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Obtener la organización y facility existentes
  const org = await prisma.organization.findFirst();
  const facility = await prisma.facility.findFirst();

  if (!org || !facility) {
    console.log('❌ Primero ejecuta el seed principal');
    return;
  }

  // Crear usuarios con diferentes roles
  const users = [
    {
      email: 'maria@example.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'González',
      role: 'COLLECTOR' as const,
      rut: '12345678-9',
    },
    {
      email: 'pedro@example.com',
      password: hashedPassword,
      firstName: 'Pedro',
      lastName: 'Recolector',
      role: 'COLLECTOR' as const,
      rut: '98765432-1',
    },
    {
      email: 'juan@example.com',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'OPERATOR' as const,
      organizationId: org.id,
      facilityId: facility.id,
    },
    {
      email: 'ana@example.com',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'Supervisora',
      role: 'ADMIN' as const,
      organizationId: org.id,
      facilityId: facility.id,
    },
    {
      email: 'empresa@example.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Empresario',
      role: 'COMPANY' as const,
      rut: '76543210-K',
    }
  ];

  // Crear usuarios
  for (const userData of users) {
    try {
      const user = await prisma.user.create({
        data: userData,
      });
      console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
    } catch (error) {
      console.log(`⚠️  Usuario ${userData.email} ya existe`);
    }
  }

  // Crear algunos QR codes para María
  const maria = await prisma.user.findUnique({ 
    where: { email: 'maria@example.com' } 
  });

  if (maria) {
    console.log('\n📱 Creando QR codes para María...');
    
    for (let i = 1; i <= 5; i++) {
      const qr = await prisma.qrCode.create({
        data: {
          type: 'DEPOSIT',
          status: 'AVAILABLE',
        },
      });
      console.log(`✅ QR creado: ${qr.id}`);
    }
  }

  // Crear punto de recepción directa para la facility
  const receptionPoint = await prisma.collectionPoint.findFirst({
    where: { 
      name: { contains: 'Recepción Directa' }
    }
  });

  if (!receptionPoint) {
    const qr = await prisma.qrCode.create({
      data: {
        type: 'COLLECTION_POINT',
        status: 'USED',
      },
    });

    await prisma.collectionPoint.create({
      data: {
        name: `Recepción Directa - ${facility.name}`,
        description: 'Entrega directa de materiales reciclables',
        address: facility.address || 'Av. Principal 123',
        latitude: -33.4372,
        longitude: -70.6506,
        facilityId: facility.id,
        qrCodeId: qr.id,
        active: true,
      },
    });
    console.log('\n✅ Punto de recepción directa creado');
  }

  console.log('\n👥 Resumen de usuarios:');
  console.log('- María y Pedro: COLLECTORS (recolectores)');
  console.log('- Juan: OPERATOR (valida y crea lotes)');
  console.log('- Ana: ADMIN (supervisión general)');
  console.log('- Carlos: COMPANY (empresa compradora)');
  console.log('\nTodos con contraseña: password123');
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());