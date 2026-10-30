import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
let password = "";
if (process.stdin.isTTY) {
  process.stdout.write(
    "Choisissez un mot de passe (12 caractères minimum, saisie masquée) : ",
  );
  const output = new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  password = await rl.question("");
  rl.close();
  process.stdout.write("\n");
} else {
  for await (const chunk of process.stdin) password += chunk.toString();
  password = password.replace(/\r?\n$/, "");
}
if (password.length < 12 || password.length > 1024) {
  console.error("Le mot de passe doit contenir entre 12 et 1024 caractères.");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
console.log(
  `ADMIN_PASSWORD_HASH=scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
);
