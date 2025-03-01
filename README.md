# 🚀 Desafio Billing NestJS

Este projeto usa **NestJS, Kafka, PostgreSQL e LocalStack** para simular um sistema de billing. Para rodar o projeto, siga os passos abaixo:

## 📦 Pré-requisitos
- **Docker e Docker Compose** (https://docs.docker.com/get-docker/)
- **AWS CLI** (https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)

## 🚀 Como rodar o projeto

1. Clone o repositório:
   ```sh
   git clone https://github.com/fstufop/DesafioBillingNestJs.git
   cd DesafioBillingNestJs

2. Crie o bucket do S3 no local stack:
   chmod +x localstack-init.sh
   aws --endpoint-url=http://localhost:4566 s3 mb s3://file-api-bucket