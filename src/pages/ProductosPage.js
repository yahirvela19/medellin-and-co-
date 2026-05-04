import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const CATEGORIAS = ['Anillo', 'Collar', 'Arete', 'Pulsera', 'Dije', 'Otro'];

const initialForm = { nombre: '', descripcion: '', precio: '', stock: '', categoria: '', sku: '', ubicacion: '' };

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editando, setEditando] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchProductos(); }, []);

  useEffect(() => {
    let res = productos;
    if (busqueda) res = res.filter(p =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(busqueda.toLowerCase())
    );
    if (categoria) res = res.filter(p => p.categoria === categoria);
    setFiltrados(res);
  }, [busqueda, categoria, productos]);

  const fetchProductos = async () => {
    setLoading(true);
    const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    setProductos(data || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(initialForm); setEditando(null); setModal(true); };
  const openEdit = (p) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, stock: p.stock, categoria: p.categoria || '', sku: p.sku || '', ubicacion: p.ubicacion || '' });
    setEditando(p.id_producto);
    setModal(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.precio) return;
    const payload = { ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0 };

    if (editando) {
      await supabase.from('productos').update(payload).eq('id_producto', editando);
      setMsg({ type: 'success', text: 'Producto actualizado correctamente.' });
    } else {
      await supabase.from('productos').insert(payload);
      setMsg({ type: 'success', text: 'Producto agregado correctamente.' });
    }
    setModal(false);
    fetchProductos();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    await supabase.from('productos').delete().eq('id_producto', id);
    if (seleccionado?.id_producto === id) setSeleccionado(null);
    fetchProductos();
    setMsg({ type: 'success', text: 'Producto eliminado.' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Catálogo e inventario de joyería</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span>+</span> Agregar Producto
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="toolbar">
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Buscar por nombre o SKU…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 130 }} value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: seleccionado ? '1fr 300px' : '1fr', gap: 20 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state"><h3>No hay productos</h3><p>Agrega tu primer producto.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>SKU</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Ubicación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id_producto} onClick={() => setSeleccionado(p)}>
                    <td style={{ color: 'var(--text-muted)' }}>#{p.id_producto}</td>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku || '—'}</td>
                    <td>{p.categoria ? <span className="badge badge-gold">{p.categoria}</span> : '—'}</td>
                    <td style={{ color: 'var(--gold)' }}>{fmt(p.precio)}</td>
                    <td>
                      <span className={`badge ${p.stock < 5 ? 'badge-red' : 'badge-green'}`}>{p.stock}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.ubicacion || '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(p.id_producto)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {seleccionado && (
          <div className="detail-panel">
            <h3>Vista Previa</h3>
            <div className="detail-row"><span>Nombre</span><span>{seleccionado.nombre}</span></div>
            <div className="detail-row"><span>SKU</span><span style={{ fontFamily: 'monospace' }}>{seleccionado.sku || '—'}</span></div>
            <div className="detail-row"><span>Precio</span><span style={{ color: 'var(--gold)' }}>{fmt(seleccionado.precio)}</span></div>
            <div className="detail-row"><span>Stock</span><span>{seleccionado.stock} uds.</span></div>
            <div className="detail-row"><span>Categoría</span><span>{seleccionado.categoria || '—'}</span></div>
            <div className="detail-row"><span>Ubicación</span><span>{seleccionado.ubicacion || '—'}</span></div>
            {seleccionado.descripcion && (
              <div style={{ marginTop: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Descripción</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{seleccionado.descripcion}</div>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => setSeleccionado(null)}>
              Cerrar
            </button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editando ? 'Editar Producto' : 'Agregar Producto'}</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Anillo de Oro 18k" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="ANI-001" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Material, talla, detalles…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Precio *</label>
                <input className="form-input" type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input className="form-input" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Vitrina A1" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGuardar}>
                {editando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
