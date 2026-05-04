import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const initialForm = { nombre: '', telefono: '', correo: '' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [ventasCliente, setVentasCliente] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editando, setEditando] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchClientes(); }, []);

  useEffect(() => {
    let res = clientes;
    if (busqueda) res = res.filter(c =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.correo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.telefono || '').includes(busqueda)
    );
    setFiltrados(res);
  }, [busqueda, clientes]);

  const fetchClientes = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    setClientes(data || []);
    setLoading(false);
  };

  const fetchVentasCliente = async (id) => {
    const { data } = await supabase.from('ventas').select('id_venta, fecha, total').eq('id_cliente', id).order('fecha', { ascending: false }).limit(5);
    setVentasCliente(data || []);
  };

  const handleSeleccionar = (c) => {
    setSeleccionado(c);
    fetchVentasCliente(c.id_cliente);
  };

  const openAdd = () => { setForm(initialForm); setEditando(null); setModal(true); };
  const openEdit = (c) => {
    setForm({ nombre: c.nombre, telefono: c.telefono || '', correo: c.correo || '' });
    setEditando(c.id_cliente);
    setModal(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre) return;
    if (editando) {
      await supabase.from('clientes').update(form).eq('id_cliente', editando);
      setMsg({ type: 'success', text: 'Cliente actualizado.' });
    } else {
      await supabase.from('clientes').insert(form);
      setMsg({ type: 'success', text: 'Cliente registrado.' });
    }
    setModal(false);
    fetchClientes();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    await supabase.from('clientes').delete().eq('id_cliente', id);
    if (seleccionado?.id_cliente === id) setSeleccionado(null);
    fetchClientes();
    setMsg({ type: 'success', text: 'Cliente eliminado.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Base de datos de clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span>+</span> Agregar Cliente
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="toolbar">
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Buscar por nombre, correo o teléfono…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: seleccionado ? '1fr 300px' : '1fr', gap: 20 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state"><h3>No hay clientes</h3><p>Registra tu primer cliente.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id_cliente} onClick={() => handleSeleccionar(c)} style={{ background: seleccionado?.id_cliente === c.id_cliente ? 'var(--bg-hover)' : '' }}>
                    <td style={{ color: 'var(--text-muted)' }}>#{c.id_cliente}</td>
                    <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.telefono || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.correo || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('es-MX')}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(c.id_cliente)}>Eliminar</button>
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
            <h3>Perfil del Cliente</h3>
            <div className="detail-row"><span>Nombre</span><span>{seleccionado.nombre}</span></div>
            <div className="detail-row"><span>Teléfono</span><span>{seleccionado.telefono || '—'}</span></div>
            <div className="detail-row"><span>Correo</span><span style={{ fontSize: 11, wordBreak: 'break-all' }}>{seleccionado.correo || '—'}</span></div>
            <div className="detail-row"><span>Registro</span><span>{new Date(seleccionado.created_at).toLocaleDateString('es-MX')}</span></div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Últimas Compras
              </div>
              {ventasCliente.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Sin compras registradas</div>
              ) : ventasCliente.map(v => (
                <div key={v.id_venta} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(v.fecha).toLocaleDateString('es-MX')}</span>
                  <span style={{ color: 'var(--gold)' }}>{fmt(v.total)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(seleccionado)}>Editar</button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSeleccionado(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editando ? 'Editar Cliente' : 'Agregar Cliente'}</div>
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Ana García López" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="8112345678" />
            </div>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input className="form-input" type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="cliente@correo.com" />
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
