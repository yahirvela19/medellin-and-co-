# 💎 Medellín & Co. — Sistema de Gestión de Joyería

Sistema integral de inventario y ventas para joyería, construido con React + Supabase.

---

## 🗂️ Estructura del Proyecto

```
medellin-co/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── layout/
│   │       └── Layout.js         ← Sidebar + navegación
│   ├── lib/
│   │   └── supabase.js           ← Cliente de Supabase
│   ├── pages/
│   │   ├── LoginPage.js          ← Inicio de sesión
│   │   ├── HomePage.js           ← Dashboard con métricas
│   │   ├── ProductosPage.js      ← Inventario CRUD
│   │   ├── ClientesPage.js       ← Clientes CRUD
│   │   └── VentasPage.js         ← Ventas CRUD
│   ├── App.js                    ← Rutas principales
│   ├── index.js                  ← Entry point
│   └── index.css                 ← Estilos globales
├── supabase_schema.sql           ← Script SQL para Supabase
├── .env.example                  ← Variables de entorno
├── vercel.json                   ← Config para Vercel
└── package.json
```

---

## 🚀 Guía de Despliegue Paso a Paso

### PASO 1 — Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Elige nombre, contraseña de DB y región (US East recomendado)
3. En el menú izquierdo → **SQL Editor** → **New Query**
4. Pega el contenido de `supabase_schema.sql` y ejecuta (**Run**)
5. Esto crea las tablas y datos de ejemplo automáticamente

6. Para crear usuarios de acceso:
   - Ve a **Authentication** → **Users** → **Add User**
   - Ingresa correo y contraseña del administrador

7. Obtén tus credenciales:
   - **Settings** → **API**
   - Copia `Project URL` y `anon public key`

---

### PASO 2 — Configurar el Proyecto Local

```bash
# Instalar dependencias
cd medellin-co
npm install

# Crear archivo de variables de entorno
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:
```
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# Probar localmente
npm start
```

---

### PASO 3 — Subir a GitHub

```bash
# Inicializar repositorio
git init
git add .
git commit -m "feat: sistema Medellín & Co. inicial"

# Crear repositorio en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/medellin-co.git
git branch -M main
git push -u origin main
```

---

### PASO 4 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Conecta tu cuenta de GitHub → importa `medellin-co`
3. En **Environment Variables**, agrega:
   - `REACT_APP_SUPABASE_URL` → tu Project URL
   - `REACT_APP_SUPABASE_ANON_KEY` → tu anon key
4. **Framework Preset**: Create React App (se detecta automático)
5. Click **Deploy** — ¡listo en ~2 minutos!

---

## 🔐 Seguridad en Producción (Opcional)

Para habilitar Row Level Security en Supabase:

```sql
-- En SQL Editor de Supabase
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;

-- Permitir acceso solo a usuarios autenticados
CREATE POLICY "auth_only" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON ventas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON detalle_venta FOR ALL USING (auth.role() = 'authenticated');
```

---

## 🛠️ Módulos del Sistema

| Módulo | Funcionalidad |
|--------|--------------|
| **Login** | Autenticación con Supabase Auth |
| **Dashboard** | Métricas, ventas recientes, productos más vendidos |
| **Productos** | CRUD completo, búsqueda, filtro por categoría, vista previa |
| **Clientes** | CRUD completo, historial de compras por cliente |
| **Ventas** | Registro de ventas con múltiples productos, descuento automático de stock |

---

## 👥 Equipo

- Carlos Abdel García Guzmán — IME
- Josue Yahir Vela Hernández — ITS  
- Maria Macias Delgado — ITS
- José Angel Martínez Herrera — ITS
- Alan Bertin Castillo Martinez — ITS

**Maestro:** Ing. Alejandro Aguilar Flores  
**UANL — FIME | Lab. Programación Orientada a Objetos**
