---
layout: post
title: Mime type resolution in Rails
published: false
---

This is a long blog. If you want a summary then José Valim has provided a [summary in less than 140 characters](http://twitter.com/#!/josevalim/status/7928782685995009).

It is common to see following code in Rails

    respond_to do |format|
      format.hml
      format.xml  { render :xml => @users }
    end

If you want output in xml format then all you have to do is to request with <tt>.xml</tt> extension at the end like this _localhost:3000/users.xml_.

What we saw is only one part of the puzzle. The other side of the equation is HTTP header field [Accept](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1) .

### HTTP Header Field Accept ###

When browser sends a request then it also sends the information about what kind of resources the browser is capable of handling. Here are some of the examples of the _Accept_ header a browser can send.

    text/plain
    
    image/gif, images/x-xbitmap, images/jpeg, application/vnd.ms-excel, application/msword, 
    application/vnd.ms-powerpoint, */*
    
    text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
    
    application/vnd.wap.wmlscriptc, text/vnd.wap.wml, application/vnd.wap.xhtml+xml, 
    application/xhtml+xml, text/html, multipart/mixed, */*

If you are reading this blog on a browser then you can find out what kind of _Accept_ header your browser is sending by visiting [this link](http://pgl.yoyo.org/http/browser-headers.php). Here is list of _Accept_ header sent by different browsers on my machine.

    Chrome: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5
    Firefox: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8,application/json
    Safari: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5
    IE: application/x-ms-application, image/jpeg, application/xaml+xml, image/gif, 
    image/pjpeg, application/x-ms-xbap, application/x-shockwave-flash, */*


Let's take a look at the _Accept_ header sent by Safari.

    Safari: application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5

Safari is saying that I can handle documents which are xml (application/xml), html (text/html) or plain text (text/plain) documents. And I can handle images such as image/png. If all else fails then send me whatever you can and I will try to render that document to the best of my ability.

Notice that there are also __q__ values. That signifies the priority order. This is what spec has to say about q.

>Each media-range MAY be followed by one or more accept-params, beginning with the "q" parameter for indicating a relative quality factor. The first "q" parameter (if any) separates the media-range parameter(s) from the accept-params. Quality factors allow the user or user agent to indicate the relative degree of preference for that media-range, using the qvalue scale from 0 to 1 (section 3.9). The default value is q=1.


The spec is saying is that each document type has a default value of 1. When _q_ value is specified then take that value into account. For all documents that have same _q_ value give high priority to the one that came first in the list. Based on that this should be the order in which documents should be sent to safari browser.

* application/xml (q is 1)
* application/xhtml+xml (q is 1)
* image/png (q is 1)
* text/html (q is 0.9)
* text/plain (q is 0.8)
* \*/\* (q is 0.5)

Notice that Safari is nice enough to say to put a lower priority for \*/\*. Chrome and Firefox also puts \*/\* at a lower priority which is a good thing. Not so with IE which does not declare any q value for \*/\* .


Look at the order again and you can see that _application/xml_ has higher priority over _text/html_. What it means is that safari is telling rails that I would prefer _application/xml_ over _text/html_. Send me _text/html_ only if you cannot send _application/xml_. 

And let's say that you have developed a RESTful app which is capable of sending output in both html and xml formats. 

Rails being a good HTTP citizen should follow the HTTP_ACCEPT protocol and should send an xml document in this case. Again all you did was visit a website and safari is telling rails that send me xml document over html document. Clearly HTTP_ACCEPT values being sent by Safari is broken.

##HTTP_ACCEPT is broken##

HTTP_ACCEPT attribute concept is neat. It defines the order and the priority. However the implementation is broken by all the browser vendors. Given the case that browsers do not send proper HTTP_ACCEPT what can rails do. One solution is to ignore it completely. If you want _xml_ output then request _http://localhost:3000/users.xml_ . Solely relying on formats make life easy and less buggy. This is what Rails did for a long time. 

Starting [this commit](https://github.com/rails/rails/commit/2f4aaed7b3feb3be787a316fab3144c06bb21a27) ,by default, rails did ignore HTTP_ACCEPT attribute. Same is true for [Twitter API](http://dev.twitter.com/doc/get/search) where HTTP_ACCEPT attribute is ignored and twitter solely relies on format to find out what kind of document should be returned.

Unfortunately it is not a practical solution. Web has been there for a long time and there are a lot of applications who expect the response type to be RSS feed if they are sending _application/rss+xml_ in their HTTP_ACCEPT attribute. It is not nice to take a hard stand and ask all of them to request with extension _.rss_ .

##How to make sense of HTTP_ACCEPT##

Now that we have decided to obey HTTP_ACCEPT how to go about handling the order in which the browser wants requests to be handled and what common sense dictates us.

At the beginning of the blog I showed respond_to code.

    respond_to do |format|
      format.hml
      format.xml  { render :xml => @users }
    end

Above code says that if the requested format is _html_ then send _html_ response. If the requested format is _xml_ then send _xml_ response. However it also says one more very important thing and that has to do with the order in which two formats are declared.

To come to a common sense solution rails decided to parse HTTP_ACCEPT and build the response type browser supports. However when it comes to priority it will look at the order in which formats are declared inside the respond_to block.

The order provided by browser is

     xml
     png
     html
     plain
     anything

The order in which formats are delcared is

    html (format.html)
    xml (format.xml)

Rails goes through each format declared in respond_to and tries to see if browser can handle that format. In this case format.html is declared first so rails tries to find a match for _text/html_ and in this case safari can handle _text/html_ and _text/html_ response is sent.

But you will say this is not the order in which browser requested documents to be sent. Yes I know. But if rails obeys browser then it will send xml and that is not what user wants to see even though that is what browser requested.

Also note that if you request a url in rails with .format option like _http://localhost:3000/users.xml_ then HTTP_ACCEPT is totally ignored. It is strongly recommended to use _.format_ option because this is guaranteed to work.

Now let's add twist to this use case by not declaring respond_to block. Now my controller looks like

    class UsersController << ActionController::Base
      def users
        @users = User.all  
      end
    end

I have following files on views
    
    users.html.erb
    users.xml.erb

In this case if safari request comes through then user will get xml output and user will be totally surprised. Yes user will see xml output. This is the reason why it is always always recommended to use respond_to block . Why would user see the xml output.

Remember the order in which browser wants document is

    xml
    html
    plain
    anything

Since no respond_to block was provided rails has no way to find what is the order in which user wants document to be sent. So rails will obey whatever HTTP_ACCEPT says. And rails will try to see if there is a _users.xml.builder_ file. If a file is found then rails will render that one.

##More twists with Ajax request##

When an AJAX request is made the Safari, Firefox and Chrome send only one item in HTTP_ACCEPT and that is \*/\*. So if you are making an AJAX request then HTTP_ACCEPT for these three browsers will look like

    Chrome: */*
    Firefox: */*
    Safari: */*

and if your respond_to block looks like this 

    respond_to do |format|
      format.hml
      format.xml  { render :xml => @users }
    end

then the first one will be served based on the formats order. And in this case html respsone would be sent for an AJAX request.

This is the reason why if you are using jQuery and if you are sending AJAX request then you should add something like this in your .js file

    $(function() {
      $.ajaxSetup({
        'beforeSend': function(xhr) {
          xhr.setRequestHeader("Accept", "text/javascript");
        }
      });
    });

If you are using a newer version of rails.js then you don't need to add above code since it is already take care of for you through [this commit](https://github.com/rails/jquery-ujs/commit/b6a3500bfb4b845d2c5e2f81b3c57a62fffd0845) .

##Trying it out##

If you want to play with HTTP_ACCEPT header then put the following line in your controller to inspect the HTTP_ACCEPT attribute.

    puts request.headers['HTTP_ACCEPT']

I used following rake task to set custom HTTP_ACCEPT attribute.

    require "net/http"
    require "uri"

    task :custom_accept do
      uri = URI.parse("http://localhost:3000/users")
      http = Net::HTTP.new(uri.host, uri.port)

      request = Net::HTTP::Get.new(uri.request_uri)
      request["Accept"] = "text/html, application/xml, */*"

      response = http.request(request)
    end


##Thanks##

I understood a lot of intricacies of while working on [ticket #6022](https://rails.lighthouseapp.com/projects/8994-ruby-on-rails/tickets/6022-content-negotiation-fails-for-some-headers-regression#ticket-6022-10) . A big thanks to [José Valim](http://twitter.com/#!/josevalim) for patiently dealing with me while I tried to understand all the intricacies.

