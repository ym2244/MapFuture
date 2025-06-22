# data/Dockerfile
FROM node:16-alpine

WORKDIR /app

# 把 travelPlan.json 复制到容器根目录，并重命名为 db.json
COPY cities.json ./db.json

# 全局安装 json-server
RUN npm install -g json-server

# 暴露 json-server 默认端口
EXPOSE 9000

# 启动 json-server
CMD ["json-server", "--watch", "db.json", "--host", "0.0.0.0", "--port", "9000"]
