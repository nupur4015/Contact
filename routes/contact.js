const { Router } = require("express");
const pool = require("../db");

async function getContactDataById(primaryContactId) {
  try {
    // Retrieve data for the primary contact and its associated secondary contacts
    const query = `
            SELECT
                id AS "primaryContactId",
                ARRAY(SELECT DISTINCT email FROM Contact WHERE id = $1 OR linkedId=$1 AND email IS NOT NULL) AS "emails",
                ARRAY(SELECT DISTINCT phoneNumber FROM Contact WHERE id = $1 or linkedId=$1 And phoneNumber IS NOT NULL) AS "phoneNumbers",
                ARRAY(SELECT DISTINCT id FROM Contact WHERE linkedId = $1) AS "secondaryContactIds"
            FROM
                Contact
            WHERE
                id = $1;
        `;

    const result = await pool.query(query, [primaryContactId]);

    // Extract the single result row
    const contactData = result.rows[0];

    // Create the response object in the desired format
    const response = {
      contact: {
        primaryContactId: contactData.primaryContactId,
        emails: contactData.emails,
        phoneNumbers: contactData.phoneNumbers,
        secondaryContactIds: contactData.secondaryContactIds,
      },
    };

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getContactDataByemail(email) {
  try {
    // Retrieve data for the primary contact and its associated secondary contacts
    const query = `
          SELECT
          c.id AS "primaryContactId",
            ARRAY(SELECT DISTINCT email FROM Contact WHERE id = c.id AND email IS NOT NULL) AS "emails",
            ARRAY(SELECT DISTINCT phoneNumber FROM Contact WHERE id = c.id AND phoneNumber IS NOT NULL) AS "phoneNumbers",
            ARRAY(SELECT DISTINCT id FROM Contact WHERE linkedId = c.id) AS "secondaryContactIds"
          FROM
            Contact c
          WHERE
          c.email = $1;
                          `;

    const result = await pool.query(query, [email]);

    // Extract the single result row
    const contactData = result.rows[0];

    // Create the response object in the desired format
    const response = {
      contact: {
        primaryContactId: contactData.primaryContactId,
        emails: contactData.emails,
        phoneNumbers: contactData.phoneNumbers,
        secondaryContactIds: contactData.secondaryContactIds,
      },
    };

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getContactDataByphoneNumber(phoneNumber) {
  try {
    // Retrieve data for the primary contact and its associated secondary contacts
    const query = `
          SELECT
          c.id AS "primaryContactId",
            ARRAY(SELECT DISTINCT email FROM Contact WHERE id = c.id AND email IS NOT NULL) AS "emails",
            ARRAY(SELECT DISTINCT phoneNumber FROM Contact WHERE id = c.id AND phoneNumber IS NOT NULL) AS "phoneNumbers",
            ARRAY(SELECT DISTINCT id FROM Contact WHERE linkedId = c.id) AS "secondaryContactIds"
          FROM
            Contact c
          WHERE
          c.phoneNumber = $1;
                          `;

    const result = await pool.query(query, [phoneNumber]);

    // Extract the single result row
    const contactData = result.rows[0];

    // Create the response object in the desired format
    const response = {
      contact: {
        primaryContactId: contactData.primaryContactId,
        emails: contactData.emails,
        phoneNumbers: contactData.phoneNumbers,
        secondaryContactIds: contactData.secondaryContactIds,
      },
    };

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}

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
          linkedId = $2 OR id = $2 OR linkedId = $1;
  `;

const router = Router();
router.get("/", (request, response, next) => {
  pool.query("SELECT * FROM contact ORDER BY id ASC", (err, res) => {
    if (err) return next(err);

    response.json(res.rows);
  });
});
router.post("/identify", (request, response, next) => {
  const { email, phoneNumber } = request.body;

  // Execute the query with placeholders
  pool.query(query, [phoneNumber, email], (error, result) => {
    if (error) {
      console.error("Error executing the query:", error);
      return;
    }

    const existenceStatus = result.rows[0].existence_status;
    console.log(existenceStatus);
    if (existenceStatus == "none_exist" || ( existenceStatus == "phone_number_exists" & email==null ) || ( existenceStatus == "email_exists" & phoneNumber==null ) ) {
      const linkprecedence = "primary";
      pool.query(
        "INSERT INTO contact (phoneNumber, email, linkPrecedence) VALUES ($1, $2, $3)",
        [phoneNumber, email, linkprecedence],
        (err, res) => {
          //console.log(res);
          if (err) return next(err);
          if(email!=null){
          getContactDataByemail(email)
            .then((res) => {
              response.json(res);
            })
            .catch((err) => {
              console.error("Error:", err);
            });
          
        }else{
          getContactDataByphoneNumber(phoneNumber)
            .then((res) => {
              response.json(res);
            })
            .catch((err) => {
              console.error("Error:", err);
            });
          
        }
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
          [phoneNumber, email, linkprecedence, resultValue],
          (err, res) => {
            if (err) return next(err);
          }
        );
        getContactDataById(resultValue)
          .then((res) => {
            response.json(res);
          })
          .catch((err) => {
            console.error("Error:", err);
          });
      });
    } else if (existenceStatus == "phone_number_exists") {
      // Execute the query with placeholders
      pool.query(query3, [phoneNumber], (error, result) => {
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
          [phoneNumber, email, linkprecedence, resultValue],
          (err, res) => {
            if (err) return next(err);
          }
        );
        getContactDataById(resultValue)
          .then((res) => {
            response.json(res);
          })
          .catch((err) => {
            console.error("Error:", err);
          });
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
          const res2 = await executeQuery(query3, [phoneNumber]);
          console.log(res1, res2);
          const minId = res1 < res2 ? res1 : res2;
          const maxId = res1 > res2 ? res1 : res2;
          if (res1 == res2) {
            console.log("already connected");
          } else {
            pool.query(query4, [minId, maxId], (error, result) => {
              if (error) {
                console.error("Error executing the query:", error);
                return;
              }
              // Handle the query result here (e.g., check result.rowCount for the number of rows updated)

              console.log("Rows updated:", result.rowCount);
              // Continue with further processing as needed
            });
          }
          getContactDataById(minId)
            .then((res) => {
              response.json(res);
            })
            .catch((err) => {
              console.error("Error:", err);
            });
        } catch (error) {
          console.error("Error executing the query:", error);
        }
      }

      // Call the async function to start the process
      main();
    }
    //response.redirect("/");
  });
});
module.exports = router;
