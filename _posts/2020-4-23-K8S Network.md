---
layout:     post   		   # 使用的布局（不需要改）
title:      K8S Network        # 标题
subtitle:   学习笔记 #副标题
date:       2020-04-23 				# 时间
author:     Liansong 						# 作者
header-img: img/post-bg-swift.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签s

- 学习笔记
- tech
- k8s
---

K8S network is divided into 3 levels. From inside to outside, there are 3 types: **1) Container Network. 2) Intra-Cluster Network. 3) External Cluster Network.** Below is the details,

### 1. Container Network

Docker networking is limited within the host itself. By default, it creates a virtual bridge named docker0 and for each container it allocates a virtual ethane which get attached to the bridge docker0. So, in Docker two containers can communicate with each other if they resident on the same host.

<img src="https://tva1.sinaimg.cn/large/007S8ZIlgy1ge43fqcv1xj310e0m2q7z.jpg" alt="image-20200423225823675" style="zoom:40%;" />

### 2. Intra-Cluster Network

This means Pod to Pod communicate. In the cluster, all Pods share the same network segment. So the Pods can communicate directly.

<img src="https://tva1.sinaimg.cn/large/007S8ZIlgy1ge438gf6o3j311y0gejxe.jpg" alt="image-20200423225122129" style="zoom:33%;" />      	   

Also you can expose the Pod to a service, then in the cluster, other applications can access the Pod service. Like this,

<img src="https://tva1.sinaimg.cn/large/007S8ZIlgy1ge43aap8l7j30u00w3wm2.jpg" alt="image-20200423225311644" style="zoom:33%;" />



### 3. External Cluster Network

How to access the k8s cluster network from outside? There are 3 ways to build the network model.

#### 3.1. LoadBalacer

A LoadBalacer Service  is the standard way to expose a service to the internet. But only on the AWS or Google Cloud can use this function. On GKE, this will spin up a network load balancer that will give you a single IP address that will forward all traffic to your service.

<img src="https://tva1.sinaimg.cn/large/007S8ZIlgy1ge3xk6fpu4j30u00x6dnd.jpg" alt="image-20200423193504046" style="zoom:33%;" />

If you want to want to directly expose a service, this is the default method. All traffic on the port you specify will be forwarded to the service.There is no filtering, no routing, etc. This means you can send almost any kind of traffic to it, like HTTP, TCP, UDP. Websocket, gRPC, or whatever.

The big downside is that each service you expose with a LoadBalancer will get its own IP address, and you have to pay for a LoadBalancer per exposed service, which can get expensive.

#### 3.2. NodePort

A NodePort service is the most primitive way to get external traffic directly to your service. NodePort, as the name implies, opens a specific port on all the Node, and any traffic that is sent to this port is forwarded to the service.

<img src="https://tva1.sinaimg.cn/large/007S8ZIlgy1ge3xha2c9xj30u00vpwqh.jpg" alt="image-20200423193216616" style="zoom:33%;" />

#### 3.3. Ingress

Unlike all the above examples, Ingress is actually not a type of service. Instead, it sits in front of multiple services and act as a "smart router" or entry point into your cluster.You can do a lot of different things with an Ingress, and there are many types of Ingress controllers that have different capabilities.

<img src="https://tva1.sinaimg.cn/large/007S8ZIlgy1ge3xshdrdlj31080mg441.jpg" alt="image-20200423194304849" style="zoom:40%;" />

>```yaml
>apiVersion: extensions/v1beta1
>kind: Ingress
>metadata:
>  name: my-ingress
>spec:
>  backend:
>    serviceName: other
>    servicePort: 8080
>  rules:
>  - host: foo.mydomain.com
>    http:
>      paths:
>      - backend:
>          serviceName: foo
>          servicePort: 8080
>  - host: mydomain.com
>    http:
>      paths:
>      - path: /bar/*
>        backend:
>          serviceName: bar
>          servicePort: 8080
>```
