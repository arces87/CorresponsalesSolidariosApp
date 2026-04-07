/**
 * Claves de `userData` que pertenecen a la operación en curso (depósito, retiro,
 * préstamo, obligaciones, pago de servicio). Se eliminan tras completar la
 * transacción o al volver al menú, manteniendo sesión y datos de negocio.
 */
const OPERACION_EN_CURSO_KEYS = [
  'numerocuentacliente',
  'tipocuenta',
  'secuencialcuenta',
  'tipoRegistroFirma',
  'valor',
  'nombrecliente',
  'identificacioncliente',
  'tipoIdentificacioncliente',
  'observacionDeposito',
  'idservicio',
  'tipoServicio',
  'servicio',
  'proveedorsevicio',
  'recibo',
  'referencia',
  'valorafectado',
  'obligacionesSeleccionadas',
  'obligacionesTransaccion',
  'cuentasPorCobrar',
  'totalSeleccionado',
  'secuencialprestamo',
  'codigoprestamo',
];

/**
 * @param {Record<string, unknown> | null | undefined} prevData
 * @returns {Record<string, unknown> | null | undefined}
 */
export function clearOperacionEnCurso(prevData) {
  if (prevData == null || typeof prevData !== 'object') {
    return prevData;
  }
  const next = { ...prevData };
  for (const key of OPERACION_EN_CURSO_KEYS) {
    if (key in next) {
      delete next[key];
    }
  }
  return next;
}
