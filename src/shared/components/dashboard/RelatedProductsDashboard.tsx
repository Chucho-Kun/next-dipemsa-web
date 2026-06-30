'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { Producto } from './types/producto';

export default function RelatedProductsDashboard() {
  const [isClient, setIsClient] = useState(false);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<string | null>(null);

  // Soluciona problemas de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar productos
  useEffect(() => {
    fetch('/api/admin/productos')
      .then(res => res.json())
      .then(data => setProductos(data));
  }, []);

  useEffect(() => {
  if (!productoSeleccionado) {
    setRelacionados([]);
    return;
  }

  const relacionadosIds = productoSeleccionado.related_products || [];
  const relacionadosFiltrados = productos.filter(p => 
    relacionadosIds.includes(p.id)
  );
  setRelacionados(relacionadosFiltrados);
}, [productoSeleccionado, productos]);

  // Cuando cambie el producto seleccionado, cargar sus relacionados
  useEffect(() => {
    if (!productoSeleccionado) return;
    
    const relacionadosIds = productoSeleccionado.related_products || [];
    const relacionadosFiltrados = productos.filter(p => 
      relacionadosIds.includes(p.id)
    );
    setRelacionados(relacionadosFiltrados);
  }, [productoSeleccionado, productos]);

  const actualizarRelacionados = async (productoId: string, nuevosRelacionados: string[]) => {
    const res = await fetch(`/api/admin/productos/${productoId}/relacionados`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ related_products: nuevosRelacionados })
    });

    if (res.ok) {
      //toast.success("Productos relacionados actualizados");
    } else {
      toast.error("Error al actualizar");
    }
  };

  const agregarRelacionado = async (productoRelacionado: Producto) => {
  if (!productoSeleccionado) return;

  const relacionadosIds = relacionados.map(rel => rel.id);

  if (relacionadosIds.includes(productoRelacionado.id)) {
    toast.error("Este producto ya está relacionado");
    return;
  }

  const nuevosRelacionados = [...relacionadosIds, productoRelacionado.id];

  // Actualizar en base de datos
  await actualizarRelacionados(productoSeleccionado.id, nuevosRelacionados);

  // Actualizar estado local (importante para que CenterPanel se actualice)
  setRelacionados(prev => [...prev, productoRelacionado]);

  toast.success("Producto agregado correctamente");
};

const eliminarRelacionado = async (idToRemove: string) => {
  if (!productoSeleccionado) return;

  const nuevosRelacionados = relacionados
    .filter(rel => rel.id !== idToRemove);

  // Actualizar en base de datos
  await actualizarRelacionados(productoSeleccionado.id, nuevosRelacionados.map(r => r.id));

  // Actualizar estado local
  setRelacionados(nuevosRelacionados);

  toast.success("Producto eliminado de relacionados");
};


  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Cargando dashboard de productos relacionados...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Panel Izquierdo */}
      <LeftPanel
        productos={productos}
        productoSeleccionado={productoSeleccionado}
        setProductoSeleccionado={setProductoSeleccionado}
      />

      {/* Panel Central */}
      <CenterPanel
        productoSeleccionado={productoSeleccionado}
        relacionados={relacionados}
        eliminarRelacionado={eliminarRelacionado}
      />

      {/* Panel Derecho */}
      <RightPanel
        productos={productos}
        productoSeleccionado={productoSeleccionado}
        relacionados={relacionados}
        agregarRelacionado={agregarRelacionado}
      />
    </div>
  );
}