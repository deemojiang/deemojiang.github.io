---
layout:     post   				    # 使用的布局（不需要改）
title:      二：Kubernetes 和 Docker的使用 				# 标题
subtitle:   Kubernetes in action 读书笔记 #副标题
date:       2019-09-10 				# 时间
author:     Liansong 						# 作者
header-img: img/post-bg-rwd.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 读书笔记
    - tech
    - k8s
    - docker
---


### 1. 理解Docker镜像,文件系统和容器

容器的镜像就是打包编译容器后的一个文件，打包镜像是依赖Dockerfile文件，From行定义了镜像的起始内容，也就是构建的基础镜像，镜像的构建过程是将整个目录的文件上传到Docker守护进程中，Docker会先从基础镜像仓库中拉取基础镜像，然后镜像的打包是一个分层的结构，基础镜像作为一层，然后每一条命令会作为一个新的分层，一层一层叠加，整个就是一个联合文件系统。

![1568011079301](https://tva1.sinaimg.cn/large/006y8mN6gy1g6ur4dnruaj30dt07w75q.jpg)


容器的理解， 容器其实就是镜像运行的一个实例。容器是依赖于主机的操作系统运行的，所以就会有一个问题，比如在RedHat宿主机上打包的一个镜像，这个镜像能否在ubuntu上运行呢？不一定，要看你是否有用到宿主机特有的， 但是你在另外一个宿主机上运行没有的东西。镜像运行出的容器，相当于宿主机的一个进程。每个容器间的文件系统也是独立的。



### 2. Kubernetes 集群和Mini Kube

先来理解下集群的概念，什么是集群？ 集群就是将多个计算机节点组合到一起，形成一个群集，所以集群的优点也很明显，可以更好的管理系统，提供单机系统的性能。

看看mini kube, 它是本地的一个单节点的集群，它不适用于多节点的情况。要想和kubernetes交互，还需要kubernetes cli客户端。

多节点的Kubernetes集群概览：

![1568012876300](https://tva1.sinaimg.cn/large/006y8mN6gy1g6ur4f4tsyj30g00b841m.jpg)



三个节点的kubernetes图。看看这个玩意， 每一个工作节点都有Docker，Kubelet和Kube-proxy,可以通过kubectl通过rest向主节点发送控制命令，来控制每个分节点。有意思。



### 3. ReplicationControler

POD 是Kubernetes 控制的最小单位，Kubernetes不会关心容器的调度，它只会管POD。一个POD中可以有很多个container，但是这一组container是关联密切的，因为他们可以看作是运行在同一个宿主机上。So 什么是ReplicationControler呢，这玩意是用来干啥的。

我的理解阿，ReplicationControler 是用来管理POD的水平伸缩，能够确保规定的POD个数能按照设置的正常运行。

![1568018641181](https://tva1.sinaimg.cn/large/006y8mN6gy1g6ur4gdgi7j30g607z0um.jpg)

可以看下这张图，外部访问过来后，只会映射到一个内部ip，然后到底调用的哪个POD我们是不用关心的，里面的每个POD都是独立的ip。ReplicationControler来控制副本的个数。



### 4. 梳理下kubectl一些相关的命令

kubectl get pods, 列出所有的POD， kubectl expose kubia --type=LoadBalancer --name kubia-http.将服务的网络设置为LoadBalancer方式，kubectl get service,列出所有的服务

kubectl get replicationcontrollers,列出所有的副本。kubectl scale rc kubia --replicas=3,将副本扩充。

kubectl get rc,查看扩容。kubectl get pods -o wide,查看POD的ip和运行的节点。kubectl describe pod,可以查看这个POD的日志信息。
