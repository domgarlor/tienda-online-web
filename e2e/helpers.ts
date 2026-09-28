// Genera datos únicos por ejecución para no chocar con restricciones
// de unicidad (username/email) si el backend lleva rato arrancado y ya
// se han corrido los tests antes. La misma lección que aprendimos con
// la colección de Postman: nunca hardcodear un email fijo en un test.
export function usuarioUnico() {
  const sufijo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    username: `e2e_${sufijo}`,
    password: 'password123',
    nombre: `Usuario E2E ${sufijo}`,
    email: `e2e_${sufijo}@example.com`,
  };
}
