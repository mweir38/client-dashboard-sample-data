const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const { Parser } = require("json2csv");

// @route GET /api/reports/customers/csv
router.get("/customers/csv", async (req, res) => {
  try {
    const customers = await Customer.find();

    const fields = ["name", "healthScore", "renewalLikelihood", "products"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(customers);

    res.header("Content-Type", "text/csv");
    res.attachment("customers_report.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating CSV");
  }
});

// @route GET /api/reports/customers/pdf
router.get("/customers/pdf", async (req, res) => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument();

  try {
    const customers = await Customer.find();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=customers_report.pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Customer Health Report", { align: "center" });
    doc.moveDown();

    customers.forEach((c) => {
      doc
        .fontSize(12)
        .text(`Name: ${c.name}`)
        .text(`Health Score: ${c.healthScore}`)
        .text(`Renewal: ${c.renewalLikelihood}`)
        .text(`Products: ${c.products.join(", ")}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

module.exports = router;
