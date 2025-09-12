'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { depositsService } from '@/services/deposits.service';
import { ArrowLeft, Package, Camera, Upload } from 'lucide-react';
import Link from 'next/link';

const MATERIAL_TYPES = [
  'PET', 'HDPE', 'PP', 'LDPE', 'PS', 'PVC', 
  'CARTON', 'GLASS', 'ALUMINUM', 'STEEL', 'COPPER', 'OTHER_METAL'
];

const createDepositSchema = z.object({
  qrCodeId: z.string().min(1, 'Código QR requerido'),
  collectionPointId: z.string().optional(),
  materialType: z.enum(['PET', 'HDPE', 'PP', 'LDPE', 'PS', 'PVC', 'CARTON', 'GLASS', 'ALUMINUM', 'STEEL', 'COPPER', 'OTHER_METAL'] as const),
  estimatedWeight: z.number().min(0.1, 'Peso mínimo 0.1 kg').max(1000, 'Peso máximo 1000 kg'),
  observations: z.string().optional(),
});

type CreateDepositForm = z.infer<typeof createDepositSchema>;

export default function CreateDepositPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateDepositForm>({
    resolver: zodResolver(createDepositSchema),
  });

  const createDepositMutation = useMutation({
    mutationFn: (data: CreateDepositForm & { photos: string[] }) => 
      depositsService.createDeposit(data),
    onSuccess: () => {
      toast.success('Depósito creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
      router.push('/deposits');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear depósito');
    },
  });

  const onSubmit = (data: CreateDepositForm) => {
    createDepositMutation.mutate({
      ...data,
      photos,
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPhotoPreview(prev => [...prev, result]);
          // En producción, aquí subirías la imagen a un servicio como S3 o Cloudinary
          // Por ahora, simulamos una URL
          setPhotos(prev => [...prev, `https://example.com/photos/${Date.now()}-${file.name}`]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Función para escanear QR (simulada por ahora)
  const handleScanQR = () => {
    // En la implementación real, usarías html5-qrcode para escanear
    const simulatedQrId = `qr-${Date.now()}`;
    setValue('qrCodeId', simulatedQrId);
    toast.success('Código QR escaneado exitosamente');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/deposits"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a depósitos
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Depósito</h1>
        <p className="text-gray-600 mt-2">
          Registra un nuevo depósito de material reciclable
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* QR Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código QR *
            </label>
            <div className="flex space-x-3">
              <input
                {...register('qrCodeId')}
                type="text"
                placeholder="Escanea o ingresa el código QR"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleScanQR}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Camera className="w-5 h-5 mr-2" />
                Escanear
              </button>
            </div>
            {errors.qrCodeId && (
              <p className="mt-1 text-sm text-red-600">{errors.qrCodeId.message}</p>
            )}
          </div>

          {/* Material Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* Estimated Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso Estimado (kg) *
            </label>
            <input
              {...register('estimatedWeight', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' ? undefined : parseFloat(v)
              })}
              type="number"
              step="0.1"
              min="0.1"
              max="1000"
              placeholder="0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {errors.estimatedWeight && (
              <p className="mt-1 text-sm text-red-600">{errors.estimatedWeight.message}</p>
            )}
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos del Material
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Haz clic para subir fotos o arrastra aquí
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG hasta 10MB cada una
                </span>
              </label>
            </div>

            {/* Photo Preview */}
            {photoPreview.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoPreview.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              placeholder="Describe el estado del material, condiciones especiales, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createDepositMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {createDepositMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 mr-2" />
                  Crear Depósito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}