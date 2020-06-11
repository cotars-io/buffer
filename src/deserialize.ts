import {
    MetaModel,
    Type,
    MetaField,
    FLAG_REPEATED,
    FLAG_MAP_KEY_STRING,
} from "./common";
import { Reader } from "./reader";

function readValue(reader: Reader, flag: number) {
    const isMapKeyString = (flag & FLAG_MAP_KEY_STRING) > 0;
    const type: Type = flag & 0x1f;
    const readFunctions = {
        [Type.STR]: reader.utf8,
        [Type.BOOL]: reader.bool,
        [Type.INT8]: reader.int8,
        [Type.UINT8]: reader.uint8,
        [Type.INT16]: reader.int16,
        [Type.UINT16]: reader.uint16,
        [Type.INT32]: reader.int32,
        [Type.UINT32]: reader.uint32,
        [Type.ENUM]: reader.uint32,
        [Type.INT64]: reader.int64,
        [Type.UINT64]: reader.uint64,
        [Type.FLOAT32]: reader.float32,
        [Type.FLOAT64]: reader.float64,
        [Type.BYTES]: reader.bytes,
    };
    if (type == Type.MODEL) {
        return readModel(reader);
    } else if (readFunctions[type]) {
        return readFunctions[type].call(reader);
    } else if (type == Type.MAP) {
        const mapSize = reader.uint16();
        const mapValues = new Map;
        for (let i = 0; i < mapSize; i++) {
            if (isMapKeyString) {
                mapValues.set(reader.utf8(), readEachValue(reader).values);
            } else {
                mapValues.set(reader.int32(), readEachValue(reader).values);
            }
        }
        return mapValues;
    }
    throw new Error(`data type(${type}) unpack error`);
}

function readModel(buffer: number[] | Reader) {
    const reader = buffer instanceof Reader ? buffer : new Reader(buffer);
    const values = {};
    const tag = reader.uint32();
    while (!reader.isEnd()) {
        const readed = readEachValue(reader);
        values[readed.tag] = readed.values;
    }
    return { __tag__: tag, ...values };
}

function readEachValue(reader: Reader): { tag: number; values: any } {
    const tag = reader.uint16();
    const flag = reader.uint8();
    const isRepeated = (flag & FLAG_REPEATED) > 0;
    if (isRepeated) {
        const values = [];
        const length = reader.uint16();
        for (let i = 0; i < length; i++) {
            values.push(readValue(reader, flag));
        }
        return { tag, values };
    }
    return { tag, values: readValue(reader, flag) };
}

type DeserializeType =  { __tag__: number, [index: number]: any };

export function transform<T>(data: DeserializeType, meta: MetaModel): Partial<T> {
    const object = new Object;
    meta.fields.forEach(f => {
        if (f.type == Type.MODEL) {
            object[f.name] = transform(data[f.tag], f.model);
        } else {
            object[f.name] = data[f.tag];
        }
    });
    return object as any;
}

export function deserialize(buffer: number[]): DeserializeType {
    const data = readModel(buffer);
    return data as DeserializeType;
}
