'use client'

import { useState, useEffect, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Loader2, Car, Bike } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAvailableYears } from '@/integrations/nhtsa'

type VehicleType = 'car' | 'motorcycle'

interface Make {
  id: number
  nhtsa_id?: number | null
  name: string
}

interface Model {
  id: number
  name: string
}

interface VehicleMakeModelSelectorProps {
  value: {
    vehicleType?: VehicleType
    year: string
    make: string
    model: string
  }
  onChange: (value: { vehicleType: VehicleType; year: string; make: string; model: string }) => void
  className?: string
  disabled?: boolean
  showVehicleType?: boolean
}

export function VehicleMakeModelSelector({
  value,
  onChange,
  className,
  disabled = false,
  showVehicleType = true,
}: VehicleMakeModelSelectorProps) {
  const [makes, setMakes] = useState<Make[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loadingMakes, setLoadingMakes] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)
  const [makeOpen, setMakeOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [customModel, setCustomModel] = useState('')

  const vehicleType = value.vehicleType || 'car'
  const years = getAvailableYears()

  // Fetch makes when vehicle type changes - sorted A-Z
  useEffect(() => {
    async function fetchMakes() {
      setLoadingMakes(true)
      try {
        const res = await fetch(`/api/vehicles/makes?type=${vehicleType}`)
        if (res.ok) {
          const data = await res.json()
          // Sort makes alphabetically A-Z
          const sortedMakes = [...(data.makes || [])].sort((a: Make, b: Make) => 
            a.name.localeCompare(b.name)
          )
          setMakes(sortedMakes)
        }
      } catch (err) {
        console.error('Failed to fetch makes:', err)
      } finally {
        setLoadingMakes(false)
      }
    }
    fetchMakes()
  }, [vehicleType])

  // Fetch models when make or year changes - sorted A-Z
  useEffect(() => {
    async function fetchModels() {
      if (!value.make) {
        setModels([])
        return
      }

      setLoadingModels(true)
      try {
        const params = new URLSearchParams({ make: value.make })
        if (value.year) {
          params.set('year', value.year)
        }
        const res = await fetch(`/api/vehicles/models?${params}`)
        if (res.ok) {
          const data = await res.json()
          // Sort models alphabetically A-Z
          const sortedModels = [...(data.models || [])].sort((a: Model, b: Model) => 
            a.name.localeCompare(b.name)
          )
          setModels(sortedModels)
        }
      } catch (err) {
        console.error('Failed to fetch models:', err)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [value.make, value.year])

  const handleVehicleTypeChange = useCallback(
    (type: VehicleType) => {
      onChange({ vehicleType: type, year: '', make: '', model: '' })
    },
    [onChange]
  )

  const handleYearChange = useCallback(
    (year: string) => {
      onChange({ ...value, vehicleType, year, model: '' })
    },
    [value, vehicleType, onChange]
  )

  const handleMakeChange = useCallback(
    (make: string) => {
      onChange({ ...value, vehicleType, make, model: '' })
      setMakeOpen(false)
    },
    [value, vehicleType, onChange]
  )

  const handleModelChange = useCallback(
    (model: string) => {
      onChange({ ...value, vehicleType, model })
      setModelOpen(false)
      setCustomModel('')
    },
    [value, vehicleType, onChange]
  )

  const handleCustomModelSubmit = useCallback(() => {
    if (customModel.trim()) {
      onChange({ ...value, vehicleType, model: customModel.trim() })
      setModelOpen(false)
      setCustomModel('')
    }
  }, [value, vehicleType, onChange, customModel])

  return (
    <div className={cn('grid gap-4', className)}>
      {/* Vehicle Type Selection */}
      {showVehicleType && (
        <div className="space-y-2">
          <Label>Vehicle Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={vehicleType === 'car' ? 'default' : 'outline'}
              onClick={() => handleVehicleTypeChange('car')}
              disabled={disabled}
              className={cn(
                'h-12 flex items-center justify-center gap-2',
                vehicleType === 'car' && 'bg-[#CC0000] hover:bg-[#CC0000]/90 text-white'
              )}
            >
              <Car className="h-5 w-5" />
              Car / SUV / Truck
            </Button>
            <Button
              type="button"
              variant={vehicleType === 'motorcycle' ? 'default' : 'outline'}
              onClick={() => handleVehicleTypeChange('motorcycle')}
              disabled={disabled}
              className={cn(
                'h-12 flex items-center justify-center gap-2',
                vehicleType === 'motorcycle' && 'bg-[#CC0000] hover:bg-[#CC0000]/90 text-white'
              )}
            >
              <Bike className="h-5 w-5" />
              Motorcycle
            </Button>
          </div>
        </div>
      )}

      {/* Year Selection */}
      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Select
          value={value.year}
          onValueChange={handleYearChange}
          disabled={disabled}
        >
          <SelectTrigger id="year" className="w-full">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Make Selection with Search */}
      <div className="space-y-2">
        <Label>Make</Label>
        <Popover open={makeOpen} onOpenChange={setMakeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={makeOpen}
              disabled={disabled || loadingMakes}
              className="w-full justify-between font-normal"
            >
              {loadingMakes ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading makes...
                </span>
              ) : value.make ? (
                <span className="flex items-center gap-2">
                  {vehicleType === 'motorcycle' ? (
                    <Bike className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Car className="h-4 w-4 text-muted-foreground" />
                  )}
                  {value.make}
                </span>
              ) : (
                'Select make...'
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search makes..." />
              <CommandList>
                <CommandEmpty>No make found.</CommandEmpty>
                <CommandGroup>
                  {makes.map(make => (
                    <CommandItem
                      key={make.id}
                      value={make.name}
                      onSelect={() => handleMakeChange(make.name)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value.make === make.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {make.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Model Selection with Search + Custom Input */}
      <div className="space-y-2">
        <Label>Model</Label>
        <Popover open={modelOpen} onOpenChange={setModelOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={modelOpen}
              disabled={disabled || !value.make || loadingModels}
              className="w-full justify-between font-normal"
            >
              {loadingModels ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading models...
                </span>
              ) : value.model ? (
                value.model
              ) : !value.make ? (
                'Select make first'
              ) : (
                'Select model...'
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search or type custom model..."
                value={customModel}
                onValueChange={setCustomModel}
              />
              <CommandList>
                {models.length === 0 && !customModel && (
                  <CommandEmpty>
                    No models found. Type to add a custom model.
                  </CommandEmpty>
                )}
                {customModel && !models.some(m => 
                  m.name.toLowerCase() === customModel.toLowerCase()
                ) && (
                  <CommandGroup heading="Custom">
                    <CommandItem onSelect={handleCustomModelSubmit}>
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      Add &quot;{customModel}&quot;
                    </CommandItem>
                  </CommandGroup>
                )}
                {models.length > 0 && (
                  <CommandGroup heading="Models">
                    {models.map(model => (
                      <CommandItem
                        key={model.id}
                        value={model.name}
                        onSelect={() => handleModelChange(model.name)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value.model === model.name ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {model.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default VehicleMakeModelSelector
