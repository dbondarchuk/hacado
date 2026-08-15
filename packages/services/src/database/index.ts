import { MongoClient } from "mongodb";

let client: MongoClient;

const getClient = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  const options = { appName: "hacado" };
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClient?: MongoClient;
    };

    if (!globalWithMongo._mongoClient) {
      globalWithMongo._mongoClient = new MongoClient(uri, options);
    }
    client = globalWithMongo._mongoClient;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
  }
};

export const getDbConnection = async () => {
  const dbName = process.env.MONGODB_DB;
  return (await getDbClient()).db(dbName, { ignoreUndefined: true });
};

export const getDbConnectionSync = () => {
  if (!client) getClient();
  const dbName = process.env.MONGODB_DB;
  return client.db(dbName, { ignoreUndefined: true });
};

export const getDbClient = async () => {
  if (!client) getClient();

  return await client.connect();
};
