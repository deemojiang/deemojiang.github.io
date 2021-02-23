---
layout:     post   				    # 使用的布局（不需要改）
title:      九：Deployment声明式升级应用    # 标题
subtitle:   Kubernetes in action 读书笔记 #副标题
date:       2019-09-16 				# 时间
author:     Liansong 						# 作者
header-img: img/post-bg-coffee.jpeg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 读书笔记
    - tech
    - k8s
---


### 1. 升级的几种方式

先来看一个案例，这种情况怎么处理：

![1568612886034](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmdt0vuj30g608h3ze.jpg)

POD现在用的是V1版本，现在有一个V2版本，怎么把V2版本替换到V1版本？有三种方式：

- [ ]  删除旧版本POD，是用新版本POD替换

	> ![1568613200012](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmgk8eaj30le0c10yd.jpg)
	>
	> 这种方法比较暴力，就是直接修改V1的配置模板为V2，然后删除V1的POD，这个时候V2的模板会检测，没有POD，会重新启动V2 版本的POD。这种方法会有一个问题，删除V1时整个服务会停止。



- [ ]  蓝绿部署

	> ![1568613427566](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmiqr20j30ls0a1gqg.jpg)
	>
	> 这个是这样的，就是你的程序同时支持V1，V2 版本，同时你的环境资源充分，可以同时运行这两个， 怎么做呢？ 就是在你的环境里把V2的POD启动起来，待所有的完全都没问题后，可以删除掉V1的POD，把服务的流量切换到V2。 这种方式的问题就是资源开销较大。



- [ ]  滚动升级

	> ![1568613815414](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmlksedj30m90ao7a3.jpg)
	>
	> 这个就比较厉害了，它是利用扩容和缩容来实现动态替换升级。 啥意思呢，就是在你的部署文件中定义新旧版本的POD，然后依次删除V1的POD， 使V2 的POD动态扩容。但是这种方式，如果用命令来操作比较繁琐。



### 2. 使用ReplicationController 实现自动滚动升级

使用kubectl 命令方式进行滚动升级。kubectl rolling-update kubia-v1 kubia-v2 --image=luksa/kubia:v2 命令。

这个命令到底干了啥呢，来看看。

![1568615814724](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmmv5gvj30j506ojt3.jpg)

![1568615843841](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmplt7oj30km07tdio.jpg)

可以看看这个图，是通过修改Replicas的数量来慢慢替换V1 的POD为V2。 但是这种方式有个问题，因为是用的Kubectl方式来完成这些，相当于是客户端方式，所以，如果没有网络时，可能会导致升级停止。



### 3. 使用Deployment升级应用

Deployment 是一种更加高级的升级方式，它是属于上层的一种升级方式，而另外几种是属于底层的。

![1568617462767](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmqdl59j30hu03k0ta.jpg)

使用Deployment时，实际是用的ReplicaSet来管理POD。所以到底是怎么做到滚动升级的呢。

Deployment 就是一个部署文件，可以在里面定义你要部署的信息，然后进行部署。

![1568617908023](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nms17isj30jf08jac2.jpg)

定义了一个部署，现在来看看如何来实现滚动升级。首先要触发升级，怎么触发呢，通过修改Deployment 文件的方式来触发。可以用Kubectl set image deployment kubia nodejs=luksa/kubia:v2 来重新指定镜像，POD就会重新去下载镜像。

![1568618181124](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmtibo8j30ll08agoq.jpg)

然后在内部，它会依次去删除掉V1 的POD，然后再启动V2的POD。 它也可以自己定义升级的策略，RollinUpdate和Recreate两种，默认是第一种。 	



### 4. 回滚升级

现在有一个问题啊，假如你要升级一个V3版本，但是呢，V3 版本有一些bug,你升级了，然后发现有问题了，怎么回退到之前的版本呢？可以用命令方式解决：kubectl rollout undo deployment kubia， 可以回滚到上一个版本。也可以回退到某一个历史版本，可以先查看历史：kubectl rollout history deployment kubia 看所有的历史版本， 然后用kubectl rollout undo deployment kubia --to-revision = ? 来回退到某一个版本。



### 5. 滚动升级的状态控制

- [ ]  控制升级速率

	> 用两个参数来定义：maxSurge 和 maxUnavailable ， 具体怎么计算的我不太想搞清楚了，可以看看作用。
	>
	> ![1568619581291](https://tva1.sinaimg.cn/large/006y8mN6gy1g71nmum3dkj30ll08agoq.jpg)



- [ ]  暂停滚动升级

	> 这个可以用来玩金丝雀升级。啥叫金丝雀，就是被束缚的。怎么玩呢，就是先来搞个滚动升级，然后立即暂停滚动升级，这个时候新的POD会被创建，旧的POD还在运行，而流量会有一部分切换到新的POD中，然后测试，测试通过后，你可以恢复滚动升级，完成替换，如果测试没有通过，可以回滚到之前版本。金丝雀升级其实就是让一些人来体验新版本。看看命令：
	> kubectl rollout pause deployment kubia
	> kubectl rollout resume deployment kubia 



- [ ]  阻止出错版本的滚动升级

	> 还有一个比较好的方式，就是可以设置一个时间段，和设置探针，在这个时间段呢，如果新的POD没有问题，则就支持滚动升级。这个相当于设置了一个保险，可以将风险降到最低。
	> ![1568620656178](../pwa/1568620656178.png)



- [ ]  为滚动升级配置的deadline 

	> 就是设置一个时间段，如果程序没有升级成功，就可以取消升级。
