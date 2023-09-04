  const { Router } = require("express");
  const pool = require("../db");

  const query = `
          SELECT
              CASE
                  WHEN EXISTS (
                      SELECT 1 FROM Contact WHERE phoneNumber = $1
                  ) AND EXISTS (
                      SELECT 1 FROM Contact WHERE email = $2
                  ) THEN 'both_exist_separately'
                  WHEN EXISTS (
                      SELECT 1 FROM Contact WHERE phoneNumber = $1
                  ) THEN 'phone_number_exists'
                  WHEN EXISTS (
                      SELECT 1 FROM Contact WHERE email = $2
                  ) THEN 'email_exists'
                  ELSE 'none_exist'
              END AS existence_status;
      `;
  const query2 = `
      SELECT
          CASE
              WHEN linkPrecedence = 'secondary' THEN linkedId
              ELSE id
          END AS result
      FROM
          Contact
      WHERE
          email = $1;
  `;
  const query3 = `
  SELECT
      CASE
          WHEN linkPrecedence = 'secondary' THEN linkedId
          ELSE id
      END AS result
  FROM
      Contact
  WHERE
      phoneNumber = $1;
  `;
  const query4 = `
      UPDATE Contact
      SET
          linkPrecedence = 'secondary',
          updatedAt = CURRENT_TIMESTAMP,
          linkedId = $1
      WHERE
          linkedId = $2 OR id = $2 OR linkedId=$1;
  `;

  const router = Router();
  router.get("/", (request, response, next) => {
    pool.query("SELECT * FROM contact ORDER BY id ASC", (err, res) => {
      if (err) return next(err);

      response.json(res.rows);
    });
  });
  router.post("/", (request, response, next) => {
    const { email, phonenumber } = request.body;

    // Execute the query with placeholders
    pool.query(query, [phonenumber, email], (error, result) => {
      if (error) {
        console.error("Error executing the query:", error);
        return;
      }

      const existenceStatus = result.rows[0].existence_status;
      console.log(existenceStatus);
      if (existenceStatus == "none_exist") {
        const linkprecedence = "primary";
        pool.query(
          "INSERT INTO contact (phoneNumber, email, linkPrecedence) VALUES ($1, $2, $3)",
          [phonenumber, email, linkprecedence],
          (err, res) => {
            if (err) return next(err);
          }
        );
      } else if (existenceStatus == "email_exists") {
        // Execute the query with placeholders
        pool.query(query2, [email], (error, result) => {
          if (error) {
            console.error("Error executing the query:", error);
            return;
          }

          // Handle the query result here
          const resultValue = result.rows[0].result;
          console.log(resultValue);
          const linkprecedence = "secondary";
          pool.query(
            "INSERT INTO contact (phoneNumber, email, linkPrecedence, linkedId) VALUES ($1, $2, $3, $4)",
            [phonenumber, email, linkprecedence, resultValue],
            (err, res) => {
              if (err) return next(err);
            }
          );
        });
      } else if (existenceStatus == "phone_number_exists") {
        // Execute the query with placeholders
        pool.query(query3, [phonenumber], (error, result) => {
          if (error) {
            console.error("Error executing the query:", error);
            return;
          }

          // Handle the query result here
          const resultValue = result.rows[0].result;
          console.log(resultValue);
          const linkprecedence = "secondary";
          pool.query(
            "INSERT INTO contact (phoneNumber, email, linkPrecedence, linkedId) VALUES ($1, $2, $3, $4)",
            [phonenumber, email, linkprecedence, resultValue],
            (err, res) => {
              if (err) return next(err);
            }
          );
        });
      } else {
        function executeQuery(query, params) {
          return new Promise((resolve, reject) => {
            pool.query(query, params, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result.rows[0].result);
              }
            });
          });
        }
        // Execute the query with placeholders
        async function main() {
          try {
            // Execute the query with placeholders using the utility function and await the result
            const res1 = await executeQuery(query2, [email]);
            const res2 = await executeQuery(query3, [phonenumber]);
            console.log(res1, res2);
            const minId = res1 < res2 ? res1 : res2;
            const maxId = res1 > res2 ? res1 : res2;

            pool.query(query4, [minId, maxId], (error, result) => {
              if (error) {
                console.error("Error executing the query:", error);
                return;
              }
              // Handle the query result here (e.g., check result.rowCount for the number of rows updated)
              console.log("Rows updated:", result.rowCount);
              // Continue with further processing as needed
            });
          } catch (error) {
            console.error("Error executing the query:", error);
          }
        }

        // Call the async function to start the process
        main();
      }
      response.redirect("/");
    });
  });
  module.exports = router;
