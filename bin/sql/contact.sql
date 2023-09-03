CREATE TABLE contact (
    id               SERIAL PRIMARY KEY,
    phoneNumber      VARCHAR(255),
    email            VARCHAR(255),
    linkedId         INT,
    linkPrecedence   VARCHAR(10) CHECK (linkPrecedence IN ('primary', 'secondary')),
    createdAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt        TIMESTAMP,
    deletedAt        TIMESTAMP
);