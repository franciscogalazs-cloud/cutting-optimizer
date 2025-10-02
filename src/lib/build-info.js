/* global __BUILD_INFO__ */
// Exponer información de compilación definida por Vite en __BUILD_INFO__
// Tip: __BUILD_INFO__ es una constante global inyectada en tiempo de build por vite.config.js
export const BUILD_INFO = (typeof __BUILD_INFO__ !== 'undefined') ? __BUILD_INFO__ : {
  version: '0.0.0',
  date: new Date().toISOString(),
  commit: 'dev',
};

export default BUILD_INFO;
