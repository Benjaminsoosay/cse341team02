const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const mongodb = require("./db/connect");

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(express.static("./public"));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
  })
);

// Swagger (must be before routes)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
const contactsRoutes = require("./routes");
app.use("/contacts", contactsRoutes);

// Optional login route
app.get("/login", (req, res) => {
  res.render("login", {});
});

// GLOBAL ERROR HANDLER (required idea from lesson)
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// Initialize MongoDB and start server
mongodb.initDb((err) => {
  if (err) {
    console.log(err);
  } else {
    app.listen(port, () => {
      console.log(`Contacts API running on port ${port}`);
    });
  }
});