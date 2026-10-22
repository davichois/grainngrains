/* ───────────────────────────────────────────────────────────────
   CUPONES Y PROMOCIONES

   Cada cupón se arma con PALABRAS CLAVE:

     cupon("CODIGO", <un premio>, <reglas…>, <opciones…>)

   El checkout y el servidor usan las mismas reglas: lo que ve el
   cliente es exactamente lo que se cobra.

   ══ PREMIOS (elige uno) ══════════════════════════════════════════
   porcentaje(10)                      10% de descuento
   porcentaje(15, { tope: 40 })        15%, máximo S/ 40
   montoFijo(20)                       S/ 20 menos
   montoPorCada(10, 100)               S/ 10 menos por cada S/ 100
   precioEspecial(200)                 Cada bolsa a S/ 200
   gratisElMasBarato                   La bolsa más barata gratis
   descuentoEnUno(30, "mas caro")      30% en la bolsa más cara (o "mas barato")
   llevaPaga(3, 2)                     Lleva 3, paga 2
   segundoAl(50)                       La 2.ª bolsa al 50%
   regalo("clasicos", "morningClassic", "250g", "grano entero")
                                       Producto de regalo a S/ 0
   envioGratis                         Envío gratis
   descuentoEnvio(5)                   S/ 5 menos en el envío
   descuentoEnvioPorcentaje(50)        50% menos en el envío
   envioA(5)                           El envío cuesta S/ 5
   escalasPorCantidad({ 10: 15, 20: 20 })  15% desde 10 cafés, 20% desde 20
   escalasPorMonto({ 200: 5, 400: 10 })    5% desde S/ 200, 10% desde S/ 400

   ══ REGLAS (combina las que quieras) ═════════════════════════════
   Carrito
     compraMinima(120)   compraMaxima(150)
     cantidadMinima(3)   cantidadMaxima(2)    (un combo cuenta como varios cafés)
     requiere("daughtersOfTheForest", …)      Productos (o combos) que deben estar en el carrito
     requiereCantidad("donEliseoFarm", 2)     Al menos 2 bolsas de ese producto
     variedadMinima(3)                        Al menos 3 cafés distintos
   Qué productos reciben el descuento
     ediciones("caficultores", "mujeres", "clasicos", "experimental")
     exceptoEdiciones("experimental")
     productos("donEliseoFarm")   exceptoProductos("vanilla-infused")
     presentacion("1kg")          sinCombos      soloCombos
     moliendas("grano entero", "fino")
     limiteUnidades(3)            El descuento alcanza máximo a 3 bolsas (las más caras)
     topeDescuento(50)            Tope de S/ 50 para cualquier premio
   Cliente
     mayorista                     Solo con Factura (RUC)
     correos("ana@gmail.com")      dominios("miempresa.com")
     documentos("20000000001")     DNI o RUC autorizados
     suscriptores                  Solo si marca "Quiero recibir novedades"
     soloBoleta                    Solo consumidor final (no empresas)
     exceptoCorreos(…)  exceptoDominios(…)  exceptoDocumentos(…)   Quiénes NO pueden
     idiomas("en", "de")           Solo si compra con la web en esos idiomas
   Pago y envío
     soloYape   soloTarjeta   soloLima   soloProvincias
     departamentos("Arequipa", "Cusco")    exceptoDepartamentos("Loreto")
   Fechas y horarios (hora de Lima)
     desde("2026-12-01")   hasta("2026-12-31")   vigencia("2026-12-01", "2026-12-31")
     vigencia("2026-11-27 00:00", "2026-11-27 23:59")   Con hora exacta
     fechas("2026-07-28", "2026-07-29")         Días sueltos
     dias("viernes", "sabado")   finDeSemana
     diasDelMes(1, 15)   quincena (15 y fin de mes)   finDeMes
     horario("06:00", "10:00")   horario("22:00", "02:00")  (cruza medianoche)
   Límites de uso (necesitan UPSTASH_REDIS_REST_URL y _TOKEN en .env;
   sin ellas, estos cupones no se aplican)
     usosMaximos(100)   usosPorCliente(2)   unaVezPorCliente   usosPorDia(20)
     presupuesto(1500)   Soles de descuento que se pueden regalar en total
     primeraCompra       clienteFrecuente(3)  (desde su 4.ª compra)

   ══ OPCIONES ═════════════════════════════════════════════════════
     automatico     Se aplica solo, sin escribir el código
     acumulable     Se suma con otras promociones acumulables. Entre las
                    que no lo son (incluido el cupón escrito) gana la que
                    más ahorra.
     exclusivo      No se combina con nada: se aplica solo él, si ahorra
                    más que todas las demás juntas
     alias("ANA15", "LUIS15")   Otros códigos para el mismo cupón
     inactivo       Desactivado sin borrarlo
     nota("…")      Nota interna, no se muestra

   Ediciones: caficultores, mujeres, clasicos, experimental
   Productos: donEliseoFarm, donEdwinFarm, donOsmarFarm,
              daughtersOfTheForest, guardiansOfTheEarth, morningClassic,
              vanilla-infused, guanabana-infused
   Combos:    farmersTrio, discovery, womenDuo, infusedDuo
   Moliendas: "grano entero", "grueso", "medio", "fino"
   Si algo está mal escrito, ese cupón se desactiva solo y se avisa en la
   consola con el motivo.
─────────────────────────────────────────────────────────────── */
import type { Coupon } from "./index";
import {
  alias,
  clienteFrecuente,
  descuentoEnvioPorcentaje,
  envioA,
  exceptoDepartamentos,
  exceptoDominios,
  exclusivo,
  fechas,
  idiomas,
  limiteUnidades,
  moliendas,
  montoPorCada,
  presupuesto,
  quincena,
  requiereCantidad,
  soloBoleta,
  topeDescuento,
  usosPorDia,
  variedadMinima,
  acumulable,
  automatico,
  cantidadMaxima,
  cantidadMinima,
  compraMaxima,
  compraMinima,
  cupon,
  departamentos,
  dias,
  documentos,
  dominios,
  ediciones,
  envioGratis,
  descuentoEnvio,
  escalasPorCantidad,
  escalasPorMonto,
  exceptoEdiciones,
  gratisElMasBarato,
  horario,
  inactivo,
  llevaPaga,
  mayorista,
  montoFijo,
  nota,
  porcentaje,
  precioEspecial,
  presentacion,
  primeraCompra,
  regalo,
  requiere,
  segundoAl,
  sinCombos,
  soloCombos,
  soloLima,
  soloProvincias,
  soloYape,
  suscriptores,
  unaVezPorCliente,
  usosMaximos,
  vigencia,
} from "./keywords";

export const COUPONS: Coupon[] = [
  /* ── Porcentaje ── */
  cupon("GRAIN10", porcentaje(10), nota("10% en toda la tienda")),
  cupon("BIENVENIDO15", porcentaje(15, { tope: 40 }), compraMinima(120)),
  cupon("CAFICULTOR20", porcentaje(20), ediciones("caficultores"), sinCombos),
  cupon("CLASICOS12", porcentaje(12), exceptoEdiciones("experimental")),
  cupon("COMBO10", porcentaje(10), soloCombos),
  cupon("PRUEBA30", porcentaje(30), compraMaxima(150), cantidadMaxima(2)),

  cupon("GRANO15", porcentaje(15), moliendas("grano entero")),
  cupon(
    "TRES20",
    porcentaje(20),
    limiteUnidades(3),
    nota("20% en máximo 3 bolsas"),
  ),
  cupon("VARIEDAD12", porcentaje(12), variedadMinima(3)),
  cupon(
    "AMIGOS10",
    porcentaje(10),
    exceptoDominios("grainngrains.org"),
    nota("Para todos menos el equipo"),
  ),
  cupon("CONSUMIDOR8", porcentaje(8), soloBoleta),
  cupon(
    "WELCOME10",
    porcentaje(10),
    idiomas("en", "de", "fr", "pt", "zh", "ja", "ko"),
    nota("Para quien compra desde la web en otro idioma"),
  ),

  /* ── Monto fijo, precio especial y bolsa gratis ── */
  cupon("MENOS20", montoFijo(20), compraMinima(150)),
  cupon("CADA100", montoPorCada(10, 100), nota("S/ 10 por cada S/ 100")),
  cupon(
    "PAREJA15",
    montoFijo(15),
    requiere("daughtersOfTheForest", "guardiansOfTheEarth"),
  ),
  cupon("KILO200", precioEspecial(200), presentacion("1kg")),
  cupon("CUARTOGRATIS", gratisElMasBarato, cantidadMinima(4), sinCombos),

  /* ── Lleva X, paga Y ── */
  cupon("MUJERES3X2", llevaPaga(3, 2), ediciones("mujeres")),
  cupon("SEGUNDO50", segundoAl(50)),

  /* ── Regalo ── */
  cupon(
    "DOSELISEO",
    regalo("experimental", "vanilla-infused"),
    requiereCantidad("donEliseoFarm", 2),
    nota("Lleva 2 Don Eliseo y te regalamos un Experimental de Vainilla"),
  ),
  cupon(
    "REGALO",
    regalo("clasicos", "morningClassic", "250g", "grano entero"),
    compraMinima(200),
  ),

  /* ── Envío ── */
  cupon("ENVIOGRATIS", envioGratis, cantidadMinima(2), soloLima),
  cupon("PROVINCIA5", descuentoEnvio(5), soloProvincias),
  cupon("AREQUIPA", envioGratis, departamentos("Arequipa")),
  cupon("ENVIO5", envioA(5), soloProvincias, nota("Envío a provincias a S/ 5")),
  cupon("MITADENVIO", descuentoEnvioPorcentaje(50)),
  cupon(
    "ENVIOSELVA",
    envioGratis,
    compraMinima(180),
    exceptoDepartamentos("Loreto", "Madre de Dios", "Ucayali"),
  ),

  /* ── Mayoristas y clientes especiales ── */
  cupon(
    "MAYORISTA",
    escalasPorCantidad({ 1: 15, 20: 20, 50: 25 }),
    mayorista,
    presentacion("1kg"),
    sinCombos,
  ),
  cupon("ESCALA", escalasPorMonto({ 200: 5, 400: 10, 800: 15 })),
  cupon(
    "CORPORATIVO",
    porcentaje(18),
    dominios("empresa-aliada.com"),
    nota("Cambia el dominio por el de la empresa real"),
  ),
  cupon(
    "DISTRIBUIDOR",
    precioEspecial(190),
    mayorista,
    presentacion("1kg"),
    documentos("20000000001"),
    nota("Pon los RUC reales de tus distribuidores"),
  ),
  cupon("NOVEDADES7", porcentaje(7), suscriptores),

  /* ── Medio de pago ── */
  cupon("YAPE5", porcentaje(5), soloYape),

  /* ── Fechas y horarios ── */
  cupon("NAVIDAD25", porcentaje(25), vigencia("2026-12-01", "2026-12-31")),
  cupon("FINDE10", porcentaje(10), dias("viernes", "sabado", "domingo")),
  cupon("MADRUGADOR", porcentaje(8), horario("06:00", "10:00")),
  cupon("NOCTURNO", porcentaje(7), horario("22:00", "02:00")),
  cupon("FIESTASPATRIAS", porcentaje(28), fechas("2027-07-28", "2027-07-29")),
  cupon("QUINCENA", porcentaje(10), quincena),
  cupon(
    "BLACKFRIDAY",
    porcentaje(30),
    vigencia("2026-11-27 00:00", "2026-11-27 23:59"),
    topeDescuento(100),
    exclusivo,
    nota("Solo ese día, máximo S/ 100, no se combina con nada"),
  ),

  /* ── Límites de uso (necesitan Upstash Redis) ── */
  cupon("PRIMERA10", porcentaje(10), primeraCompra),
  cupon("LANZAMIENTO", porcentaje(20), usosMaximos(100), unaVezPorCliente),
  cupon("FIEL15", porcentaje(15), clienteFrecuente(3)),
  cupon("DIARIO12", porcentaje(12), usosPorDia(20)),
  cupon(
    "INFLUENCER15",
    porcentaje(15),
    alias("ANA15", "LUIS15"),
    presupuesto(1500),
    unaVezPorCliente,
    nota("Códigos de influencers; se corta al regalar S/ 1 500"),
  ),

  /* ── Promociones automáticas (sin código). Quita "inactivo" para lanzarlas ── */
  cupon(
    "PROMO-PROVINCIAS",
    envioGratis,
    soloProvincias,
    compraMinima(250),
    automatico,
    acumulable,
    inactivo,
  ),
  cupon(
    "PROMO-500",
    regalo("clasicos", "morningClassic"),
    compraMinima(500),
    automatico,
    acumulable,
    inactivo,
  ),
];
