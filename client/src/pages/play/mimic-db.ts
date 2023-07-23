export class MimicSchema<T> {

	public static dbIdentifier: string;
	public static dbKey: string;

	constructor(init: {
		[P in keyof T as P extends keyof MimicSchema<T> ? never : P]: T[P]
	}) {
		for (const prop in init)
			(this as any)[prop] = init[prop as keyof typeof init];
	}

}


export class MimicDB {

	static #setups: Setup[] = [];

	static #handleRequestError(event: Event, reject: (reason?: any) => void) {
		const target = event.target as IDBOpenDBRequest;
		reject('Database error: ' + target.error);
	}

	static #handleRequestSuccess(event: Event, resolve: (value: any) => void) {
		const target = event.target as IDBOpenDBRequest;
		resolve(target.result);
	}

	public static connect(dbName: string, version?: number): Database {
		const request = window.indexedDB.open(dbName, version);
		const promise = new Promise<IDBDatabase>((res, rej) => {
			request.onerror = ev => this.#handleRequestError(ev, rej);
			request.onsuccess = ev => this.#handleRequestSuccess(ev, res);
			request.onupgradeneeded = ev => {
				const target = ev.target as IDBOpenDBRequest | null;
				const db = target?.result;
				if (db) {
					const setupIndex = this.#setups.findIndex(s => s.dbName === dbName);
					if (setupIndex > -1) {
						const [ setup ] = this.#setups.splice(setupIndex, 1);
						setup?.__execute(db);
					}
				}

				console.log(this.#setups);
			};
		});

		return new Database(promise);
	}

	public static setup(dbName: string, fn: (setup: DBSetup) => void) {
		if (this.#setups.find(s => s.dbName === dbName))
			throw new Error(`setup for ${ dbName } has already been registered.`);

		const setupInstance = new Setup(dbName);
		fn(setupInstance);

		this.#setups.push(setupInstance);
	}

}


class Setup {

	#setups: ((db: IDBDatabase) => void)[] = [];

	constructor(public dbName: string) {}

	public createCollection<T extends typeof MimicSchema<any>>(
		schema: T,
		...[ name, options ]: Parameters<IDBDatabase['createObjectStore']>
	) {
		const _createCollection = (db: IDBDatabase) => db.createObjectStore(name, options);
		const _createIndex: ((store: IDBObjectStore) => void)[] = [];

		const chain = {
			createIndex: (...args: Parameters<IDBObjectStore['createIndex']>) => {
				_createIndex.push((store: IDBObjectStore) => void store.createIndex(...args));

				return chain;
			},
			mutate: (mutateFn: (collection: Collection<T>) => void) => {
				this.#setups.push((db: IDBDatabase) => {
					const store = _createCollection(db);
					_createIndex.forEach(fn => fn(store));

					store.transaction.onerror = (event) => {
						const target = event.target as IDBOpenDBRequest;
						console.error('Database error: ' + target.error);
					};

					store.transaction.oncomplete = () => {
						const coll = new Database(Promise.resolve(db)).collection(schema);
						mutateFn(coll);
					};
				});
			},
		};

		return chain;
	}

	public __execute(db: IDBDatabase) {
		this.#setups.forEach(setup => setup(db));
	}

}


class Database {

	constructor(public database: Promise<IDBDatabase>) {}

	public collection<T extends typeof MimicSchema<any>>(schema: T) {
		return new Collection(
			schema,
			async (mode) => {
				const db = await this.database;
				const transaction = db.transaction(schema.dbIdentifier, mode);
				const store = transaction.objectStore(schema.dbIdentifier);

				return store;
			},
		);
	}

}


class Collection<T extends typeof MimicSchema<any>> {

	constructor(
		public schema: T,
		public collection: (mode: IDBTransactionMode) => Promise<IDBObjectStore>,
	) {}

	static #handleRequestError(event: Event, reject: (reason?: any) => void) {
		const target = event.target as IDBRequest;
		reject('Request error: ' + target.error);
	}

	static #handleRequestSuccess(event: Event, resolve: (value: any) => void) {
		const target = event.target as IDBRequest;
		resolve(target.result);
	}

	public async get(query: IDBValidKey | IDBKeyRange) {
		const coll = await this.collection('readonly');

		const promise = await new Promise<T | undefined>((res, rej) => {
			const req = coll.get(query);

			req.onerror = event => Collection.#handleRequestError(event, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise !== undefined
			?  new this.schema(promise)
			: undefined;
	}

	public async getByIndex(indexName: string, query: IDBValidKey | IDBKeyRange) {
		const coll = await this.collection('readonly');

		const promise = await new Promise<T | undefined>((res, rej) => {
			const req = coll.index(indexName).get(query);

			req.onerror = event => Collection.#handleRequestError(event, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise !== undefined
			?  new this.schema(promise)
			: undefined;
	}

	public async getAll() {
		const coll = await this.collection('readonly');
		const promise = await new Promise<T[]>((res, rej) => {
			const req = coll.getAll();

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise.map(item => new this.schema(item) as InstanceType<T>);
	}

	public async add<TKey extends IDBValidKey>(item: InstanceType<T>, key?: TKey): Promise<TKey> {
		console.log('trying to add');

		const coll = await this.collection('readwrite');
		const promise = await new Promise<TKey>((res, rej) => {
			const req = coll.add(item, key ?? (item as any)[this.schema.dbKey]);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	public async put<TKey extends IDBValidKey>(item: InstanceType<T>, key?: TKey): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const promise = await new Promise<TKey>((res, rej) => {
			const req = coll.put(item, key ?? (item as any)[this.schema.dbKey]);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return promise;
	}

	public async putByIndex<TKey extends IDBValidKey>(
		indexName: string,
		query: IDBValidKey | IDBKeyRange,
		item: InstanceType<T>,
	): Promise<TKey> {
		const coll = await this.collection('readwrite');
		const collKey = await new Promise<TKey>((res, rej) => {
			const req = coll.index(indexName).getKey(query);

			req.onerror = ev => Collection.#handleRequestError(ev, rej);
			req.onsuccess = ev => Collection.#handleRequestSuccess(ev, res);
		});

		return await this.put(item, collKey);
	}

}


export type DBSetup = Omit<Setup, '__execute' | 'dbName'>;
export type MimicDBSetup = typeof Setup
export type MimicDBDatabase = typeof Database
export type MimicDBCollection = typeof Collection
