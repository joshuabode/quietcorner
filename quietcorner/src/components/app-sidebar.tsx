"use client"

import {useState, useEffect, useRef, FormEvent, ChangeEvent, useCallback} from 'react'
import { addMinutes, format, parse, startOfDay } from 'date-fns'
import { BarChart, Calendar, ChevronDown, ChevronUp, Clock, MapPin, Plus, Upload, Users, Wifi, BookOpen, LogOut } from 'lucide-react'
import { Slider } from "@/components/ui/slider"


import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import Modal from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { eventNames } from 'process'
import { read } from 'fs'

type Location = {
    building_id: string;
    name: string;
    latitude: number;
    longitude: number;
    opening_hours: string;
    positions_occupied: string;  // Added this field
};



type TimeBlock = {
    start: Date | null
    end: Date | null
    title: string
    location: string
    timetabled: boolean
}

type AppSidebarProps = {
    onLocationSelect: (name: string, coordinates: [number, number]) => void
}


export default function AppSidebar({ onLocationSelect }: AppSidebarProps) {
    const [locations, setLocations] = useState<Location[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
    const [studyMatches, setStudyMatches] = useState<any[]>([])
    const [icsFile, setIcsFile] = useState("")
    const [modal, setModal] = useState(false);
    const [data, setData] = useState("");

    const icsInput = useRef<HTMLInputElement | null>(null)
    const studyStart = useRef<HTMLInputElement | null>(null)
    const studyEnd = useRef<HTMLInputElement | null>(null)
    const studyTitle = useRef<HTMLInputElement | null>(null)
    const studyLocation = useRef<HTMLSelectElement | null>(null)

    useEffect(() => {
        restoreCustomTimeBlocks()
    }, [])

    useEffect(() => {
        //send icsFile to server for database storage
    } 
    , [icsFile, date])


    const [state, setState] = useState<{
        locations: Location[];
        isLoading: boolean;
    }>({
        locations: [],
        isLoading: true
    });

    // Move the fetch logic outside of render
    useEffect(() => {
        const fetchData = async () => {
            try {
                const locationsResponse = await fetch("/api/locations");
                if (!locationsResponse.ok) {
                    throw new Error("Failed to fetch locations");
                }
                const locationsData = await locationsResponse.json();

                setState({
                    locations: locationsData,
                    isLoading: false
                });
            } catch (error) {
                console.error("Error fetching data:", error);
                setState(prev => ({ ...prev, isLoading: true }));
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 2000); // Update every 2 seconds

        return () => clearInterval(intervalId);
    }, []);

    const handleLocationSelect = useCallback((name: string, coordinates: [number, number]) => {
        onLocationSelect(name, coordinates);
    }, [onLocationSelect]);

    const getStatusColor = (positions_occupied: string) => {
        const occupancy = parseInt(positions_occupied);
        if (isNaN(occupancy)) return "text-gray-500";
        if (occupancy >= 500) return "text-red-500";
        if (occupancy >= 300) return "text-orange-500";
        return "text-green-500";
    };

    const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const crowdLevel = formData.get("crowd_level")
        try {
            console.log(formData.get("location"), crowdLevel, formData.get("comments"))
            const response = await fetch("/api/report_crowd", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    location_id: formData.get("location"),
                    crowd_level: Number.parseFloat(crowdLevel as string),
                    comments: formData.get("comments"),
                }),
            })
            if (response.ok) {
                console.log("Crowd report submitted successfully")
            } else {
                console.error("Failed to submit crowd report")
            }
        } catch (error) {
            console.error("Error submitting crowd report:", error)
        }
    }
    //
    // const handleStudyRequest = async (event: FormEvent<HTMLFormElement>) => {
    //     event.preventDefault()
    //     const formData = new FormData(event.currentTarget)
    //     try {
    //         const response = await fetch('/study_request', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 user_id: 1, // Replace with actual user ID from authentication
    //                 location_id: formData.get('study-location'),
    //                 subject: formData.get('study-subject'),
    //                 preferred_time: formData.get('study-time'),
    //             }),
    //         })
    //         if (response.ok) {
    //             console.log('Study request submitted successfully')
    //             fetchStudyMatches()
    //         } else {
    //             console.error('Failed to submit study request')
    //         }
    //     } catch (error) {
    //         console.error('Error submitting study request:', error)
    //     }
    // }
    //
    // const fetchStudyMatches = async () => {
    //     try {
    //         const response = await fetch('/study_matches?user_id=1') // Replace with actual user ID from authentication
    //         if (response.ok) {
    //             const data = await response.json()
    //             setStudyMatches(data)
    //         } else {
    //             console.error('Failed to fetch study matches')
    //         }
    //     } catch (error) {
    //         console.error('Error fetching study matches:', error)
    //     }
    // }

        
    const addCustomTimeBlock = (block : TimeBlock) => {
        // If the block argument is passed, then add that as the block.
        // Otherwise, create a block from the modal form
        let isBlock = Boolean(block.start && block.end)
        const newBlock: TimeBlock = isBlock ? block :
        {
            start: new Date(studyStart.current?.value ?? ""),
            end: new Date(studyEnd.current?.value ?? ""),
            title: studyTitle.current?.value ?? "",
            location: studyLocation.current?.value ?? "",
            timetabled: false
        }
        setTimeBlocks(timeBlocks => [...timeBlocks, newBlock])

        setModal(false)
        let storedBlocks : string | null = localStorage.getItem("customStudyBlocks")
        if (storedBlocks && !isBlock) {
            let customBlocks : TimeBlock[] = JSON.parse(storedBlocks)
            localStorage.setItem("customStudyBlocks", JSON.stringify([...customBlocks, newBlock]))
        } else if (!isBlock) {
            localStorage.setItem("customStudyBlocks", JSON.stringify([newBlock]))
        }
    }

    const restoreCustomTimeBlocks = () => {
        let storedBlocks : string | null = localStorage.getItem("customStudyBlocks")
        if (storedBlocks) {
            let customBlocks : TimeBlock[] = JSON.parse(storedBlocks)
            for (let i in customBlocks) {
                if (customBlocks[i].start) {
                    customBlocks[i].start = new Date(customBlocks[i].start)
                }
                if (customBlocks[i].end) {
                    customBlocks[i].end = new Date(customBlocks[i].end)
                }
            }
            customBlocks.forEach(addCustomTimeBlock)
        }
    }

    const addTimeBlocks = (icsData: string) => {
        const newBlocks: TimeBlock[] = []
        let block: TimeBlock = {start: new Date(), end: new Date(), title: "", location: "", timetabled: true}
        for (const line of icsData.split("\n")) {
            if (line.startsWith("BEGIN:VEVENT")) {
                block = {start: null, end: null, title: "", location: "", timetabled: true}
            } else if (line.startsWith("DTSTART:")) {
                let str = line.slice("DTSTART:".length)
                str = str.slice(0,4) + '-' 
                            + str.slice(4,6) + '-' 
                            + str.slice(6,11) + ':'
                            + str.slice(11, 13) + ':'
                            + str.slice(13, 15) + '.000Z'
                block.start = new Date(str)
            } else if (line.startsWith("DTEND:")) {
                let str = line.slice("DTEND:".length)
                str = str.slice(0,4) + '-' 
                            + str.slice(4,6) + '-' 
                            + str.slice(6,11) + ':'
                            + str.slice(11, 13) + ':'
                            + str.slice(13, 15) + '.000Z'
                block.end = new Date(str)
            } else if (line.startsWith("SUMMARY:")) {
                block.title = line.slice("SUMMARY:".length)
            } else if (line.startsWith("LOCATION:")) {
                let str = line.slice("LOCATION:".length)
                block.location = str
            } else if (line.startsWith("END:VEVENT")) {
                newBlocks.push(block)
            }
        }
            
        setTimeBlocks(timeBlocks.concat(newBlocks))
    }

    const handleIcsClick = () => {
        if (icsInput.current)
            icsInput.current.click()
        else
            return
    }

    const handleIcsFile = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0]
            const reader = new FileReader()
            reader.readAsText(file)
            reader.onloadend = () => {
                if (typeof reader.result === "string") {
                    setIcsFile(reader.result)
                    addTimeBlocks(reader.result)
                }

            }
        }
    }


    const handleLocationClick = (location: Location) => {
        onLocationSelect(location.name, [location.latitude, location.longitude])
    }

    const courses = ['COMP12111', 'COMP11120', 'COMP15111', 'COMP16321']



    return (
        <Sidebar className="w-[400px]">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="sm">
                            <MapPin className="mr-2 h-5 w-5" />
                            Quiet Corner
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <Tabs defaultValue="crowd-levels" className="w-full h-full">
                    <div className="flex h-full">
                        <TabsList className="flex flex-col h-full space-y-2 bg-muted p-2">
                            <TabsTrigger value="crowd-levels" className="justify-start">
                                <Users className="mr-2 h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="report" className="justify-start">
                                <BarChart className="mr-2 h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="justify-start">
                                <Calendar className="mr-2 h-4 w-4" />

                            </TabsTrigger>
                            <TabsTrigger value="study-match" className="justify-start">
                                <BookOpen className="mr-2 h-4 w-4" />

                            </TabsTrigger>
                        </TabsList>
                        <div className="flex-1 p-4">
                            <TabsContent value="crowd-levels">
                                <SidebarGroup>
                                    <SidebarGroupLabel>Current Crowd Levels</SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        {state.isLoading ? (<>
                                            <p className="text-sm text-gray-500">Loading...</p>
                                        </>
                                   
                                        ) : (
                                            state.locations.map((location) => (
                                                <Collapsible key={location.building_id}>
                                                    <Card
                                                        className="mb-4 cursor-pointer"
                                                        onClick={() => handleLocationSelect(location.name, [location.latitude, location.longitude])}
                                                    >
                                                        <CollapsibleTrigger className="w-full">
                                                            <CardHeader className="pb-2 flex justify-between items-center">
                                                                <CardTitle>{location.name}</CardTitle>
                                                                <div className={`font-bold ${getStatusColor(location.positions_occupied)}`}>
                                                                    {location.positions_occupied}
                                                                </div>
                                                                <ChevronDown className="h-4 w-4 ml-2" />
                                                            </CardHeader>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="px-4 pb-4">
                                                            <div className="mt-2 space-y-2">
                                                                <div className="flex items-center">
                                                                    <Clock className="mr-2 h-4 w-4"/>
                                                                    <span
                                                                        className="font-semibold">Opening Hours: </span>
                                                                    <span> {location.opening_hours}</span>
                                                                </div>
                                                                <div className="flex items-start">
                                                                    <Wifi className="mr-2 h-4 w-4 mt-1"/>
                                                                    <div>
                                                                        <span
                                                                            className="font-semibold">Facilities:</span>
                                                                        <ul className="list-disc list-inside pl-4">
                                                                            <li>{location.facility_1}</li>
                                                                            <li>{location.facility_2}</li>
                                                                            <li>{location.facility_3}</li>
                                                                                </ul>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </CollapsibleContent>
                                                    </Card>
                                                </Collapsible>
                                            ))
                                        )}
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </TabsContent>
                            <TabsContent value="report">
                                <SidebarGroup>
                                    <SidebarGroupLabel>Report Crowd Level</SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <form className="space-y-4" onSubmit={handleReportSubmit}>
                                            <div>
                                                <Label htmlFor="location">Location</Label>
                                                <Select name="location">
                                                    <SelectTrigger id="location">
                                                        <SelectValue placeholder="Select location"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {state.locations.map((location) => (
                                                            <SelectItem key={location.building_id}
                                                                        value={location.name}>
                                                                {location.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Crowd Level</Label>
                                                <Slider
                                                    id="crowd_level"
                                                    name="crowd_level"
                                                    defaultValue={[0]}
                                                    max={1}
                                                    step={0.01}
                                                    onValueChange={(value) => {
                                                        // You can add any additional logic here if needed
                                                        console.log("Crowd level:", value[0])
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="comments">Comments (optional)</Label>
                                                <Input id="comments" name="comments"
                                                       placeholder="Any additional information..."/>
                                            </div>
                                            <Button type="submit">Submit Report</Button>
                                        </form>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </TabsContent>
                            <TabsContent value="schedule" className="h-full">
                                <SidebarGroup className="h-full">
                                    <SidebarGroupLabel>Schedule</SidebarGroupLabel>
                                    <SidebarGroupContent className="h-full">
                                        <div className="flex flex-col h-full">
                                        <CalendarComponent
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                className="rounded-md border mb-4"
                                            />
                                            <div className="flex-1 overflow-hidden">
                                                <Label>Timetable for {date?.toDateString()}</Label>
                                                <ScrollArea className="h-[300px] mt-2 border rounded-md">
                                                    <div className="relative w-full" style={{ height: '1440px' }}>
                                                    {Array.from({ length: 24 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="absolute left-0 right-0 border-t border-gray-200 text-xs text-gray-500 pl-1"
                                                                style={{ top: `${(i / 24) * 100}%` }}
                                                            >
                                                                {`${i.toString().padStart(2, '0')}:00`}
                                                            </div>
                                                        ))}
                                                        {timeBlocks.map((block, index) => { 
                                                            if (block.start?.toDateString() === date?.toDateString()) {
                                                                return(
                                                                    <div
                                                                        id={index}
                                                                        className={`absolute left-0 right-0 ${block.timetabled ? 'bg-blue-600/30' : 'bg-red-500/30'} rounded p-2 text-xs`}
                                                                        style={{
                                                                            top: `${(block.start.getHours() * 60 + block.start.getMinutes()) / 1440 * 100}%`,
                                                                            height: `${((block.end.getHours() - block.start.getHours()) * 60 + (block.end.getMinutes() - block.start.getMinutes())) / 1440 * 100}%`,
                                                                        }}
                                                                    >
                                                                        <strong>{block.title}</strong>
                                                                        <br />
                                                                        {block.location}
                                                                        <br />
                                                                        {format(block.start, 'HH:mm')} - {format(block.end, 'HH:mm')}
                                                                    </div>
                                                            )}
                                                            })}
                                                
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                            <div className="flex justify-between mt-4">
                                            
                                                <Modal openModal={modal} closeModal={() => setModal(false)}>
                                                    
                                                    <div>
                                                    <Label htmlFor="start-time">
                                                        Start:
                                                    </Label>

                                                    <Input
                                                    type="datetime-local"
                                                    id="start-time"
                                                    name="start"
                                                    ref={studyStart}
                                                    />  
                                                    </div>
                                                    <div>
                                                    <Label htmlFor="end-time">
                                                        Finish:
                                                    </Label>
                                                    <Input
                                                    type="datetime-local"
                                                    id="end-time"
                                                    name="end"
                                                    ref={studyEnd}
                                                    />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="title">
                                                            Label:
                                                        </Label>
                                                        <Input type="text"
                                                        ref={studyTitle}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="location">
                                                            Location:
                                                        </Label>
                                        
                                                        <select name="location" ref={studyLocation} className='border border-gray-300 text-gray-900 rounded-lg h-12'>
                                                            <option value="Main Library">Main Library</option>
                                                            <option value="Stopford Building Library">Stopford Building Library</option>
                                                            <option value="Alan Gilbert Learning Commons">Alan Gilbert Learning Commons</option>

                                                        </select>
                                                    </div>
                                                    <Button onClick={addCustomTimeBlock}>Add</Button>   
                                                </Modal>
                                                <Button onClick={() => setModal(true)}>
                                                    <Plus className="mr-2 h-4 w-4" /> Add Time Block
                                                </Button>
                                                <div>
                                                    <form action="">
                                                         <input
                                                        type="file"
                                                        id="ics-upload"
                                                        accept=".ics"
                                                        className="sr-only"
                                                        ref={icsInput}
                                                        onChange={handleIcsFile}
                                                    />
                                                    </form>
                                                    <Button onClick={handleIcsClick}>
                                                        <Upload className="mr-2 h-4 w-4" /> Upload .ics
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </TabsContent>
                            <TabsContent value="study-match">
                                <SidebarGroup>
                                    <SidebarGroupLabel>Study Match</SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        <form className="space-y-4">
                                            <div>
                                                <Label htmlFor="study-location">Study Location</Label>
                                                <Select name="study-location">
                                                    <SelectTrigger id="study-location">
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {locations.map((location) => (
                                                            <SelectItem key={location.id} value={location.id.toString()}>
                                                                {location.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="study-subject">Subject</Label>
                                                <Input id="study-subject" name="study-subject" placeholder="Enter your subject" />
                                            </div>
                                            <div>
                                                <Label htmlFor="study-time">Preferred Study Time</Label>
                                                <Input type="time" id="study-time" name="study-time" />
                                            </div>
                                            <Button type="submit">Find Study Partners</Button>
                                        </form>
                                        <div className="mt-4">
                                            <h3 className="font-semibold mb-2">Matched Study Partners</h3>
                                            {studyMatches.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {studyMatches.map((match, index) => (
                                                        <li key={index} className="border p-2 rounded">
                                                            <p>Location: {match.location_name}</p>
                                                            <p>Subject: {match.subject}</p>
                                                            <p>Time: {match.preferred_time}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500">No matches found yet. Submit the form to find study partners.</p>
                                            )}
                                        </div>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </SidebarContent>
        </Sidebar>
    )};
