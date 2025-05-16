-- Создаем тип для статуса задачи (если используете ENUM)
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    --org_id INTEGER,  -- Если есть таблица organizations, добавьте FOREIGN KEY
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица комнат (чаты/конференции)
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(20) CHECK (type IN ('chat', 'conference')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    text TEXT,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    is_voice_message BOOLEAN DEFAULT FALSE,
    file_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица задач (вариант с ENUM)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения поиска
CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);