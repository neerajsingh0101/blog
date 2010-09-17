---
layout: post
title: DNS settings on slicehost
---

This article is part of a series on [Installing a ruby on rails application using phusion passenger on ubuntu on slicehost](http://neeraj.name/2008/09/30/installing-a-ruby-on-rails-application-using-phusion-passenger-on-ubuntu-on-slicehost.html) .


## DNS settings

So far we have been playing with slice_ip_address but I’m sure you have bought a domain name and you want to use it.

* Go [https://manage.slicehost.com](https://manage.slicehost.com) and login.
* Click on ‘DNS tab’.
* Click on link ‘new domain’.
* Enter ‘pageaxis.com.’ ( note that there is a dot in the end and there is no www)
* Click on ‘records’ link
* Click on ‘new record’ link
* Chosse type ‘A’
* Name: pageaxis.com. ( note there is a dot in the end)
* Data : slice_ip_address
* Save

### Add another record.

* type: A
* name: www
* data: slice_ip_address
* save

Go to your domain registrar(one who sold you your domain name godaddy.com , yahho.com, register.com etc) and change the dns name servers to

    ns1.slicehost.net
    ns2.slicehost.net
    ns3.slicehost.net

Some registrars allow only two name servers. In that case do not add ns3 and don’t panick. Two of them works fine too.

### Add NS records

I am not sure why but it is recommended to setup NS records. If your registrar allowed 3 name servers in the previous step then you need to add three records or just addd two records.

#### Add another record

* Click on 'new record'
* type: NS
* name: pageaxis.com. ( note dot in the end )
* data: ns1.slicehost.net. ( note dot in the end )
* save

#### Add another record

* Click on 'new record'
* type: NS
* name: pageaxis.com. ( note dot in the end )
* data: ns2.slicehost.net. ( note dot in the end )
* save

#### Add another record

* Click on 'new record'
* type: NS
* name: pageaxis.com. ( note dot in the end )
* data: ns3.slicehost.net. ( note dot in the end )
* save

### Adding a subdomains

Let’s say that you want http://blog.pageaxis.com . In that case following DNS entry needs to be made.

* Click on 'new record'
* type: A
* name: blog
* data: slice_ip_address
* save

### DNS propogation

It may take anywhere between 24 and 72 hours for this change to propogate. To find out if the the change has propogate through or not [click here](http://network-tools.com/default.asp?prog=trace&host=www.pageaxis.com). Obvisouly change www.pageaxis.com to www.yourdomain.com .

Go to the bottom of the page. If the last hop is slicehost then you are all set. Otherwise continue to wait. In some cases it might take more than 72 hours for the change to propage.

It is also a good idea to read about dig to make sure that there is no typo mistake done before applying the changes at the registrar. Lear more about dig at [here](http://articles.slicehost.com/2007/10/8/introduction-to-dig) .
