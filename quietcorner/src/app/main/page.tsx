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
import Overlay from 'ol/Overlay';
import AppSidebar from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";

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
    const authenticate = async () => {
        let authEndpoint = window.location.href.replace('http://localhost:3000/api/login', 'http://localhost:5000/api/login');
        console.log(authEndpoint)
        try {
            const authenticationResponse = await fetch('http://localhost:5000/api/login', {
                method: 'GET',
                credentials: 'include', // Include cookies for cross-origin requests
            });
            const data = await authenticationResponse.json();
            console.log(data);

            if (!authenticationResponse.ok) {
                throw new Error('Failed to connect to authenticator');
            }
            const authenticationData = await authenticationResponse.json();
            console.log(authenticationData)
            setAuthenticated(authenticationData.auth)
            setAuthUrl(authenticationData.url)
        } catch (error) {
            console.error('UOM_FETCH_ERROR:', authEndpoint, error)
        }
    }

    const [authenticated, setAuthenticated] = useState(false);
    const [nextAuthUrl, setAuthUrl] = useState('/main')
    const [locations, setLocations] = useState<Location[]>([]);
    const [map, setMap] = useState<Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const mapElement = useRef<HTMLDivElement>(null);
    const [vectorSource, setVectorSource] = useState(new VectorSource());


    useEffect(() => {
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

        const intervalId = setInterval(fetchData, 2000); // Update every 10ms


        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (authenticated) {
            //
        }
    }, [authenticated]);

    useEffect(() => {
        if (mapElement.current && locations.length > 0) {
            initializeMap();
        }
    }, [locations]);
    const initializeMap = () => {
        const initialMap = new Map({
            target: mapElement.current!,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            view: new View({
                center: fromLonLat([-2.2339, 53.4668]), // Manchester city center
                zoom: 15,
            }),
        });

        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
            source: vectorSource,
        });

        initialMap.addLayer(vectorLayer);

        locations.forEach((location) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([location.longitude, location.latitude])),
                name: location.building_name,
                population: location.max_capacity,
            });

            const style = createFeatureStyle(location.max_capacity);
            feature.setStyle(style);

            vectorSource.addFeature(feature);
        });



        initialMap.on('click', (event) => {
            const feature = initialMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);
            if (feature) {
                const coordinates = (feature.getGeometry() as Point).getCoordinates();
                setSelectedLocation(feature.get('name'));
            } else {
                setSelectedLocation(null);
            }
        });

        setMap(initialMap);
    };

    const createFeatureStyle = (population: number) => {
        let color = '#FF6600';
        let radius = 20;

        if (population > 500) {
            color = '#FF0000';
            radius = 30;
        } else if (population < 200) {
            color = '#00FF00';
            radius = 10;
        }

        return new Style({
            image: new Circle({
                radius: radius,
                fill: new Fill({ color: color }),
                stroke: new Stroke({ color: '#FFFFFF', width: 2 })
            })
        });
    };

    const handleLocationSelect = (name: string, coordinates: [number, number]) => {
        if (map) {
            map.getView().animate({
                center: fromLonLat([coordinates[1], coordinates[0]]),
                zoom: 18,
                duration: 1000,
            });
            setSelectedLocation(name);
        }
    };

    return (
        <div>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "400px",
                    } as React.CSSProperties
                }
            >
                <AppSidebar onLocationSelect={handleLocationSelect} />
                <SidebarInset>
                    <div style={{height:'100vh', width:'100%'}} className="flex flex-1 flex-col" ref={mapElement}>
                    {/*        {selectedLocation && (*/}
                    {/*            <div className="bg-white p-2 rounded shadow">*/}
                    {/*                <h3 className="font-bold">{selectedLocation}</h3>*/}
                    {/*                <p>Crowd Level: {*/}
                    {/*                    (() => {*/}
                    {/*                        const location = locations.find(l => l.name === selectedLocation);*/}
                    {/*                        if (location) {*/}
                    {/*                            if (location.population > 500) return 'High';*/}
                    {/*                            if (location.population < 200) return 'Low';*/}
                    {/*                            return 'Medium';*/}
                    {/*                        }*/}
                    {/*                        return 'Unknown';*/}
                    {/*                    })()*/}
                    {/*                }</p>*/}
                    {/*            </div>*/}
                    {/*        )}*/}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}

export default MapLayout;