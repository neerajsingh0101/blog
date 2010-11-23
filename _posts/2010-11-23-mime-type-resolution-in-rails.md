---
layout: post
title: Mime type resolution in Rails
---

It is common to see following type of code in Rails

    respond_to do |format|
      format.hml
      format.xml  { render :xml => @users }
    end

If you want output in xml format then all you have to do is to request with <tt>.xml</tt> extension at the end like this <tt>localhost:3000/users.xml</tt>.

What we saw is only one part of the puzzle. The other side of the equation is HTTP header field [Accept](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1) .

### HTTP Header Field Accept ###

When browser sends a request then it also sends the information about what kind of resources the browser is capable of handling. Here are some of the examples of the "Accept" header a browser can send.

    text/plain
    
    image/gif, images/x-xbitmap, images/jpeg, application/vnd.ms-excel, application/msword, 
    application/vnd.ms-powerpoint, */*
    
    text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
    
    application/vnd.wap.wmlscriptc, text/vnd.wap.wml, application/vnd.wap.xhtml+xml, 
    application/xhtml+xml, text/html, multipart/mixed, */*

If you are reading this blog on a browser then you can find out what kind of "Accept" header your browser is sending by visiting [this link](http://pgl.yoyo.org/http/browser-headers.php). Here is list of "Accept" header sent by different browsers on my machine.

    Chrome: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5
    Firefox: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8,application/json
    Safari: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5
    IE: application/x-ms-application, image/jpeg, application/xaml+xml, image/gif, 
    image/pjpeg, application/x-ms-xbap, application/x-shockwave-flash, */*

