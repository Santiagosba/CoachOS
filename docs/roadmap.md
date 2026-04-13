# Roadmap MVP de CoachOS

## Objetivo

Construir una primera version util para un entrenador personal que quiera:

- gestionar clientes
- asignar programas
- revisar progreso
- organizar sesiones
- cobrar de forma simple

Y para un cliente que quiera:

- ver su entreno del dia
- registrar pesos, reps y series
- reservar o cancelar sesiones
- pagar desde la app

## Fase 1: Core operativo

Estado: muy avanzado

### Alcance

- Auth con roles `TRAINER` y `CLIENT`
- Perfiles basicos de cliente
- Programas por semanas, dias y ejercicios
- Entreno del dia para cliente
- Registro de workout logs
- Historial de entrenamientos

### Definition of done

- El PT puede gestionar sus clientes sin tocar base de datos manualmente
- El cliente puede completar un entreno entero desde el movil
- El trainer y el cliente ven informacion consistente

## Fase 2: Reservas y agenda

Estado: parcialmente implementado

### Alcance

- Crear sesiones desde el lado trainer
- Ver calendario del PT
- Permitir al cliente ver sus sesiones
- Permitir cancelar o confirmar segun reglas

### Falta por cerrar

- Flujo de reserva desde la app del cliente
- Reglas de negocio para cancelaciones
- Filtros de calendario y estados mas claros
- Recordatorios y notificaciones

## Fase 3: Cobros

Estado: pendiente

### Alcance

- Stripe Checkout o Payment Links para empezar rapido
- Plan mensual o bonos de sesiones
- Historial de pagos
- Estado de pago visible para el trainer

### Recomendacion

Empezar con:

- pago unico
- suscripcion mensual simple

Evitar al inicio:

- facturacion compleja
- impuestos multi-pais
- prorrateos avanzados

## Fase 4: Progreso visual

Estado: base de datos preparada, interfaz parcial

### Alcance

- Graficas de peso corporal
- Evolucion de carga por ejercicio
- Volumen semanal
- Adherencia al programa

### KPI utiles

- entrenamientos por semana
- tasa de sesiones completadas
- ejercicios con progreso positivo

## Fase 5: Comunicacion

Estado: pendiente

### Alcance

- Chat 1 a 1 entre trainer y cliente
- Mensajes operativos
- Recordatorios

### Recomendacion

No hacerlo antes de cerrar pagos y reservas, salvo que sea clave comercialmente.

## Arquitectura sugerida para produccion

### App

- Expo / React Native
- Expo Router
- Zustand para estado local

### Backend

- Node.js + Express + TypeScript
- Prisma
- PostgreSQL en produccion

### Servicios externos

- Stripe para pagos
- Expo Notifications para push
- almacenamiento de imagenes para fotos de progreso

## Riesgos actuales

- La base de datos actual usa SQLite, adecuada para prototipo pero no para una app multiusuario en produccion.
- No hay aun un modulo de pagos, que es una parte central del valor del producto.
- Falta mensajeria, por lo que la relacion PT-cliente depende todavia de canales externos.
- El progreso existe como historial, pero no como visualizacion clara tipo graficas.

## Prioridades concretas para los siguientes sprints

### Sprint 1

- alta de cliente desde app trainer
- mejora de detalle de cliente
- pulir programas y asignacion
- corregir edge cases de workout log

### Sprint 2

- sesiones para cliente
- reserva/cancelacion
- estados de sesion
- recordatorios basicos

### Sprint 3

- integracion Stripe
- planes o bonos
- historial de pagos

### Sprint 4

- graficas de progreso
- dashboard trainer con metricas utiles

### Sprint 5

- chat
- notificaciones

## Criterio de exito del MVP

El MVP esta listo cuando un entrenador puede operar una parte real de su negocio desde CoachOS y un cliente puede usarlo durante varias semanas sin depender de WhatsApp, hojas de calculo o cobros manuales para las tareas principales.
