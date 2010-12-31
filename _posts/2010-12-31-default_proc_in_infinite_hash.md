---
layout: post
title: Infinite hash and default_proc
published: true
---

I you already know how [this infinite hash](http://twitter.com/#!/tenderlove/status/5687291469107200) works then you are all set. If not read along.

#Default value of Hash#

If I want a hash to have a default value then that's easy.

    h = Hash.new(0)
    puts h['usa'] #=> 0

Above code will give me a fixed value if key is not found. If I want dynamic value then I can use block form.

    h = Hash.new{|h,k| h[k] = k.upcase}
    puts h['usa'] #=> USA
    puts h['india'] #=> INDIA

#Default value is hash#

If I want the default value to be a <tt>hash</tt> then it seems easy but it falls apart soon.

    h = Hash.new{|h,k| h[k] = {} }
    puts h['usa'].inspect #=> {}
    puts h['usa']['ny'].inspect #=> nil
    puts h['usa']['ny']['nyc'].inspect #=> NoMethodError: undefined method `[]' for nil:NilClass

In the above if a key is missing for <tt>h</tt> then it returns a hash. However that returned hash is an ordinary hash which does not have a capability of returning another hash if a key is missing.

This is where <tt>default_proc</tt> comes into picture. [hash.default_proc](http://ruby-doc.org/core-1.8.6/classes/Hash.html#M002854) returns the block which was passed to <tt>Hash.new</tt> .

    h = Hash.new{|h,k| Hash.new(&h.default_proc)}
    puts h['usa']['ny']['nyc'].inspect #=> {}

