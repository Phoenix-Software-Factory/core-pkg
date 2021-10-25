import {openDB, deleteDB, wrap, unwrap} from 'https://unpkg.com/idb?module';

let _db;
export const initialize$ = (dbName, models, dbVersion) => {
    _db = openDB(dbName, dbVersion, {
        upgrade(db) {
            // Create a store of objects
            models.forEach(m => {
                const store = db.createObjectStore(m.name, m.options);
                // Create an index on the 'date' property of the objects.
                (m.indexes || []).forEach(i => {
                    store.createIndex(i, i);
                })
            })
        },
    });
    return _db;
};

export const get$ = async (model, key) => (await _db).get(model, key);
export const add$ = async (model, value) => (await _db).add(model, value);
export const set$ = async (model, key, val) => (await _db).put(model, val, key);
export const count$ = async (model, key, val) => (await _db).count(model, key);
export const del$ = async (model, key) => (await _db).delete(model, key);
export const clear$ = async (model) => (await _db).clear(model);
export const keys$ = async (model) => (await _db).getAllKeys(model);
export const all$ = async (model, key) => (await _db).getAll(model, key);
export const bulkAdd$ = async (model, data) => {
    if (data && data.length) {
        const tx = (await _db).transaction(model, 'readwrite');
        await Promise.all(data.map(d => tx.store.add(d)).concat(tx.done));
    }
};
export const bulkSet$ = async (model, data) => {
    if (data && data.length) {
        const tx = (await _db).transaction(model, 'readwrite');
        await Promise.all(data.map(d => tx.store.put(d)).concat(tx.done));
    }
};
export const setIf$ = async (model, where, update, options) => {
    const whereKey = where && where.key;
    const whereValue = where && where.value;
    const updateKey = update && update.key;
    const updateValue = update && update.value;
    const tx = _db.transaction(model, 'readwrite');
    const index = tx.store.index(whereKey);

    for await (const cursor of index.iterate(whereValue)) {
        const pointer = {...cursor.value};
        if ((options.stringEnd && typeof updateValue === 'string') || options.plus) {
            pointer[updateKey] += updateValue;
        } else if (options.stringStart && typeof updateValue === 'string') {
            pointer[updateKey] = updateValue + pointer[updateKey];
        } else if (options.less) {
            pointer[updateKey] -= updateValue;
        } else if (options.fnEval || typeof updateValue === 'function') {
            pointer[updateKey] = updateValue(pointer[updateKey]);
        } else {
            pointer[updateKey] = updateValue;
        }
        cursor.update(pointer);
    }

    await tx.done;
}


// const initialize$ = openDB('igm-db', 1, {
//     upgrade(db) {
//         // Create a store of objects
//         const store = db.createObjectStore('images', {
//             // The 'id' property of the object will be the key.
//             keyPath: 'id',
//             // If it isn't explicitly set, create a value by auto incrementing.
//             autoIncrement: true,
//         });
//         // Create an index on the 'date' property of the objects.
//         store.createIndex('createdAt', 'createdAt');
//     },
// });
