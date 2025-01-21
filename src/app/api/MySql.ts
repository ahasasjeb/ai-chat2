import mysql from 'mysql2/promise';

interface MySqlError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

export class MySql {
  private static instance: mysql.Pool | null = null;
  private static isInitializing = false;
  private static retryCount = 3;
  private static retryDelay = 1000;

  public static async getInstance(): Promise<mysql.Pool> {
    // 防止并发初始化
    if (MySql.isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getInstance();
    }

    if (!MySql.instance) {
      MySql.isInitializing = true;
      try {
        const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
        
        if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
          throw new Error('数据库配置缺失');
        }

        console.log('正在创建数据库连接池...配置信息:', {
          host: DB_HOST,
          port: DB_PORT || 3306,
          database: DB_NAME,
          user: DB_USER,
          // 添加连接来源信息用于调试
          connectionOrigin: 'Vercel Serverless Function'
        });

        MySql.instance = mysql.createPool({
          host: DB_HOST,
          port: parseInt(DB_PORT || '3306', 10),
          user: DB_USER,
          password: DB_PASSWORD,
          database: DB_NAME,
          waitForConnections: true,
          connectionLimit: 1,
          maxIdle: 1,
          connectTimeout: 60000, // 增加超时时间到60秒
          enableKeepAlive: false,
          keepAliveInitialDelay: 10000,
          ssl: {
            rejectUnauthorized: true // 如果使用SSL连接但证书有问题，可以尝试此选项
          }
        });

        // 添加连接错误监听
        MySql.instance.on('connection', (connection) => {
          console.log('新的数据库连接已建立');
          connection.on('error', (err) => {
            console.error('数据库连接错误:', err);
          });
        });

        // 验证连接池
        await MySql.validatePool(MySql.instance);
        console.log('数据库连接池创建成功');
      } catch (error) {
        const mysqlError = error as MySqlError;
        console.error('数据库连接池创建失败:', {
          message: mysqlError.message,
          code: mysqlError.code,
          state: mysqlError.sqlState
        });
        MySql.instance = null;
        throw error;
      } finally {
        MySql.isInitializing = false;
      }
    }

    return MySql.instance;
  }

  private static async validatePool(pool: mysql.Pool): Promise<void> {
    let connection;
    try {
      connection = await pool.getConnection();
      // 执行简单查询测试连接
      await connection.query('SELECT 1');
    } catch (error: unknown) {
      const mysqlError = error as MySqlError;
      throw new Error(`数据库连接验证失败: ${mysqlError?.message || '未知错误'}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  public static async closePool(): Promise<void> {
    if (MySql.instance) {
      await MySql.instance.end();
      MySql.instance = null;
    }
  }
}

export async function initDatabase() {
  try {
    const pool = await MySql.getInstance();
    
    // 使用事务确保表创建的一致性
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 创建用户表
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id VARCHAR(255) PRIMARY KEY,
          user_id INT,
          title VARCHAR(255),
          created_at BIGINT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(255) PRIMARY KEY,
          chat_id VARCHAR(255),
          role VARCHAR(50),
          content TEXT,
          created_at BIGINT,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        )
      `);

      await connection.commit();
      console.log('数据库表初始化成功');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}
