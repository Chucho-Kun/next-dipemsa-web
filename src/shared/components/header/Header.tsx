'use client';

import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { marcas } from '../../db/marcas';
import SearchBar from './SearchBar';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full">
      {/* Top Bar - Envíos Gratis */}
      <div className="banner-promo text-white font-bold text-center text-sm py-2 px-4">
        ENVÍOS GRATIS EN COMPRAS MAYORES A $5,000 MXN (aplica CDMX y Área Metropolitana) 
        <Link href="/terminos-y-condiciones/" className="underline hover:text-orange-400 ml-1">
          Términos y Condiciones
        </Link>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="shrink-0">

              <Link href={'/'} className="cursor-pointer">
                  <Image 
                    src={'/logo.webp'}
                    width={200}
                    height={70}
                    alt='Logo Dipemsa'
                    className="w-auto h-14 md:h-16 object-contain"
                    priority
                  />
              </Link>

            </div>

              <SearchBar />

               {/* Cart and Quote Button */}
               <div className="flex items-center gap-4">
               {/* Cart */}

              {/**Icono carrito en movil */}
              {/* <button 
                className="flex items-center gap-2 hover:text-[#E30613] transition fixed bottom-6 right-6 md:static md:bottom-auto md:right-auto z-50 md:z-auto bg-white rounded-4xl p-2.25"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="1.5" 
                  stroke="#FF5E00" 
                  className="size-9 md:size-8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" 
                  />
                </svg>
                <span className="cart-label bg-[#FF5E00] text-white w-5 h-5 rounded-full text-sm" >
                  3
                </span>
              </button> */}

              {/* Cotiza Ahora Button */}
              <Link 
                  href={ 'https://api.whatsapp.com/send?phone=5532651039' }
                  className="bg-[#FF5E00] hover:bg-[#E30613] text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition text-sm whitespace-nowrap">
                COTIZA AHORA
                <span className="text-xl">
                  <Image 
                    src={'/icons/whatsapp.svg'}
                    alt="whatsapp icon"
                    width={25}
                    height={25}
                  />
                </span>
              </Link>

              {/* Mobile Menu Button */}
              <button 
                aria-label='abrir menu movil'
                className="md:hidden text-gray-700"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-[#1E2A44] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden md:flex items-center justify-center gap-14 py-4 font-bold text-large">
            
            <Link href={'/'} className='hover:text-[#FF5E00] transition'>HOME</Link>
            <Link href={'/marcas'} className='hover:text-[#FF5E00] transition'>MARCAS</Link>
            <Link href={'/productos'} className='hover:text-[#FF5E00] transition'>PRODUCTOS</Link>
            <Link href={'/soy-mayorista'} className='hover:text-[#FF5E00] transition'>SOY MAYORISTA</Link>
            <Link href={'/compra-pactada'} className='hover:text-[#FF5E00] transition'>COMPRA PACTADA</Link>
            <Link href={'/contacto'} className='hover:text-[#FF5E00] transition'>CONTACTO</Link>

          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 flex flex-col gap-3 text-sm border-t border-gray-700 font-bold">
              <Link href={'/'} className='hover:text-[#FF5E00] transition'>HOME</Link>
              <Link href={'/marcas'} className='hover:text-[#FF5E00] transition'>MARCAS</Link>
              <Link href={'/productos'} className='hover:text-[#FF5E00] transition'>PRODUCTOS</Link>
              <Link href={'/soy-mayorista'} className='hover:text-[#FF5E00] transition'>SOY MAYORISTA</Link>
              <Link href={'/compra-pactada'} className='hover:text-[#FF5E00] transition'>COMPRA PACTADA</Link>
              <Link href={'/contacto'} className='hover:text-[#FF5E00] transition'>CONTACTO</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Brands Bar */}
      <div className="bg-white py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-225 mx-auto hidden md:flex items-center justify-center gap-2 md:gap-2 text-xs md:text-sm font-bold text-gray-600 flex-wrap">
            
            { marcas.map( (marca, index) => (
                <React.Fragment key={marca.name}>
                  <Link href={ `/marca/${ marca.name }`  } className='hover:text-amber-600 transition' >
                    <span className='uppercase'>{ marca.name.replace('-', ' ') }</span>
                  </Link>
                  { index < marcas.length - 1 && <span>•</span> }
                </React.Fragment>
            )) }

          </div>
        </div>
      </div>
    </header>
  );
}