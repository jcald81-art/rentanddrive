'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Car as CarIcon, 
  FolderOpen, 
  FileText, 
  Upload, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Wrench,
  Shield,
  ClipboardCheck,
  FileWarning,
  Plus,
  ChevronLeft,
  Calendar,
  AlertCircle
} from 'lucide-react'

// Document categories for filing
const documentCategories = [
  { id: 'service', label: 'Service Records', icon: Wrench, color: 'bg-blue-500' },
  { id: 'inspection', label: 'Inspections', icon: ClipboardCheck, color: 'bg-green-500' },
  { id: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-purple-500' },
  { id: 'registration', label: 'Registration', icon: FileText, color: 'bg-amber-500' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'bg-cyan-500' },
  { id: 'other', label: 'Other Documents', icon: FolderOpen, color: 'bg-gray-500' },
]

// Service types for quick categorization
const serviceTypes = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Transmission Service',
  'Coolant Flush',
  'Air Filter Replacement',
  'Spark Plug Replacement',
  'Battery Replacement',
  'Alignment',
  'State Inspection',
  'Emissions Test',
  'General Repair',
  'Recall Service',
  'Other',
]

interface Document {
  id: string
  name: string
  category: string
  serviceType?: string
  vehicleId?: string
  vehicleName?: string
  uploadDate: string
  expiryDate?: string
  fileSize: string
  fileType: string
  url: string
  notes?: string
}

// Mock documents - in production, these would come from Supabase
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Oil Change Receipt - Jan 2024',
    category: 'service',
    serviceType: 'Oil Change',
    vehicleId: 'v1',
    vehicleName: '2023 Tesla Model 3',
    uploadDate: '2024-01-15',
    fileSize: '245 KB',
    fileType: 'PDF',
    url: '#',
    notes: 'Synthetic oil, next change at 75,000 miles',
  },
  {
    id: '2',
    name: 'Annual Inspection Certificate',
    category: 'inspection',
    serviceType: 'State Inspection',
    vehicleId: 'v1',
    vehicleName: '2023 Tesla Model 3',
    uploadDate: '2024-02-01',
    expiryDate: '2025-02-01',
    fileSize: '180 KB',
    fileType: 'PDF',
    url: '#',
  },
  {
    id: '3',
    name: 'Insurance Policy',
    category: 'insurance',
    vehicleId: 'v1',
    vehicleName: '2023 Tesla Model 3',
    uploadDate: '2024-01-01',
    expiryDate: '2025-01-01',
    fileSize: '520 KB',
    fileType: 'PDF',
    url: '#',
  },
  {
    id: '4',
    name: 'Tire Rotation Service',
    category: 'maintenance',
    serviceType: 'Tire Rotation',
    vehicleId: 'v2',
    vehicleName: '2022 Ford F-150',
    uploadDate: '2024-03-10',
    fileSize: '156 KB',
    fileType: 'PDF',
    url: '#',
    notes: 'Rotated front to back, tread depth good',
  },
]

export default function FilingCabinetPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('')
  const [uploadServiceType, setUploadServiceType] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.vehicleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.serviceType?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesVehicle = selectedVehicle === 'all' || doc.vehicleId === selectedVehicle
    return matchesSearch && matchesCategory && matchesVehicle
  })

  // Get unique vehicles from documents
  const vehicles = Array.from(new Set(documents.map(d => d.vehicleId).filter(Boolean)))
    .map(id => {
      const doc = documents.find(d => d.vehicleId === id)
      return { id, name: doc?.vehicleName || 'Unknown Vehicle' }
    })

  // Check for expiring documents
  const expiringDocuments = documents.filter(doc => {
    if (!doc.expiryDate) return false
    const expiry = new Date(doc.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow
  })

  const handleUpload = async () => {
    setIsUploading(true)
    // Simulate upload - in production, this would upload to Supabase Storage
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsUploading(false)
    setIsUploadDialogOpen(false)
    // Reset form
    setUploadCategory('')
    setUploadServiceType('')
  }

  const getCategoryInfo = (categoryId: string) => {
    return documentCategories.find(c => c.id === categoryId) || documentCategories[5]
  }

  return (
    <div className="min-h-svh bg-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0D0D0D]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/host/dashboard" className="text-white/60 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/images/logo.jpg" 
                alt="Rent and Drive" 
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
              <FolderOpen className="h-3 w-3 mr-1" />
              Filing Cabinet
            </Badge>
          </div>
          <Link href="/host/dashboard">
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Filing Cabinet</h1>
            <p className="text-gray-400">
              Store and organize service records, inspections, insurance, and other vehicle documents
            </p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D62828] hover:bg-[#b82222] gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#151c2c] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Add a new document to your filing cabinet
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="bg-[#0a0f1a] border-white/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(uploadCategory === 'service' || uploadCategory === 'maintenance') && (
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select value={uploadServiceType} onValueChange={setUploadServiceType}>
                      <SelectTrigger className="bg-[#0a0f1a] border-white/20">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Vehicle (Optional)</Label>
                  <Select>
                    <SelectTrigger className="bg-[#0a0f1a] border-white/20">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="v1">2023 Tesla Model 3</SelectItem>
                      <SelectItem value="v2">2022 Ford F-150</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-[#D62828]/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      Drag and drop or click to upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input 
                    placeholder="Add any relevant notes..."
                    className="bg-[#0a0f1a] border-white/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expiry Date (Optional)</Label>
                  <Input 
                    type="date"
                    className="bg-[#0a0f1a] border-white/20"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading || !uploadCategory}
                  className="bg-[#D62828] hover:bg-[#b82222]"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expiring Documents Alert */}
        {expiringDocuments.length > 0 && (
          <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-400">
                  {expiringDocuments.length} document{expiringDocuments.length > 1 ? 's' : ''} expiring soon
                </p>
                <p className="text-sm text-amber-400/70">
                  Review and renew before expiration
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                Review
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {documentCategories.map(category => {
            const count = documents.filter(d => d.category === category.id).length
            const isSelected = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(isSelected ? 'all' : category.id)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  isSelected 
                    ? 'bg-[#D62828]/20 border-[#D62828]/50' 
                    : 'bg-[#151c2c] border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`h-10 w-10 rounded-lg ${category.color}/20 flex items-center justify-center mb-3`}>
                  <category.icon className={`h-5 w-5 ${category.color.replace('bg-', 'text-').replace('-500', '-400')}`} />
                </div>
                <p className="font-medium text-white text-sm">{category.label}</p>
                <p className="text-xs text-gray-500">{count} files</p>
              </button>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#151c2c] border-white/10 text-white"
            />
          </div>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-full md:w-48 bg-[#151c2c] border-white/10 text-white">
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map(v => (
                <SelectItem key={v.id} value={v.id!}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents List */}
        <Card className="bg-[#151c2c] border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white text-lg">
              {selectedCategory === 'all' ? 'All Documents' : getCategoryInfo(selectedCategory).label}
              <span className="text-gray-500 font-normal ml-2">({filteredDocuments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-2">No documents found</p>
                <p className="text-sm text-gray-500">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredDocuments.map(doc => {
                  const category = getCategoryInfo(doc.category)
                  const isExpiringSoon = doc.expiryDate && new Date(doc.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  
                  return (
                    <div key={doc.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg ${category.color}/20 flex items-center justify-center flex-shrink-0`}>
                          <category.icon className={`h-5 w-5 ${category.color.replace('bg-', 'text-').replace('-500', '-400')}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-white truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {doc.vehicleName && (
                                  <Badge variant="outline" className="border-white/20 text-gray-400 text-xs">
                                    <CarIcon className="h-3 w-3 mr-1" />
                                    {doc.vehicleName}
                                  </Badge>
                                )}
                                {doc.serviceType && (
                                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                                    {doc.serviceType}
                                  </Badge>
                                )}
                                {isExpiringSoon && (
                                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Expiring Soon
                                  </Badge>
                                )}
                              </div>
                              {doc.notes && (
                                <p className="text-sm text-gray-500 mt-1 truncate">{doc.notes}</p>
                              )}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                            </span>
                            <span>{doc.fileSize}</span>
                            <span>{doc.fileType}</span>
                            {doc.expiryDate && (
                              <span className={isExpiringSoon ? 'text-amber-400' : ''}>
                                Expires {new Date(doc.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
