import { z } from "zod";

export const itemRunesSchema = z.array(
  z.object({
    id: z.number(),
    Key: z.string(),
    enUS: z.string(),
    zhTW: z.string(),
    deDE: z.string(),
    esES: z.string(),
    frFR: z.string(),
    itIT: z.string(),
    koKR: z.string(),
    plPL: z.string(),
    esMX: z.string(),
    jaJP: z.string(),
    ptBR: z.string(),
    ruRU: z.string(),
    zhCN: z.string(),
  }),
);

export type TItemRunes = z.infer<typeof itemRunesSchema>;
