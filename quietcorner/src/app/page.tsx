"use client";
import { redirect } from 'react-router';


export default function Home() {
  window.location.replace("http://localhost:5000/login")
  return null;
}
