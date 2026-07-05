# Norman Digital Solutions

Sitio web con formulario de solicitudes, botón flotante de WhatsApp y panel de administración básico.

## Ejecutar localmente

```bash
npm install
npm start
```

Luego abre:
- http://localhost:3000
- http://localhost:3000/admin

Credenciales de administrador:
- Usuario: admin
- Contraseña: admin123

## Despliegue en Render

1. Sube este proyecto a GitHub.
2. En Render, crea un nuevo Web Service.
3. Elige el repositorio.
4. Usa:
   - Build Command: npm install
   - Start Command: npm start
5. Añade las variables:
   - NODE_ENV=production
   - SESSION_SECRET=una_clave_segura
