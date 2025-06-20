import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { TableConfiguration } from '../../types';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { ICONS, DEFAULT_MIN_TABLE, DEFAULT_MAX_TABLE } from '../../constants';

const TableManagement: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<TableConfiguration>({ minTable: DEFAULT_MIN_TABLE, maxTable: DEFAULT_MAX_TABLE });
  const [minInput, setMinInput] = useState<string>(DEFAULT_MIN_TABLE.toString());
  const [maxInput, setMaxInput] = useState<string>(DEFAULT_MAX_TABLE.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTableConfiguration = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await apiService.getTableConfiguration();
      setCurrentConfig(config);
      setMinInput(config.minTable.toString());
      setMaxInput(config.maxTable.toString());
    } catch (error) {
      console.error("Failed to fetch table configuration:", error);
      setMessage({ type: 'error', text: 'Masa yapılandırması yüklenemedi.' });
      // Keep default values in inputs if fetch fails
      const defaultConfig = await apiService.getDefaultTableConfiguration();
      setCurrentConfig(defaultConfig);
      setMinInput(defaultConfig.minTable.toString());
      setMaxInput(defaultConfig.maxTable.toString());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTableConfiguration();
  }, [fetchTableConfiguration]);

  const handleSaveConfiguration = async () => {
    setMessage(null);
    const minTable = parseInt(minInput, 10);
    const maxTable = parseInt(maxInput, 10);

    if (isNaN(minTable) || isNaN(maxTable)) {
      setMessage({ type: 'error', text: 'Lütfen geçerli sayılar girin.' });
      return;
    }

    if (minTable <= 0 || maxTable <= 0) {
      setMessage({ type: 'error', text: 'Masa numaraları pozitif olmalıdır.' });
      return;
    }

    if (minTable > maxTable) {
      setMessage({ type: 'error', text: 'Minimum masa numarası, maksimum masa numarasından büyük olamaz.' });
      return;
    }
    
    // Limit max tables to prevent UI issues on cashier page (e.g. 100 tables)
    if (maxTable > 200) {
         setMessage({ type: 'error', text: 'Maksimum masa sayısı 200\'ü geçmemelidir.'});
         return;
    }


    setIsLoading(true);
    try {
      await apiService.updateTableConfiguration({ minTable, maxTable });
      setCurrentConfig({ minTable, maxTable });
      setMessage({ type: 'success', text: 'Masa yapılandırması başarıyla güncellendi.' });
    } catch (error: any) {
      console.error("Failed to update table configuration:", error);
      setMessage({ type: 'error', text: `Güncelleme başarısız: ${error.message}` });
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
        {ICONS.table("w-6 h-6 mr-2")} Masa Yönetimi
      </h2>

      {message && (
        <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100' : 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-100'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kasiyer ekranında görünecek masa numarası aralığını belirleyin. Varsayılan aralık {DEFAULT_MIN_TABLE}-{DEFAULT_MAX_TABLE}.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <Input
            label="Minimum Masa Numarası"
            type="number"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder={DEFAULT_MIN_TABLE.toString()}
            min="1"
            containerClassName="mb-0"
          />
          <Input
            label="Maksimum Masa Numarası"
            type="number"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder={DEFAULT_MAX_TABLE.toString()}
            min="1"
            containerClassName="mb-0"
          />
        </div>
         <p className="text-xs text-gray-500 dark:text-gray-400">
          Kasiyer ekranında iyi bir görünüm için maksimum masa sayısını 200 ile sınırlı tutmanız önerilir.
        </p>
        <div>
          <Button onClick={handleSaveConfiguration} isLoading={isLoading}>
            Ayarları Kaydet
          </Button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Mevcut Yapılandırma</h3>
        {isLoading && !currentConfig.minTable ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Masa Numaraları: <span className="font-semibold">{currentConfig.minTable}</span> - <span className="font-semibold">{currentConfig.maxTable}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default TableManagement;
