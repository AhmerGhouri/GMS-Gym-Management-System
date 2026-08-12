'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, ArrowLeft, CheckCircle2, AlertCircle, Trash2, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/axios';
import { Gender, MemberStatus } from '@gms/types';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ParsedMember {
  id: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  gender: Gender;
  phone?: string;
  email?: string;
  cnic?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  timeSlot?: string;
  joiningDate?: string;
  planId?: string;
  status?: MemberStatus;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: { index: number; data: any; reason: string }[];
}

export default function BulkImportPage() {
  const { data: plansData } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const res = await api.get('/memberships/plans');
      return res.data;
    },
  });
  const plans = (plansData?.data || []).filter((plan: any) => plan.isActive);

  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
  });

  const parseFile = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const mappedData: ParsedMember[] = json.map((row, index) => ({
          id: `temp-${index}`,
          firstName: row['First Name'] || row.firstName,
          lastName: row['Last Name'] || row.lastName || undefined,
          fatherName: row['Father Name'] || row.fatherName || undefined,
          gender: parseGender(row['Gender'] || row.gender),
          phone: row['Phone'] || row.phone ? String(row['Phone'] || row.phone) : undefined,
          email: row['Email'] || row.email || undefined,
          cnic: row['CNIC'] || row.cnic ? String(row['CNIC'] || row.cnic).replace(/\D/g, '') : undefined,
          dateOfBirth: row['Date of Birth'] || row.dateOfBirth ? parseDate(row['Date of Birth'] || row.dateOfBirth) : undefined,
          address: row['Address'] || row.address || undefined,
          emergencyContact: row['Emergency Contact'] || row.emergencyContact ? String(row['Emergency Contact'] || row.emergencyContact) : undefined,
          timeSlot: row['Time Slot'] || row.timeSlot || undefined,
          planId: row['Membership'] || row.planId || undefined,
          joiningDate: row['Joining Date'] || row.joiningDate ? parseDate(row['Joining Date'] || row.joiningDate) : undefined,
        })).filter(row => row.firstName); // Basic validation: require names

        setParsedData(mappedData);
        if (mappedData.length === 0) {
          toast({
            title: 'No valid data found',
            description: 'Ensure your file has at least a First Name column.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error parsing file',
          description: 'The file could not be parsed. Make sure it is a valid Excel or CSV file.',
          variant: 'destructive',
        });
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setIsParsing(false);
      toast({
        title: 'Error reading file',
        description: 'Failed to read the selected file.',
        variant: 'destructive',
      });
    };

    reader.readAsBinaryString(file);
  };

  const parseGender = (val: string): Gender => {
    if (!val) return 'MALE';
    const lower = val.toLowerCase();
    if (lower.startsWith('f')) return 'FEMALE';
    if (lower.startsWith('o')) return 'OTHER';
    return 'MALE';
  };

  const parseDate = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'number') {
      // Excel serial date
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return undefined;
  };

  const removeRow = (id: string) => {
    setParsedData(prev => prev.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof ParsedMember, value: any) => {
    setParsedData(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value === 'none' ? undefined : value };
      }
      return row;
    }));
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        members: parsedData.map(({ id, ...rest }) => rest)
      };
      
      const res = await api.post('/members/bulk', payload);
      setImportResult(res.data);
      
      toast({
        title: 'Import completed',
        description: `Successfully imported ${res.data.successful} members.`,
        variant: res.data.failed > 0 ? 'warning' : 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.response?.data?.message || 'Failed to perform bulk import.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <Link href="/members">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bulk Import Members</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload an Excel or CSV file to import multiple members at once.</p>
          </div>
        </div>
        {parsedData.length > 0 && !importResult && (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
            Import {parsedData.length} Members
          </Button>
        )}
      </motion.div>

      <div className="grid gap-6">
        {!file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent shadow-none">
              <div 
                {...getRootProps()} 
                className={`p-12 text-center cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl flex flex-col items-center justify-center min-h-[300px] ${isDragActive ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-500' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="h-16 w-16 bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Drag & drop your file here</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  Supports .xlsx, .xls, and .csv files. Ensure your columns match the required fields (First Name, Last Name, Phone, CNIC, etc.)
                </p>
                <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950">
                  Select File
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {isParsing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Parsing file...</p>
          </div>
        )}

        {importResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Import Summary
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Your bulk import has been processed.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg text-center">
                    <div className="text-2xl font-bold">{importResult.successful}</div>
                    <div className="text-xs font-medium uppercase tracking-wider">Successful</div>
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-lg text-center">
                    <div className="text-2xl font-bold">{importResult.failed}</div>
                    <div className="text-xs font-medium uppercase tracking-wider">Failed</div>
                  </div>
                </div>
              </div>
              
              {importResult?.errors?.length > 0 && (
                <div className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Member Name</TableHead>
                        <TableHead>Error Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-slate-500">{error.index + 1}</TableCell>
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {error.data?.firstName} {error.data?.lastName}
                          </TableCell>
                          <TableCell className="text-rose-600 dark:text-rose-400 text-sm">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {error.reason}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button variant="outline" onClick={clearFile}>Import Another File</Button>
                <Link href="/members" className="ml-3">
                  <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">Go to Members</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {parsedData.length > 0 && !importResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white text-base">Preview Data</CardTitle>
                  <CardDescription>Found {parsedData.length} valid rows</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile} className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400">
                  <X className="h-4 w-4 mr-2" /> Discard File
                </Button>
              </CardHeader>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-sm">
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">First Name</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Last Name</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Gender</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Phone</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">CNIC</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Joining Date</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Membership</TableHead>
                      <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400 w-16">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {parsedData.map((row) => (
                        <motion.tr 
                          key={row.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-white">{row.firstName}</TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">{row.lastName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent">
                              {row.gender}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">{row.phone || '—'}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">{row.cnic || '—'}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">{row.joiningDate || '—'}</TableCell>
                          <TableCell>
                            <Select value={row.planId || 'none'} onValueChange={(val) => updateRow(row.id, 'planId', val)}>
                              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-950"><SelectValue placeholder="No Plan" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Plan</SelectItem>
                                {plans.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={row.status || 'ACTIVE'} onValueChange={(val) => updateRow(row.id, 'status', val)}>
                              <SelectTrigger className="w-[110px] bg-white dark:bg-slate-950"><SelectValue placeholder="Status" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                <SelectItem value="FROZEN">Frozen</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
