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

interface Location {
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
    const [locations, setLocations] = useState<Location[]>([]);
    const [map, setMap] = useState<Map | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const mapElement = useRef<HTMLDivElement>(null);
    const popupElement = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (mapElement.current && locations.length > 0) {
            initializeMap();
        }
    }, [locations]);

    const fetchLocations = async () => {
        try {
            const response = await fetch('/api/locations');
            if (!response.ok) {
                throw new Error('Failed to fetch locations');
            }
            const data = await response.json();
            setLocations(data);
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

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

        const popup = new Overlay({
            element: popupElement.current!,
            positioning: 'bottom-center',
            offset: [0, -10],
        });

        initialMap.addOverlay(popup);

        initialMap.on('click', (event) => {
            const feature = initialMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);
            if (feature) {
                const coordinates = (feature.getGeometry() as Point).getCoordinates();
                popup.setPosition(coordinates);
                setSelectedLocation(feature.get('name'));
            } else {
                popup.setPosition(undefined);
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
                        <div ref={popupElement} className="ol-popup">
                            {selectedLocation && (
                                <div className="bg-white p-2 rounded shadow">
                                    <h3 className="font-bold">{selectedLocation}</h3>
                                    <p>Crowd Level: {
                                        (() => {
                                            const location = locations.find(l => l.name === selectedLocation);
                                            if (location) {
                                                if (location.population > 500) return 'High';
                                                if (location.population < 200) return 'Low';
                                                return 'Medium';
                                            }
                                            return 'Unknown';
                                        })()
                                    }</p>
                                </div>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}

export default MapLayout;