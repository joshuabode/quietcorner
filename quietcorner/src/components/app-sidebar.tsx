/* eslint-disable */
"use client"

import {useState, useEffect, useRef, FormEvent, ChangeEvent, useCallback} from 'react'
import { format} from 'date-fns'
import { BarChart, Calendar, CircleChevronRight, CircleChevronLeft, Clock, MapPin, Plus, Upload, Users, Wifi, BookOpen, LogOut } from 'lucide-react'
import { Slider } from "@/components/ui/slider"


import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    useSidebar
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CrowdLevelCardList } from '@/components/CrowdLevelCardList'

export type StudyLocation = {
    building_id: string
    name: string
    latitude: number
    longitude: number
    opening_hours: string
    positions_occupied: number // Added this field
    max_capacity: number
    facility_1: string
    facility_2: string
    facility_3: string
}

type TimeBlock = {
    start: Date
    end: Date
    title: string
    location: string
    timetabled: boolean
}

type ReportResponse = {
    message: string | null
    successful: boolean
}

type AppSidebarProps = {
    onLocationSelect: (name: string, coordinates: [number, number]) => void
}

export function AppSidebar({ onLocationSelect }: AppSidebarProps) {

    const [locations, setLocations] = useState<StudyLocation[]>([])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
    const [studyMatches, setStudyMatches] = useState<any[]>([])
    const [modal, setModal] = useState(false);
    const [reportResponse, setReportResponse] = useState<ReportResponse>({message: "", successful: true});


    const icsInput = useRef<HTMLInputElement | null>(null)
    const studyStart = useRef<HTMLInputElement | null>(null)
    const studyEnd = useRef<HTMLInputElement | null>(null)
    const studyTitle = useRef<HTMLInputElement | null>(null)
    const studyLocation = useRef<HTMLSelectElement | null>(null)

    const {
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      } = useSidebar()

    useEffect(() => {
        restoreCustomTimeBlocks()
    }, [])

    const [crowdLevelState, setCrowdLevelState] = useState<{
        locations: StudyLocation[]
        isLoading: boolean
    }>({
        locations: [],
        isLoading: true,
    })

    // Move the fetch logic outside of render
    useEffect(() => {

        fetchData()
        fetchCalendar()

        const intervalId = setInterval(fetchData, 2000) // Update every 2 seconds

        return () => clearInterval(intervalId)
    }, [])

    const handleLocationSelect = useCallback(
        (name: string, coordinates: [number, number], buildingId: string) => {
            onLocationSelect(name, coordinates)
        },
        [onLocationSelect],
    )

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

    const handleReportSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const crowdLevel = formData.get("crowd_level")
        const urlParams = new URLSearchParams(window.location.search)
        try {
            const response = await fetch("/api/report_crowd", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    timestamp: Date.now(),
                    location_id: formData.get("location"),
                    username: urlParams.get('username'),
                    crowd_level: Number.parseFloat(crowdLevel as string),
                    comments: formData.get("comments"),
                }),
            })
            if (response.ok) {
                setReportResponse({successful: true, message: "Crowd report submitted successfully"})
            } else {
                console.error("Failed to submit crowd report")
                let responseBody = await response.json()
                setReportResponse({successful: false, message: "Failed to submit crowd report: " + responseBody.message})
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

    const addCustomTimeBlock = (block: TimeBlock|null) => {
        // If the block argument is passed, then add that as the block.
        // Otherwise, create a block from the modal form
        const isBlock = block && Boolean(block.start && block.end)
        const newBlock: TimeBlock = isBlock
            ? block
            : {
                start: new Date(studyStart.current?.value ?? ""),
                end: new Date(studyEnd.current?.value ?? ""),
                title: studyTitle.current?.value ?? "",
                location: studyLocation.current?.value ?? "",
                timetabled: false,
            }
        setTimeBlocks((timeBlocks) => [...timeBlocks, newBlock])

        setModal(false)
        const storedBlocks: string | null = localStorage.getItem("customStudyBlocks")
        if (storedBlocks && !isBlock) {
            const customBlocks: TimeBlock[] = JSON.parse(storedBlocks)
            localStorage.setItem("customStudyBlocks", JSON.stringify([...customBlocks, newBlock]))
        } else if (!isBlock) {
            localStorage.setItem("customStudyBlocks", JSON.stringify([newBlock]))
        }
    }

    const restoreCustomTimeBlocks = () => {
        const storedBlocks: string | null = localStorage.getItem("customStudyBlocks")
        if (storedBlocks) {
            const customBlocks: TimeBlock[] = JSON.parse(storedBlocks)
            for (const i in customBlocks) {
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
        let block: TimeBlock = { start: new Date(), end: new Date(), title: "", location: "", timetabled: true }
        for (const line of icsData.split("\n")) {
            if (line.startsWith("BEGIN:VEVENT")) {
                block = { start: new Date(0), end:  new Date(0), title: "", location: "", timetabled: true }
            } else if (line.startsWith("DTSTART:")) {
                let str = line.slice("DTSTART:".length)
                str =
                    str.slice(0, 4) +
                    "-" +
                    str.slice(4, 6) +
                    "-" +
                    str.slice(6, 11) +
                    ":" +
                    str.slice(11, 13) +
                    ":" +
                    str.slice(13, 15) +
                    ".000Z"
                block.start = new Date(str)
            } else if (line.startsWith("DTEND:")) {
                let str = line.slice("DTEND:".length)
                str =
                    str.slice(0, 4) +
                    "-" +
                    str.slice(4, 6) +
                    "-" +
                    str.slice(6, 11) +
                    ":" +
                    str.slice(11, 13) +
                    ":" +
                    str.slice(13, 15) +
                    ".000Z"
                block.end = new Date(str)
            } else if (line.startsWith("SUMMARY:")) {
                block.title = line.slice("SUMMARY:".length)
            } else if (line.startsWith("LOCATION:")) {
                const str = line.slice("LOCATION:".length)
                block.location = str
            } else if (line.startsWith("END:VEVENT")) {
                newBlocks.push(block)
            }
        }

        setTimeBlocks(timeBlocks.concat(newBlocks))
    }

    const handleIcsClick = () => {
        if (icsInput.current) icsInput.current.click()
        else return
    }

    const handleIcsFile = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0]
            const reader = new FileReader()
            reader.readAsText(file)
            reader.onloadend = () => {
                if (typeof reader.result === "string") {
                    addTimeBlocks(reader.result)
                    postCalendar(reader.result)
                }
            }
        }
    }

    const fetchData = async () => {
        try {
            const locationsResponse = await fetch("/api/locations")
            if (!locationsResponse.ok) {
                throw new Error("Failed to fetch locations")
            }
            const locationsData = await locationsResponse.json()

            setCrowdLevelState({
                locations: locationsData,
                isLoading: false,
            })
        } catch (error) {
            console.error("Error fetching data:", error)
            setCrowdLevelState((prev) => ({ ...prev, isLoading: true }))
        }
    }

    const fetchCalendar = async () => {
        const urlParams = new URLSearchParams(window.location.search)
        try {
            const calendarResponse = await fetch(`api/fetch_calendar/${urlParams.get('username')}`,{
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }});
            let calendarResponseBody = await calendarResponse.json()
            if (calendarResponse.ok) {
                addTimeBlocks(calendarResponseBody.data)
            } else {
                console.error("Failed to fetch calendar: " + calendarResponseBody.message)
            }
        } catch (error) {
            console.error("Error while fetching calendar data:", error)
        }
    }

    const postCalendar = async (calendarData: string) => {
        console.log(calendarData)
        const urlParams = new URLSearchParams(window.location.search)
        try {
            const response = await fetch("/api/upload_calendar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: calendarData,
                    username: urlParams.get('username'),
                }),
            })
            if (!response.ok) {
                let responseBody = await response.json()
                console.error("Failed to upload calendar: " + responseBody.message)
            } else {}
        } catch (error) {
            console.error("Error submitting crowd report:", error)
        }
    }

    return (
        <>
        <div onClick={() => {toggleSidebar()}} className='md:hidden md:h-0 absolute left-5 bottom-5 z-10 bg-white size-12 flex-col flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-lg'>
            <CircleChevronRight/>
        </div>
        <Sidebar collapsible="icon" className="w-full lg:w-[800px] ">
            <div onClick={() => {toggleSidebar()}} className='md:hidden md:h-0 absolute right-5 top-5 z-10 bg-white size-12 flex-col flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-lg'>
            <CircleChevronLeft/>
            </div>
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
                            <TabsTrigger onClick={() => {setOpen(true)}} value="crowd-levels" className="justify-start">
                                <Users className="mr-3 h-6 w-6" />
                                <div className="hidden sm:block">Crowd Levels</div>
                            </TabsTrigger>
                            <TabsTrigger onClick={() => {setOpen(true)}} value="report" className="justify-start">
                                <BarChart className="mr-3 h-6 w-6"/>
                                <div className="hidden sm:block">Report Crowd Level</div>
                            </TabsTrigger>
                            <TabsTrigger onClick={() => {setOpen(true)}} value="schedule" className="justify-start">
                                <Calendar className="mr-3 h-6 w-6"/>
                                <div className="hidden sm:block">Schedule</div>
                            </TabsTrigger>
                            <TabsTrigger onClick={() => {setOpen(true)}} value="study-match" className="justify-start">
                                <BookOpen className="mr-3 h-6 w-6"/>
                                <div className="hidden sm:block">Study Match</div>
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex-1 p-4">
                            <TabsContent value="crowd-levels">
                                <SidebarGroup>
                                    <SidebarGroupLabel className="text-lg">Current Crowd Levels</SidebarGroupLabel>
                                    <SidebarGroupContent>
                                        {crowdLevelState.isLoading ? (
                                            <>
                                                <p className="text-sm text-gray-500">Loading...</p>
                                            </>
                                        ) : (
                                                <div className="container mx-auto p-4">
                                                    <h1 className="text-2xl font-bold mb-4">Locations</h1>
                                                    <CrowdLevelCardList
                                                        locations={crowdLevelState.locations}
                                                        handleLocationSelect={handleLocationSelect}
                                                    />
                                                </div>
                                                // <Collapsible
                                                //     key={location.building_id}
                                                //     onOpenChange={(open) => {
                                                //         if (open) {
                                                //             setTimeout(() => {
                                                //                 const element = document.getElementById(`collapsible-${location.building_id}`)
                                                //                 element?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                                                //             }, 100)
                                                //         }
                                                //     }}
                                                // >
                                                //     <Card
                                                //         id={`collapsible-${location.building_id}`}
                                                //         className="mb-4 cursor-pointer"
                                                //         onClick={() =>
                                                //             handleLocationSelect(
                                                //                 location.name,
                                                //                 [location.latitude, location.longitude],
                                                //                 location.building_id,
                                                //             )
                                                //         }
                                                //     >
                                                //         <CollapsibleTrigger className="w-full">
                                                //             <CardHeader>
                                                //                 <div  className="pb-0 flex flex-row">
                                                //                 <CardTitle>{location.name || "Unnamed Location"}</CardTitle>
                                                //                     <ChevronDown className="h-4 w-4" />
                                                //                     {/* Debug: Add a fallback background color */}
                                                //                     <div className={`absolute right-4 px-3 py-3 rounded-md ${getStatusBkgd(location.positions_occupied/location.max_capacity)} font-bold mr-2 ${getStatusColor(location.positions_occupied/location.max_capacity)}`}>
                                                //                         {getStatusText(location.positions_occupied/location.max_capacity)}
                                                //                     </div>
                                                //                 </div>
                                                //                 <div className="flex flex-row">
                                                //                     Occupancy rate: {location.positions_occupied/location.max_capacity *100}%
                                                //                 </div>
                                                //             </CardHeader>
                                                //         </CollapsibleTrigger>
                                                //         <CollapsibleContent className="px-4 pb-4">
                                                //             <div className="mt-2 space-y-2">
                                                //                 <div className="flex items-center">
                                                //                     <Clock className="mr-2 h-4 w-4" />
                                                //                     <span className={`font-semibold  `}>Opening Hours: </span>
                                                //                     <span> {location.opening_hours}</span>
                                                //                 </div>
                                                //                 <div className="flex items-start">
                                                //                     <Wifi className="mr-2 h-4 w-4 mt-1" />
                                                //                     <div>
                                                //                         <span className="font-semibold">Facilities:</span>
                                                //                         <ul className="list-disc list-inside pl-4">
                                                //                             <li>☕{location.facility_1}</li>
                                                //                             <li>📖{location.facility_2}</li>
                                                //                             <li>🤔{location.facility_3}</li>
                                                //                         </ul>
                                                //                     </div>
                                                //                 </div>
                                                //             </div>
                                                //         </CollapsibleContent>
                                                //     </Card>
                                                // </Collapsible>
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
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {crowdLevelState.locations.map((location) => (
                                                            <SelectItem key={location.building_id} value={location.name}>
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
                                                <Input id="comments" name="comments" placeholder="Any additional information..." />
                                            </div>
                                            <Button type="submit">Submit Report</Button>
                                            <div>
                                                <p className={`text-${reportResponse.successful ? 'green': 'red'}-500`}>
                                                    {reportResponse.message}
                                                </p>
                                            </div>
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
                                                className="rounded-md border m-auto"
                                            />
                                            <div className="flex-1 overflow-hidden">
                                                <Label>Timetable for {date?.toDateString()}</Label>
                                                <ScrollArea className="h-[300px] mt-2 border rounded-md">
                                                    <div className="relative w-full" style={{ height: "1440px" }}>
                                                        {Array.from({ length: 24 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="absolute left-0 right-0 border-t border-gray-200 text-xs text-gray-500 pl-1"
                                                                style={{ top: `${(i / 24) * 100}%` }}
                                                            >
                                                                {`${i.toString().padStart(2, "0")}:00`}
                                                            </div>
                                                        ))}
                                                        {timeBlocks.map((block, index) => {
                                                            if (block.start?.toDateString() === date?.toDateString()) {
                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        className={`absolute left-0 right-0 ${block.timetabled ? "bg-blue-600/30" : "bg-red-500/30"} rounded p-2 text-xs`}
                                                                        style={{
                                                                            top: `${((block.start.getHours() * 60 + block.start.getMinutes()) / 1440) * 100}%`,
                                                                            height: `${(((block.end.getHours() - block.start.getHours()) * 60 + (block.end.getMinutes() - block.start.getMinutes())) / 1440) * 100}%`,
                                                                        }}
                                                                    >
                                                                        <strong>{block.title}</strong>
                                                                        <br />
                                                                        {block.location}
                                                                        <br />
                                                                        {format(block.start, "HH:mm")} - {format(block.end, "HH:mm")}
                                                                    </div>
                                                                )
                                                            }
                                                        })}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                            <div className="flex justify-between mt-4">
                                                <Modal openModal={modal} closeModal={() => setModal(false)}>
                                                    <div>
                                                        <Label htmlFor="start-time">Start:</Label>

                                                        <Input type="datetime-local" id="start-time" name="start" ref={studyStart} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="end-time">Finish:</Label>
                                                        <Input type="datetime-local" id="end-time" name="end" ref={studyEnd} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="title">Label:</Label>
                                                        <Input type="text" ref={studyTitle} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="location">Location:</Label>

                                                        <select
                                                            name="location"
                                                            ref={studyLocation}
                                                            className="border border-gray-300 text-gray-900 rounded-lg h-12"
                                                        >
                                                            <option value="Main Library">Main Library</option>
                                                            <option value="Stopford Building Library">Stopford Building Library</option>
                                                            <option value="Alan Gilbert Learning Commons">Alan Gilbert Learning Commons</option>
                                                        </select>
                                                    </div>
                                                    <Button onClick={() => {addCustomTimeBlock(null)}}>Add</Button>
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
                                                            <SelectItem key={location.building_id} value={location.building_id.toString()}>
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
                                                <p className="text-sm text-gray-500">
                                                    No matches found yet. Submit the form to find study partners.
                                                </p>
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
        </>
    )
}

