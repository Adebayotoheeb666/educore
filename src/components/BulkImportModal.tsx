import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from '../components/ui/progress';
import { downloadCSVTemplate } from '../lib/bulkImportServiceExtended';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, type: string) => Promise<{
    success: boolean;
    totalRows: number;
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }>;
}

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [step, setStep] = useState<'select' | 'upload' | 'preview' | 'importing' | 'complete'>('select');
  const [selectedType, setSelectedType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Array<Record<string, any>>>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ 
    totalRows: number;
    imported: number; 
    failed: number; 
    errors: Array<{ row: number; error: string }> 
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset the modal when it's opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedType('');
      setFile(null);
      setPreviewData([]);
      setProgress(0);
      setResult(null);
    }
  }, [isOpen]);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep('upload');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Simple preview - in a real app, you'd parse the CSV here
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n').slice(0, 6); // Get first 5 rows for preview
          const headers = lines[0]?.split(',').map(h => h.trim()) || [];
          const previewRows = lines.slice(1).filter(Boolean).map(line => {
            const values = line.split(',').map(v => v.trim());
            return headers.reduce((obj, header, i) => ({
              ...obj,
              [header]: values[i] || ''
            }), {});
          });
          setPreviewData(previewRows);
        } catch (error) {
          console.error('Error parsing CSV preview:', error);
          setPreviewData([{ 'Error': 'Could not parse CSV file. Please check the format.' }]);
        }
      };
      reader.readAsText(selectedFile);
      
      setStep('preview');
    }
  };

  const handleDownloadTemplate = () => {
    if (selectedType) {
      downloadCSVTemplate(selectedType as any);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedType) return;
    
    setStep('importing');
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 300);
    
    try {
      const importResult = await onImport(file, selectedType);
      clearInterval(interval);
      setProgress(100);
      setResult({
        totalRows: importResult.totalRows,
        imported: importResult.imported,
        failed: importResult.failed,
        errors: importResult.errors || []
      });
      setStep('complete');
    } catch (error) {
      console.error('Import failed:', error);
      setResult({
        totalRows: 0,
        imported: 0,
        failed: 1,
        errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error during import' }]
      });
      setStep('complete');
    } finally {
      clearInterval(interval);
    }
  };

  const resetAndClose = () => {
    setSelectedType('');
    setFile(null);
    setPreviewData([]);
    setProgress(0);
    setResult(null);
    setStep('select');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Bulk Import {selectedType ? `- ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}s` : ''}</h2>
          <button 
            onClick={resetAndClose} 
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 'select' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">What would you like to import?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['staff', 'parent', 'class', 'subject', 'student'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors duration-200"
                  >
                    <div className="font-medium capitalize">{type}</div>
                    <div className="text-sm text-gray-500">
                      Import multiple {type}s at once
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Import {selectedType}s</h3>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">CSV file (max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('select')}
                  className="px-4 py-2"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleDownloadTemplate} 
                  variant="outline"
                  className="px-4 py-2 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {step === 'preview' && file && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Preview {selectedType}s</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((header) => (
                          <th 
                            key={header} 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.values(row).map((cell, j) => (
                            <td 
                              key={j} 
                              className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis"
                              title={String(cell)}
                            >
                              {String(cell) || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-sm text-gray-500 text-right">
                Showing {Math.min(previewData.length, 5)} of {previewData.length} rows
              </div>
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('upload')}
                  className="px-4 py-2"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleImport}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Import {previewData.length} {selectedType}{previewData.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 text-center py-8">
              <div className="animate-pulse">
                <Upload className="mx-auto h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Importing {selectedType}s...</h3>
              <p className="text-gray-500">Please wait while we process your data</p>
              <div className="w-full max-w-md mx-auto">
                <Progress value={progress} className="h-2.5" />
                <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
              </div>
            </div>
          )}

          {step === 'complete' && result && (
            <div className="space-y-6 text-center py-8">
              {result.failed === 0 ? (
                <div className="text-green-600">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
                  <p className="text-gray-600">
                    Successfully imported {result.imported} {selectedType}{result.imported !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <div className="text-yellow-600">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Import Complete with {result.failed} {result.failed === 1 ? 'Error' : 'Errors'}
                  </h3>
                  <p className="text-gray-600">
                    Imported {result.imported} of {result.totalRows} {selectedType}s
                  </p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-left mt-6 border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  <h4 className="font-medium mb-3 text-sm text-gray-700 uppercase tracking-wider">Error Details:</h4>
                  <ul className="text-sm space-y-2">
                    {result.errors.slice(0, 5).map((error, i) => (
                      <li key={i} className="flex items-start">
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2">
                          Row {error.row + 1}
                        </span>
                        <span className="text-gray-700">{error.error}</span>
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        ...and {result.errors.length - 5} more error{result.errors.length - 5 !== 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="pt-6">
                <Button 
                  onClick={resetAndClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
