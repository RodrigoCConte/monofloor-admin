#!/bin/bash

# Script para configurar vt.monofloor.cloud no VPS

HOST="72.61.56.150"
PASSWORD="qS4wv19mLrB;c@rOGeX,"

echo "Conectando ao VPS e configurando vt.monofloor.cloud..."

# Criar diretório e configurar nginx
ssh root@$HOST << 'ENDSSH'
# Criar diretório para o site
mkdir -p /var/www/vt.monofloor.cloud

# Verificar se nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "Nginx não encontrado. Instalando..."
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
fi

# Criar configuração do nginx
cat > /etc/nginx/sites-available/vt.monofloor.cloud << 'EOF'
server {
    listen 80;
    server_name vt.monofloor.cloud;

    root /var/www/vt.monofloor.cloud;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

# Ativar o site
ln -sf /etc/nginx/sites-available/vt.monofloor.cloud /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar nginx
systemctl reload nginx

echo "Nginx configurado com sucesso!"
echo "Agora precisamos fazer upload do index.html"

ENDSSH

echo ""
echo "Configuração do servidor concluída!"
echo "Agora faça upload do arquivo index.html com:"
echo "scp /Users/rodrigoconte/Primeiro\ projeto/monofloor-admin/public-video-processor/index.html root@72.61.56.150:/var/www/vt.monofloor.cloud/"
