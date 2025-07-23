'use client';

import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import About from '../components/About';
import Membership from '../components/Membership';
import Login from '../components/Login';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <About />
      <Membership />
      <Login />
      <Footer />
    </div>
  );
}
