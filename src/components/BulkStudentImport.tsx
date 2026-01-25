import { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
    parseCSVFile,
    validateStudentData,
    bulkImportStudents,
    downloadCSVTemplate,
    type StudentImportRow,
    type ImportResult
} from '../lib/bulkImportService';
import { useAuth } from '../hooks/useAuth';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/types';

interface BulkStudentImportProps {
    onSuccess?: (result: ImportResult) => void;
    onClose?: () => void;
    user?: User | null;
    profile?: UserProfile | null;
    schoolId?: string | null;
}

export const BulkStudentImport = ({ onSuccess, onClose, user: propUser, profile: propProfile, schoolId: propSchoolId }: BulkStudentImportProps) => {
    const { schoolId: authSchoolId, user: authUser, profile: authProfile } = useAuth();

    // Use props if available, otherwise fallback to hook (for robustness)
    const user = propUser || authUser;
    const profile = propProfile || authProfile;
    const schoolId = propSchoolId || authSchoolId;
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [fileData, setFileData] = useState<StudentImportRow[]>([]);
    const [error, setError] = useState('');
    const [result, setResult] = useState<ImportResult | null>(null);
    const [importing, setImporting] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setError('');
        setFile(selectedFile);

        try {
            // Validate file type
            if (!selectedFile.name.endsWith('.csv') && !selectedFile.type.includes('spreadsheet')) {
                setError('Please upload a CSV file');
                return;
            }

            // Parse file
            const parsed = await parseCSVFile(selectedFile);

            if (parsed.length === 0) {
                setError('No valid student records found in file');
                return;
            }

            // Validate data
            const validation = validateStudentData(parsed);
            if (!validation.valid) {
                setError(`Validation failed: ${validation.errors.slice(0, 3).map(e => e.error).join(', ')}...`);
                setFileData([]);
                return;
            }

            setFileData(parsed);
            setStep('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse file');
            setFile(null);
        }
    };

    const handleImport = async () => {
        if (!schoolId || !user || !profile) {
            setError('User information not found');
            return;
        }

        setImporting(true);
        setStep('importing');
        setError('');

        try {
            const importResult = await bulkImportStudents(
                fileData,
                schoolId,
                false,
                user.id,
                profile.fullName || 'Unknown User'
            );
            setResult(importResult);
            setStep('complete');

            if (onSuccess) {
                onSuccess(importResult);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
            setStep('preview');
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setFileData([]);
        setError('');
        setResult(null);
    };

    // Upload Step
    if (step === 'upload') {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Import Students</h2>
                    <p className="text-gray-400">Upload a CSV file to bulk import students into your school</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* CSV Template Section */}
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-teal-300 font-bold mb-1">Need a template?</h3>
                            <p className="text-teal-200/70 text-sm">Download our CSV template with the correct format and sample data</p>
                        </div>
                        <button
                            onClick={downloadCSVTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </button>
                    </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer block">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-teal-400" />
                            </div>
                        </div>
                        <p className="text-white font-bold mb-2">Click to upload or drag and drop</p>
                        <p className="text-gray-400 text-sm">CSV files only</p>
                    </label>
                </div>

                {/* Required Format */}
                <div className="bg-dark-card border border-white/5 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-3">Required Format</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                        <p><span className="text-teal-400">AdmissionNumber</span> - Unique student ID (required)</p>
                        <p><span className="text-teal-400">FullName</span> - Student full name (required)</p>
                        <p><span className="text-teal-400">Email</span> - Student email (optional)</p>
                        <p><span className="text-teal-400">Class</span> - Class/Form name (optional)</p>
                        <p><span className="text-teal-400">ParentPhone</span> - Parent contact (optional)</p>
                        <p><span className="text-teal-400">ParentName</span> - Parent name (optional)</p>
                        <p><span className="text-teal-400">ParentEmail</span> - Parent email (optional)</p>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        );
    }

    // Preview Step
    if (step === 'preview') {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Review Import</h2>
                    <p className="text-gray-400">Review the data before importing</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                    <p className="text-teal-300 font-bold mb-1">{fileData.length} students ready to import</p>
                    <p className="text-teal-200/70 text-sm">File: {file?.name}</p>
                </div>

                {/* Preview Table */}
                <div className="border border-white/5 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-gray-400 font-bold">Admission #</th>
                                    <th className="px-4 py-3 text-left text-gray-400 font-bold">Name</th>
                                    <th className="px-4 py-3 text-left text-gray-400 font-bold">Email</th>
                                    <th className="px-4 py-3 text-left text-gray-400 font-bold">Class</th>
                                    <th className="px-4 py-3 text-left text-gray-400 font-bold">Parent Phone</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {fileData.slice(0, 10).map((row, idx) => (
                                    <tr key={`preview-${idx}-${row.admissionNumber || row.fullName || ''}`} className="hover:bg-white/5">
                                        <td className="px-4 py-3 text-white">{row.admissionNumber}</td>
                                        <td className="px-4 py-3 text-white">{row.fullName}</td>
                                        <td className="px-4 py-3 text-gray-400">{row.email || '-'}</td>
                                        <td className="px-4 py-3 text-gray-400">{row.className || '-'}</td>
                                        <td className="px-4 py-3 text-gray-400">{row.parentPhone || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {fileData.length > 10 && (
                        <div className="bg-white/5 px-4 py-3 text-gray-400 text-sm text-center">
                            ... and {fileData.length - 10} more students
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 px-6 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                    >
                        {importing ? 'Importing...' : 'Confirm Import'}
                    </button>
                </div>
            </div>
        );
    }

    // Importing Step
    if (step === 'importing') {
        return (
            <div className="space-y-6 text-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Importing Students...</h2>
                </div>

                <div className="flex justify-center">
                    <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                </div>

                <div className="text-gray-400">
                    <p>Processing {fileData.length} student records</p>
                    <p className="text-sm mt-2">This may take a few moments...</p>
                </div>
            </div>
        );
    }

    // Complete Step
    if (step === 'complete' && result) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.success ? 'bg-teal-500/20' : 'bg-orange-500/20'}`}>
                            {result.success ? (
                                <CheckCircle2 className="w-8 h-8 text-teal-400" />
                            ) : (
                                <AlertCircle className="w-8 h-8 text-orange-400" />
                            )}
                        </div>
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${result.success ? 'text-teal-400' : 'text-orange-400'}`}>
                        {result.success ? 'Import Complete!' : 'Import Completed with Issues'}
                    </h2>
                </div>

                <div className="bg-dark-card border border-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Total Records:</span>
                        <span className="text-white font-bold">{result.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Successfully Imported:</span>
                        <span className="text-teal-400 font-bold">{result.imported}</span>
                    </div>
                    {result.failed > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-400">Failed:</span>
                            <span className="text-red-400 font-bold">{result.failed}</span>
                        </div>
                    )}
                </div>

                {result.errors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                        <p className="text-red-300 font-bold mb-3">Errors ({result.errors.length})</p>
                        <div className="space-y-2 text-sm text-red-200/80">
                            {result.errors.slice(0, 5).map((err: any, idx: number) => (
                                <p key={`error-row-${err.row}-${idx}`}>
                                    <span className="font-mono">Row {err.row}</span>: {err.error}
                                </p>
                            ))}
                            {result.errors.length > 5 && (
                                <p className="text-red-300">... and {result.errors.length - 5} more errors</p>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors"
                >
                    Import More Students
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                )}
            </div>
        );
    }

    return null;
};
