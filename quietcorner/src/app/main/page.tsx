/* eslint-disable */

"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { Circle, Style, Fill, Stroke } from 'ol/style';
import { AppSidebar, StudyLocation } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import Overlay from 'ol/Overlay';
import Geolocation from "ol/Geolocation"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { getStatusText } from '@/components/CrowdLevelCard';
import { Coordinate } from 'ol/coordinate';

function MapLayout() {
    const [authenticated, setAuthentication] = useState(true)
    const [locations, setLocations] = useState<StudyLocation[]>([]);
    const [map, setMap] = useState<Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const mapElement = useRef<HTMLDivElement>(null);
    const vectorSource = new VectorSource();
    const popupElement = useRef<HTMLDivElement>(null);
    const [popup, setPopup] = useState<Overlay | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [geolocation, setGeolocation] = useState<Geolocation | null>(null);
    const [
        open,
        setOpen] = useState(true);


    useEffect(() => {
        authAPI()
        const fetchData = async () => {
            try {
                const locationsResponse = await fetch("/api/locations");
                if (!locationsResponse.ok) {
                    throw new Error("Failed to fetch locations");
                }
                const locationsData = await locationsResponse.json();
                setLocations(locationsData); // Update state with new locations
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };


        fetchData();

        const intervalId = setInterval(fetchData, 2000); // Update every 2s


        return () => clearInterval(intervalId);
    }, []);



    useEffect(() => {
        if (!map) {
            const initialMap = new Map({
                target: mapElement.current!,
                layers: [
                    new TileLayer({
                        source: new OSM(),
                    }),
                    new VectorLayer({
                        source: vectorSource,
                    }),
                ],
                view: new View({
                    center: fromLonLat([-2.2339, 53.4668]), // Manchester city center
                    zoom: 15,
                }),
            });


            setMap(initialMap);
            const newPopup = new Overlay({
                element: popupElement.current!,
                positioning: "bottom-center",
                offset: [0, -10],
                autoPan: {
                    animation: {
                        duration: 250,
                },}
            })

            initialMap.addOverlay(newPopup)
            setPopup(newPopup)

            initialMap.on("click", (event) => {
                const feature = initialMap.forEachFeatureAtPixel(event.pixel, (feature) => feature)
                if (feature) {
                    setSelectedLocation(feature.get("name"))
                } else {
                    setSelectedLocation(null)
                    setExpandedCard(null)
                }
            })

        }
    }, [map, vectorSource])

    useEffect(() => {
        if (!map) return;

        vectorSource.clear(); // Remove old markers


        locations.forEach((location) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([location.longitude, location.latitude])),
                name: location.name,
                population: location.positions_occupied,
            });

            const style = createFeatureStyle(location.max_capacity, location.positions_occupied);
            feature.setStyle(style);

            vectorSource.addFeature(feature);


        })
        const geo = new Geolocation({
            trackingOptions: {
                enableHighAccuracy: true,
            },
            projection: map.getView().getProjection(),
        })

        geo.setTracking(true)

        const positionFeature = new Feature()
        positionFeature.setStyle(
            new Style({
                image: new Circle({
                    radius: 12,
                    fill: new Fill({
                        color: "#3399CC",
                    }),
                    stroke: new Stroke({
                        color: "#fff",
                        width: 2,
                    }),
                }),
            }),
        )

        vectorSource.addFeature(positionFeature)
        let lastValidCoordinates: Coordinate | null = null

        const updatePosition = () => {
            const newCoordinates = geo.getPosition()
            if (newCoordinates && Number.isFinite(newCoordinates[0])) {
                lastValidCoordinates = newCoordinates
                positionFeature.setGeometry(new Point(newCoordinates))
            } else if (lastValidCoordinates) {
                positionFeature.setGeometry(new Point(lastValidCoordinates))
            }
        }

        geo.on("change:position", updatePosition)

        const updateInterval = setInterval(updatePosition, 1000)

        setGeolocation(geo)

        return () => {
            clearInterval(updateInterval)
            geo.setTracking(false)
            geo.un("change:position", updatePosition)
        }


        setGeolocation(geo)
    }, [locations, map, vectorSource])
    useEffect(() => {
        if (map && popup && expandedCard) {
            const location = locations.find((l) => l.name === expandedCard)
            if (location) {
                const coordinates = fromLonLat([location.longitude, location.latitude])
                popup.setPosition(coordinates)
                map.getView().animate({
                    center: coordinates,
                    zoom: 18,
                    duration: 800,
                })
            }
        } else if (popup) {
            popup.setPosition(undefined)
        }
    }, [expandedCard, locations, map, popup])


    const authAPI = async () => {
        try {
            const authenticationResponse = await fetch('http://localhost:5000/api/login'+window.location.search, {
                method: 'GET',
                headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Credentials': 'true'},
                mode: 'cors',
                credentials: 'include',

            });
            const data = await authenticationResponse.json();

            if (!data.auth)
                location.replace(data.url);
            setAuthentication(data.auth);
            return data.auth
        } catch(error) {
            console.error("An error occured during authentication" + error)
        }


    }



    // const initializeMap = () => {
    //     const initialMap = new Map({
    //         target: mapElement.current!,
    //         layers: [
    //             new TileLayer({
    //                 source: new OSM(),
    //             }),
    //         ],
    //         view: new View({
    //             center: fromLonLat([-2.2339, 53.4668]), // Manchester city center
    //             zoom: 15,
    //         }),
    //     });
    //
    //     const vectorSource = new VectorSource();
    //     const vectorLayer = new VectorLayer({
    //         source: vectorSource,
    //     });
    //
    //     initialMap.addLayer(vectorLayer);
    //
    //     locations.forEach((location) => {
    //         const feature = new Feature({
    //             geometry: new Point(fromLonLat([location.longitude, location.latitude])),
    //             name: location.name,
    //             population: location.max_capacity,
    //         });
    //
    //         const style = createFeatureStyle(location.max_capacity, location.positions_occupied);
    //         feature.setStyle(style);
    //
    //         vectorSource.addFeature(feature);
    //     });
    //     const popup = new Overlay({
    //         element: popupElement.current!,
    //         positioning: 'bottom-center',
    //         offset: [0, -10],
    //     });
    //     initialMap.addOverlay(popup);
    //
    //
    //     initialMap.on('click', (event) => {
    //         const feature = initialMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);
    //         if (feature) {
    //             const coordinates = (feature.getGeometry() as Point).getCoordinates();
    //             popup.setPosition(coordinates);
    //             setSelectedLocation(feature.get('name'));
    //         } else {
    //             popup.setPosition(undefined);
    //             setSelectedLocation(null);
    //         }
    //     });
    //
    //     setMap(initialMap);
    // };

    const createFeatureStyle = (capacity: number, population: number) => {
        console.log(population/capacity)
        const color = `hsl(${120*(1 - population/capacity)}, 100%, 50%)`;
        const radius = Math.sqrt(capacity/2);

        return new Style({
            image: new Circle({
                radius: radius,
                fill: new Fill({ color: color }),
                stroke: new Stroke({ color: '#FFFFFF', width: 2 })
            })
        });
    };

    const handleLocationSelect = (name: string) => {
        setSelectedLocation(name)
        setExpandedCard(name)
    }

    const handleCardClose = () => {
        setExpandedCard(null)
    }

    const handleCenterOnUser = () => {
        if (geolocation && map) {
            const coordinates = geolocation.getPosition()
            if (coordinates) {
                map.getView().animate({
                    center: coordinates,
                    zoom: 18,
                    duration: 1000,
                })
            }
        }
    }

    if (authenticated) {return (
        <div>
            <SidebarProvider open={open} defaultOpen={true} onOpenChange={setOpen}>
                <AppSidebar onLocationSelect={handleLocationSelect} />
                <SidebarInset>
                    <div className="flex-1 flex-row relative w-full" ref={mapElement}>
                        <div ref={popupElement} className="ol-popup">
                            {selectedLocation && (
                                <div className="bg-white p-2 rounded shadow">
                                    <h3 className="font-bold">{selectedLocation}</h3>
                                    <p>Crowd Level: {
                                        (() => {
                                            const location = locations.find(l => l.name === selectedLocation);
                                            if (location) {
                                                return getStatusText(location.positions_occupied/location.max_capacity);
                                            }
                                        })()
                                    }</p>
                                </div>
                            )}
                        </div>
                        <div className="hidden md:flex absolute bottom-4 left-4 z-10 w-80 h-20 flex-col items-center justify-center rounded-lg border bg-card text-card-foreground shadow-lg">
                            <div className="relative z-20 h-6 w-64 bg-gradient-to-r from-[#00FF00] via-[#FFFF00] to-[#FF0000] border">
                                <p className='absolute -left-5'>0</p>
                                <p className='absolute -right-7'>100</p>
                            </div>
                            Occupancy / %
                        </div>
                        <Button
                            className="absolute bottom-4 size-12 right-4 z-10 bg-card rounded-lg border bg-card text-card-foreground shadow-lg"
                            onClick={handleCenterOnUser}
                            variant="secondary"
                        >
                            <MapPin/>
                        </Button>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );}

    else {
        authAPI();
    }
}

export default MapLayout;