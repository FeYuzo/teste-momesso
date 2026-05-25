#!/bin/bash
# ============================================================
# start.sh — Inicia o projeto Momesso localmente (sem Docker)
# Requisitos: Node.js 20+, PostgreSQL 15+ rodando
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  __  __                                      "
echo " |  \/  | ___  _ __ ___   ___  ___ ___  ___  "
echo " | |\/| |/ _ \| '_ \` _ \ / _ \/ __/ __|/ _ \ "
echo " | |  | | (_) | | | | | |  __/\__ \__ \ (_) |"
echo " |_|  |_|\___/|_| |_| |_|\___||___/___/\___/ "
echo -e "${NC}"
echo -e "${GREEN}Iniciando ambiente de desenvolvimento...${NC}\n"

# ── Backend ────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Instalando dependências do back-end...${NC}"
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}  ✓ Arquivo .env criado a partir de .env.example${NC}"
  echo -e "${YELLOW}  ⚠ Edite backend/.env com suas credenciais do PostgreSQL se necessário${NC}"
fi

npm install
echo -e "${GREEN}  ✓ node_modules do back-end instalados${NC}"

# ── Seed ──────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/4] Rodando seed do banco de dados...${NC}"
npm run seed && echo -e "${GREEN}  ✓ Seed executado com sucesso${NC}" || echo -e "${RED}  ✗ Seed falhou (banco pode já ter dados)${NC}"

# ── Inicia backend em background ─────────────────────────
echo -e "\n${YELLOW}[3/4] Iniciando back-end em modo desenvolvimento...${NC}"
npm run start:dev &
BACKEND_PID=$!
echo -e "${GREEN}  ✓ Back-end iniciado (PID: $BACKEND_PID) → http://localhost:3000/api${NC}"

cd ..

# ── Frontend ──────────────────────────────────────────────
echo -e "\n${YELLOW}[4/4] Instalando dependências e iniciando front-end...${NC}"
cd frontend
npm install
echo -e "${GREEN}  ✓ node_modules do front-end instalados${NC}"
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Front-end iniciado (PID: $FRONTEND_PID) → http://localhost:4200${NC}"

cd ..

echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  Projeto rodando!${NC}"
echo -e "${GREEN}  Frontend:  http://localhost:4200${NC}"
echo -e "${GREEN}  API:       http://localhost:3000/api${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "\n${YELLOW}Pressione Ctrl+C para encerrar ambos os servidores${NC}\n"

# Aguarda e mata ambos os processos ao sair
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '\n${RED}Servidores encerrados.${NC}'" EXIT
wait
