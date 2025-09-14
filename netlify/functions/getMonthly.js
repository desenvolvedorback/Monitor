const { google } = require('googleapis')

exports.handler = async (event, context) => {
  try {
    const PROPERTY_ID = process.env.GA_PROPERTY_ID || "504985686"
    const CLIENT_EMAIL = process.env.GA_CLIENT_EMAIL
    let PRIVATE_KEY = process.env.GA_PRIVATE_KEY

    if(!PROPERTY_ID || !CLIENT_EMAIL || !PRIVATE_KEY){
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Variáveis de ambiente não configuradas corretamente.' })
      }
    }

    PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n')

    const jwt = new google.auth.JWT(
      CLIENT_EMAIL,
      null,
      PRIVATE_KEY,
      ['https://www.googleapis.com/auth/analytics.readonly']
    )

    await jwt.authorize()

    const analyticsdata = google.analyticsdata({
      version: 'v1beta',
      auth: jwt
    })

    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    const formatDate = d => d.toISOString().slice(0,10)

    const res = await analyticsdata.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(today) }],
        metrics: [{ name: 'sessions' }]
      }
    })

    let total = 0
    if(res && res.data && res.data.rows && res.data.rows.length > 0){
      total = Number(res.data.rows[0].metricValues[0].value || 0)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin':'*'},
      body: JSON.stringify({ total })
    }

  } catch (err) {
    console.error('Erro getMonthly:', err.message || err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao consultar Google Analytics', detail: err.message || String(err) })
    }
  }
}
