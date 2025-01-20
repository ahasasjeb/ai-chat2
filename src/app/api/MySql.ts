import mysql from 'mysql2/promise';

export class MySql {
  private static instance: mysql.Pool;

  public static getInstance(): mysql.Pool {
    if (!MySql.instance) {
      MySql.instance = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    }
    return MySql.instance;
  }
}

export async function initDatabase() {
  const pool = MySql.getInstance();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(255) PRIMARY KEY,
      user_id INT,
      title VARCHAR(255),
      created_at BIGINT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      chat_id VARCHAR(255),
      role VARCHAR(50),
      content TEXT,
      created_at BIGINT,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);
}
