/** "Son: VEINTITRES Y 19/100 SOLES" — the printed/legal spelling of an amount,
 *  same convention used on physical boletas. Supports 0 to 999,999.99. */

const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIECIS = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function tresDigitos(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const centena = c > 0 ? CENTENAS[c] + ' ' : '';
  return (centena + dosDigitos(resto)).trim();
}

function dosDigitos(n: number): string {
  if (n === 0) return '';
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIECIS[n - 10];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (n === 20) return 'VEINTE';
  if (d === 2) return 'VEINTI' + UNIDADES[u];
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function enteroALetras(n: number): string {
  if (n === 0) return 'CERO';
  if (n === 1) return 'UNO';

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];
  if (millones > 0) partes.push(millones === 1 ? 'UN MILLON' : `${tresDigitos(millones)} MILLONES`);
  if (miles > 0) partes.push(miles === 1 ? 'MIL' : `${tresDigitos(miles)} MIL`);
  if (resto > 0) partes.push(tresDigitos(resto));

  return partes.join(' ').trim();
}

/** amount: 23.19 → "VEINTITRES Y 19/100 SOLES" */
export function montoEnLetras(amount: number): string {
  const total = Math.round(Math.max(0, amount) * 100) / 100;
  const parteEntera = Math.floor(total);
  const centavos = Math.round((total - parteEntera) * 100);
  const centavosStr = String(centavos).padStart(2, '0');
  return `${enteroALetras(parteEntera)} Y ${centavosStr}/100 SOLES`;
}
