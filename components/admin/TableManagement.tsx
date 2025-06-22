
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { TableConfiguration } from '../../types';
import Input from '../shared/Input';
import Button from '../shared/Button';
import { ICONS, DEFAULT_TABLE_NAMES } from '../../constants';

// Feedback Message Component (similar to AdminPage's internal one for consistency)
const FeedbackDisplay: React.FC<{message: {type: 'success' | 'error', text: string} | null}> = ({message}) => {
  if (!message) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3.5 mb-4 rounded-lg text-sm flex items-center shadow ${message.type === 'success' ? 'bg-green-50 dark:bg-green-700/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-600' : 'bg-red-50 dark:bg-red-700/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-600'}`}
    >
      {message.type === 'success' ? ICONS.checkCircle("w-5 h-5 mr-2") : ICONS.xCircle("w-5 h-5 mr-2")}
      {message.text}
    </motion.div>
  );
};

const TableManagement: React.FC = () => {
  const [currentTableNames, setCurrentTableNames] = useState<string[]>(DEFAULT_TABLE_NAMES);
  const [newTableNameInput, setNewTableNameInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTableConfiguration = useCallback(async () => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      const config = await apiService.getTableConfiguration();
      setCurrentTableNames(config.tableNames && config.tableNames.length > 0 ? [...config.tableNames].sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})) : [...DEFAULT_TABLE_NAMES]);
    } catch (error) {
      console.error("Failed to fetch table configuration:", error);
      setFeedbackMessage({ type: 'error', text: 'Masa yapılandırması yüklenemedi. Varsayılanlar kullanılıyor.' });
      setCurrentTableNames([...DEFAULT_TABLE_NAMES]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTableConfiguration();
  }, [fetchTableConfiguration]);

  const handleAddTableName = () => {
    setFeedbackMessage(null);
    const trimmedName = newTableNameInput.trim();
    if (!trimmedName) {
      setFeedbackMessage({ type: 'error', text: 'Masa adı boş olamaz.' });
      return;
    }
    if (currentTableNames.some(name => name.toLowerCase() === trimmedName.toLowerCase())) {
      setFeedbackMessage({ type: 'error', text: `"${trimmedName}" adlı masa zaten mevcut.` });
      return;
    }
    setCurrentTableNames(prev => [...prev, trimmedName].sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})));
    setNewTableNameInput('');
  };

  const handleDeleteTableName = (nameToDelete: string) => {
    setFeedbackMessage(null);
    setCurrentTableNames(prev => prev.filter(name => name !== nameToDelete));
  };

  const handleSaveConfiguration = async () => {
    setFeedbackMessage(null);
     if (currentTableNames.length === 0) {
      if (!window.confirm("Masa listesi boş. Bu şekilde kaydetmek, kasiyer ekranında hiç masa görünmemesine neden olur. Emin misiniz?")) {
        return;
      }
    }
    setIsLoading(true);
    try {
      await apiService.updateTableConfiguration({ tableNames: currentTableNames });
      setFeedbackMessage({ type: 'success', text: 'Masa yapılandırması başarıyla güncellendi.' });
    } catch (error: any) {
      console.error("Failed to update table configuration:", error);
      setFeedbackMessage({ type: 'error', text: `Güncelleme başarısız: ${error.message}` });
    }
    setIsLoading(false);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
        {ICONS.table("w-6 h-6 mr-3 text-primary-DEFAULT")} Masa Listesi Yönetimi
      </h2>

      <FeedbackDisplay message={feedbackMessage} />

      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Kasiyer ekranında görünecek özel masa isimlerini buradan yönetin. 
            Sayısal veya metinsel (örn: A1, Bahçe 3, VIP) masa adları ekleyebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Input
              label="Yeni Masa Adı"
              value={newTableNameInput}
              onChange={(e) => setNewTableNameInput(e.target.value)}
              placeholder="Örn: 15 veya Teras 2"
              containerClassName="flex-grow mb-0 sm:mb-4"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTableName();}}}
            />
            <Button onClick={handleAddTableName} leftIcon={ICONS.add("w-4 h-4")} size="md" className="w-full sm:w-auto self-end sm:self-auto sm:mt-[27px]">
              Ekle
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Mevcut Masalar ({currentTableNames.length})</h3>
          {isLoading && currentTableNames.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          ) : currentTableNames.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-3 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-md border border-gray-200 dark:border-gray-600">Henüz masa eklenmemiş. Yukarıdan yeni masa adı ekleyebilirsiniz.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 custom-scrollbar">
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {currentTableNames.map((name) => (
                  <motion.li 
                    key={name}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={name}>{name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTableName(name)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 !p-1"
                      title={`${name} masasını sil`}
                    >
                      {ICONS.delete("w-4 h-4")}
                    </Button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleSaveConfiguration} isLoading={isLoading} size="md">
            Masa Listesini Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TableManagement;
