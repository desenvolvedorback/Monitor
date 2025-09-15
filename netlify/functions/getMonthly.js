// netlify/functions/getMonthly.js
import { google } from "googleapis";

export async function handler() {
  try {
    // Pega credenciais do ambiente do Netlify
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const propertyId = "properties/0727d20ab62b54a86f98753cc07fe3aa82b5f686"; // formato correto para GA4

    // Autenticação com service account
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsDataClient = google.analyticsdata({
      version: "v1beta",
      auth,
    });

    // Pega o primeiro e o último dia do mês atual
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`;
    const endDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate()).padStart(2, "0")}`;

    // Faz a consulta
    const response = await analyticsDataClient.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "activeUsers" }],
      },
    });

    const total =
      response.data.rows?.[0]?.metricValues?.[0]?.value || "0";

    return {
      statusCode: 200,
      body: JSON.stringify({ total }),
    };
  } catch (error) {
    console.error("Erro na função getMonthly:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
