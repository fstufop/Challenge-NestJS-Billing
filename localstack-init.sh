#!/bin/bash

# Espera o LocalStack iniciar
echo "Aguardando LocalStack..."
sleep 5

# Criar bucket no S3 LocalStack
echo "Criando bucket no LocalStack..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://file-api-bucket

echo "Bucket criado com sucesso!"