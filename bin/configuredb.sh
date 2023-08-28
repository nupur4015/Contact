#!/bin/bash

database="contactdb"

echo "Configuring database: $database"

dropdb -U node_user contactdb
createdb -U node_user contactdb

psql -U node_user contactdb <C:/Users/nuprs/OneDrive/Desktop/bitespeed/bin/sql/contact.sql

echo "$database configured"