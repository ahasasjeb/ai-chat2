import mysql from 'mysql2/promise';

export class MySql {
  private static instance: mysql.Pool | null = null;

  public static async getInstance(): Promise<mysql.Pool> {
    if (!MySql.instance) {
      const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
      
      if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
        throw new Error('数据库配置缺失');
      }

      try {
        MySql.instance = mysql.createPool({
          host: DB_HOST,
          user: DB_USER,
          password: DB_PASSWORD,
          database: DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });

        // 测试连接
        const connection = await MySql.instance.getConnection();
        console.log('数据库连接成功');
        connection.release();
      } catch (error) {
        console.error('数据库连接失败:', error);
        throw new Error('数据库连接失败');
      }
    }
    return MySql.instance;
  }
}

export async function initDatabase() {
  try {
    const pool = await MySql.getInstance();
    
    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
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

    console.log('数据库表初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}
