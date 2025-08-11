# Deployment Guide: DigitalOcean Droplet with Portainer, Docker, and GitHub Actions

This guide will walk you through deploying the Member Engagement App on a DigitalOcean Droplet. The setup uses Docker for containerization, Portainer for easy container management, and GitHub Actions for automated deployments when your repository is updated.

## Prerequisites

1.  **A DigitalOcean Account:** And an active Droplet with Ubuntu 22.04 or 24.04.
2.  **Domain Name:** You own `thecuriousforge.org` and can manage its DNS settings.
3.  **GitHub Repository:** Your project code is hosted on GitHub.
4.  **Basic Knowledge:** Familiarity with the command line and Git.

---

## Part 1: DigitalOcean Droplet Initial Setup

### 1.1. Connect to Your Droplet

Use SSH to connect to your Droplet as the root user.

```bash
ssh root@your_droplet_ip
```

### 1.2. Create a Non-Root User (Recommended for security)

Replace `deploy` with your desired username.

```bash
adduser deploy
```

Give the user a password and fill out any other information if you wish. Then, give the user sudo privileges:

```bash
usermod -aG sudo deploy
```

### 1.3. Update System Packages

```bash
apt update && apt upgrade -y
```

### 1.4. Install Essential Tools

```bash
apt install -y curl git ufw
```

### 1.5. Configure Firewall (UFW)

We'll allow SSH, HTTP, and HTTPS traffic.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full' # This allows both HTTP (80) and HTTPS (443)
ufw enable
```

Type `y` when prompted.

---

## Part 2: Install Docker and Docker Compose

### 2.1. Install Docker

The official Docker script is the easiest way.

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

After installation, add your non-root user to the `docker` group so you can run Docker commands without `sudo`.

```bash
usermod -aG docker deploy
```

**Important:** You need to log out and log back in as the `deploy` user for this change to take effect.

### 2.2. Install Docker Compose

Docker Compose is typically included with Docker Desktop, but on a server, we install it as a plugin.

```bash
apt install -y docker-compose-plugin
```

Verify the installation:

```bash
docker --version
docker compose version
```

---

## Part 3: Install and Configure Portainer

Portainer provides a web UI for managing your Docker environment.

### 3.1. Create a Docker Volume for Portainer

This volume will persist Portainer's data.

```bash
docker volume create portainer_data
```

### 3.2. Create the Portainer Container

We'll use the provided [`portainer-compose.yml`](portainer-compose.yml:1) file for this. First, you'll need to get this file onto your server. You can use `git clone` or `scp` to copy your project files to the droplet.

Assuming your project files are in `/home/deploy/Member-Engagement-App`:

```bash
cd /home/deploy/Member-Engagement-App
docker compose -f portainer-compose.yml up -d
```

This will download the Portainer image and start the container in detached mode.

### 3.3. Access and Configure Portainer

1.  Open your web browser and navigate to `http://your_droplet_ip:9443`.
2.  You will be prompted to set up an admin user. Choose a strong password.
3.  On the next screen, select "Docker" as the environment to manage and click "Connect".

You should now see the Portainer dashboard. We'll come back to this later to see our application containers.

---

## Part 4: DNS Configuration

You need to point your domains to your Droplet's IP address.

1.  Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare).
2.  Go to the DNS management section for `thecuriousforge.org`.
3.  Create two `A` records:
    - **Type:** `A`
    - **Host/Name:** `signin`
    - **Value/Points to:** `your_droplet_ip`
    - **TTL:** (Default is fine)
    - **Type:** `A`
    - **Host/Name:** `portainer`
    - **Value/Points to:** `your_droplet_ip`
    - **TTL:** (Default is fine)

DNS propagation can take some time (up to 48 hours, but usually much faster). You can verify it using tools like `dig` or online DNS checkers.

---

## Part 5: Set up Nginx Reverse Proxy

A reverse proxy will route traffic from `signin.thecuriousforge.org` to your frontend container and from `portainer.thecuriousforge.org` to your Portainer container. It will also handle SSL/TLS certificates for HTTPS.

### 5.1. Create Nginx Configuration File

We'll use the provided [`nginx.conf`](nginx.conf:1) file. This file should be placed in a directory that Nginx can access, for example, `/home/deploy/Member-Engagement-App/nginx.conf`.

### 5.2. Create an Nginx Docker Container

We'll add Nginx to our main `docker-compose.yml` file. The guide will assume this has been done in the [`docker-compose.yml`](docker-compose.yml:1) file.

### 5.3. Obtain SSL Certificates with Certbot

We'll use Certbot to get free SSL certificates from Let's Encrypt. This can also be run as a Docker container.

1.  **Create a directory for certificates:**

    ```bash
    mkdir -p ~/certbot/conf ~/certbot/www
    ```

2.  **Run Certbot to obtain certificates:**
    Run this command for both domains. Replace `your_email@example.com` with your actual email.

    ```bash
    # For signin.thecuriousforge.org
    docker run --rm -v ~/certbot/conf:/etc/letsencrypt -v ~/certbot/www:/var/www/certbot certbot/certbot certonly --webroot -w /var/www/certbot --email your_email@example.com -d signin.thecuriousforge.org --agree-tos --no-eff-email --force-renewal

    # For portainer.thecuriousforge.org
    docker run --rm -v ~/certbot/conf:/etc/letsencrypt -v ~/certbot/www:/var/www/certbot certbot/certbot certonly --webroot -w /var/www/certbot --email your_email@example.com -d portainer.thecuriousforge.org --agree-tos --no-eff-email --force-renewal
    ```

    This will create the certificate files in `~/certbot/conf/live/your_domain/`.

3.  **Update Nginx configuration for SSL:**
    The provided [`nginx.conf`](nginx.conf:1) already includes the necessary SSL configuration. You just need to ensure the paths in the `ssl_certificate` and `ssl_certificate_key` directives match the location of your new certificates.

4.  **Set up Auto-renewal of Certificates:**
    Let's Encrypt certificates are valid for 90 days. We can set up a cron job to auto-renew them.

    Open the crontab editor:

    ```bash
    crontab -e
    ```

    Add the following line to run the renewal command twice a day:

    ```
    0 0,12 * * * /usr/bin/docker run --rm -v /home/deploy/certbot/conf:/etc/letsencrypt -v /home/deploy/certbot/www:/var/www/certbot certbot/certbot renew --quiet
    ```

    Save and exit. This command will check for renewing certificates and only perform actions if they are near expiration.

---

## Part 6: Configure GitHub Actions for Automated Deployment

This is the core of the CI/CD pipeline. We will create a workflow that builds and deploys your application whenever you push to a specific branch.

### 6.1. Create a Personal Access Token (PAT) in GitHub

The workflow needs permission to push to your repository. A classic PAT with `repo` scope is a simple way to achieve this.

1.  Go to your GitHub account Settings -> Developer settings -> Personal access tokens -> Tokens (classic).
2.  Click "Generate new token".
3.  Give it a name (e.g., "Deployment Token").
4.  Set an expiration.
5.  Check the `repo` scope.
6.  Click "Generate token".
7.  **Copy the token immediately.** You won't be able to see it again.

### 6.2. Add the PAT as a Repository Secret

1.  In your GitHub repository, go to Settings -> Secrets and variables -> Actions.
2.  Click "New repository secret".
3.  Name the secret `CR_PAT` (or whatever you like, but remember it for the workflow file).
4.  Paste the token you copied into the "Secret" field.
5.  Click "Add secret".

### 6.3. Add Droplet SSH Key as a Repository Secret

The workflow needs to SSH into your Droplet to run Docker commands.

1.  **Generate an SSH key pair** on your local machine (or on the droplet, then copy the private key securely).

    ```bash
    ssh-keygen -t ed25519 -C "github-actions-deploy"
    ```

    Save it with a memorable name (e.g., `deploy_key`). Do not set a passphrase for automated use.

2.  **Add the public key to your Droplet's `authorized_keys` file.**
    Copy the contents of the `deploy_key.pub` file.
    On your Droplet, as the `deploy` user:

    ```bash
    mkdir -p ~/.ssh
    echo "your_public_key_content" >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    ```

3.  **Add the private key as a GitHub Repository Secret.**

    - Name the secret `SSH_PRIVATE_KEY`.
    - Paste the _entire_ content of the `deploy_key` (the private key) file.
    - Click "Add secret".

4.  **Add the Droplet IP and Username as secrets.**
    - `SSH_HOST`: Your Droplet's IP address.
    - `SSH_USER`: The user to SSH as (e.g., `deploy`).

### 6.4. Create the GitHub Actions Workflow File

The workflow file is located at `.github/workflows/deploy.yml`. This file defines the automation steps. The provided file will be set up to trigger on a push to the `main` branch. You can easily change this to a `live` branch by modifying the `branches` section in the `on` push trigger.

---

## Part 7: Final Deployment and Verification

### 7.1. Trigger the First Deployment

1.  Make sure all the configuration files ([`docker-compose.yml`](docker-compose.yml:1), [`docker-compose.prod.yml`](docker-compose.prod.yml:1), [`nginx.conf`](nginx.conf:1)) are committed to your repository.
2.  Push a change to the branch that triggers the workflow (e.g., `main`).
    ```bash
    git add .
    git commit -m "Configure deployment pipeline"
    git push origin main
    ```

### 7.2. Monitor the Workflow

1.  In your GitHub repository, go to the "Actions" tab.
2.  You should see your workflow running. Click on it to view the logs for each step.
3.  If any step fails, the logs will tell you why. Common issues are related to secrets, SSH connections, or Docker build errors.

### 7.3. Verify the Deployment

Once the workflow completes successfully:

1.  **Check Portainer:**
    - Navigate to `https://portainer.thecuriousforge.org`.
    - Log in and go to "Containers". You should see your `frontend`, `backend`, `nginx`, and `portainer` containers running.
2.  **Check the Application:**
    - Navigate to `https://signin.thecuriousforge.org`.
    - Your application should be live!

### 7.4. Updating the Application

From now on, whenever you push a change to your `main` (or `live`) branch, the GitHub Action will automatically:

1.  Build new Docker images for your frontend and backend.
2.  Push them to your Droplet.
3.  SSH into the Droplet and run `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`, which will pull the new images and restart the services with zero downtime.

---

## Troubleshooting

- **Website not reachable:**
  - Check DNS propagation: `dig signin.thecuriousforge.org`.
  - Check UFW status: `sudo ufw status`.
  - Check if Nginx is running and listening on ports 80/443: `docker ps | grep nginx`.
  - Check Nginx logs: `docker logs <nginx_container_name_or_id>`.
- **GitHub Action fails:**
  - Carefully review the error logs in the Actions tab.
  - Ensure all secrets (`CR_PAT`, `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`) are correct.
  - Test SSH connection manually from your local machine using the private key to ensure it works.
- **Container crashes:**
  - Use Portainer or `docker logs <container_name>` to inspect the logs of the failing container.
  - Check environment variables in [`docker-compose.prod.yml`](docker-compose.prod.yml:1).
