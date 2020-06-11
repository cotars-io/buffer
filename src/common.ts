export enum Type {
    STR,
    BOOL,
    INT8,
    UINT8,
    INT16,
    UINT16,
    INT32,
    UINT32,
    ENUM,
    INT64,
    UINT64,
    FLOAT32,
    FLOAT64,
    BYTES,
    MODEL,
    MAP,
}

export type MetaField = {
    type: Type;
    repeated: boolean;
    name: string;
    tag: number;
    model?: MetaModel;
    mapValueField?: MetaField;
    mapKeyWithString?: boolean;
}

export type MetaModel = {
    name: string;
    tag: number;
    fields: MetaField[];
}

export const FLAG_REPEATED = 0x40;
export const FLAG_MAP_KEY_STRING = 0x80;