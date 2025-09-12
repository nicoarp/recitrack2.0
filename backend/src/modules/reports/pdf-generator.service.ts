import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Batch, Organization, Facility } from '@prisma/client';

@Injectable()
export class PdfGeneratorService {
  async generateBatchCertificate(data: {
    batch: any;
    organization: Organization;
    facility: Facility;
    itemCount: number;
  }): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text('CERTIFICADO DE RECICLAJE', { align: 'center' });
      doc.moveDown();
      
      // Número de certificado
      doc.fontSize(12).text(`Certificado No: CERT-${data.batch.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, { align: 'right' });
      doc.moveDown();

      // Información de la organización
      doc.fontSize(14).text('CENTRO DE ACOPIO', { underline: true });
      doc.fontSize(12);
      doc.text(`Nombre: ${data.organization.name}`);
      doc.text(`RUT: ${data.organization.rut}`);
      doc.text(`Sucursal: ${data.facility.name}`);
      doc.text(`Dirección: ${data.facility.address}`);
      doc.moveDown();

      // Información del lote
      doc.fontSize(14).text('DETALLES DEL LOTE', { underline: true });
      doc.fontSize(12);
      doc.text(`ID del Lote: ${data.batch.id}`);
      doc.text(`Material: ${data.batch.materialType}`);
      doc.text(`Cantidad de items: ${data.itemCount}`);
      doc.text(`Peso Bruto: ${data.batch.grossWeight} kg`);
      doc.text(`Tara: ${data.batch.tareWeight} kg`);
      doc.text(`Peso Neto: ${data.batch.netWeight} kg`);
      doc.text(`Fecha de cierre: ${new Date(data.batch.closedAt).toLocaleDateString('es-CL')}`);
      doc.moveDown();

      // Blockchain (si existe)
      if (data.batch.blockchainTx) {
        doc.fontSize(14).text('VERIFICACIÓN BLOCKCHAIN', { underline: true });
        doc.fontSize(10);
        doc.text(`Transaction Hash: ${data.batch.blockchainTx}`);
        doc.text(`Estado: ${data.batch.blockchainStatus}`);
        doc.moveDown();
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10);
      doc.text('Este certificado acredita que los materiales descritos han sido recibidos y procesados', { align: 'center' });
      doc.text('cumpliendo con los estándares de trazabilidad establecidos por la Ley REP.', { align: 'center' });

      doc.end();
    });
  }

  async generateMonthlyReport(data: {
    organization: Organization;
    startDate: Date;
    endDate: Date;
    batches: any[];
    totalWeight: number;
    materialBreakdown: Record<string, number>;
  }): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text('REPORTE MENSUAL DE RECICLAJE', { align: 'center' });
      doc.moveDown();
      
      // Período
      doc.fontSize(12);
      doc.text(`Período: ${data.startDate.toLocaleDateString('es-CL')} - ${data.endDate.toLocaleDateString('es-CL')}`);
      doc.text(`Organización: ${data.organization.name}`);
      doc.text(`RUT: ${data.organization.rut}`);
      doc.moveDown();

      // Resumen
      doc.fontSize(14).text('RESUMEN EJECUTIVO', { underline: true });
      doc.fontSize(12);
      doc.text(`Total de lotes procesados: ${data.batches.length}`);
      doc.text(`Peso total procesado: ${data.totalWeight.toFixed(2)} kg`);
      doc.text(`CO₂ equivalente evitado: ${(data.totalWeight * 2.5).toFixed(2)} kg`);
      doc.moveDown();

      // Desglose por material
      doc.fontSize(14).text('DESGLOSE POR MATERIAL', { underline: true });
      doc.fontSize(12);
      Object.entries(data.materialBreakdown).forEach(([material, weight]) => {
        const percentage = ((weight / data.totalWeight) * 100).toFixed(1);
        doc.text(`${material}: ${weight.toFixed(2)} kg (${percentage}%)`);
      });
      doc.moveDown();

      // Detalle de lotes
      doc.fontSize(14).text('DETALLE DE LOTES', { underline: true });
      doc.fontSize(10);
      
      data.batches.forEach((batch, index) => {
        if (index > 0) doc.moveDown(0.5);
        doc.text(`Lote ${index + 1}: ${batch.materialType} - ${batch.netWeight} kg - ${new Date(batch.closedAt).toLocaleDateString('es-CL')}`);
      });

      doc.end();
    });
  }
}