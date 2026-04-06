#!/bin/bash

# Test directo de Gemini API
# Uso: bash test-gemini-api-direct.sh

API_KEY="AIzaSyDzCy0ffdE6NkZ7IgWgRRpLrqkXRO8vsaI"

echo "🔍 Probando Gemini API directamente..."
echo ""

# Test 1: Solicitud simple
echo "TEST 1: Solicitud simple"
echo "========================"

curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hola, responde solo con la palabra OK"
      }]
    }]
  }' 2>&1

echo ""
echo ""

# Test 2: Solicitud con estructura JSON (como la app)
echo "TEST 2: Solicitud estructurada (formato de la app)"
echo "==================================================="

curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Extrae información nutricional del siguiente texto y responde SOLO con JSON limpio sin markdown:\n\nINPUT DEL USUARIO: \"200g de salmón\"\n\nRespuesta esperada:\n{\n  \"reply_text\": \"Salmón registrado\",\n  \"food_data\": {\n    \"food_name\": \"Salmón\",\n    \"quantity_g\": 200,\n    \"group_1_motor\": {\n      \"calories\": 400,\n      \"protein_g\": 40,\n      \"carbs_g\": 0,\n      \"fat_g\": 26\n    }\n  }\n}"
      }]
    }]
  }' 2>&1

echo ""
echo ""
echo "✅ Prueba completada"
