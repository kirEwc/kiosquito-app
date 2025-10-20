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
  activa: boolean;
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

    // Productos de ejemplo
    const productosEjemplo = [
      {
        nombre: "Coca Cola 355ml",
        precio: 150,
        stock: 50,
        descripcion: "Refresco de cola",
        categoria: "Bebidas",
      },
      {
        nombre: "Agua Mineral 500ml",
        precio: 50,
        stock: 100,
        descripcion: "Agua natural",
        categoria: "Bebidas",
      },
      {
        nombre: "Papas Fritas",
        precio: 80,
        stock: 30,
        descripcion: "Snack salado",
        categoria: "Snacks",
      },
      {
        nombre: "Chocolate",
        precio: 120,
        stock: 25,
        descripcion: "Chocolate con leche",
        categoria: "Dulces",
      },
      {
        nombre: "Pan Tostado",
        precio: 60,
        stock: 40,
        descripcion: "Pan para desayuno",
        categoria: "Panadería",
      },
      {
        nombre: "Café Instantáneo",
        precio: 200,
        stock: 15,
        descripcion: "Café soluble",
        categoria: "Bebidas",
      },
      {
        nombre: "Galletas María",
        precio: 90,
        stock: 35,
        descripcion: "Galletas dulces",
        categoria: "Dulces",
      },
      {
        nombre: "Jugo de Naranja",
        precio: 100,
        stock: 20,
        descripcion: "Jugo natural",
        categoria: "Bebidas",
      },
    ];

    for (const producto of productosEjemplo) {
      const exists = await this.db.getFirstAsync(
        "SELECT id FROM productos WHERE nombre = ?",
        [producto.nombre]
      );
      if (!exists) {
        await this.db.runAsync(
          "INSERT INTO productos (nombre, precio_cup, stock, descripcion, categoria) VALUES (?, ?, ?, ?, ?)",
          [
            producto.nombre,
            producto.precio,
            producto.stock,
            producto.descripcion,
            producto.categoria,
          ]
        );
      }
    }
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
    const values = fields.map((key) => producto[key as keyof Producto]);
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
      "SELECT * FROM monedas WHERE activa = 1 ORDER BY codigo"
    )) as Moneda[];
    return monedas;
  }

  async createMoneda(moneda: Omit<Moneda, "id">): Promise<number> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    const result = await this.db.runAsync(
      "INSERT INTO monedas (codigo, nombre, tasa_cambio, activa) VALUES (?, ?, ?, ?)",
      [moneda.codigo, moneda.nombre, moneda.tasa_cambio, moneda.activa ? 1 : 0]
    );

    return result.lastInsertRowId;
  }

  async updateMoneda(id: number, moneda: Partial<Moneda>): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    const fields = Object.keys(moneda).filter((key) => key !== "id");
    const values = fields.map((key) => {
      const value = moneda[key as keyof Moneda];
      return key === "activa" ? (value ? 1 : 0) : value;
    });
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await this.db.runAsync(`UPDATE monedas SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);
  }

  // Métodos para ventas
  async createVenta(venta: Omit<Venta, "id" | "fecha">): Promise<number> {
    if (!this.db) throw new Error("Base de datos no inicializada");

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
      SELECT v.*, p.nombre as producto_nombre, m.codigo as moneda_codigo
      FROM ventas v
      JOIN productos p ON v.producto_id = p.id
      JOIN monedas m ON v.moneda_id = m.id
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
