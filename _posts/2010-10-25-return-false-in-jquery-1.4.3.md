---
layout: post
title: return false has changed in jquery 1.4.3
---

jQuery 1.4.3 was recently [released](http://blog.jquery.com/2010/10/16/jquery-143-released/). If you upgrade to jQuery 1.4.3 you will notice that the behavior of "return false" has changed in this version. First let's see what "return false" does.

## return false ##

    $('a').click(function(){
      console.log('clicked'); 
      return false;
    });

I will ensure that above code is executed on domready. Now if I click on any link then three two things will happen.

* e.preventDefault() will be called
* e.stopPropagation() will be called

## e.preventDefault() ##

As the name suggets, calling <tt>e.preventDefault()</tt> will make sure that the default beahvior is not executed.

    <a href='www.google.com'>click me</a>

If above link is clicked then the default behavior of the browser is to take you to <tt>www.google.com</tt>. However by invoking <tt>e.preventDefault()</tt> browser will not go ahead with default behavior and I will <strong>not</strong> be taken to <tt>www.google.com</tt>.

## e.stopPropagation ##

When a link is clicked then a "click event" is created. And this event bubbles all the way up to the top. By invoking <tt>e.stopPropagation</tt> I am asking browser to not propagate the event. In other words the event will stop bubbling.

    <div class='first'>
      <div class='two'>
        <a href='www.google.com'>click me</a>
      </div>
    </div>

If I click on "click me" then "click event" will start bubbling. Now let's say that I catch this event at <tt>.two</tt> and if I call <tt>e.stopPropagation()</tt> then ethis event will never reach to <tt>.first</tt> .

## e.stopImmediatePropagation ##

First note that you can bind more than one event to an element. Take a look at following case.

    <a class='one'>one</a>

To the above elemet I am going to bind three events.

    $('a').bind('click', function(e){
      console.log('first');
    });

    $('a').bind('click', function(e){
      console.log('second');
      e.stopImmediatePropagation();
    });

    $('a').bind('click', function(e){
      console.log('third');
    });

So in this case there are three events bound to the same element. Notice that second event binding invokes <tt>e.stopImmediatePropagation()</tt> . Calling <tt>e.stopImmediatePropagation</tt> does two things.

Just like <tt>stopPropagation</tt> it will stop the bubbling of the event. So any parent of this element will not get this event. 

However <tt>stopImmdiatePropagation</tt> stops the event bubbling even to the siblings. It kills the event right then and there. That's it. End of the event.

Once again calling <tt>stopPropagation</tt> means stop this event going to parent. And calling <tt>stopImmediatePropagation</tt> means stop passing this event to sibligns.

#Back to original problem#

Now that I have described what <tt>preventDefault</tt>, <tt>stopPropagation</tt> and <tt>stopImmeidatePropagation</tt> does what changed in jQuery 1.4.3.

In jQuery 1.4.2 when I call "return false" that was same as calling:

* e.preventDefault()
* e.stopPropagation()
* e.stopImmeidatePropagation()

e.stopImmeidatePropagation internally calls <tt>e.stopPragation</tt> but I have added here for visual clarity.

Fact that <tt>return false</tt> was calling <tt>e.stopImmeidatePropagation</tt> was a bug. Get that. It was a bug which got fixed in jquery 1.4.3.

So in jquery 1.4.3 <tt>e.stopImmediatePropagation</tt> is not called. Checkout this piece of code from <tt>events.js</tt> of jquery code base.

    if ( ret !== undefined ) {
      event.result = ret;
      if ( ret === false ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

As you can see when <tt>return false</tt> is invoked then <tt>e.stopImmediatePropagation</tt> is <strong>not</strong> called.

I tried to find which commit made this change but I could not go far because of [this issue](http://github.com/jeresig/sizzle/commit/852d3d0a60de709e83b65ddb54e6a095498ad1a8#commitcomment-174932).


#It gets complicated with live and a bug in jQuery 1.4.3#

To make the case complicated, jQuery 1.4.3 has a bug in which <tt>e.preventStopImmediatePropagation</tt> doest not work. Here is [a link to this bug](http://forum.jquery.com/topic/e-stopimmedidatepropagation-does-not-work-with-live-or-with-delegate) I reported.

To understand the bug take a look at following code:

    <a href='' class='first'>click me</a>

    $('a.first').live('click', function(e){
        alert('hello');
        e.preventDefault();
        e.stopImmediatePropagation();
    });
      
    $('a.first').live('click', function(){
        alert('world');
    });
     

Since I am invoking <tt>e.stopImmediatePropagation</tt> I should never see <tt>alert world</tt>. However you will see that alert. You can play with it [here](http://jsbin.com/ujipi4/3#html) .

This bug has been fixed as per [this commit](http://github.com/jquery/jquery/commit/974b5aeab7a3788ff5fb9db87b9567784e0249fc) . Note that the commit mentioned was done after the release of jQuery 1.4.3. To get the fix you will have to wait for jQuery 1.4.4 release or use jQuery edge.

#I am using rails.js (jquery-ujs)#

As I have shown "return false" does not work in jQuery 1.4.3 . However I would have to like have as much backward compatibility in <tt>jquery-ujs</tt> as much possible so that the same code base works with jQuery 1.4 through 1.4.3 since not every one upgrades immediately.

[This commit](http://github.com/rails/jquery-ujs/commit/f991faf0074487b43a061168cdbfd102ee0c182c) should make <tt>jquery-ujs</tt> jquery 1.4.3 compatible. [Many issues](http://github.com/rails/jquery-ujs/issues) have been logged at jquery-ujs and I will take a look at all of them one by one. Pleaes do provide your feedback.
