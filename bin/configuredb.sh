#!/bin/bash

# Replace these with your Render database connection details
DATABASE_URL="postgres://node_user:26llItWWGupHbdlfgDOaGXbKuZGWYAih@dpg-cjsqf1u3m8ac73fa46q0-a.oregon-postgres.render.com/contactdb_tfka"
sql_script="C:/Users/nuprs/OneDrive/Desktop/bitespeed/bin/sql/contact.sql"


echo "Configuring database using Render PostgreSQL: $DATABASE_URL"

# Use backslashes for the path to your SQL file
psql.exe "$DATABASE_URL" -a -f "$sql_script"

# Check the exit status of the previous command
if [ $? -ne 0 ]; then
    echo "Error executing the SQL script. The table may not have been created."
    exit 1
fi

# Check if the table exists in the database (replace 'your_table_name' with the actual table name)
table_exists=$(psql.exe "$DATABASE_URL" -c "\dt contact" | grep "1 row")

if [ -n "$table_exists" ]; then
    echo "Table contact has been created successfully."
else
    echo "Table contact was not created."
fi

echo "Database configuration completed."
