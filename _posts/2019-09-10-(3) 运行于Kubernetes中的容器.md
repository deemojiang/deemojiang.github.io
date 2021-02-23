---
layout:     post   				    # 使用的布局（不需要改）
title:      三： 运行于Kubernetes中的容器 				# 标题
subtitle:   Kubernetes in action 读书笔记 #副标题
date:       2019-09-10 				# 时间
author:     Liansong 						# 作者
header-img: img/tag-bg-o.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 读书笔记
    - tech
    - k8s
    - docker
---

### 1. 为啥要搞出POD

我们知道，POD是Kubernetes管理的最小单位，为啥Kubernetes不直接管理container，要管理POD呢？这是有原因的，我们知道，container是单一进程的，啥意思呢，就是container的设计思想就是每个container只运行一个进程， 如果用枯bernetes直接去管理这些container，肯定是错综复杂，所以就搞出了POD这个东西，来实现容器间的资源和网络隔离，在同一个POD下的所有容器共享网络和系统资源，但是呢，一个POD内的所有容器肯定是逻辑业务密切结合的一个整体，他们肯定是有很强的联系。每一个container可以用端口来进行区分。



### 2. 怎么规划POD中的容器

刚说到，POD中放的是一组容器，怎么来规划这些容器呢，把项目中所有容器都放到一个POD中可以吗？因为POD比较轻量，所以鼓励是尽可能多的用POD，而规划POD中的容器，需要考虑的是，你的这一组容器的业务逻辑是否紧密相连，还有你是否要scale你的容器，这些是你的判断条件。

![1568022964845](https://tva1.sinaimg.cn/large/006y8mN6gy1g6ur9w2djtj30fc087n06.jpg)



很好的一个例子，前端和后端分为两个POD来进行部署。



### 3. YAML文件分析及创建POD

![1568023748851](https://tva1.sinaimg.cn/large/006y8mN6gy1g6ur9wxdumj30by06p75b.jpg)

非常的EASY， 其实一个YAML文件就包含：kind, metadata, spe这些东西。metadata 是用来定义POD的数据，spec是用来定义这个POD下的所有容器数据。      

有几个命令需要学习下：Kubectl create -f a.yaml， 这个是通过yaml文件来创建需要的POD。获取POD中指定容器的日志信息，可以用kubectl logs kula -c kubia。获取运行的POD的yaml或json格式文件，可以用kubectl get po kubia -o yaml 或kubectl get po kubia -o json。kubectl port-forward kubela 8888:8080 用来搞端口映射。 



### 4. POD的标签

标签的作用毋庸置疑，就是用来区分POD。所以加入标签这个就是为了能更好的管理你的POD。一个POD可以设置多个标签，然后利用标签来统一的调度POD。标签的一些命令可以通过手册查看，包括修改标签，设置标签，增加标签等等。



### 5. Namespace 

先搞清楚，搞出Namespace的目的，我们知道，已经有了标签的概念了，标签也是可以用来分组，但是为啥还是要搞出Namespace呢？标签的分组还是不太彻底，一个POD可以有多个标签，所以我觉得标签还是更多的给运维人员用，搞出Namespace就不一样了，每一个POD只有唯一的一个Namespace，使资源的分组更加的彻底。

来看看怎么玩Namespace。 kubectl get ns: 列出所有的命名空间，kubectl get po --namespace kube-system:列出指定Namespace的所有POD。kubectl create namespace custom-namespace,创建一个Namespace。



