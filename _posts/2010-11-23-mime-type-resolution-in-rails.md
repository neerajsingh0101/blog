---
layout: post
title: Mime type resolution in Rails
published: true
---

This is a long blog. If you want a summary then José Valim has provided a [summary in less than 140 characters](http://twitter.com/#!/josevalim/status/7928782685995009).

It is common to see following code in Rails

    respond_to do |format|
      format.html
      format.xml  { render :xml => @users }
    end

If you want output in xml format then request with <tt>.xml</tt> extension at the end like this _localhost:3000/users.xml_ and you will get the outupt in xml format.

What we saw is only one part of the puzzle. The other side of the equation is HTTP header field [Accept](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.1)  defined in HTTP RFC.

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

Notice that there are also __q__ values. That signifies the priority order. This is what HTTP spec has to say about __q__.

>Each media-range MAY be followed by one or more accept-params, beginning with the "q" parameter for indicating a relative quality factor. The first "q" parameter (if any) separates the media-range parameter(s) from the accept-params. Quality factors allow the user or user agent to indicate the relative degree of preference for that media-range, using the qvalue scale from 0 to 1 (section 3.9). The default value is q=1.


The spec is saying is that each document type has a default value of _q_ as 1. When _q_ value is specified then take that value into account. For all documents that have same _q_ value give high priority to the one that came first in the list. Based on that this should be the order in which documents should be sent to safari browser.

* application/xml (q is 1)
* application/xhtml+xml (q is 1)
* image/png (q is 1)
* text/html (q is 0.9)
* text/plain (q is 0.8)
* \*/\* (q is 0.5)

Notice that Safari is nice enough to put a lower priority for \*/\*. Chrome and Firefox also puts \*/\* at a lower priority which is a good thing. Not so with IE which does not declare any q value for \*/\* .


Look at the order again and you can see that _application/xml_ has higher priority over _text/html_. What it means is that safari is telling Rails that I would prefer _application/xml_ over _text/html_. Send me _text/html_ only if you cannot send _application/xml_.

And let's say that you have developed a RESTful app which is capable of sending output in both html and xml formats.

Rails being a good HTTP citizen should follow the HTTP_ACCEPT protocol and should send an xml document in this case. Again all you did was visit a website and safari is telling rails that send me xml document over html document. Clearly HTTP_ACCEPT values being sent by Safari is broken.

##HTTP_ACCEPT is broken##

HTTP_ACCEPT attribute concept is neat. It defines the order and the priority. However the implementation is broken by all the browser vendors. Given the case that browsers do not send proper HTTP_ACCEPT what can rails do. One solution is to ignore it completely. If you want _xml_ output then request _http://localhost:3000/users.xml_ . Solely relying on formats make life easy and less buggy. This is what Rails did for a long time.

Starting [this commit](https://github.com/rails/rails/commit/2f4aaed7b3feb3be787a316fab3144c06bb21a27) ,by default, rails did ignore HTTP_ACCEPT attribute. Same is true for [Twitter API](http://dev.twitter.com/doc/get/search) where HTTP_ACCEPT attribute is ignored and twitter solely relies on format to find out what kind of document should be returned.

Unfortunately this solution has its own sets of problems. Web has been there for a long time and there are a lot of applications who expect the response type to be RSS feed if they are sending _application/rss+xml_ in their HTTP_ACCEPT attribute. It is not nice to take a hard stand and ask all of them to request with extension _.rss_ .

##Parsing HTTP_ACCEPT attribute##

Parsing and obeying HTTP_ACCEPT attribute is filled with many edge cases. First let's look at the code that decides what to parse and how to handle the data.


    BROWSER_LIKE_ACCEPTS = /,\s*\*\/\*|\*\/\*\s*,/

    def formats
      accept = @env['HTTP_ACCEPT']

      @env["action_dispatch.request.formats"] ||=
        if parameters[:format]
          Array(Mime[parameters[:format]])
        elsif xhr? || (accept && accept !~ BROWSER_LIKE_ACCEPTS)
          accepts
        else
          [Mime::HTML]
        end
    end

Notice that if a format is passed like _http://localhost:3000/users.xml_ or _http://localhost:3000/users.js_ then Rails does not even parse  the HTTP_ACCEPT values. Also note that if browser is sending \*/\* along with other values then Rails totally bails out and just returns Mime::HTML unless the request is ajax request.

Next I am going to discuss some of the cases in greater detail which should bring more clarity around this issue.

##Case 1: HTTP_ACCEPT is \*/\*##

I have following code.

    respond_to do |format|
      format.html { render :text => 'this is html' }
      format.js  { render :text => 'this is js' }
    end

I am assuming that _HTTP_ACCEPT_ value is \*/\* . In this case browser is saying that send me whatever you got. Since browser is not dictating the order in which documents should be sent Rails will look at the order in which Mime types are declared in respond_to block and will pick the first one. Here is the corresponding code

     def negotiate_mime(order)
        formats.each do |priority|
          if priority == Mime::ALL
            return order.first
          elsif order.include?(priority)
            return priority
          end
        end

        order.include?(Mime::ALL) ? formats.first : nil
      end

What it's saying is that if Mime::ALL is sent then pick the first one declared in the respond_to block. So be careful with order in which formats are declared inside the respond_to block.

The order in which formats are declared can be real issue. Checkout these [two](http://www.danielcadenas.com/2008/10/internet-explorer-7-accept-header-and.html) [cases](http://www.brentmc79.com/posts/ie7-accept-header-and-rails-respon-to-bug) where the author ran into issue because of the order in which formats are declared.

So far so good. However what if there is no respond_to block. If I don't have respond_to block and if I have _index.html.erb_, _index.js.erb_ and _index.xml.builder_ files in my view directory then which one will be picked up. In this case Rails will go over all the registered formats in the order in which they are delcared and will try to find a match . So in this case it matters in what order Mime types are registered. Here is the code that registers Mime types.

    Mime::Type.register "text/html", :html, %w( application/xhtml+xml ), %w( xhtml )
    Mime::Type.register "text/plain", :text, [], %w(txt)
    Mime::Type.register "text/javascript", :js, %w( application/javascript application/x-javascript )
    Mime::Type.register "text/css", :css
    Mime::Type.register "text/calendar", :ics
    Mime::Type.register "text/csv", :csv
    Mime::Type.register "application/xml", :xml, %w( text/xml application/x-xml )
    Mime::Type.register "application/rss+xml", :rss
    Mime::Type.register "application/atom+xml", :atom
    Mime::Type.register "application/x-yaml", :yaml, %w( text/yaml )

    Mime::Type.register "multipart/form-data", :multipart_form
    Mime::Type.register "application/x-www-form-urlencoded", :url_encoded_form

    # http://www.ietf.org/rfc/rfc4627.txt
    # http://www.json.org/JSONRequest.html
    Mime::Type.register "application/json", :json, %w( text/x-json application/jsonrequest )

    # Create Mime::ALL but do not add it to the SET.
    Mime::ALL = Mime::Type.new("*/*", :all, [])


As you can see _text/html_ is first in the list, _text/javascript_ next and then _application/xml_. So Rails will look for view file in the following order: _index.html.erb_ , _index.js.erb_ and _index.xml.builder_ .

##Case 2: HTTP_ACCEPT with no \*/\*##

I am going to assume that in this case HTTP_ACCEPT sent by browser looks really simple like this

    text/javascript, text/html, text/plain

I am also assuming that my respond_to block looks like this

    respond_to do |format|
      format.html { render :text => 'this is html' }
      format.js  { render :text => 'this is js' }
    end

So browser is saying that I prefer documents in following order

     js
     html
     plain

The order in which formats are delcared is

    html (format.html)
    js (format.js)

In this case rails will go through each Mime type that browser supports from top to bottom one by one. If a match is found then response is sent otherwise rails tries find match for next Mime type. First in the list of Mime types suppported by browser is js and Rails does find that my respond_to block supports _.js_ . Rails executes _format.js_ block and response is sent to browser.


##Case 3: Ajax requests##

When an AJAX request is made the Safari, Firefox and Chrome send only one item in HTTP_ACCEPT and that is \*/\*. So if you are making an AJAX request then HTTP_ACCEPT for these three browsers will look like

    Chrome: */*
    Firefox: */*
    Safari: */*

and if your respond_to block looks like this

    respond_to do |format|
      format.html { render :text => 'this is html' }
      format.js  { render :text => 'this is js' }
    end

then the first one will be served based on the formats order. And in this case html respsone would be sent for an AJAX request. This is not what you want.

This is the reason why if you are using jQuery and if you are sending AJAX request then you should add something like this in your _application.js_ file

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
      puts response.body
    end


##Thanks##

I got familiar with intricacies of mime parsing while working on [ticket #6022](https://rails.lighthouseapp.com/projects/8994-ruby-on-rails/tickets/6022-content-negotiation-fails-for-some-headers-regression#ticket-6022-10) . A big thanks to [José Valim](http://twitter.com/#!/josevalim) for patiently dealing with me while working on this ticket.

