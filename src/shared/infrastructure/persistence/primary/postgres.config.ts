const dbConfig = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	max: 10,
	idleTimeoutMillis: 10000,
	connectionTimeoutMillis: 0,
};

export { dbConfig };

