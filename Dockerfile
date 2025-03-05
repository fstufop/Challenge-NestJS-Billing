# Usa a imagem oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos package.json e package-lock.json para instalar as dependências
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --only=production

# Copia o restante dos arquivos do projeto
COPY . .

# Compila o código TypeScript
RUN npm run build

# Expõe a porta da aplicação
EXPOSE 3000

# Define o comando para rodar a aplicação
CMD ["npm", "run", "start:dev"]