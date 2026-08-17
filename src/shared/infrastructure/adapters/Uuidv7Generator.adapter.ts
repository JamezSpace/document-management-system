import { uuidv7 } from "uuidv7";
import type { IdGeneratorPort } from "../../application/port/services/IdGenerator.port.js";

class UuidV7Generator implements IdGeneratorPort {
  generate(): string {
    return uuidv7();
  }
}

export default UuidV7Generator;