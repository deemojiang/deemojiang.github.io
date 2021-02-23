---
layout:     post   		  # 使用的布局（不需要改）
title:      Health Check    # 标题
subtitle:   学习笔记 #副标题
date:       2020-04-11 				# 时间
author:     Liansong 						# 作者
header-img: img/post-bg-2015.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签s
    - 学习笔记
    - tech
    - k8s
---

### 1. About K8S health check

Health check is the important feature of the k8s orchestrating. K8s can monitor those containers and automatically restart them if they fail. If the container's main process crashes, the k8s will restart the container. Also if your application has a bug that causes it to crash every once in a while, k8s will restart it automatically.There are two kinds of ways for health check. Liveness and Readiness. What's the difference? And how to use these? 

- **liveness probes**

  k8s can check if a container is still alive through liveness probes. You can specify a liveness probe for each container in the pod's specification. k8s will periodically execute the probe and restart the container if the probe fails.
  
  The liveness health check configure file.
  
  >```yaml
  >apiVersion: v1
  >kind: Pod
  >metadata:
  >  labels:
  >    test: liveness
  >  name: liveness
  >spec:
  >  restartPolicy: OnFailure
  >  containers:
  >  - name: liveness
  >    image: busybox
  >    args:
  >    - /bin/sh
  >    - -c
  >    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 60
  >    livenessProbe:
  >      exec:
  >        command:
  >        - cat
  >        - /tmp/healthy
  >      initialDelaySeconds: 10
  >      periodSeconds: 5
  >```

From this configure file, we define the livenessProbe. Every 5 seconds, the probe will detect and execute the command. If failed, will restart the pod again. 

- The  Readiness health check configure file.

  >```yaml
  >apiVersion: v1
  >kind: Pod
  >metadata:
  >  labels:
  >    test: readiness
  >  name: readiness
  >spec:
  >  restartPolicy: OnFailure
  >  containers:
  >  - name: readiness
  >    image: busybox
  >    args:
  >    - /bin/sh
  >    - -c
  >    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 60
  >    readinessProbe:
  >      exec:
  >        command:
  >        - cat
  >        - /tmp/healthy
  >      initialDelaySeconds: 10
  >      periodSeconds: 5
  >```

The file is similar to liveness. Just changed the key value. For this one, when it was failure, will restart the pod one time, after that, set the readiness no use. 

### 2. Health Check practice in the rolling update

How the health check used in the rolling update? Image one case, you update the application from V1 to V2, but in fact V2 application is wrong, you didn't use the checking method to verify this. How will you solve this problem? We can use health check.

- First, deploy 10 copies with v1.

  >```yaml
  >apiVersion: apps/v1
  >kind: Deployment
  >metadata:
  >  name: app
  >spec:
  >  replicas: 10
  >  selector:
  >    matchLabels:
  >      run: app
  >  template:
  >    metadata:
  >      labels:
  >        run: app
  >    spec:
  >      containers:
  >      - name: app
  >        image: busybox
  >        args:
  >        - /bin/sh
  >        - -c
  >        - sleep 10; touch /tmp/healthy; sleep 30000
  >        readinessProbe:
  >          exec:
  >            command:
  >            - cat
  >            - /tmp/healthy
  >          initialDelaySeconds: 10
  >          periodSeconds: 5
  >```

![image-20200411175808940](https://tva1.sinaimg.cn/large/007S8ZIlgy1gdpzbx6r8oj318i0qm7wh.jpg)

- Then rollling update the wrong application. It will trigger the probe to detect.

  >```yaml
  >apiVersion: apps/v1
  >kind: Deployment
  >metadata:
  >  name: app
  >spec:
  >  replicas: 10
  >  selector:
  >    matchLabels:
  >      run: app
  >  template:
  >    metadata:
  >      labels:
  >        run: app
  >    spec:
  >      containers:
  >      - name: app
  >        image: busybox
  >        args:
  >        - /bin/sh
  >        - -c
  >        - sleep 3000
  >        readinessProbe:
  >          exec:
  >            command:
  >            - cat
  >            - /tmp/healthy
  >          initialDelaySeconds: 10
  >          periodSeconds: 5
  >```

​        When use this configure file to deploy, will fail. Below is the result.

![ ](https://tva1.sinaimg.cn/large/007S8ZIlgy1gdpzk08tjbj313i0qe4qp.jpg)

![image-20200411180855382](https://tva1.sinaimg.cn/large/007S8ZIlgy1gdpztqjufbj30qa0zqx47.jpg)

From the result, we can see the new replications can't pass the health check. But the health check also remain the most old replications. This is because of the maxSurge and maxUnavailable. Will use the default value if not define in the file.maxSurge and maxUnavailable are used to define the rolling update copies and failure copies.

### 3. Rolling update

This section is not for health check. Only the summary of the learning before.                                                                                                                                                                    This section comprises with rolling update and rolling back. Rolling update is very easy, just run the command, will deploy the change automatically. We mainly discuss the rolling back.

When you do the rolling update, you can record the revision. When you want to roll back, you can location this version.                                   

- Kuebctl apply -f rollback.yaml --record

  When add the record parameter, will record the reversion.

  ![image-20200410235930980](https://tva1.sinaimg.cn/large/00831rSTgy1gdp45c5s14j31ig0oohdt.jpg)

- Kubectl rollout history deployment http 

  This will show the all deployment history version.

  ![image-20200410235854295](https://tva1.sinaimg.cn/large/00831rSTgy1gdp44rkss8j31640cqtoh.jpg)

- Kubectl rollout undo deployment http --to-revision=1

  This will rollout the version.

  ![image-20200411000050144](https://tva1.sinaimg.cn/large/00831rSTgy1gdp46orwccj31mw0aa4gs.jpg)

  Also, when you rollout successful, the version will change as your deployment.

  ![image-20200411000139532](https://tva1.sinaimg.cn/large/00831rSTgy1gdp47k5pepj31760bo170.jpg)