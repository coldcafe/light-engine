# install kubectl
curl -Lo /usr/local/bin/kubectl "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x /usr/local/bin/kubectl

# install aws-cli
apt update
apt install python3 python-is-python3 python3.13-venv -y
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip" \
    && unzip awscli-bundle.zip \
    && ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

# install nodejs
curl -O https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.xz
apt install xz-utils
xz -d node-v22.20.0-linux-x64.tar.xz && tar xf node-v22.20.0-linux-x64.tar
mv node-v22.20.0-linux-x64 /usr/local/node