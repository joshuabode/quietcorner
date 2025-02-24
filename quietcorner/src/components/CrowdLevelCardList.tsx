"use client"

import { useState, useMemo } from "react"
import { SortDropdown } from "./SortDropdown"
import { FilterDropdown } from "./FilterDropdown"
import { CrowdLevelCard } from "./CrowdLevelCard"
import { StudyLocation } from "./app-sidebar"
import { OccupancyLevel } from "./FilterDropdown"


export type CrowdLevelCardListProps = {
    locations: StudyLocation[]
    handleLocationSelect: (name: string, coords: [number, number], id: string) => void
}

type filter = {
    occupancy: OccupancyLevel[]
    buildingName: string
}

const sortOptions = [
    { label: "Name A-Z", value: "name-asc" },
    { label: "Name Z-A", value: "name-desc" },
    { label: "Occupancy Low-High", value: "occupancy-asc" },
    { label: "Occupancy High-Low", value: "occupancy-desc" },
]

export function CrowdLevelCardList({ locations, handleLocationSelect }: CrowdLevelCardListProps) {
    const [currentSort, setCurrentSort] = useState("name-asc")
    const [filters, setFilters] = useState<filter>({
        occupancy: [],
        buildingName: "",
    })

    const filteredAndSortedLocations = useMemo(() => {
        return locations
            .filter((location) => {
                const occupancyMatch =
                    filters.occupancy.length === 0 ||
                    (filters.occupancy.includes("low") && (location.positions_occupied/location.max_capacity) <= 0.4) ||
                    (filters.occupancy.includes("medium") &&
                        (location.positions_occupied/location.max_capacity) > 0.4 &&
                        (location.positions_occupied/location.max_capacity) < 0.7) ||
                    (filters.occupancy.includes("high") && (location.positions_occupied/location.max_capacity) >= 0.7)
                const nameMatch =
                    filters.buildingName === "" || location.name.toLowerCase().includes(filters.buildingName.toLowerCase())
                return occupancyMatch && nameMatch
            })
            .sort((a, b) => {
                switch (currentSort) {
                    case "name-asc":
                        return a.name.localeCompare(b.name)
                    case "name-desc":
                        return b.name.localeCompare(a.name)
                    case "occupancy-asc":
                        return a.positions_occupied - b.positions_occupied
                    case "occupancy-desc":
                        return b.positions_occupied - a.positions_occupied
                    default:
                        return 0
                }
            })
    }, [locations, currentSort, filters])

    const handleFilterChange = (newFilters: filter) => {
        setFilters(newFilters)
    }

    return (
        <div>
            <div className="flex justify-between mb-4">
                <FilterDropdown activeFilters={filters} onFilterChange={handleFilterChange} />
                <SortDropdown options={sortOptions} currentSort={currentSort} onSortChange={setCurrentSort} />
            </div>
            {filteredAndSortedLocations.map((location) => (
                <CrowdLevelCard key={location.building_id} location={location} handleLocationSelect={handleLocationSelect} />
            ))}
        </div>
    )
}

