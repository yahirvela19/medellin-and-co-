import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function HomePage() {
  const [stats, setStats] = useState({ totalVentas: 0, totalClientes: 0, totalProductos: 0, stockBajo: 0 });
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [productoNuevo, setProductoNuevo] = useState(null);
  const [masVendidos, setMasVendidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [
        { data: ventas },
        { data: clientes },
        { data: productos },
        { data: detalle },
        { data: recientes },
        { data: nuevoP },
      ] = await Promise.all([
        supabase.from('ventas').select('total'),
        supabase.from('clientes').select('id_cliente'),
        supabase.from('productos').select('id_producto, stock'),
        supabase.from('detalle_venta').select('id_producto, cantidad, productos(nombre)'),
        supabase.from('ventas').select('id_venta, total, fecha, clientes(nombre)').order('fecha', { ascending: false }).limit(5),
        supabase.from('productos').select('nombre, created_at').order('created_at', { ascending: false }).limit(1),
      ]);

      const totalVentas = (ventas || []).reduce((s, v) => s + v.total, 0);
      const stockBajo = (productos || []).filter(p => p.stock < 5).length;

      // Productos más vendidos
      const mapaProductos = {};
      (detalle || []).forEach(d => {
        const nombre = d.productos?.nombre || 'Desconocido';
        mapaProductos[nombre] = (mapaProductos[nombre] || 0) + d.cantidad;
      });
      const top = Object.entries(mapaProductos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, cantidad]) => ({ name: name.length > 18 ? name.substring(0, 18) + '…' : name, cantidad }));

      setStats({ totalVentas, totalClientes: clientes?.length || 0, totalProductos: productos?.length || 0, stockBajo });
      setVentasRecientes(recientes || []);
      setProductoNuevo(nuevoP?.[0] || null);
      setMasVendidos(top);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del sistema</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Ventas Totales</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{fmt(stats.totalVentas)}</div>
          <div className="stat-sub">Acumulado histórico</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clientes</div>
          <div className="stat-value">{stats.totalClientes}</div>
          <div className="stat-sub">Registrados en el sistema</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productos</div>
          <div className="stat-value">{stats.totalProductos}</div>
          <div className="stat-sub">En catálogo</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stock Bajo</div>
          <div className="stat-value" style={{ color: stats.stockBajo > 0 ? '#e74c3c' : 'var(--success)' }}>
            {stats.stockBajo}
          </div>
          <div className="stat-sub">Productos con menos de 5 uds.</div>
        </div>
      </div>

      {/* PRODUCTO MÁS NUEVO */}
      {productoNuevo && (
        <div className="card card-gold" style={{ marginBottom: 24, display: 'inline-block', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 3 }}>
                Producto más reciente
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)' }}>{productoNuevo.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Agregado el {new Date(productoNuevo.created_at).toLocaleDateString('es-MX')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* VENTAS RECIENTES */}
        <div className="card">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, marginBottom: 16, color: 'var(--text-primary)' }}>
            Ventas Recientes
          </h3>
          {ventasRecientes.length === 0 ? (
            <div className="empty-state"><p>No hay ventas registradas</p></div>
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRecientes.map(v => (
                    <tr key={v.id_venta}>
                      <td><span className="badge badge-gold">#{v.id_venta}</span></td>
                      <td>{v.clientes?.nombre || 'N/A'}</td>
                      <td>{new Date(v.fecha).toLocaleDateString('es-MX')}</td>
                      <td style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MÁS VENDIDOS */}
        <div className="card">
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, marginBottom: 16, color: 'var(--text-primary)' }}>
            Más Vendidos
          </h3>
          {masVendidos.length === 0 ? (
            <div className="empty-state"><p>Sin datos</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={masVendidos} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#8a8478' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--gold)' }}
                />
                <Bar dataKey="cantidad" fill="var(--gold)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
