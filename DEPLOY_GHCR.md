# GHCR 镜像部署

这个项目会通过 GitHub Actions 发布两个镜像：

- `ghcr.io/xingxiyu520/xingxiyu520.github.io-backend`
- `ghcr.io/xingxiyu520/xingxiyu520.github.io-web`

推送到 `main` 分支后会生成 `latest` 标签；推送到功能分支会生成对应分支名标签；也可以在 GitHub Actions 页面手动运行 `Publish Docker Images`。

## 1. 首次在服务器准备目录

```bash
sudo mkdir -p /opt/xiyu-wiki/backend/data /opt/xiyu-wiki/backend/uploads
cd /opt/xiyu-wiki
```

复制仓库里的 `docker-compose.prod.yml` 到这个目录，或者直接拉取仓库后使用该文件。

## 2. 创建生产环境变量

```bash
mkdir -p backend
nano backend/.env
```

最少需要：

```env
APP_NAME="Xiyu Wiki API"
ENVIRONMENT=production
API_PREFIX=/api
DATABASE_URL=sqlite:///./data/site.db
JWT_SECRET=replace-with-a-real-random-secret
JWT_EXPIRE_DAYS=7
ADMIN_COOKIE_NAME=xiyu_admin_token
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=replace-before-first-run
UPLOAD_DIR=./uploads
PUBLIC_UPLOAD_BASE_URL=/uploads
CORS_ORIGINS=["https://your-domain.com"]
```

生成随机密钥：

```bash
openssl rand -hex 32
```

## 3. 拉取并启动镜像

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

查看状态：

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

## 4. 更新版本

```bash
cd /opt/xiyu-wiki
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 5. 使用指定标签

如果还没有合并到 `main`，可以用功能分支镜像：

```bash
IMAGE_TAG=feature-blog-admin-backend-foundation docker compose -f docker-compose.prod.yml pull
IMAGE_TAG=feature-blog-admin-backend-foundation docker compose -f docker-compose.prod.yml up -d
```

数据会保存在服务器本地：

- `backend/data/site.db`
- `backend/uploads/`
