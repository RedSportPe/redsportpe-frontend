/**
 * RedSport — Puente de impresión local (ESC/POS, boletera 80mm)
 * ------------------------------------------------------------------
 * Reemplaza tu red-boss-test/serve_escpos.js con este archivo (o copia
 * solo buildBoleta() dentro del tuyo, donde hoy armas el texto).
 *
 * Correr:   node serve_escpos.js
 * Escucha:  POST http://localhost:3000/api/print/boleta  (JSON del frontend)
 *
 * ENVÍO A LA IMPRESORA: al final del archivo está sendToPrinter().
 * Por defecto intenta el paquete `escpos` + `escpos-usb` (npm i escpos escpos-usb).
 * Si tu bridge actual ya imprime de otra forma (share de Windows, puerto COM,
 * archivo RAW), conserva TU función de envío y pásale el Buffer de buildBoleta.
 */

const http = require('http');

// ===== ESC/POS =====
const ESC = '\x1b';
const GS = '\x1d';
const INIT = ESC + '@';
const CENTER = ESC + 'a' + '\x01';
const LEFT = ESC + 'a' + '\x00';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_ON = GS + '!' + '\x11';   // double width + height
const DOUBLE_OFF = GS + '!' + '\x00';
const CUT = GS + 'V' + '\x42' + '\x00'; // partial cut with feed

const WIDTH = 42; // columnas en 80mm con fuente A

// Tildes y eñes dan problemas según el codepage de la impresora: se translitera.
const ACCENTS = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n', Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ñ: 'N', '¡': '', '¿': '', '·': '-' };
const clean = (s = '') => String(s).replace(/[áéíóúñÁÉÍÓÚÑ¡¿·]/g, c => ACCENTS[c] ?? c);

const line = () => '-'.repeat(WIDTH) + '\n';
const money = n => 'S/ ' + Number(n ?? 0).toFixed(2);
/** "etiqueta.....importe" a lo ancho del papel */
const row = (label, value) => {
  label = clean(label); value = clean(value);
  const space = Math.max(1, WIDTH - label.length - value.length);
  return label + ' '.repeat(space) + value + '\n';
};
const wrap = (text, indent = 0) => {
  const words = clean(text).split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > WIDTH - indent) {
      lines.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.map(l => ' '.repeat(indent) + l).join('\n') + '\n';
};

const fecha = iso => {
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return { dia: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`, hora: `${p(d.getHours())}:${p(d.getMinutes())}` };
};

/** Arma la boleta completa (estilo Tambo, sin IGV) a partir del payload del frontend */
function buildBoleta(p) {
  const f = fecha(p.fecha ?? Date.now());
  let out = INIT;

  // ===== Cabecera legal =====
  out += CENTER;
  out += DOUBLE_ON + clean(p.empresa?.nombreComercial ?? 'REED SPORT') + '\n' + DOUBLE_OFF;
  out += clean(p.empresa?.razonSocial ?? '') + '\n';
  if (p.tienda?.direccion) out += wrap(p.tienda.direccion);
  if (p.tienda?.ubigeo) out += clean(p.tienda.ubigeo) + '\n';
  out += 'RUC: ' + clean(p.empresa?.ruc ?? '') + '\n';
  out += line();
  out += BOLD_ON + 'BOLETA DE VENTA\n' + BOLD_OFF;
  if (p.boleta) out += clean(p.boleta) + '\n';
  out += line();

  // ===== Contexto =====
  out += LEFT;
  out += clean(`${p.tienda?.nombre ?? 'Tienda'} (${p.tienda?.codigo ?? ''}) - Caja: ${p.caja ?? 1}`) + '\n';
  out += row('Fecha: ' + f.dia, 'Hora: ' + f.hora);
  out += 'Ticket: ' + clean(p.ticket ?? p.codigo ?? '') + '\n';
  out += 'Vendedor: ' + clean(p.vendedor ?? '') + '\n';
  out += line();

  // ===== Cliente =====
  out += BOLD_ON + 'Cliente\n' + BOLD_OFF;
  out += 'Nombre: ' + clean(p.cliente ?? 'Clientes Varios') + '\n';
  out += 'Numero de Documento: ' + clean(p.documentoCliente ?? '00000001') + '\n';
  out += line();

  // ===== Items =====
  out += row('Articulo  Cantidad', 'Importe');
  for (const item of p.items ?? []) {
    out += wrap(item.nombre);
    out += ' ' + clean(item.sku ?? '') + '\n';
    out += row(` ${item.cantidad} x ${money(item.precio)}`, money(item.cantidad * item.precio));
  }
  out += line();

  // ===== Totales (sin IGV: la facturacion la lleva otro proveedor) =====
  if (p.subtotal && p.descuento) {
    out += row('SUBTOTAL', money(p.subtotal));
    out += row(`TOTAL DCTO. (${p.motivoDescuento ?? ''})`, '-' + money(p.descuento));
  }
  out += BOLD_ON + row('TOTAL A PAGAR', money(p.total)) + BOLD_OFF;
  out += 'Son: ' + clean(p.montoEnLetras ?? '') + '\n';
  out += line();

  // ===== Pago =====
  if (p.metodoPago === 'efectivo') {
    out += row('Efectivo', money(p.cashReceived));
    out += row('Cambio', '-' + money((p.cashReceived ?? 0) - p.total));
  } else if (p.metodoPago === 'mixto') {
    out += row('Efectivo', money(p.cashReceived));
    out += row('QR Yape/Plin', money(p.qrAmount));
  } else {
    out += row('QR Yape/Plin', money(p.total));
  }
  out += line();

  // ===== Pie =====
  out += CENTER;
  out += BOLD_ON + 'GRACIAS POR COMPRAR EN ' + clean(p.empresa?.nombreComercial ?? 'REED SPORT') + '\n' + BOLD_OFF;
  out += wrap('Enterate de la politica de cambios y devoluciones en redsport.pe/cambios');
  out += line();
  out += 'Copia de cliente\n';
  out += LEFT + wrap(p.leyenda ?? 'ESTA ES UNA REPRESENTACION IMPRESA DE LA BOLETA DE VENTA.');
  out += '\n\n\n' + CUT;

  return Buffer.from(out, 'binary');
}

// ===== Envío a la impresora =====
// Por defecto: escpos + escpos-usb (npm i escpos escpos-usb).
// >>> Si tu bridge actual imprime de otra manera, REEMPLAZA SOLO esta función. <<<
function sendToPrinter(buffer) {
  return new Promise((resolve, reject) => {
    try {
      const escpos = require('escpos');
      escpos.USB = require('escpos-usb');
      const device = new escpos.USB();
      device.open(err => {
        if (err) return reject(err);
        device.write(buffer, err2 => {
          device.close();
          err2 ? reject(err2) : resolve();
        });
      });
    } catch (e) {
      reject(new Error('No se pudo cargar escpos/escpos-usb. Instala con: npm i escpos escpos-usb — o reemplaza sendToPrinter() con tu método actual. ' + e.message));
    }
  });
}

// ===== Servidor HTTP (con CORS para el frontend en :4200) =====
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'POST' && req.url === '/api/print/boleta') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const buffer = buildBoleta(payload);
        await sendToPrinter(buffer);
        console.log(`[OK] Boleta ${payload.boleta ?? payload.codigo} impresa`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('[ERROR]', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3000, () => {
  console.log('Puente de impresion RedSport escuchando en http://localhost:3000/api/print/boleta');
});
