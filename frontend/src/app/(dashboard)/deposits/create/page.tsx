'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depositsService } from '@/services/deposits.service';
import { qrService } from '@/services/qr.service';
import { organizationsService } from '@/services/organizations.service';
import { 
  ArrowLeft, 
  Package, 
  Camera, 
  Upload, 
  QrCode,
  MapPin,
  Weight,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { MaterialType } from '@/types/api.types';

interface QRCode {
  id: string;
  code: string;
  used: boolean;
}

interface CollectionPoint {
  id: string;
  name: string;
  address: string;
}

const MATERIAL_TYPES = [
  { value: 'PET', label: 'PET - Botellas plásticas', icon: '♻️' },
  { value: 'HDPE', label: 'HDPE - Plástico duro', icon: '🥛' },
  { value: 'PP', label: 'PP - Polipropileno', icon: '📦' },
  { value: 'LDPE', label: 'LDPE - Plástico blando', icon: '🛍️' },
  { value: 'PS', label: 'PS - Poliestireno', icon: '🥤' },
  { value: 'PVC', label: 'PVC - PVC', icon: '🔧' },
  { value: 'CARTON', label: 'Cartón', icon: '📦' },
  { value: 'GLASS', label: 'Vidrio', icon: '🍾' },
  { value: 'ALUMINUM', label: 'Aluminio', icon: '🥫' },
  { value: 'STEEL', label: 'Acero', icon: '🔩' },
  { value: 'COPPER', label: 'Cobre', icon: '🔌' },
  { value: 'OTHER_METAL', label: 'Otro Metal', icon: '⚙️' },
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
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [step, setStep] = useState(1); // 1: QR, 2: Details, 3: Review

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateDepositForm>({
    resolver: zodResolver(createDepositSchema),
  });

  const selectedQR = watch('qrCodeId');
  const selectedMaterial = watch('materialType');

  // Fetch available QR codes
  const { data: myQRCodes } = useQuery({
    queryKey: ['my-qr-codes'],
    queryFn: qrService.getMyQRCodes,
  })as { data: QRCode[] | undefined };

  // Fetch collection points
  const { data: collectionPoints } = useQuery({
    queryKey: ['collection-points'],
    queryFn: organizationsService.getCollectionPoints,
  });

  // Create deposit mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateDepositForm) => {
      const deposit = await depositsService.createDeposit({
  ...data,
  photos: [] // Por ahora array vacío, luego lo actualizas si necesitas
});
      
      // Upload photos if any
      if (photos.length > 0) {
        for (const photo of photos) {
          await depositsService.uploadImage(deposit.id, photo);
        }
      }
      
      return deposit;
    },
    onSuccess: () => {
      toast.success('¡Depósito creado exitosamente!');
      queryClient.invalidateQueries({ queryKey: ['my-deposits'] });
      router.push('/deposits');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear el depósito');
    },
  });

  const onSubmit = (data: CreateDepositForm) => {
    createMutation.mutate(data);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/deposits"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nuevo Depósito</h1>
            <p className="text-gray-600 mt-1">Registra un nuevo depósito de material reciclable</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <div
            key={stepNumber}
            className={`flex items-center ${stepNumber < 3 ? 'flex-1' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= stepNumber
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > stepNumber ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          {step === 1 && 'Selecciona o escanea el código QR'}
          {step === 2 && 'Completa los detalles del depósito'}
          {step === 3 && 'Revisa y confirma'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: QR Code Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <QrCode className="w-5 h-5 mr-2 text-green-600" />
              Código QR
            </h2>
            
            <div className="space-y-4">
              {/* QR Scanner Button */}
              <button
                type="button"
                onClick={() => router.push('/qr/scan')}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Escanear código QR</span>
              </button>

              <div className="text-center text-gray-500 text-sm">o selecciona uno de tus códigos</div>

              {/* Available QR Codes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {myQRCodes?.map((qr) => (
                  <button
                    key={qr.id}
                    type="button"
                    onClick={() => {
                      setValue('qrCodeId', qr.id);
                      setStep(2);
                    }}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      selectedQR === qr.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <QrCode className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-xs text-gray-600">{qr.code}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {qr.used ? 'Usado' : 'Disponible'}
                    </p>
                  </button>
                ))}
              </div>

              {!myQRCodes?.length && (
                <div className="text-center py-8 text-gray-500">
                  <p>No tienes códigos QR disponibles</p>
                  <Link href="/qr/generate" className="text-green-600 hover:underline text-sm">
                    Generar códigos QR
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Deposit Details */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Material Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Tipo de Material
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MATERIAL_TYPES.map((material) => (
                  <button
                    key={material.value}
                    type="button"
                    onClick={() => setValue('materialType', material.value as MaterialType)}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      selectedMaterial === material.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{material.icon}</div>
                    <p className="text-sm font-medium text-gray-900">{material.value}</p>
                    <p className="text-xs text-gray-600">{material.label}</p>
                  </button>
                ))}
              </div>
              {errors.materialType && (
                <p className="text-red-500 text-sm mt-2">{errors.materialType.message}</p>
              )}
            </div>

            {/* Weight and Location */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Depósito</h2>
              
              <div className="space-y-4">
                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Weight className="w-4 h-4 inline mr-1" />
                    Peso Estimado (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('estimatedWeight', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: 2.5"
                  />
                  {errors.estimatedWeight && (
                    <p className="text-red-500 text-sm mt-1">{errors.estimatedWeight.message}</p>
                  )}
                </div>

                {/* Collection Point */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Punto de Recolección (opcional)
                  </label>
                  <select
                    {...register('collectionPointId')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar punto...</option>
                    {collectionPoints?.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.name} - {point.address}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Observaciones (opcional)
                  </label>
                  <textarea
                    {...register('observations')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Información adicional sobre el depósito..."
                  />
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Fotos del Material (opcional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 cursor-pointer transition-colors"
                    >
                      <Upload className="w-5 h-5 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Subir fotos</span>
                    </label>
                    
                    {photoPreview.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {photoPreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              width={96}
                              height={96}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedMaterial && watch('estimatedWeight')) {
                    setStep(3);
                  } else {
                    toast.error('Completa todos los campos requeridos');
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Confirm */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Check className="w-5 h-5 mr-2 text-green-600" />
              Revisa y Confirma
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Código QR</p>
                <p className="font-medium">{selectedQR}</p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Material</p>
                <p className="font-medium">
                  {MATERIAL_TYPES.find(m => m.value === selectedMaterial)?.label}
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Peso Estimado</p>
                <p className="font-medium">{watch('estimatedWeight')} kg</p>
              </div>
              
              {watch('collectionPointId') && (
                <div className="border-l-4 border-orange-500 pl-4">
                  <p className="text-sm text-gray-600">Punto de Recolección</p>
                  <p className="font-medium">
                    {collectionPoints?.find((p) => p.id === watch('collectionPointId'))?.name}
                  </p>
                </div>
              )}
              
              {watch('observations') && (
                <div className="border-l-4 border-gray-500 pl-4">
                  <p className="text-sm text-gray-600">Observaciones</p>
                  <p className="font-medium">{watch('observations')}</p>
                </div>
              )}
              
              {photos.length > 0 && (
                <div className="border-l-4 border-pink-500 pl-4">
                  <p className="text-sm text-gray-600">Fotos</p>
                  <p className="font-medium">{photos.length} foto(s) adjunta(s)</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Antes de confirmar:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Verifica que el tipo de material sea correcto</li>
                  <li>Asegúrate que el peso estimado sea aproximado</li>
                  <li>Una vez creado, no podrás editar el depósito</li>
                </ul>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Confirmar y Crear
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}