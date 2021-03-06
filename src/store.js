import levelup from 'levelup';
import sublevel from 'level-sublevel';
import memdown from 'memdown';
import Resource from './resource';

export function configureStore(options = {}) {
  let db;

  if (db) {
    return db;
  }

  db = sublevel(levelup({
    db: memdown,
    keyEncoding: 'json',
    valueEncoding: 'json',
    ...options
  }));

  function save(resource) {
    const {
      id,
      type,
      ...attributes
    } = resource;

    const storage = db.sublevel(type);

    return new Promise((resolve, reject) => {
      resource.refresh();
      storage.put(id, resource.toJSON(), err => {
        if (err) {
          return reject(err);
        }

        resolve(resource);
      });
    });
  }

  function find(id, type) {
    if (typeof id === 'object') {
      type = id.type;
      id = id.id;
    }

    const storage = db.sublevel(type);

    return new Promise((resolve, reject) => {
      storage.get(id, (err, value) => {
        if (err) {
          return reject(err);
        }

        const {
          id,
          type,
          refreshed_at,
          ...attributes
        } = value;

        const record = new Resource(id, type, attributes, {
          refreshed_at: refreshed_at
        });

        resolve(record);
      });
    });
  }

  return {
    save: save,
    find: find 
  };
}
