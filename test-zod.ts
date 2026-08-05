import { loginSchema } from "./src/schemas/request/request.dto.js";
const result = loginSchema.safeParse({ loginIdentifier: "kishorpandey22@gmail.com", password: "Kishor@22" });
console.log(result);
