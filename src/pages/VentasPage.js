import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [modal, setModal] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [msg, setMsg] = useState(null);

  // form nueva venta
  const [clienteId, setClienteId] = useState('');
  const [items, setItems] = useState([{ id_producto: '', cantidad: 1 }]);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let res = ventas;
    if (busqueda) res = res.filter(v =>
      (v.clientes?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(v.id_venta).includes(busqueda)
    );
    setFiltradas(res);
  }, [busqueda, ventas]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: v }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('ventas').select('id_venta, fecha, total, clientes(nombre)').order('fecha', { ascending: false }),
      supabase.from('clientes').select('id_cliente, nombre'),
      supabase.from('productos').select('id_producto, nombre, precio, stock'),
    ]);
    setVentas(v || []);
    setClientes(c || []);
    setProductos(p || []);
    setLoading(false);
  };

  const fetchDetalle = async (id_venta) => {
    const { data } = await supabase
      .from('detalle_venta')
      .select('id_detalle, cantidad, subtotal, productos(nombre, precio)')
      .eq('id_venta', id_venta);
    setDetalles(data || []);
  };

  const handleSeleccionar = (v) => {
    setSeleccionada(v);
    fetchDetalle(v.id_venta);
  };

  const addItem = () => setItems([...items, { id_producto: '', cantidad: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: val };
    setItems(copy);
  };

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      const prod = productos.find(p => String(p.id_producto) === String(item.id_producto));
      return sum + (prod ? prod.precio * (parseInt(item.cantidad) || 0) : 0);
    }, 0);
  };

  const handleGuardar = async () => {
    if (!clienteId || items.some(i => !i.id_producto)) {
      setMsg({ type: 'error', text: 'Selecciona cliente y todos los productos.' });
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    const total = calcTotal();
    const { data: venta, error } = await supabase
      .from('ventas')
      .insert({ id_cliente: parseInt(clienteId), total, fecha: new Date().toISOString() })
      .select()
      .single();

    if (error) { setMsg({ type: 'error', text: 'Error al crear venta.' }); return; }

    const detallesPayload = items.map(item => {
      const prod = productos.find(p => String(p.id_producto) === String(item.id_producto));
      return {
        id_venta: venta.id_venta,
        id_producto: parseInt(item.id_producto),
        cantidad: parseInt(item.cantidad),
        subtotal: prod ? prod.precio * parseInt(item.cantidad) : 0,
      };
    });

    await supabase.from('detalle_venta').insert(detallesPayload);

    // Actualizar stock
    for (const item of items) {
      const prod = productos.find(p => String(p.id_producto) === String(item.id_producto));
      if (prod) {
        await supabase.from('productos').update({ stock: prod.stock - parseInt(item.cantidad) }).eq('id_producto', item.id_producto);
      }
    }

    setModal(false);
    setClienteId('');
    setItems([{ id_producto: '', cantidad: 1 }]);
    setMsg({ type: 'success', text: 'Venta registrada exitosamente.' });
    setTimeout(() => setMsg(null), 3000);
    fetchAll();
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta venta?')) return;
    await supabase.from('ventas').delete().eq('id_venta', id);
    if (seleccionada?.id_venta === id) setSeleccionada(null);
    fetchAll();
    setMsg({ type: 'success', text: 'Venta eliminada.' });
    setTimeout(() => setMsg(null), 3000);
  };

  const totalArticulos = ventas.reduce((s, v) => s + 1, 0); // count ventas
  const montoTotal = ventas.reduce((s, v) => s + v.total, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">Registro de transacciones</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <span>+</span> Nueva Venta
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* MÉTRICAS */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total de Ventas</div>
          <div className="stat-value">{ventas.length}</div>
          <div className="stat-sub">Transacciones registradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monto Total</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{fmt(montoTotal)}</div>
          <div className="stat-sub">Ingresos acumulados</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ticket Promedio</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {ventas.length > 0 ? fmt(montoTotal / ventas.length) : fmt(0)}
          </div>
          <div className="stat-sub">Por venta</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Buscar por cliente o folio…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: seleccionada ? '1fr 320px' : '1fr', gap: 20 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : filtradas.length === 0 ? (
            <div className="empty-state"><h3>No hay ventas</h3><p>Registra tu primera venta.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(v => (
                  <tr key={v.id_venta} onClick={() => handleSeleccionar(v)} style={{ background: seleccionada?.id_venta === v.id_venta ? 'var(--bg-hover)' : '' }}>
                    <td><span className="badge badge-gold">#{v.id_venta}</span></td>
                    <td style={{ fontWeight: 500 }}>{v.clientes?.nombre || 'Cliente eliminado'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(v.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(v.total)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(v.id_venta)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {seleccionada && (
          <div className="detail-panel">
            <h3>Detalle de Venta #{seleccionada.id_venta}</h3>
            <div className="detail-row"><span>Cliente</span><span>{seleccionada.clientes?.nombre || '—'}</span></div>
            <div className="detail-row"><span>Fecha</span><span>{new Date(seleccionada.fecha).toLocaleDateString('es-MX')}</span></div>
            <div className="detail-row"><span>Total</span><span style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(seleccionada.total)}</span></div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Productos
              </div>
              {detalles.map(d => (
                <div key={d.id_detalle} style={{ marginBottom: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{d.productos?.nombre || 'Producto'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    <span>{d.cantidad} × {fmt(d.productos?.precio || 0)}</span>
                    <span style={{ color: 'var(--gold)' }}>{fmt(d.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => setSeleccionada(null)}>
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* MODAL NUEVA VENTA */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Nueva Venta</div>

            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <select className="form-input" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">— Seleccionar cliente —</option>
                {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Productos *</label>
                <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Agregar</button>
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: 8, marginBottom: 8 }}>
                  <select className="form-input" value={item.id_producto} onChange={e => updateItem(i, 'id_producto', e.target.value)}>
                    <option value="">— Producto —</option>
                    {productos.map(p => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre} ({fmt(p.precio)}) — Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={e => updateItem(i, 'cantidad', e.target.value)}
                    placeholder="Cant."
                  />
                  {items.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--gold-border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                <span style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: 'var(--gold)' }}>{fmt(calcTotal())}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGuardar}>Registrar Venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
