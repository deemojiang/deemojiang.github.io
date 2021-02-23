---
layout:     post                 # 使用的布局（不需要改）
title:      Prometheus + Grafana      # 标题
subtitle:   学习笔记   #副标题
date:       2020-11-07 				# 时间
author:     Liansong 						# 作者
header-img: img/post-bg-universe.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 学习笔记
    - Prometheus
    - Grafana
---

### 1. 背景介绍

#### 1.1 Prometheus

中文是普罗米修斯，光听名字就感觉很有范，是很厉害的东西。让我来说说普罗米修斯的故事，他是雅典神话中的人物，传说就是他捏造了人形，雅典娜给每个人形赋予了灵魂。宙斯是禁止人类用火，这哥们看到人类处于困苦中，就从阿波罗手里盗取了火，因此触犯了宙斯，之后宙斯就将他关在高加索山的悬崖上，并且每天放出一只恶鹰去啄他的肝，又让他的肝每天都能长出来，让他承受各种痛苦。这神话还挺有意思，所以可以看到普罗米修斯是人类守护神，他来承受各种苦难 ，守护人类。所以今天说的这个东西也是这个功能，是一个性能监控工具，他是基于时间序列的一套开源的监控&报警用 Go语言写的一套系统。

它是基于HTTP协议抓取被监控点的状态信息，所以支持面就比较广，任何支持HTTP协议的组件都可以用它来作为被监控点，所以也广泛被用于docker，k8s和mesos环境的监控。输出被监控组件信息的HTTP接口是exporter，目前很多互联网公司常用的组件都可以直接使用exporter。

#### 1.2 Grafana

用于可视化大型测量数据的开源程序，提供了强大，优雅的方式去创建、共享、浏览 数据。Grafana和Prometheus配合使用，用图形化界面的方式去展示服务的运行情况。

### 2. 实战操练

我是用的vagrant + virtual Box的方式起了三个instance，中间的过程也是一波三折，主要开始是对vagrant不太熟悉，其实vagrant是对开发环境的隔离，和docker有点像，通过box镜像的方式来隔离不同的开发环境。在使用vagrant的时候把网络配置复习了一下，主要是NAT，桥接，host-only，交换机和路由器的区别。

先来说说交换机和路由器的区别吧，这个应该是经常遇到，首先这两个在OSI七层模型中所处的层级是不一样，交换机是处于第二层，数据链路层，而路由器是处于第三层，网络层。交换机是通过物理地址的方式去确定数据的目的地址，路由器是通过网络ID号来寻址。两者的不同方式注定了功能的不同。交换机可以理解为多了更多的LAN 口，每个LAN口的网络互不干扰，路由器恰好相反，是多个LAN口共用一个总的网络端口，所以是共用网络带宽。

NAT： 网络地址转换，是虚拟机通过NAT的功能，通过宿主机所在的网络来访问公网。NAT模式下 ，局域网的其他主机不能访问虚拟机 ，虚拟机可以访问局域网的所有主机。

桥接： 是本地的物理网卡和虚拟网卡通过虚拟交换机进行桥接，虚拟交换机相当于现实网络中的交换机。

host-only： 虚拟网络是在一个全封闭的网络，唯一能访问的就是主机。

总共是起了三个instance，一个是安装prometheus，一个安装granfan，一个是安装node_exporter.

- 安装和启动prometheus

  >```powershell
  >wget https://github.com/prometheus/prometheus/releases/download/v2.7.1/prometheus-2.7.1.linux-amd64.tar.gz
  >tar -xvzf prometheus-2.7.1.linux-amd64.tar.gz -C /usr/local/
  >mv prometheus-2.7.1.linux-amd64 prometheus
  >./prometheus --config.file="prometheus.yml" &  (后台运行)
  >lsof -i:9090 （列出端口进程）
  >```

弄完后，就启动了prometheus， 占用的端口是9090端口，也就开始了性能的监控。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gkgeu2fkzyj31se0u0gr4.jpg" alt="image-20201107104121713" style="zoom:50%;" />

设置target就是监控的目标，默认情况下监控目标是自己，也可以设置其他的node节点进行监控。

- 安装和启动node_exporter节点

  ```powershell
  curl -OL https://github.com/prometheus/node_exporter/releases/download/v0.15.2/node_exporter-0.15.2.darwin-amd64.tar.gz
  tar -xzf node_exporter-0.15.2.darwin-amd64.tar.gz
  nohup /usr/local/node_exporter/node_exporter
  ```

这个就启动了node_exporter，进去后也是可以看到，实际上就是一堆下图这种日志。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gkgf2ksptuj31lo0sawna.jpg" alt="image-20201107104939103" style="zoom:50%;" />

这些日志是可以被prometheus 调用和展示的。

- Granfan 安装和启动

这个是一个图形化界面的性能监控工具，安装和启动也是非常简单。

```powershell
sudo apt-get install grafana
service grafana-server start
```

通过Grafana可以用dashboard把普罗米修斯添加到监控中。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gkgf8xgklmj31mr0u0qay.jpg" alt="image-20201107105547224" style="zoom:50%;" />

总体来说，还是比较简单。

### 3. k8s 和 prometheus， Granfan结合的实战

[https://www.qikqiak.com/post/kubernetes-monitor-prometheus-grafana/](https://www.qikqiak.com/post/kubernetes-monitor-prometheus-grafana/)

这篇博文也是一个很好的k8s和prometheus Granfan相结合 的例子。

### 4. Prometheus 常见的问题

[https://www.ershicimi.com/p/b27a4437ff01832f1832c563a8a00437](https://www.ershicimi.com/p/b27a4437ff01832f1832c563a8a00437)



