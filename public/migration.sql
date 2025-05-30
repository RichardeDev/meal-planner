CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    pending BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    description TEXT
);

CREATE TABLE weekly_meals (
    id VARCHAR(36) PRIMARY KEY,
    week_key VARCHAR(10), -- ex: "2025-W18"
    day VARCHAR(10),
    date DATE,
    meal_id iNT,
    FOREIGN KEY (meal_id) REFERENCES meals(id)
);

CREATE TABLE user_selections (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT,
    day_id VARCHAR(10),
    meal_id INT,
    week_key VARCHAR(10),
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (meal_id) REFERENCES meals(id)
);

CREATE TABLE holidays (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    date DATE,
    recurring BOOLEAN
);