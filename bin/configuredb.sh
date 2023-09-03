#!/bin/bash

database="contactdb"
username="node_user"
password="nupur1234"
sql_script="C:/Users/nuprs/OneDrive/Desktop/bitespeed/bin/sql/contact.sql"

# Set the PGPASSWORD environment variable with the password
export PGPASSWORD="$password"

echo "Configuring database: $database"

# Drop and create the database
dropdb.exe -U $username -h localhost -p 5432 -e $database

# Check the exit status of the previous command
if [ $? -ne 0 ]; then
    echo "Error dropping the database."
    exit 1
fi

# Create the database
createdb.exe -U $username -h localhost -p 5432 -e $database

# Check the exit status of the previous command
if [ $? -ne 0 ]; then
    echo "Error creating the database."
    exit 1
fi

# Use backslashes for the path to your SQL file
psql.exe -U $username -h localhost -p 5432 -d $database -a -f "$sql_script"

# Check the exit status of the previous command
if [ $? -ne 0 ]; then
    echo "Error executing the SQL script. The table may not have been created."
    exit 1
fi

# Unset the PGPASSWORD environment variable


# Check if the table exists in the database (replace 'your_table_name' with the actual table name)
table_exists=$(psql.exe -U $username -h localhost -p 5432 -d $database -c "\dt contact" | grep "1 row")

if [ -n "$table_exists" ]; then
    echo "Table contact has been created successfully."
else
    echo "Table contact was not created."
fi
unset PGPASSWORD
echo "$database configured"
