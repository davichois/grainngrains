// Genera el hash de la contraseña del panel para ADMIN_PASSWORD_HASH.
//   npm run admin:password -- "tu-nueva-contraseña"
// Si no se pasa contraseña, crea una al azar y la muestra.
import { randomBytes, scrypt } from "node:crypto";

const password =
  process.argv[2] ??
  randomBytes(12).toString("base64url"); // 16 caracteres al azar

if (password.length < 10) {
  console.error("La contraseña debe tener al menos 10 caracteres.");
  process.exit(1);
}

const salt = randomBytes(16);
scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
  if (err) throw err;
  /* Sin "$" (Next lo leería como variable dentro del .env) */
  const hash = `scrypt:${salt.toString("base64")}:${key.toString("base64")}`;
  if (!process.argv[2]) console.log(`Contraseña generada: ${password}\n`);
  console.log("Pega esta línea en tu .env:\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(
    `\n(y si aún no tienes una) ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`,
  );
});
