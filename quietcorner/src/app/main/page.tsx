"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import 'ol/ol.css';
import Geolocation from 'ol/Geolocation.js';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { Circle, Style, Fill, Stroke } from 'ol/style';
import AppSidebar from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import Overlay from 'ol/Overlay';
import Geolocation from "ol/Geolocation"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"


type Location = {
    building_id: number;
    name: string;
    longitude: number;
    latitude: number;
    opening_hours: string;
    facilities: string;
    positions_occupied: number;
    max_capacity: number;
    created_at: string;
    has_access_point: boolean;
}

function MapLayout() {
    const [authenticated, setAuthentication] = useState(true)
    const [locations, setLocations] = useState<Location[]>([]);
    const [map, setMap] = useState<Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const mapElement = useRef<HTMLDivElement>(null);
    const [vectorSource, setVectorSource] = useState(new VectorSource());
    const popupElement = useRef<HTMLDivElement>(null);
    const [popupShown,setpopupShown] = useState(false);
    const [popup, setPopup] = useState<Overlay | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [geolocation, setGeolocation] = useState<Geolocation | null>(null);


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
                autoPan: true,
                autoPanAnimation: {
                    duration: 250,
                },
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
        let lastValidCoordinates = null

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
            console.error("An error occured during authentication")
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
        let color = `hsl(${120*(1 - population/capacity)}, 100%, 50%)`;
        let radius = Math.sqrt(capacity/2);

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
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "800px",
                    } as React.CSSProperties
                }
            >
                <AppSidebar onLocationSelect={handleLocationSelect} />
                <SidebarInset>
                    <div style={{height: '100vh', width: '100%'}} className="flex flex-1 flex-col relative" ref={mapElement}>
                        <div ref={popupElement} className="ol-popup">
                            {selectedLocation && (
                                <div className="bg-white p-2 rounded shadow">
                                    <h3 className="font-bold">{selectedLocation}</h3>
                                    <p>Crowd Level: {
                                        (() => {
                                            const location = locations.find(l => l.name === selectedLocation);
                                            if (location) {
                                                if (location.positions_occupied > 500) return 'High';
                                                if (location.positions_occupied < 200) return 'Low';
                                                return 'Medium';
                                            }
                                            return 'Unknown';
                                        })()
                                    }</p>
                                </div>
                            )}
                        </div>
                        <Button
                            className="absolute bottom-4 right-4 rounded-full p-2 shadow-lg"
                            onClick={handleCenterOnUser}
                            variant="secondary"
                        >
                            <MapPin className="h-6 w-6" />
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