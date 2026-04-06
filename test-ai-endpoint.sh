#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
SUPABASE_URL="https://gdoquewussvvkmwgdgxp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkb3F1ZXd1c3N2dmttd2dkZ3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODAwMzUsImV4cCI6MjA4NDc1NjAzNX0.xO_j1KAiY2ySnJsL9alMDiTvfHIRO9pXMZoue2RBofg"
EMAIL="sebastian.lisboalisboa@gmail.com"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test del Endpoint de IA con Gemini - NutriTracker PWA   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Pedir contraseña si no está en variable de entorno
if [ -z "$PASSWORD" ]; then
  echo -e "${YELLOW}Ingresa la contraseña para ${EMAIL}:${NC}"
  read -s PASSWORD
  echo ""
fi

echo -e "${BLUE}🔐 Paso 1: Autenticando usuario...${NC}"

# Obtener access token
AUTH_RESPONSE=$(curl -s --request POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  --header "apikey: ${ANON_KEY}" \
  --header "Content-Type: application/json" \
  --data-raw "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Error al autenticar. Verifica tu contraseña.${NC}"
  echo -e "${RED}Respuesta: ${AUTH_RESPONSE}${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Usuario autenticado exitosamente${NC}"
echo ""

# Menú de opciones
echo -e "${BLUE}📋 Selecciona el tipo de prueba:${NC}"
echo ""
echo "1) Comida simple: 200g de salmón"
echo "2) Comida compuesta: Bowl de quinoa con pollo"
echo "3) Atún (alta proteína)"
echo "4) Batido con proteína"
echo "5) Comida detallada (salmón + arroz + brócoli)"
echo "6) Entrada personalizada"
echo ""
read -p "Opción (1-6): " OPTION

case $OPTION in
  1)
    MESSAGE="200g de salmón a la plancha"
    ;;
  2)
    MESSAGE="Bowl de quinoa con pollo, aguacate, tomate cherry y aderezo de tahini"
    ;;
  3)
    MESSAGE="200g de atún enlatado en agua"
    ;;
  4)
    MESSAGE="Batido con 30g de proteína whey, una banana, 200ml de leche de almendras y una cucharada de mantequilla de maní"
    ;;
  5)
    MESSAGE="150g de salmón a la plancha, 100g de arroz integral, 80g de brócoli al vapor y medio aguacate"
    ;;
  6)
    echo ""
    echo -e "${YELLOW}Ingresa tu descripción de comida:${NC}"
    read MESSAGE
    ;;
  *)
    echo -e "${RED}Opción inválida${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${BLUE}🤖 Paso 2: Enviando a Gemini...${NC}"
echo -e "${YELLOW}📝 Mensaje: \"${MESSAGE}\"${NC}"
echo ""

# Mostrar indicador de progreso
echo -n "Procesando"
for i in {1..5}; do
  echo -n "."
  sleep 0.5
done
echo ""
echo ""

# Llamar al endpoint de IA
AI_RESPONSE=$(curl -s --request POST \
  "${SUPABASE_URL}/functions/v1/process-food-ai" \
  --header "Authorization: Bearer ${ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data-raw "{
    \"message\": \"${MESSAGE}\"
  }")

# Verificar si hay error
if echo "$AI_RESPONSE" | grep -q '"error"'; then
  ERROR_MSG=$(echo $AI_RESPONSE | grep -o '"error":"[^"]*' | cut -d'"' -f4)
  echo -e "${RED}❌ Error en el endpoint:${NC}"
  echo -e "${RED}${ERROR_MSG}${NC}"
  echo ""
  echo -e "${YELLOW}Respuesta completa:${NC}"
  echo "$AI_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AI_RESPONSE"
  exit 1
fi

# Extraer datos relevantes
FOOD_NAME=$(echo $AI_RESPONSE | grep -o '"food_name":"[^"]*' | cut -d'"' -f4)
CALORIES=$(echo $AI_RESPONSE | grep -o '"calories":[0-9.]*' | cut -d':' -f2)
PROTEIN=$(echo $AI_RESPONSE | grep -o '"protein_g":[0-9.]*' | cut -d':' -f2)
CARBS=$(echo $AI_RESPONSE | grep -o '"carbs_g":[0-9.]*' | cut -d':' -f2)
FATS=$(echo $AI_RESPONSE | grep -o '"fat_g":[0-9.]*' | cut -d':' -f2)
REPLY=$(echo $AI_RESPONSE | grep -o '"reply_text":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ ÉXITO                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🍽️  Alimento:${NC} ${FOOD_NAME}"
echo -e "${BLUE}💬 Respuesta IA:${NC} ${REPLY}"
echo ""
echo -e "${GREEN}📊 Macros Detectados:${NC}"
echo -e "   • Calorías:       ${CALORIES} kcal"
echo -e "   • Proteína:       ${PROTEIN} g"
echo -e "   • Carbohidratos:  ${CARBS} g"
echo -e "   • Grasas:         ${FATS} g"
echo ""

# Preguntar si quiere ver el JSON completo
read -p "¿Ver respuesta JSON completa? (s/n): " SHOW_JSON

if [ "$SHOW_JSON" = "s" ] || [ "$SHOW_JSON" = "S" ]; then
  echo ""
  echo -e "${BLUE}📄 Respuesta JSON Completa:${NC}"
  echo "$AI_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AI_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Prueba completada exitosamente${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Puedes verificar el alimento en:${NC}"
echo -e "   Dashboard → Alimentos → Últimos registros"
echo ""
