
const express = require("express");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Главная страница
app.get("/", (req, res) => {
    res.send("Express работает!");
});

// Информация о приложении
app.get("/api/info", (req, res) => {
    res.json({
        application: "Web Technologies",
        technology: "Node.js + Express",
        database: "PostgreSQL"
    });
});

// Проверка подключения к PostgreSQL
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");
        res.json({
            message: "Подключение к базе данных успешно!",
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка подключения к базе данных" });
    }
});

// Получение всех автомобилей
app.get("/api/cars", async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "Cars" ORDER BY "Id"'
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения автомобилей" });
    }
});

// Поиск автомобилей по марке и модели
app.get("/api/cars/search", async (req, res) => {
    try {
        const { brand, model } = req.query;

        const result = await pool.query(
            `SELECT * FROM "Cars"
             WHERE ($1::text IS NULL OR "Brand" ILIKE $1)
             AND ($2::text IS NULL OR "Model" ILIKE $2)
             ORDER BY "Id"`,
            [
                brand ? `%${brand}%` : null,
                model ? `%${model}%` : null
            ]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка поиска автомобилей" });
    }
});

// Получение автомобиля по ID
app.get("/api/cars/:id", async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "Cars" WHERE "Id" = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Автомобиль не найден" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения автомобиля" });
    }
});

// Добавление автомобиля
app.post("/api/cars", async (req, res) => {
    try {
        const { Brand, Model, Year, PricePerDay, IsAvailable, Description } = req.body;

        const result = await pool.query(
            `INSERT INTO "Cars"
            ("Brand", "Model", "Year", "PricePerDay", "IsAvailable", "Description")
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [Brand, Model, Year, PricePerDay, IsAvailable, Description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка добавления автомобиля" });
    }
});

// Изменение автомобиля
app.put("/api/cars/:id", async (req, res) => {
    try {
        const { Brand, Model, Year, PricePerDay, IsAvailable, Description } = req.body;

        const result = await pool.query(
            `UPDATE "Cars"
            SET "Brand" = $1,
                "Model" = $2,
                "Year" = $3,
                "PricePerDay" = $4,
                "IsAvailable" = $5,
                "Description" = $6
            WHERE "Id" = $7
            RETURNING *`,
            [Brand, Model, Year, PricePerDay, IsAvailable, Description, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Автомобиль не найден" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка изменения автомобиля" });
    }
});

// Удаление автомобиля
app.delete("/api/cars/:id", async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM "Cars" WHERE "Id" = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Автомобиль не найден" });
        }

        res.json({
            message: "Автомобиль успешно удалён",
            car: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка удаления автомобиля" });
    }
});

// Тестовый POST-запрос
app.post("/api/test", (req, res) => {
    res.json({
        message: "Данные получены",
        data: req.body
    });
});

// Обработка неизвестных маршрутов
app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден" });
});

// Запуск сервера
app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port ${port}`);
});
