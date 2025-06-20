
import React, { useState, useEffect } from 'react';
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
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price);
      setCategory(initialData.category);
      setImageUrl(initialData.imageUrl || '');
      setDescription(initialData.description || '');
      setIsAvailable(initialData.isAvailable);
    } else {
      setName('');
      setPrice(0);
      setCategory('');
      setImageUrl('');
      setDescription('');
      setIsAvailable(true);
    }
    setGenerationError(null); // Clear generation error when initialData changes
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0 || !category) {
        alert("Lütfen tüm zorunlu alanları doldurun (Ürün Adı, Fiyat, Kategori).");
        return;
    }
    onSubmit({ name, price, category, imageUrl: imageUrl || DEFAULT_IMAGE_URL, description, isAvailable });
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
        setGenerationError(err.message || "Açıklama üretilemedi. Lütfen tekrar deneyin.");
    } finally {
        setIsGeneratingDescription(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Ürün Adı"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (generationError && e.target.value.trim()) setGenerationError(null); // Clear error on name input
        }}
        placeholder="Örn: Latte"
        required
      />
      <Input
        label="Fiyat (TL)"
        type="number"
        value={price}
        onChange={(e) => setPrice(parseFloat(e.target.value))}
        placeholder="Örn: 35"
        required
        min="0.01"
        step="0.01"
      />
      <Input
        label="Kategori"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Örn: Sıcak İçecekler"
        required
      />
      <Input
        label="Görsel URL (Opsiyonel)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
      <div>
        <div className="flex justify-between items-center mb-1">
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
                className="text-xs py-1 px-2"
                disabled={!name.trim() || isGeneratingDescription}
            >
                AI ile Oluştur
            </Button>
        </div>
        <textarea
            id="description"
            name="description"
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Ürün hakkında kısa bilgi veya AI ile oluşturun"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
        {generationError && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{generationError}</p>}
      </div>
      
      <div className="flex items-center">
        <input
          id="isAvailable"
          name="isAvailable"
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="h-4 w-4 text-primary-DEFAULT border-gray-300 rounded focus:ring-primary-DEFAULT"
        />
        <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
          Satışta (Mevcut)
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>İptal</Button>}
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Ürünü Güncelle' : 'Ürün Ekle'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;