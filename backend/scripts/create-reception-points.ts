import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createReceptionPoints() {
  try {
    // Obtener la facility existente
    const facilities = await prisma.facility.findMany({
      include: {
        collectionPoints: true,
      },
    });

    console.log(`Encontradas ${facilities.length} facilities`);

    for (const facility of facilities) {
      // Verificar si ya tiene punto de recepción
      const hasReceptionPoint = facility.collectionPoints.some(
        point => point.name.includes('Recepción Directa')
      );

      if (!hasReceptionPoint) {
        console.log(`Creando punto de recepción para: ${facility.name}`);
        
        // 1. Primero crear el QR
        const qrCode = await prisma.qrCode.create({
          data: {
            type: 'COLLECTION_POINT',
            status: 'USED',
          },
        });

        // 2. Luego crear el punto con el QR
        const collectionPoint = await prisma.collectionPoint.create({
          data: {
            name: `Recepción Directa - ${facility.name}`,
            description: 'Entrega directa de materiales reciclables en el centro de acopio',
            address: facility.address,
            latitude: facility.latitude || -33.4372,
            longitude: facility.longitude || -70.6506,
            facilityId: facility.id,
            qrCodeId: qrCode.id,  // Asignar el QR creado
            active: true,
          },
        });

        // 3. Actualizar el QR con la referencia al punto
        await prisma.qrCode.update({
          where: { id: qrCode.id },
          data: {
            collectionPoint: {
              connect: { id: collectionPoint.id }
            }
          },
        });

        console.log(`✅ Creado exitosamente con QR: ${qrCode.id}`);
      } else {
        console.log(`⏭️  ${facility.name} ya tiene punto de recepción`);
      }
    }

    console.log('✅ Proceso completado');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createReceptionPoints();