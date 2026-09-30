'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { marcas } from '../../db/marcas';
import SearchBar from './SearchBar';
import CartModule from './CartModule';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full md:sticky md:top-0 md:z-50 bg-white shadow-md">
      {/* Top Bar - Envíos Gratis */}
      <div className="banner-promo text-white font-bold text-center text-sm py-2 px-4">
        ENVÍOS GRATIS EN COMPRAS MAYORES A $5,000 MXN (aplica CDMX y Área Metropolitana) 
        <Link href="/terminos-y-condiciones/" className="underline hover:text-orange-400 ml-1">
          Términos y Condiciones
        </Link>
      </div>

      {/* Main Header */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
            {/* Logo */}
            <div className="shrink-0">

              <Link href={'/'} className="cursor-pointer">
                  <img width={250} height={89} src="/logo.svg" alt="Logo Dipemsa SVG" className="" />
              </Link>

            </div>

              <div className="w-full md:flex-1 md:max-w-85 lg:max-w-95">
                <SearchBar />
              </div>

               {/* Cart and Quote Button */}
               <div className="flex items-center gap-2.5 shrink-0 cursor-pointer">
               {/* Cart */}

              {/**Icono carrito en movil */}
              <CartModule />

              <div className="flex flex-col items-end gap-1 mb-5">
                <span className="text-[#C2410C] font-extrabold text-[17px] leading-none tracking-tight pr-26">
                  Cotiza por whatsapp
                </span>

                <div className="flex items-center gap-2">
                  {/* Cotiza Ahora Button */}
                  <Link 
                      href={ 'https://api.whatsapp.com/send?phone=5532651039' }
                      target='_blank'
                      className="bg-[#FF5E00] hover:bg-[#E30613] text-white font-extrabold px-3 py-2 rounded-lg flex items-center gap-1.5 transition text-[13px] leading-none whitespace-nowrap shadow-sm">
                    CDMX / EDO MÉX
                    <span className="flex items-center">
                      <Image 
                        src={'/icons/whatsapp.svg'}
                        alt="whatsapp icon"
                        width={20}
                        height={20}
                      />
                    </span>
                  </Link>
                  
                  <Link 
                      href={ 'https://api.whatsapp.com/send?phone=7299367395' }
                      target='_blank'
                      className="bg-[#FF5E00] hover:bg-[#E30613] text-white font-extrabold px-3 py-2 rounded-lg flex items-center gap-1.5 transition text-[13px] leading-none whitespace-nowrap shadow-sm">
                    PACHUCA DE SOTO
                    <span className="flex items-center">
                      <Image 
                        src={'/icons/whatsapp.svg'}
                        alt="whatsapp icon"
                        width={20}
                        height={20}
                      />
                    </span>
                  </Link>
                </div>
              </div>

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
            <Link href={'/carrito-de-compra'} className='hover:text-[#FF5E00] transition'>CARRITO DE COMPRA</Link>
            <Link href={'/contacto'} className='hover:text-[#FF5E00] transition'>CONTACTO</Link>

          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 flex flex-col gap-3 text-sm border-t border-gray-700 font-bold">
              <Link href={'/'} className='hover:text-[#FF5E00] transition'>HOME</Link>
              <Link href={'/marcas'} className='hover:text-[#FF5E00] transition'>MARCAS</Link>
              <Link href={'/productos'} className='hover:text-[#FF5E00] transition'>PRODUCTOS</Link>
              <Link href={'/soy-mayorista'} className='hover:text-[#FF5E00] transition'>SOY MAYORISTA</Link>
              <Link href={'/carrito-de-compra'} className='hover:text-[#FF5E00] transition'>CARRITO DE COMPRA</Link>
              <Link href={'/contacto'} className='hover:text-[#FF5E00] transition'>CONTACTO</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Brands Bar */}
      <div className="bg-white py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-full mx-auto hidden md:flex items-center justify-center gap-2 md:gap-1 text-xs md:text-sm font-bold text-gray-600 flex-wrap">
            
            { marcas.sort((a,b) => a.name.localeCompare(b.name))
                    .map( (marca, index) => (
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