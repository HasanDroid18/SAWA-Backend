const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const axios = require("axios"); // Import Axios
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const authRouter = require("./routes/authRouter");
const postsRouter = require("./routes/postsRouter");
const donationRouter = require("./routes/donationRouter");

const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/donations", donationRouter);
// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.get("/api/hospitals", async (req, res) => {
  try {
    const response = await axios.get(
      "https://mophapp.tedmob.com/api/hospitals"
    );
    const hospitals = response.data;

    // Extract relevant attributes
    const filteredHospitals = hospitals.map((hospital) => ({
      type: hospital.type,
      name: hospital.name,
      region: hospital.info?.region || "N/A",
      latitude: hospital.info?.latitude || null,
      longitude: hospital.info?.longitude || null,
      address: hospital.info?.address || "N/A",
      phone: hospital.info?.phone_numbers?.[0]?.number || "N/A",
      doctor: hospital.info?.doctor || "N/A",
      doctor_phone: hospital.info?.doctor_phone || "N/A",
      responsible: hospital.info?.responsible || "N/A",
      responsible_phone: hospital.info?.responsible_phone || "N/A",
    }));

    res.json(filteredHospitals); // Send the filtered data to the client
  } catch (error) {
    console.error("Error fetching data from MOPH API:", error.message);
    res.status(500).json({ error: "Failed to fetch data from MOPH API" });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from the server" });
});

app.listen(process.env.PORT, () => {
  console.log("listening...");
});
