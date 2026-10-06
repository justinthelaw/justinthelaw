/** Public persistence boundary, consumed only by application composition. */
export { MAX_SAVE_BYTES, encodeSave, decodeSave, validateSave, migrateSave } from './codec.js';
export { createIndexedDbAdapter } from './indexeddb.js';
export { createSaveRepository } from './repository.js';
export { createPersistenceService, notificationApplies, notificationMarksSaved } from './application.js';
