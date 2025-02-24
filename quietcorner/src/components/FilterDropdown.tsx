"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, X } from "lucide-react"

export type OccupancyLevel = "low" | "medium" | "high"

type FilterDropdownProps = {
    activeFilters: {
        occupancy: OccupancyLevel[]
        buildingName: string
    }
    onFilterChange: (filters: { occupancy: OccupancyLevel[]; buildingName: string }) => void
}

export function FilterDropdown({ activeFilters, onFilterChange }: FilterDropdownProps) {
    const [localFilters, setLocalFilters] = useState(activeFilters)

    const handleOccupancyChange = (level: OccupancyLevel) => {
        const newOccupancy = localFilters.occupancy.includes(level)
            ? localFilters.occupancy.filter((l) => l !== level)
            : [...localFilters.occupancy, level]
        setLocalFilters({ ...localFilters, occupancy: newOccupancy })
    }

    const handleBuildingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalFilters({ ...localFilters, buildingName: e.target.value })
    }

    const applyFilters = () => {
        onFilterChange(localFilters)
    }

    const clearFilters = () => {
        const clearedFilters = { occupancy: [], buildingName: "" }
        setLocalFilters(clearedFilters)
        onFilterChange(clearedFilters)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    Filter <Filter className="ml-2 h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="leading-none font-bold">Occupancy</h4>
                        <div className="flex flex-col space-y-1.5">
                            {["low", "medium", "high"].map((level) => (
                                <div key={level} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`occupancy-${level}`}
                                        checked={localFilters.occupancy.includes(level as OccupancyLevel)}
                                        onCheckedChange={() => handleOccupancyChange(level as OccupancyLevel)}
                                    />
                                    <Label htmlFor={`occupancy-${level}`}>{level.charAt(0).toUpperCase() + level.slice(1)}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="leading-none font-bold">Building Name</h4>
                        <Input
                            placeholder="Enter building name"
                            value={localFilters.buildingName}
                            onChange={handleBuildingNameChange}
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            Clear <X className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={applyFilters}>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

