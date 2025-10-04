// frontend/src/app/(dashboard)/deposits/remote/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { depositsService } from '@/services/deposits.service';
import { ArrowLeft, Package, Camera, QrCode, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const MATERIAL_TYPES = [
  'PET', 'HDPE', 'PP', 'LDPE', 'PS', 'PVC', 
  'CARTON', 'GLASS', 'ALUMINUM', 'STEEL', 'COPPER', 'OTHER_METAL'
];

const remoteDepositSchema = z.object({
  materialType: z.enum(['PET', 'HDPE', 'PP', 'LDPE', 'PS', 'PVC', 'CARTON', 'GLASS', 'ALUMINUM', 'STEEL', 'COPPER', 'OTHER_METAL'] as const),
  estimatedWeight: z.number().min(0.1, 'Peso mínimo 0.1 kg').max(1000, 'Peso máximo 1000 kg'),
  observations: z.string().optional(),
});

type RemoteDepositForm = z.infer<typeof remoteDepositSchema>;

export default function RemoteDepositPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [depositCreated, setDepositCreated] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RemoteDepositForm>({
    resolver: zodResolver(remoteDepositSchema),
  });

  const createDepositMutation = useMutation({
    mutationFn: (data: any) => depositsService.createDeposit(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
      setDepositCreated(data);
      toast.success('Depósito creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear depósito');
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limitar a 3 fotos
    if (files.length + photos.length > 3) {
      toast.error('Máximo 3 fotos permitidas');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotoFiles(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RemoteDepositForm) => {
    if (photos.length === 0) {
      toast.error('Debes agregar al menos una foto del material');
      return;
    }

    // No incluimos collectionPointId - será null
    const depositData = {
      ...data,
      photos: photos, // En producción serían URLs de S3
    };

    createDepositMutation.mutate(depositData);
  };

  // Si ya se creó el depósito, mostrar el QR
  if (depositCreated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Depósito Registrado!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Muestra este código QR en el centro de acopio para validar tu depósito
            </p>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 inline-block">
              {depositCreated.qr?.image && (
                <img 
                  src={depositCreated.qr.image} 
                  alt="QR Code del depósito"
                  className="w-48 h-48 mx-auto"
                />
              )}
              <p className="text-xs text-gray-500 mt-2">
                ID: {depositCreated.deposit.id.slice(-6).toUpperCase()}
              </p>
            </div>

            {/* Deposit Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Información del depósito:</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Material:</strong> {depositCreated.deposit.materialType}</p>
                <p><strong>Peso estimado:</strong> {depositCreated.deposit.estimatedWeight} kg</p>
                <p><strong>Estado:</strong> Pendiente de validación</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <Info className="w-5 h-5 text-amber-600 inline mr-2" />
              <p className="text-sm text-amber-800 inline">
                Guarda este QR o toma una captura. Lo necesitarás para que el centro valide tu material.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setDepositCreated(null);
                  setPhotos([]);
                  setPhotoFiles([]);
                  reset();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Crear Otro Depósito
              </button>
              
              <Link
                href="/deposits"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Ver Mis Depósitos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/deposits"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a depósitos
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Registrar Depósito Remoto</h1>
        <p className="text-gray-600 mt-2">
          Registra tu material reciclable y genera un QR para presentar en el centro
        </p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <Info className="w-5 h-5 text-blue-600 inline mr-2" />
        <span className="text-sm text-blue-800">
          Este tipo de depósito es ideal cuando los contenedores no tienen QR o cuando 
          quieres registrar tu material antes de llevarlo al centro.
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información del Material
          </h2>

          <div className="space-y-4">
            {/* Material Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Material *
              </label>
              <select
                {...register('materialType')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecciona un material</option>
                {MATERIAL_TYPES.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
              {errors.materialType && (
                <p className="mt-1 text-sm text-red-600">{errors.materialType.message}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso Estimado (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                {...register('estimatedWeight', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: 5.5"
              />
              {errors.estimatedWeight && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedWeight.message}</p>
              )}
            </div>

            {/* Observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones (opcional)
              </label>
              <textarea
                {...register('observations')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ej: Botellas limpias y sin etiquetas"
              />
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fotos del Material *
          </h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Agrega fotos del material para facilitar la validación (mínimo 1, máximo 3)
          </p>

          <div className="space-y-4">
            {photos.length < 3 && (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Haz clic para seleccionar fotos
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </label>
            )}

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createDepositMutation.isPending}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {createDepositMutation.isPending ? (
            'Creando depósito...'
          ) : (
            <>
              <QrCode className="w-5 h-5 mr-2" />
              Generar Código QR
            </>
          )}
        </button>
      </form>
    </div>
  );
}