
import React, { useState, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import { Product } from '../../types';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { DEFAULT_IMAGE_URL, ICONS } from '../../constants';
import { apiService } from '../../services/apiService';

interface ProductFormProps {
  onSubmit: (productData: Omit<Product, 'id'>) => Promise<void>;
  initialData?: Product | null;
  onCancel?: () => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, initialData, onCancel, isLoading }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string | number>(0); // Store as string for input, parse on submit
  const [category, setCategory] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState(''); 
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [imagePreview, setImagePreview] = useState<string | null>(null); 
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const updateImageStates = useCallback((newImageUrl?: string) => {
    if (newImageUrl) {
      if (newImageUrl.startsWith('data:image')) {
        setImagePreview(newImageUrl); 
        setManualImageUrl(''); 
      } else if (newImageUrl && newImageUrl !== DEFAULT_IMAGE_URL) {
        setManualImageUrl(newImageUrl); 
        setImagePreview(newImageUrl); 
      } else {
        setImagePreview(null);
        setManualImageUrl('');
      }
    } else {
      setImagePreview(null);
      setManualImageUrl('');
    }
    setImageError(null);
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price);
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setIsAvailable(initialData.isAvailable);
      updateImageStates(initialData.imageUrl);
    } else {
      setName('');
      setPrice(0);
      setCategory('');
      setDescription('');
      setIsAvailable(true);
      updateImageStates(); 
    }
    setGenerationError(null);
  }, [initialData, updateImageStates]);

  const handleFileChange = (file: File | null) => {
    setImageError(null);
    if (file) {
      if (!file.type.startsWith('image/')) {
        setImageError('Lütfen geçerli bir resim dosyası seçin (örn: JPG, PNG, GIF, WebP).');
        updateImageStates(manualImageUrl || (initialData?.imageUrl !== DEFAULT_IMAGE_URL ? initialData?.imageUrl : undefined)); 
        return;
      }
      if (file.size > 5 * 1024 * 1024) { 
        setImageError('Dosya boyutu 5MB\'dan büyük olamaz.');
        updateImageStates(manualImageUrl || (initialData?.imageUrl !== DEFAULT_IMAGE_URL ? initialData?.imageUrl : undefined));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateImageStates(reader.result as string);
      };
      reader.onerror = () => {
        setImageError('Dosya okunurken bir hata oluştu.');
        updateImageStates(manualImageUrl || (initialData?.imageUrl !== DEFAULT_IMAGE_URL ? initialData?.imageUrl : undefined));
      }
      reader.readAsDataURL(file);
    } else {
      // If no file, revert to manual URL or initial URL if it exists and isn't the default placeholder
      updateImageStates(manualImageUrl || (initialData?.imageUrl && initialData.imageUrl !== DEFAULT_IMAGE_URL ? initialData.imageUrl : undefined));
    }
  };

  const handleImageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setImageError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.some(type => type === "Files")) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleRemoveImage = () => {
    updateImageStates(); 
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; 
  };
  
  const handleManualImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setManualImageUrl(newUrl); 
    if (newUrl.trim() === '') { 
      // If manual URL is cleared, and there's a file preview, keep the file preview.
      // Otherwise (no file preview), clear the preview.
      if (!(imagePreview && imagePreview.startsWith('data:image'))) {
        setImagePreview(null);
      }
    } else {
      setImagePreview(newUrl); 
    }
    setImageError(null);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price as string);
    if (!name || isNaN(numericPrice) || numericPrice <= 0 || !category) {
        alert("Lütfen tüm zorunlu alanları (Ürün Adı, Fiyat, Kategori) geçerli değerlerle doldurun.");
        return;
    }
    
    let finalImageUrl = DEFAULT_IMAGE_URL; // Default if nothing else is set
    // Prioritize file upload (base64)
    if (imagePreview && imagePreview.startsWith('data:image')) {
        finalImageUrl = imagePreview;
    } 
    // Then manual URL if it's not empty and not the default
    else if (manualImageUrl.trim() && manualImageUrl.trim() !== DEFAULT_IMAGE_URL) {
        finalImageUrl = manualImageUrl.trim();
    } 
    // Then if there's any imagePreview left (could be an old URL from initialData) that is not default
    else if (imagePreview && imagePreview !== DEFAULT_IMAGE_URL) { 
        finalImageUrl = imagePreview;
    }


    onSubmit({ name, price: numericPrice, category, imageUrl: finalImageUrl, description, isAvailable });
  };

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
        setGenerationError("Lütfen önce ürün adını girin.");
        return;
    }
    setGenerationError(null);
    setIsGeneratingDescription(true);
    try {
        const generatedText = await apiService.generateProductDescription(name, category);
        setDescription(generatedText);
    } catch (err: any) {
        console.error("Failed to generate AI description:", err);
        if (err.message && (err.message.toLowerCase().includes("api anahtarı") || err.message.toLowerCase().includes("api key"))) {
            setGenerationError(`AI Açıklaması Hatası: ${err.message} Lütfen Yönetici Panelindeki Ayarlar bölümünden API anahtarınızı kontrol edin veya ayarlayın.`);
        } else {
            setGenerationError(err.message || "Açıklama üretilemedi. Lütfen tekrar deneyin.");
        }
    } finally {
        setIsGeneratingDescription(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <Input
          label="Ürün Adı"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (generationError && e.target.value.trim()) setGenerationError(null);
          }}
          placeholder="Örn: Çocuk Menüsü"
          required
        />
        <Input
          label="Kategori"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Örn: Ana Yemekler"
          required
        />
      </div>
      <Input
        label="Fiyat (TL)"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Örn: 125.50"
        required
        min="0.01"
        step="0.01"
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Ürün Görseli (Opsiyonel)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <Input
              label="Görsel URL'si"
              value={manualImageUrl}
              onChange={handleManualImageUrlChange}
              placeholder="https://..."
              containerClassName="mb-0"
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`p-4 border-2 ${isDraggingOver ? 'border-primary-DEFAULT dark:border-primary-light bg-primary-DEFAULT/5' : 'border-dashed border-gray-300 dark:border-gray-600'} rounded-lg text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150 ease-in-out flex flex-col items-center justify-center min-h-[100px]`}
            >
              <input
                id="imageFile"
                type="file"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleImageInputChange}
                className="hidden"
              />
              <label htmlFor="imageFile" className="cursor-pointer block">
                {ICONS.upload(`w-7 h-7 mx-auto mb-1.5 ${isDraggingOver ? 'text-primary-dark dark:text-primary-light' : 'text-gray-400 dark:text-gray-500'}`)}
                <p className={`text-sm ${isDraggingOver ? 'text-primary-dark dark:text-primary-light' : 'text-gray-500 dark:text-gray-400'}`}>
                  Görseli buraya sürükleyin veya <span className="font-semibold text-primary-DEFAULT dark:text-primary-light">gözatın</span>.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, GIF, WebP (Maks. 5MB)</p>
              </label>
            </div>
        </div>
        {imageError && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{imageError}</p>}
        
        {imagePreview && imagePreview !== DEFAULT_IMAGE_URL && (
          <div className="mt-4 relative group w-32 h-32 mx-auto sm:mx-0">
            <img 
                src={imagePreview} 
                alt="Ürün Önizlemesi" 
                className="w-full h-full object-cover rounded-lg shadow-md border border-gray-200 dark:border-gray-700" 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL; 
                    setImageError("Görsel yüklenemedi. URL'yi veya dosyayı kontrol edin.");
                }}
            />
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 !rounded-full aspect-square"
              title="Görseli Kaldır"
            >
              {ICONS.delete("w-4 h-4")}
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Açıklama (Opsiyonel)
            </label>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                isLoading={isGeneratingDescription}
                leftIcon={ICONS.sparkles("w-4 h-4")}
                className="text-xs py-1 px-2.5"
                disabled={!name.trim() || isGeneratingDescription}
            >
                AI ile Oluştur
            </Button>
        </div>
        <textarea
            id="description"
            name="description"
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT/40 focus:border-primary-DEFAULT sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            placeholder="Ürün hakkında kısa bilgi veya AI ile oluşturun"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
        {generationError && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{generationError}</p>}
      </div>
      
      <div className="flex items-center pt-2">
        <input
          id="isAvailable"
          name="isAvailable"
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="h-4 w-4 text-primary-DEFAULT border-gray-300 dark:border-gray-600 rounded focus:ring-primary-DEFAULT focus:ring-offset-white dark:focus:ring-offset-gray-800"
        />
        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-800 dark:text-gray-200">
          Satışta (Mevcut)
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} size="md">İptal</Button>}
        <Button type="submit" isLoading={isLoading} size="md">
          {initialData ? 'Ürünü Güncelle' : 'Ürün Ekle'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;