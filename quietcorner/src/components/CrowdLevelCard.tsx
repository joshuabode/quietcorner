import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Clock, Wifi } from "lucide-react"



const getStatusColor = (positions_occupied: string) => {
    const occupancy = Number.parseFloat(positions_occupied)
    if (isNaN(occupancy)) return "text-gray-500"
    if (occupancy >= 0.7) return "text-red-500"
    if (occupancy >= 0.4) return "text-orange-500"
    return "text-green-500"
}
const getStatusBkgd = (positions_occupied: string) => {
    const occupancy = Number.parseFloat(positions_occupied)
    if (isNaN(occupancy)) return "bg-gray-100"
    if (occupancy >= 0.7) return "bg-red-100"
    if (occupancy >= 0.4) return "bg-orange-100"
    return "bg-green-100"
}

const getStatusText = (positions_occupied: string) => {
    const occupancy = Number.parseFloat(positions_occupied)
    if (isNaN(occupancy)) return "null"
    if (occupancy >= 0.7) return "High"
    if (occupancy >= 0.4) return "Medium"
    return "Low"
}


export default function CrowdLevelCard({ location, handleLocationSelect }) {

    return (
        <Collapsible>
            <Card
                id={`collapsible-${location.building_id}`}
                style={{ marginBottom: "1rem", cursor: "pointer" }}
                onClick={() =>
                    handleLocationSelect(location.name, [location.latitude, location.longitude], location.building_id)
                }
            >
                <CollapsibleTrigger className="w-full">
                          <CardHeader>
                                     <div  className="pb-0 flex flex-row">
                                    <CardTitle>{location.name || "Unnamed Location"}</CardTitle>
                                         <ChevronDown className="h-4 w-4" />
                                        {/* Debug: Add a fallback background color */}
                                        <div className={`absolute right-7 px-3 py-3 rounded-md ${getStatusBkgd(location.positions_occupied/location.max_capacity)} font-bold mr-2 ${getStatusColor(location.positions_occupied/location.max_capacity)}`}>
                                            {getStatusText(location.positions_occupied/location.max_capacity)}
                                        </div>
                                    </div>
                                    <div className="flex flex-row">
                                        Occupancy rate: {location.positions_occupied/location.max_capacity *100}%
                                    </div>
                                 </CardHeader>
                             </CollapsibleTrigger>
                <CollapsibleContent style={{ padding: "1rem" }}>
                    <div style={{ marginTop: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                            <Clock style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }} />
                            <span style={{ fontWeight: "bold" }}>Opening Hours: </span>
                            <span> {location.opening_hours}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start" }}>
                            <Wifi style={{ marginRight: "0.5rem", height: "1rem", width: "1rem", marginTop: "0.25rem" }} />
                            <div>
                                <span style={{ fontWeight: "bold" }}>Facilities:</span>
                                <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem" }}>
                                    <li>{location.facility_1}</li>
                                    {location.facility_2 && <li>{location.facility_2}</li>}
                                    {location.facility_3 && <li>{location.facility_3}</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}

