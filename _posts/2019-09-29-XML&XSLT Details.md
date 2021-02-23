---
layout:     post   				    # 使用的布局（不需要改）
title:      XML & XSLT Details 				# 标题
subtitle:   XML XSLT 小结             #副标题
date:       2019-09-29 				# 时间
author:     Liansong 						# 作者
header-img: img/tag-bg-o.jpg 	#这篇文章标题背景图片
catalog: true 						# 是否归档
tags:								#标签
    - tech
    - xml
    - xslt
---

### 1. 你真的懂xml吗？

#### 1.1 XML 概述

说实话，之前呢对XMl的理解很浅显，就是知道它是一种数据格式，然后具体的规范这些不是很懂。今天呢再加深一点对它的理解。

XML：可扩展的标记语言。Extensible Markup Language. 这玩意造出来是为了传输和存储数据的。有的人可能会混淆XML和HTML，这两个是完全不同的两个东西，HTML是用来显示数据，焦点是数据的外观，和XML是用来传输和存储数据，焦点是数据内容。

#### 1.2 XML组成部分介绍

XML是树结构，组成部分包括元素，属性。树结构很好理解了，就是XML必须包含根节点。元素呢，怎么理解，元素就是会包含其他元素或文本的东西。只有元素才拥有属性。牛逼！文本是没有属性的啊。

> ```xml
> <bookstore>
> <book category="CHILDREN">
>   <title>Harry Potter</title> 
>   <author>J K. Rowling</author> 
>   <year>2005</year> 
>   <price>29.99</price> 
> </book>
> <book category="WEB">
>   <title>Learning XML</title> 
>   <author>Erik T. Ray</author> 
>   <year>2003</year> 
>   <price>39.95</price> 
> </book>
> </bookstore> 
> ```

看看这货，bookstore 是根节点，它也是元素，它包含了很多的其他元素和文本。然后呢，book也是元素，它有属性，属性是category，我为啥要这么详细的说这个呢，因为我对属性的概念真的不懂啊，不知道为啥要搞出这个，可能是为了解析的时候用吧，相当于解析到这个元素时，先解析下这个属性。

#### 1.3 XML规范

- 首先很简单的，肯定是有一对标签，关闭标签不能少
- 大小写敏感，区分大小写。标签不能用数字或者标点符号开始，也不能有空格
- 属性内容必须有双引号
- 不要用这种，first-book,用这种first_book

#### 1.4 XML的namespace

当当当，XML也有namespace啊，当然了，你想想看，我一个html包含XML时，要用相同的一个标签，怎么区分，只能靠namespace了。也可以用前缀的方式了，

>```
><table xmlns="http://www.w3.org/TR/html4/">
>   <tr>
>   <td>Apples</td>
>   <td>Bananas</td>
>   </tr>
></table>
>```



>```
><table xmlns="http://www.w3school.com.cn/furniture">
>   <name>African Coffee Table</name>
>   <width>80</width>
>   <length>120</length>
></table>
>```



#### 1.5 其他

其他的没啥意思了，比如DOM，就是Document Object Model,就是用来解析这些XML树状结构的，把XML进行解析。还有XML的编码，Unicode 或gb，<?xml version="1.0" encoding="ISO-8859-1"?> 这个是XML的头。记记就好。



### 2. XSL

好了，我懂了XML， 现在呢，就学下XSL。

XSL 是扩展样式表语言，Extensible Stylesheet Language. 通过XSL可以对XML进行转换和扩展，扩展成需要的格式。XSL包含XSLT，XPath和XSL-FO。XSL的难点就是要理解它的语法结构，然后再使用它。

#### 2.1 XSL 的一些用法

- 样式表的声明

  根元素是<xsl:stylesheet> 或 <xsl:transform>

  

- XSLT <template> 的使用

  这个是用来构建模板。什么意思呢，就是先用match 功能match 到原始的xml中的节点，然后把这部分节点改写成template 形式。

  >```
  ><?xml version="1.0" encoding="ISO-8859-1"?>
  ><catalog>
  >  <cd>
  >    <title>Empire Burlesque</title>
  >    <artist>Bob Dylan</artist>
  >    <country>USA</country>
  >    <company>Columbia</company>
  >    <price>10.90</price>
  >    <year>1985</year>
  >  </cd>
  ></catalog>
  >```
  >
  >这个是转换前的xml，现在需要转换。
  >
  >```
  ><?xml version="1.0" encoding="ISO-8859-1"?>
  >
  ><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  >
  ><xsl:template match="/">
  >  <html>
  >  <body>
  >    <h2>My CD Collection</h2>
  >    <table border="1">
  >    <tr bgcolor="#9acd32">
  >      <th align="left">Title</th>
  >      <th align="left">Artist</th>
  >    </tr>
  >    <xsl:for-each select="catalog/cd">
  >    <tr>
  >      <td><xsl:value-of select="title"/></td>
  >      <td><xsl:value-of select="artist"/></td>
  >    </tr>
  >    </xsl:for-each>
  >    </table>
  >  </body>
  >  </html>
  ></xsl:template>
  >
  ></xsl:stylesheet>
  >
  >```

  看这个，通过这个xsl的template 来进行转换了。它是match的根节点，然	后把match到的根节点根据template 模版进行显示。

  

- xsl value-of 元素

  怎么对标签里的东西进行取值呢，这个就用到了<xsl:value-of>, 咋用呢，看这个例子就知道了。

  >```xml
  ><?xml version="1.0" encoding="ISO-8859-1"?>
  ><xsl:stylesheet version="1.0"
  >xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  >
  ><xsl:template match="/">
  > <html>
  > <body>
  >   <h2>My CD Collection</h2>
  >   <table border="1">
  >     <tr bgcolor="#9acd32">
  >       <th>Title</th>
  >       <th>Artist</th>
  >     </tr>
  >     <tr>
  >      <td><xsl:value-of select="catalog/cd/title"/></td>
  >      <td><xsl:value-of select="catalog/cd/artist"/></td>
  >     </tr>
  >   </table>
  > </body>
  > </html>
  ></xsl:template>
  >
  ></xsl:stylesheet>
  >```

  相当于，用select 函数来对xml里的数据进行取值，然后把转换的结果送到	输出流中。

  

- xml apply 

  说实话，这个真的有点绕，但是慢慢的又有点想明白了，发明这玩意，貌似是解决这种情况，就是xml中有循环嵌套的，用apply这个把每个循环体都搞出来。可以看看例子。

  >```
  ><?xml version="1.0" encoding="ISO-8859-1"?>
  ><xsl:stylesheet version="1.0"
  >xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  >
  ><xsl:template match="/">
  ><html>
  ><body>
  ><h2>My CD Collection</h2> 
  ><xsl:apply-templates/> 
  ></body>
  ></html>
  ></xsl:template>
  >
  ><xsl:template match="cd">
  ><p>
  ><xsl:apply-templates select="title"/> 
  ><xsl:apply-templates select="artist"/>
  ></p>
  ></xsl:template>
  >
  ><xsl:template match="title">
  >Title: <span style="color:#ff0000">
  ><xsl:value-of select="."/></span>
  ><br />
  ></xsl:template>
  >
  ><xsl:template match="artist">
  >Artist: <span style="color:#00ff00">
  ><xsl:value-of select="."/></span>
  ><br />
  ></xsl:template>
  >
  ></xsl:stylesheet>
  >```

  ​	看看这个，就是用的apply来进行把所有的子节点取出来。说真的，我还是有点没太理解。

  

- xsl call-templates

  这个其实很好理解，就是相当于一个函数模块的调用。















