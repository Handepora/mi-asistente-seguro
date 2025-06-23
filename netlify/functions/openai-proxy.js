// Este es nuestro "mayordomo" de backend, versión final y robusta.
// Se ejecuta en un servidor seguro de Netlify.

exports.handler = async function (event, context) {
  // Asegurarnos de que el método sea POST. Si no, devolvemos un error JSON.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Es posible que el cuerpo del evento esté vacío, lo manejamos de forma segura.
    if (!event.body) {
        throw new Error("No se ha recibido cuerpo en la petición.");
    }
    const payload = JSON.parse(event.body);

    // Lógica de diagnóstico para la prueba de conexión.
    if (payload.action === 'ping') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "pong" }),
      };
    }

    // --- LÓGICA PRINCIPAL ---

    // 1. Obtener la clave de API de forma segura.
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error("Error de configuración: La variable de entorno OPENAI_API_KEY no está configurada en Netlify.");
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Error de configuración en el servidor: Falta la clave de API." }),
      };
    }

    // 2. Obtener los datos para la llamada a OpenAI.
    const { targetUrl, method, body } = payload;

    // 3. Preparar y realizar la llamada a la API de OpenAI.
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: body ? JSON.stringify(body) : null
    };

    const response = await fetch(targetUrl, options);
    const data = await response.json();

    // 4. Devolver la respuesta de OpenAI al frontend.
    return { 
        statusCode: response.status, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
    };

  } catch (error) {
    console.error('Error en la función del proxy:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `El backend falló: ${error.message}` })
    };
  }
};
