---
layout:     post      # 使用的布局（不需要改）
title:      Nginx Practice        # 标题
subtitle:   学习笔记   #副标题
date:       2020-11-13 				# 时间
author:     Liansong 						# 作者
header-img: img/post-bg-rwd.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - 学习笔记
    - Nginx
---

### 1. 目的

这篇总结是来回顾加实操Nginx的相关操作。包括Nginx三大特性：负载均衡，反向代理和动静分离。最后利用Nginx来模拟一个高可用场景，加深对Nginx的认识。

### 2. 基本概念

#### 2.1 Nginx说明

Nginx是一个http的反向代理web服务器，在并发能力上表现很好，能承受高达50000个并发数。所以也是深受很多公司青睐。包括百度，京东，新浪，腾讯，淘宝等。

#### 2.2 反向代理 和 正向代理

正向代理是代理客户端，服务端对于不同客户端的请求是无感的。一个比较好的例子就是VPN的使用 ，比如我们翻墙使用google，实际上就是一个正向代理，用户相当于还是访问google网址，但是实际上是发给了VPN服务器，由VPN服务器来和Google进行交互通信，再把内容返还给客户端。正向代理需要配置客户端浏览器。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknn87dbqqj31f00fual0.jpg" alt="image-20201113165046603" style="zoom:50%;" />



反向代理刚好相反，是用来代理服务端。客户端对于服务端是无感的，比如用户要访问服务端的多台tomcat服务器，可以通过访问反向代理服务器的方式，然后由反向代理服务器和 tomcat进行通信，把内容返回给客户端。所以反向代理是配置服务端。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknnbeva0zj31gy0d2k2c.jpg" alt="image-20201113165348092" style="zoom:50%;" />

#### 2.3 负载均衡

负载均衡是相当于通过负载均衡服务器，来把客户端的请求根据负载均衡配置，来分配到各个服务器。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknne980uwj31s00q2jza.jpg" alt="image-20201113165634425" style="zoom:50%;" />

#### 2.4 动静分离

动静分离相当于是把服务端的动态资源和静态资源分开，用nginx来指向不同的服务器。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknnhfh59pj31ls0nun1r.jpg" alt="image-20201113165938886" style="zoom:50%;" />

### 3. 环境安装

#### 3.1 Nginx 安装

```powershell
apt-get install nginx
```

```powershell
root@agent:/tmp/8081/apache-tomcat-9.0.39/webapps# nginx -t
nginx: [warn] conflicting server name "192.168.2.5" on 0.0.0.0:80, ignored
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

主要是配置nginx.conf文件。nginx的默认运行端口是80端口。

#### 3.2 tomcat安装

直接下载tomcat压缩文件，然后放到指定路径下，直接解压。需要安装JDK运行。tomcat的运行是在bin路径下，执行sh文件。tomcat的默认运行端口是8080端口。

```powershell
sudo add-apt-repository ppa:openjdk-r/ppa
sudo apt-get update
sudo apt install openjdk-11-jdk
```

#### 3.3 keepalived 安装

```shell
apt-get install keepalived
```

### 4. 反向代理 Practice

通过Nginx来代理tomcat服务器，我的虚拟机ip是192.168.2.5, 在Nginx配置文件中监听9001端口，同时Nginx来代理tomcat的8080和8081两个端口。在8080中创建edu文件和html文件，8081中创建vod文件夹和html文件，通过192.168.2.5:9001:/edu/a.html 和 192.168.2.5:9001:/vod/a.html来分别访问两个tomcat服务器。

<img src="/Users/yeliansong/Library/Application Support/typora-user-images/image-20201113174157372.png" alt="image-20201113174157372" style="zoom:50%;" />

主要是nginx.conf的配置，下面就是配置说明。还有tomcat的8081 服务器的配置文件要修改默认监听端口8080为8081。

```powershell
 server {
                listen 9001;
                server_name 192.168.2.5;

                location ~ /edu/ {
                        proxy_pass http://127.0.0.1:8080;
                }

                location ~ /vod/ {
                        proxy_pass http://127.0.0.1:8081;
                }
        }
```

Location ~ 是用来判断是否存在，proxy_pass 是用来指向tomcat服务器。这个block是在nginx.conf的http block中配置。通过这个实验就可以看到Nginx的反向代理了。Nginx代理两个tomcat服务器，用户只用访问9001端口即可访问不同的服务器。

### 5. 负载均衡

负载均衡是有三种配置方式，每一种都来试下。这一次是把8081下的服务器也创建一个edu文件夹和a.html文件，浏览器输入192.168.2.5:80/edu/a.html 来根据负载均衡访问不同的tomcat服务器。

-  轮询

  每个请求逐一分配到不同的tomcat服务器。相当于机会是均等的。配置如下：

  ```shell
   upstream myserver {
                  server 192.168.2.5:8080;
                  server 192.168.2.5:8081;
          }
          
          server {
                  listen 80;
                  server_name 192.168.2.5;
  
                  location / {
                          proxy_pass http://myserver;
                  }
          }
  ```

  这样的话，当请求来时，会轮巡去访问两台tomcat服务器。

- weight方式

  可以给每台tomcat服务器分配权重，请求会更具权重动态的落到不同的服务器。

  ```shell
   upstream myserver {
                  server 192.168.2.5:8080 weight=5;
                  server 192.168.2.5:8081 weight=10;
          }
          
          server {
                  listen 80;
                  server_name 192.168.2.5;
  
                  location / {
                          proxy_pass http://myserver;
                  }
          }
  ```

  这样配置后，请求会根据权重，概率性的落到两台服务器。

- Ip_hash 方式

  这个是指请求会只落到第一次访问的服务器，不会改到其他服务器，这种可以解决session问题。

  ```
  upstream myserver {
  								ip_hash;
                  server 192.168.2.5:8080 weight=5;
                  server 192.168.2.5:8081 weight=10;
          }
          
          server {
                  listen 80;
                  server_name 192.168.2.5;
  
                  location / {
                          proxy_pass http://myserver;
                  }
          }
  ```

### 6. 动静分离

这种是指把动态资源和静态资源区分开，放在不同的位置，比如数据库查找，属于动态资源，可以放在tomcat中，而静态页面这种可以放在nginx中，根据不同的指向去访问这些资源。就不操作了。

### 7. 高可用模拟

Nginx的高可用是指，用两台nginx服务器来做主从服务，当主服务器宕机后，可以自动切换到从服务器。Nginx的切换和监控是由keepalived 来实现，在keepalived中会定义一个脚本，一直去监控 nginx线程的状态，一旦状态变化时，会切换到另一个从服务器。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknpxhrp39j31oa0k6k2a.jpg" alt="image-20201113182414578" style="zoom:50%;" />

上面就是整个流程图 ，虚拟ip 192.168.2.50 是keepalived设置的一个虚拟ip，有一个nginx_check.sh 的脚本，会每隔2s去运行下这个脚本, 这个脚本是用来检测nginx线程的，如果没有nginx线程，会kill掉keepalive，服务会导向到从服务器上 。从服务器也是需要一样的配置，只是把 state改成MASTER。

```shell
vrrp_script chk_http_port {
        script "/etc/keepalived/nginx_check.sh"
        interval 2
        weight 2
}

vrrp_instance inside_VI_1 {
    state BACKUP #指定那个为master，那个为backup，如果设置了nopreempt这个值不起作用，主备考priority决定
    interface eth1 #设置实例绑定的网卡
    virtual_router_id 50 #VPID标记
    priority 90 #优先级，高优先级竞选为master
    advert_int 1 #检查间隔，默认1秒
    authentication { #设置认证
        auth_type PASS #认证方式
        auth_pass 111111 #认证密码
    }
    virtual_ipaddress { #设置vip
        192.168.2.50
    }
}
```

```
# !/bin/bash
A= 'ps -C nginx -no-header | wc -l'
if [ $A -eq 0 ];then
        /usr/sbin/nginx
        sleep 2
        if [ 'ps -C nginx --no-header | wc -l' -eq 0 ];then
                killall keepalived
        fi
fi
```

```shell
upstream myserverkeepalived {
                server 192.168.2.50:8080;
                server 192.168.2.50:8081;
        }

        server {
                listen 80;
                server_name 192.168.2.50;

                location / {
                        proxy_pass http://myserverkeepalived;
                }
        }
```

通过192.168.2.50:/edu/a.html 去 访问，默认情况下是用的master的nginx。我们可以把master的nginx down掉，服务还是可以继续访问，这个时候用的从的nginx。

### 8. Nginx 的基本原理

Nginx的架构是一个master的主进程作为守护进程 启动，多个 work进程附属于master进程，结构如下图。每个 work而进程相当于反向代理服务器。各个work进程通过竞争来抢夺请求。

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknr4jsap0j31f40sgwmz.jpg" alt="image-20201113190537081" style="zoom:50%;" />

<img src="https://tva1.sinaimg.cn/large/0081Kckwgy1gknr5m8ykmj31a20qc18i.jpg" alt="image-20201113190640325" style="zoom:50%;" />

这种方式的好处：

- 支持热部署。当nginx.conf有改动时，即使有work进程在处理事务，也不影响。config file会同步到未进行事务的work进程，待任务完成后，再同步。
- 各个work进程不用加锁而实现独立运行，节省了加锁的开销。

每个work支持的最大连接数是4个，worker的最适宜个数和cpu核数保持一致最好。

### 9. 附件

1）nginx.conf

```shell
user www-data;
worker_processes 4;
pid /run/nginx.pid;

events {
        worker_connections 768;
        # multi_accept on;
}

http {

        ##
        # Basic Settings
        ##

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;
        # server_tokens off;

        # server_names_hash_bucket_size 64;
        # server_name_in_redirect off;

        include /etc/nginx/mime.types; 
        default_type application/octet-stream;
    
        ##
        # Logging Settings
        ##
    
        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;
root@monitor:/etc/nginx# 
root@monitor:/etc/nginx# 
root@monitor:/etc/nginx# cat nginx.conf 
user www-data;
worker_processes 4;
pid /run/nginx.pid;

events {
	worker_connections 768;
	# multi_accept on;
}

http {

	##
	# Basic Settings
	##

	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;
	# server_tokens off;

	# server_names_hash_bucket_size 64;
	# server_name_in_redirect off;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	##
	# Logging Settings
	##

	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	##
	# Gzip Settings
	##

	gzip on;
	gzip_disable "msie6";
       
	
	 upstream myserverkeepalived {
                server 192.168.2.50:8080;
                server 192.168.2.50:8081;
        }

        server {
                listen 80;
                server_name 192.168.2.50;

                location / {
                        proxy_pass http://myserverkeepalived;
                }
        }

	upstream myserver {
		server 192.168.2.6:8080;
                server 192.168.2.6:8081;
	} 

        server {
		listen 80;
		server_name 192.168.2.6;
                
		location / {
			proxy_pass http://myserver;
		}
	} 	

 
        server {
		listen 80;
		server_name 192.168.2.6;
		
		location / {
			root html;
			proxy_pass http://127.0.0.1:8080;
 			index index.html index.html;
		}
	}

        server {

		listen 9001;
		server_name 192.168.2.6;
 		
		location ~ /edu/ {
			proxy_pass http://127.0.0.1:8080;
		}
		
		location ~ /vod/ {
			proxy_pass http://127.0.0.1:8081;
		}
	}


		

	# gzip_vary on;
	# gzip_proxied any;
	# gzip_comp_level 6;
	# gzip_buffers 16 8k;
	# gzip_http_version 1.1;
	# gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;

	##
	# nginx-naxsi config
	##
	# Uncomment it if you installed nginx-naxsi
	##

	#include /etc/nginx/naxsi_core.rules;

	##
	# nginx-passenger config
	##
	# Uncomment it if you installed nginx-passenger
	##
	
	#passenger_root /usr;
	#passenger_ruby /usr/bin/ruby;

	##
	# Virtual Host Configs
	##

	include /etc/nginx/conf.d/*.conf;
	include /etc/nginx/sites-enabled/*;
}


#mail {
#	# See sample authentication script at:
#	# http://wiki.nginx.org/ImapAuthenticateWithApachePhpScript
# 
#	# auth_http localhost/auth.php;
#	# pop3_capabilities "TOP" "USER";
#	# imap_capabilities "IMAP4rev1" "UIDPLUS";
# 
#	server {
#		listen     localhost:110;
#		protocol   pop3;
#		proxy      on;
#	}
# 
#	server {
#		listen     localhost:143;
#		protocol   imap;
#		proxy      on;
#	}
#}
```



2) keepalived.conf

```shell
global_defs {
   notification_email {  #指定keepalived在发生切换时需要发送email到的对象，一行一个
		monitor@3evip.cn
   }
   notification_email_from monitor@3evip.cn #指定发件人
   smtp_server stmp.3evip.cn #指定smtp服务器地址
   smtp_connect_timeout 30 #指定smtp连接超时时间
   router_id LVS_DEVEL #运行keepalived机器的一个标识
}

vrrp_sync_group VG_1{ #监控多个网段的实例
	group {
		inside_network #实例名
		outside_network
	}
	notify_master /path/xx.sh #指定当切换到master时，执行的脚本
	netify_backup /path/xx.sh #指定当切换到backup时，执行的脚本
	notify_fault "path/xx.sh VG_1" #故障时执行的脚本
	notify /path/xx.sh 
	smtp_alert #使用global_defs中提供的邮件地址和smtp服务器发送邮件通知
}

vrrp_script chk_http_port {
	script "/etc/keepalived/nginx_check.sh"
	interval 2
	weight 2
}

vrrp_instance inside_VI_1 {
    state BACKUP #指定那个为master，那个为backup，如果设置了nopreempt这个值不起作用，主备考priority决定
    interface eth1 #设置实例绑定的网卡
    virtual_router_id 50 #VPID标记
    priority 90 #优先级，高优先级竞选为master
    advert_int 1 #检查间隔，默认1秒
    authentication { #设置认证
        auth_type PASS #认证方式
        auth_pass 111111 #认证密码
    }
    virtual_ipaddress { #设置vip
        192.168.2.50
    }
}
virtual_server 192.168.36.99 80 {
    delay_loop 6 #健康检查时间间隔
    lb_algo rr  #lvs调度算法rr|wrr|lc|wlc|lblc|sh|dh
    lb_kind DR  #负载均衡转发规则NAT|DR|RUN
    persistence_timeout 5 #会话保持时间
    protocol TCP #使用的协议
    persistence_granularity <NETMASK> #lvs会话保持粒度
    virtualhost <string> #检查的web服务器的虚拟主机（host：头）    
    sorry_server<IPADDR> <port> #备用机，所有realserver失效后启用
	real_server 192.168.200.5 23 {
            weight 1 #默认为1,0为失效
            inhibit_on_failure #在服务器健康检查失效时，将其设为0，而不是直接从ipvs中删除 
            notify_up <string> | <quoted-string> #在检测到server up后执行脚本
            notify_down <string> | <quoted-string> #在检测到server down后执行脚本
			TCP_CHECK {
				connect_timeout 3 #连接超时时间
				nb_get_retry 3 #重连次数
				delay_before_retry 3 #重连间隔时间
				connect_port 23  健康检查的端口的端口
				bindto <ip>   
			}
			HTTP_GET | SSL_GET{
				url{ #检查url，可以指定多个
						path /
						digest <string> #检查后的摘要信息
						status_code 200 #检查的返回状态码
				}
				connect_port <port> 
				bindto <IPADD>
				connect_timeout 5
				nb_get_retry 3
				delay_before_retry 2
			}

			SMTP_CHECK{
					host{
						connect_ip <IP ADDRESS>
						connect_port <port> #默认检查25端口
						bindto <IP ADDRESS>
					}
					connect_timeout 5
					retry 3
					delay_before_retry 2
					helo_name <string> | <quoted-string> #smtp helo请求命令参数，可选
			}
			MISC_CHECK{
					misc_path <string> | <quoted-string> #外部脚本路径
					misc_timeout #脚本执行超时时间
					misc_dynamic #如设置该项，则退出状态码会用来动态调整服务器的权重，返回0 正常，不修改；返回1，检查失败，权重改为0；返回2-255，正常，权重设置为：返回状态码-2
			}
    }
}
```

3 ) nginx_check.sh

```shell
# !/bin/bash
A= 'ps -C nginx -no-header | wc -l'
if [ $A -eq 0 ];then
	/usr/sbin/nginx
	sleep 2
	if [ 'ps -C nginx --no-header | wc -l' -eq 0 ];then
		killall keepalived
	fi
fi
```

