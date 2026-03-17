# K3s 服务部署文档

## 前置条件

- 阿里云杭州 ECS 已安装 K3s
- `kubectl` 可正常访问集群

```bash
# 安装 K3s（如未安装）
curl -sfL https://get.k3s.io | sh -

# 验证
kubectl get nodes
```

---

## 1. 创建命名空间

```bash
kubectl create namespace petid
```

---

## 2. PostgreSQL（含 pgmq 插件）

### 2.1 持久化存储

```yaml
# postgres-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: petid
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 20Gi
```

### 2.2 Secret

```yaml
# postgres-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: petid
type: Opaque
stringData:
  POSTGRES_USER: petid
  POSTGRES_PASSWORD: "<替换为强密码>"
  POSTGRES_DB: petid
```

### 2.3 Deployment + Service

```yaml
# postgres-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: petid
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: tembo-io/pgmq-pg:16
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: postgres-secret
          volumeMounts:
      - name: data
              mountPath: /var/lib/postgresql/data
              subPath: pgdata
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: postgres-data
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: petid
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

> 使用 `tembo-io/pgmq-pg:16` 镜像，内置 pgmq 扩展。容器启动后执行：
>
> ```sql
> CREATE EXTENSION pgmq;
> ```

---

## 3. Redis

### 3.1 持久化存储

```yaml
# redis-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data
  namespace: petid
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 5Gi
```

### 3.2 配置

```yaml
# redis-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: petid
data:
  redis.conf: |
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    appendonly yes
    appendfsync everysec
    requirepass <替换为强密码>
```

### 3.3 Deployment + Service

```yaml
# redis-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: petid
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          command: ["redis-server", "/etc/redis/redis.conf"]
          ports:
            - containerPort: 6379
          volumeMounts:
            - name: config
              mountPath: /etc/redis
            - name: data
              mountPath: /data
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
      volumes:
        - name: config
          configMap:
            name: redis-config
        - name: data
          persistentVolumeClaim:
            claimName: redis-data
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: petid
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
```

---

## 4. 部署执行

```bash
# 按顺序 apply
kubectl apply -f postgres-secret.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-deploy.yaml
kubectl apply -f redis-config.yaml
kubectl apply -f redis-pvc.yaml
kubectl apply -f redis-deploy.yaml

# 验证
kubectl get pods -n petid
kubectl get svc -n petid
```

---

## 5. 集群内访问地址

后端服务通过 K3s 内部 DNS 访问：

| 服务       | 地址                               | 端口 |
| ---------- | ---------------------------------- | ---- |
| PostgreSQL | `postgres.petid.svc.cluster.local` | 5432 |
| Redis      | `redis.petid.svc.cluster.local`    | 6379 |

后端 `.env` 示例：

```env
DATABASE_URL=postgresql://petid:<密码>@postgres.petid.svc.cluster.local:5432/petid
REDIS_URL=redis://:<密码>@redis.petid.svc.cluster.local:6379
```
