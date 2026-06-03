'use client';

import { sendContactEmail } from "@/src/actions/contact";
import Link from "next/link";
import React, { useState, useRef } from "react";

export default function ContactoPage() {
  const [status, setStatus] = useState<{ success?: boolean; message?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);   // ← Agregado

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({});

    const formData = new FormData(e.currentTarget);
    
    const result = await sendContactEmail(formData);
    
    setStatus(result);
    setIsLoading(false);

    if (result.success) {
      formRef.current?.reset();     // ← Forma más segura
    }
  };

  return (
    <section className="bg-gray-100 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          CONTÁCTANOS
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Columna Izquierda - Información */}
           <div className="space-y-8">
            <div>
              <h3 className="text-orange-600 font-bold text-xl mb-6">CONTACTO</h3>
              
              <div className="space-y-4 text-gray-700">
                <p><strong>Facebook:</strong> DIPEMSA</p>
                <p><strong>Teléfono:</strong> (55) 8751 2193</p>
                <p><strong>Teléfono:</strong> (55) 5770 8512</p>
                <p><strong>WhatsApp:</strong> 55 3265 1039</p>
                <p><strong>Correo:</strong> contacto@dipemsa.com.mx</p>
              </div>
            </div>

            <div>
              <p className="text-orange-600 font-bold text-lg leading-tight">
                REALIZAMOS ENTREGAS A TODA<br />
                LA REPÚBLICA MEXICANA
              </p>
            </div>

            {/* Iconos de contacto */}
            <div className="flex gap-4">

              <Link href={'tel:5587512193'} target='_blank' className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                <img width={25} height={25} src={'/icons/phone.svg'} />
              </Link>
              <Link href={'https://wa.me/5532651039'} target='_blank' className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                <img className='hove:text-yellow-300' width={25} height={25} src={'/icons/whatsapp.svg'} />
              </Link>
              <Link href={'https://www.facebook.com/Dipemsa/'} target='_blank' className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition">
                <img width={25} height={25} src={'/icons/facebook.svg'} />
              </Link>


            </div>

            {/* Botón Enviar Mensaje */}
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3.5 rounded-full transition text-lg">
              ENVÍANOS UN MENSAJE
            </button>
          </div>

          {/* Columna Derecha - Formulario */}
          <div className="bg-white p-8 rounded-3xl shadow-sm">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre Completo:"
                  required
                  className="w-full border border-gray-300 rounded-xl px-5 py-4 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Correo Electrónico:"
                  required
                  className="w-full border border-gray-300 rounded-xl px-5 py-4 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <textarea
                  name="mensaje"
                  placeholder="Mensaje:"
                  rows={6}
                  required
                  className="w-full border border-gray-300 rounded-2xl px-5 py-4 focus:outline-none focus:border-orange-500 transition resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1E2937] hover:bg-black disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl transition text-lg flex items-center justify-center"
              >
                {isLoading ? "ENVIANDO..." : "ENVIAR MENSAJE"}
              </button>

              {status.message && (
                <p className={`text-center mt-4 font-medium ${status.success ? 'text-green-600' : 'text-red-600'}`}>
                  {status.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}