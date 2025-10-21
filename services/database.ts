import * as SQLite from "expo-sqlite";

export interface Usuario {
  id?: number;
  username: string;
  password: string;
  recordar?: boolean;
}

export interface Producto {
  id?: number;
  nombre: string;
  precio_cup: number;
  stock: number;
  descripcion?: string;
  categoria?: string;
  fecha_creacion?: string;
}

export interface Moneda {
  id?: number;
  codigo: string;
  nombre: string;
  tasa_cambio: number; // Respecto al CUP
  activa?: boolean; // Opcional, por defecto true
}

export interface Venta {
  id?: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  moneda_id: number;
  total_cup: number;
  fecha: string;
  producto_nombre?: string;
  moneda_codigo?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync("kiosquito.db");
      await this.createTables();
      await this.insertDefaultData();
    } catch (error) {
      console.error("Error inicializando base de datos:", error);
    }
  }

  private async createTables() {
    if (!this.db) return;

    // Tabla usuarios
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    // Tabla productos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio_cup REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        descripcion TEXT,
        categoria TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla monedas
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS monedas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        tasa_cambio REAL NOT NULL DEFAULT 1.0,
        activa BOOLEAN DEFAULT 1
      );
    `);

    // Tabla ventas
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        moneda_id INTEGER NOT NULL,
        total_cup REAL NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos (id),
        FOREIGN KEY (moneda_id) REFERENCES monedas (id)
      );
    `);
  }

  private async insertDefaultData() {
    if (!this.db) return;

    // Usuario por defecto
    const userExists = await this.db.getFirstAsync(
      "SELECT id FROM usuarios WHERE username = ?",
      ["admin"]
    );
    if (!userExists) {
      await this.db.runAsync(
        "INSERT INTO usuarios (username, password) VALUES (?, ?)",
        ["admin", "admin123"]
      );
    }

    // Moneda CUP por defecto
    const cupExists = await this.db.getFirstAsync(
      "SELECT id FROM monedas WHERE codigo = ?",
      ["CUP"]
    );
    if (!cupExists) {
      await this.db.runAsync(
        "INSERT INTO monedas (codigo, nombre, tasa_cambio, activa) VALUES (?, ?, ?, ?)",
        ["CUP", "Peso Cubano", 1.0, 1]
      );
    }

    // Monedas adicionales de ejemplo
    const usdExists = await this.db.getFirstAsync(
      "SELECT id FROM monedas WHERE codigo = ?",
      ["USD"]
    );
    if (!usdExists) {
      await this.db.runAsync(
        "INSERT INTO monedas (codigo, nombre, tasa_cambio, activa) VALUES (?, ?, ?, ?)",
        ["USD", "Dólar Estadounidense", 120.0, 1]
      );
    }

    const mlcExists = await this.db.getFirstAsync(
      "SELECT id FROM monedas WHERE codigo = ?",
      ["MLC"]
    );
    if (!mlcExists) {
      await this.db.runAsync(
        "INSERT INTO monedas (codigo, nombre, tasa_cambio, activa) VALUES (?, ?, ?, ?)",
        ["MLC", "Moneda Libremente Convertible", 125.0, 1]
      );
    }

    // No insertar productos de ejemplo automáticamente
    // Los productos deben ser creados manualmente por el usuario
    
    // Limpiar productos de ejemplo si existen (solo una vez)
    await this.cleanExampleProducts();
  }

  private async cleanExampleProducts() {
    if (!this.db) return;

    // Lista de productos de ejemplo que deben ser eliminados
    const productosEjemplo = [
      "Coca Cola 355ml",
      "Agua Mineral 500ml", 
      "Papas Fritas",
      "Chocolate",
      "Pan Tostado",
      "Café Instantáneo",
      "Galletas María",
      "Jugo de Naranja"
    ];

    // Verificar si existe una marca de que ya se limpiaron
    const cleanupDone = await this.db.getFirstAsync(
      "SELECT id FROM usuarios WHERE username = ?",
      ["__cleanup_done__"]
    );

    if (!cleanupDone) {
      // Eliminar productos de ejemplo
      for (const nombreProducto of productosEjemplo) {
        await this.db.runAsync(
          "DELETE FROM productos WHERE nombre = ?",
          [nombreProducto]
        );
      }

      // Marcar que la limpieza ya se hizo
      await this.db.runAsync(
        "INSERT INTO usuarios (username, password) VALUES (?, ?)",
        ["__cleanup_done__", "cleanup"]
      );
    }
  }

  // Método para verificar si hay datos iniciales
  async hasInitialData(): Promise<{ productos: number; monedas: number }> {
    if (!this.db) return { productos: 0, monedas: 0 };

    const productosCount = await this.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM productos"
    ) as { count: number };

    const monedasCount = await this.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM monedas"
    ) as { count: number };

    return {
      productos: productosCount.count,
      monedas: monedasCount.count
    };
  }

  // Métodos para usuarios
  async loginUser(username: string, password: string): Promise<Usuario | null> {
    if (!this.db) return null;

    const user = (await this.db.getFirstAsync(
      "SELECT * FROM usuarios WHERE username = ? AND password = ?",
      [username, password]
    )) as Usuario | null;

    return user;
  }

  // Métodos para productos
  async getProductos(): Promise<Producto[]> {
    if (!this.db) return [];

    const productos = (await this.db.getAllAsync(
      "SELECT * FROM productos ORDER BY nombre"
    )) as Producto[];
    return productos;
  }

  async createProducto(producto: Omit<Producto, "id">): Promise<number> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    const result = await this.db.runAsync(
      "INSERT INTO productos (nombre, precio_cup, stock, descripcion, categoria) VALUES (?, ?, ?, ?, ?)",
      [
        producto.nombre,
        producto.precio_cup,
        producto.stock,
        producto.descripcion || "",
        producto.categoria || "",
      ]
    );

    return result.lastInsertRowId;
  }

  async updateProducto(id: number, producto: Partial<Producto>): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    const fields = Object.keys(producto).filter((key) => key !== "id");
    const values = fields.map((key) => {
      const value = producto[key as keyof Producto];
      return value !== undefined ? value : null;
    });
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await this.db.runAsync(`UPDATE productos SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);
  }

  async deleteProducto(id: number): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");
    await this.db.runAsync("DELETE FROM productos WHERE id = ?", [id]);
  }

  // Métodos para monedas
  async getMonedas(): Promise<Moneda[]> {
    if (!this.db) return [];

    const monedas = (await this.db.getAllAsync(
      "SELECT * FROM monedas ORDER BY codigo"
    )) as Moneda[];
    return monedas;
  }

  async getAllMonedas(): Promise<Moneda[]> {
    if (!this.db) return [];

    const monedas = (await this.db.getAllAsync(
      "SELECT * FROM monedas ORDER BY CASE WHEN codigo = 'CUP' THEN 0 ELSE 1 END, codigo"
    )) as Moneda[];
    return monedas;
  }

  async createMoneda(moneda: Omit<Moneda, "id">): Promise<number> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    const result = await this.db.runAsync(
      "INSERT INTO monedas (codigo, nombre, tasa_cambio, activa) VALUES (?, ?, ?, ?)",
      [moneda.codigo, moneda.nombre, moneda.tasa_cambio, moneda.activa !== false ? 1 : 0]
    );

    return result.lastInsertRowId;
  }

  async updateMoneda(id: number, moneda: Partial<Moneda>): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    const fields = Object.keys(moneda).filter((key) => key !== "id");
    const values = fields.map((key) => {
      const value = moneda[key as keyof Moneda];
      if (key === "activa") {
        return value ? 1 : 0;
      }
      return value !== undefined ? value : null;
    });
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await this.db.runAsync(`UPDATE monedas SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);
  }

  async deleteMoneda(id: number): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");
    await this.db.runAsync("DELETE FROM monedas WHERE id = ?", [id]);
  }

  // Métodos para ventas
  async createVenta(venta: Omit<Venta, "id" | "fecha">): Promise<number> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    // Validar que el producto existe y tiene suficiente stock
    const producto = await this.db.getFirstAsync(
      "SELECT stock FROM productos WHERE id = ?",
      [venta.producto_id]
    ) as { stock: number } | null;

    if (!producto) {
      throw new Error("El producto no existe");
    }

    if (producto.stock < venta.cantidad) {
      throw new Error("Stock insuficiente");
    }

    // Validar que la moneda existe
    const moneda = await this.db.getFirstAsync(
      "SELECT id FROM monedas WHERE id = ?",
      [venta.moneda_id]
    );

    if (!moneda) {
      throw new Error("La moneda no existe");
    }

    // Actualizar stock del producto
    await this.db.runAsync(
      "UPDATE productos SET stock = stock - ? WHERE id = ?",
      [venta.cantidad, venta.producto_id]
    );

    // Crear la venta
    const result = await this.db.runAsync(
      "INSERT INTO ventas (producto_id, cantidad, precio_unitario, moneda_id, total_cup) VALUES (?, ?, ?, ?, ?)",
      [
        venta.producto_id,
        venta.cantidad,
        venta.precio_unitario,
        venta.moneda_id,
        venta.total_cup,
      ]
    );

    return result.lastInsertRowId;
  }

  async getVentas(fechaInicio?: string, fechaFin?: string): Promise<Venta[]> {
    if (!this.db) return [];

    let query = `
      SELECT v.*, 
             COALESCE(p.nombre, 'Producto eliminado') as producto_nombre, 
             COALESCE(m.codigo, 'Moneda eliminada') as moneda_codigo
      FROM ventas v
      LEFT JOIN productos p ON v.producto_id = p.id
      LEFT JOIN monedas m ON v.moneda_id = m.id
    `;

    const params: any[] = [];

    if (fechaInicio && fechaFin) {
      query += " WHERE DATE(v.fecha) BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    }

    query += " ORDER BY v.fecha DESC";

    const ventas = (await this.db.getAllAsync(query, params)) as Venta[];
    return ventas;
  }

  async getResumenVentas(periodo: "dia" | "semana" | "mes"): Promise<any> {
    if (!this.db) return null;

    let dateFilter = "";
    switch (periodo) {
      case "dia":
        dateFilter = "DATE(fecha) = DATE('now')";
        break;
      case "semana":
        dateFilter = "DATE(fecha) >= DATE('now', '-7 days')";
        break;
      case "mes":
        dateFilter = "DATE(fecha) >= DATE('now', '-30 days')";
        break;
    }

    const resumen = await this.db.getFirstAsync(`
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total_cup) as total_ingresos,
        SUM(cantidad) as productos_vendidos
      FROM ventas 
      WHERE ${dateFilter}
    `);

    return resumen;
  }
}

export const databaseService = new DatabaseService();
